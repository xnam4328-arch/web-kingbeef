const prisma = require('../lib/prisma');
const { buildVietQR } = require('../lib/vietqr');
const {
  addHoursToTime,
  isTimeOverlapping,
  hoursUntilReservation,
  generateBookingCode,
} = require('../lib/time');

const ACTIVE_BOOKING_STATUSES = ['pending', 'waiting_deposit_confirm', 'confirmed', 'checked_in'];
const BASE_TABLE_DEPOSIT = 200000;
const WINE_PROMO_PRICE = 199000;

const RESERVATION_INCLUDE = {
  user: { select: { id: true, fullName: true, email: true, phone: true } },
  branch: { select: { id: true, name: true, address: true, phone: true } },
  hall: { select: { id: true, name: true, type: true } },
  table: { select: { id: true, tableNumber: true, capacity: true, status: true } },
  items: {
    include: {
      menuItem: {
        select: {
          id: true,
          name: true,
          category: true,
          price: true,
          badge: true,
          requiresAdvanceOrderHours: true,
        },
      },
    },
  },
};

function attachReservationExtras(reservation) {
  const hoursLeft = hoursUntilReservation(reservation.reservationDate, reservation.startTime);
  const cancellableStatus = ['pending', 'waiting_deposit_confirm', 'confirmed'].includes(
    reservation.status
  );
  return {
    ...reservation,
    qrPayment: buildVietQR({
      bookingCode: reservation.bookingCode,
      amount: reservation.depositAmount,
    }),
    canCancel: cancellableStatus && hoursLeft >= 2,
    hoursUntilMeal: Number(hoursLeft.toFixed(2)),
  };
}

async function createReservation(req, res, next) {
  try {
    const {
      branchId,
      hallId,
      tableId,
      reservationDate,
      startTime,
      guestCount,
      items = [],
      hasWinePromo = false,
      specialRequest = '',
    } = req.body;

    if (!branchId || !hallId || !tableId || !reservationDate || !startTime || !guestCount) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp đầy đủ chi nhánh, sảnh, bàn, ngày, khung giờ và số lượng khách.',
      });
    }

    const parsedGuestCount = Number(guestCount);
    if (parsedGuestCount < 1 || parsedGuestCount > 20) {
      return res.status(400).json({ message: 'Số lượng khách không hợp lệ (1 - 20 khách).' });
    }

    const hoursAhead = hoursUntilReservation(reservationDate, startTime);
    if (hoursAhead < 0.25) {
      return res.status(400).json({
        message: 'Thời gian đặt bàn phải nằm trong tương lai (trước ít nhất 15 phút).',
      });
    }

    const endTime = addHoursToTime(startTime, 2);

    // Kiem tra thu bac chi nhanh -> sanh -> ban
    const table = await prisma.table.findUnique({
      where: { id: Number(tableId) },
      include: { hall: { include: { branch: true } } },
    });

    if (!table || table.hallId !== Number(hallId) || table.hall.branchId !== Number(branchId)) {
      return res.status(400).json({ message: 'Thông tin bàn, sảnh hoặc chi nhánh không khớp.' });
    }

    if (table.status === 'maintenance') {
      return res.status(400).json({ message: `Bàn số ${table.tableNumber} hiện đang bảo trì.` });
    }

    // Chay transaction de chong race-condition dat trung ban & tru ton kho chinh xac
    const createdReservation = await prisma.$transaction(async (tx) => {
      // 1. Khoa khung gio 2 tieng chong dat trung
      const existingBookings = await tx.reservation.findMany({
        where: {
          tableId: table.id,
          reservationDate: String(reservationDate),
          status: { in: ACTIVE_BOOKING_STATUSES },
        },
        select: { startTime: true, endTime: true },
      });

      const hasConflict = existingBookings.some((b) =>
        isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)
      );

      if (hasConflict) {
        const err = new Error(
          `Bàn số ${table.tableNumber} đã có khách đặt trong khung giờ này (hệ thống giữ bàn 2 tiếng). Vui lòng chọn bàn hoặc khung giờ khác.`
        );
        err.statusCode = 409;
        throw err;
      }

      // 2. Kiem tra mon dat truoc (Pre-order)
      let preOrderTotal = 0;
      let hasCoupleSet = false;
      const preparedItems = [];

      if (Array.isArray(items) && items.length > 0) {
        // Gop so luong neu trung menuItemId
        const qtyMap = new Map();
        for (const row of items) {
          const id = Number(row.menuItemId);
          const qty = Number(row.quantity);
          if (!id || qty <= 0) continue;
          qtyMap.set(id, (qtyMap.get(id) || 0) + qty);
        }

        const menuIds = Array.from(qtyMap.keys());
        const menuRecords = await tx.menuItem.findMany({
          where: { id: { in: menuIds } },
        });
        const menuById = new Map(menuRecords.map((m) => [m.id, m]));

        for (const [menuId, qty] of qtyMap.entries()) {
          const menuItem = menuById.get(menuId);
          if (!menuItem) {
            const err = new Error(`Không tìm thấy món ăn #${menuId}.`);
            err.statusCode = 404;
            throw err;
          }

          if (!menuItem.isAvailable || menuItem.stockQuantity < qty) {
            const err = new Error(
              `Món "${menuItem.name}" hiện đã hết món hoặc không đủ tồn kho (còn ${menuItem.stockQuantity}).`
            );
            err.statusCode = 400;
            throw err;
          }

          // Quy tac dat truoc 4 gio cho Beef Wellington Premium & King & Queen
          if (menuItem.requiresAdvanceOrderHours > 0 && hoursAhead < menuItem.requiresAdvanceOrderHours) {
            const err = new Error(
              `Món "${menuItem.name}" yêu cầu đặt trước tối thiểu ${menuItem.requiresAdvanceOrderHours} giờ so với giờ dùng bữa.`
            );
            err.statusCode = 400;
            throw err;
          }

          if (menuItem.category === 'Couple Set') {
            hasCoupleSet = true;
          }

          preOrderTotal += menuItem.price * qty;
          preparedItems.push({
            menuItemId: menuItem.id,
            quantity: qty,
            unitPrice: menuItem.price,
          });

          // Tru ton kho & tu dong tat isAvailable neu ve 0
          const nextStock = menuItem.stockQuantity - qty;
          await tx.menuItem.update({
            where: { id: menuItem.id },
            data: {
              stockQuantity: nextStock,
              isAvailable: nextStock === 0 ? false : menuItem.isAvailable,
            },
          });
        }
      }

      // Quy tac uu dai 2 ly ruou vang 199.000d khi chon Couple Set
      const applyWinePromo = Boolean(hasWinePromo);
      if (applyWinePromo && !hasCoupleSet) {
        const err = new Error(
          'Ưu đãi 2 ly rượu vang 199.000đ chỉ áp dụng khi bạn chọn kèm ít nhất một Couple Set.'
        );
        err.statusCode = 400;
        throw err;
      }

      const totalAmount = preOrderTotal + (applyWinePromo ? WINE_PROMO_PRICE : 0);
      const depositAmount =
        totalAmount > 0
          ? Math.max(BASE_TABLE_DEPOSIT, Math.round(totalAmount * 0.3))
          : BASE_TABLE_DEPOSIT;

      const bookingCode = generateBookingCode(table.hall.branch.name);

      return tx.reservation.create({
        data: {
          bookingCode,
          userId: req.user.id,
          branchId: table.hall.branchId,
          hallId: table.hallId,
          tableId: table.id,
          reservationDate: String(reservationDate),
          startTime: String(startTime),
          endTime,
          guestCount: parsedGuestCount,
          hasWinePromo: applyWinePromo,
          totalAmount,
          depositAmount,
          depositStatus: 'unpaid',
          status: 'pending',
          specialRequest: specialRequest ? String(specialRequest).trim() : null,
          items: { create: preparedItems },
        },
        include: RESERVATION_INCLUDE,
      });
    });

    res.status(201).json({
      message: 'Đặt bàn thành công! Vui lòng quét mã VietQR để hoàn tất đặt cọc giữ bàn.',
      reservation: attachReservationExtras(createdReservation),
    });
  } catch (err) {
    next(err);
  }
}

async function getMyReservations(req, res, next) {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { userId: req.user.id },
      include: RESERVATION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      reservations: reservations.map(attachReservationExtras),
    });
  } catch (err) {
    next(err);
  }
}

async function confirmTransfer(req, res, next) {
  try {
    const id = Number(req.params.id);
    const reservation = await prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt bàn.' });
    }

    if (req.user.role === 'customer' && reservation.userId !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền thao tác trên đơn đặt bàn này.' });
    }

    if (reservation.status !== 'pending') {
      return res.status(400).json({
        message: 'Đơn đặt bàn không ở trạng thái chờ thanh toán cọc.',
      });
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'waiting_deposit_confirm',
        depositStatus: 'waiting_confirm',
      },
      include: RESERVATION_INCLUDE,
    });

    res.json({
      message: 'Đã ghi nhận thông báo chuyển khoản. Thu ngân KingBeef sẽ xác nhận trong ít phút!',
      reservation: attachReservationExtras(updated),
    });
  } catch (err) {
    next(err);
  }
}

async function cancelReservation(req, res, next) {
  try {
    const id = Number(req.params.id);
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt bàn.' });
    }

    if (req.user.role === 'customer' && reservation.userId !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền hủy đơn đặt bàn này.' });
    }

    if (['checked_in', 'completed', 'cancelled'].includes(reservation.status)) {
      return res.status(400).json({
        message: 'Không thể hủy đơn đã check-in, hoàn tất hoặc đã hủy trước đó.',
      });
    }

    if (req.user.role === 'customer') {
      const hoursLeft = hoursUntilReservation(reservation.reservationDate, reservation.startTime);
      if (hoursLeft < 2) {
        return res.status(400).json({
          message: 'Chỉ có thể hủy đơn đặt bàn trước giờ ăn tối thiểu 2 tiếng. Vui lòng liên hệ hotline nhà hàng.',
        });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Hoan tra ton kho mon dat truoc
      for (const item of reservation.items) {
        const menu = await tx.menuItem.findUnique({ where: { id: item.menuItemId } });
        if (menu) {
          const restoredStock = menu.stockQuantity + item.quantity;
          await tx.menuItem.update({
            where: { id: menu.id },
            data: {
              stockQuantity: restoredStock,
              ...(menu.stockQuantity === 0 && restoredStock > 0 ? { isAvailable: true } : {}),
            },
          });
        }
      }

      return tx.reservation.update({
        where: { id },
        data: { status: 'cancelled' },
        include: RESERVATION_INCLUDE,
      });
    });

    res.json({
      message: 'Đã hủy đơn đặt bàn thành công.',
      reservation: attachReservationExtras(updated),
    });
  } catch (err) {
    next(err);
  }
}

async function getAllReservations(req, res, next) {
  try {
    const { branchId, hallId, date, status, search } = req.query;
    const where = {};

    if (branchId && branchId !== 'all') {
      where.branchId = Number(branchId);
    }
    if (hallId && hallId !== 'all') {
      where.hallId = Number(hallId);
    }
    if (date) {
      where.reservationDate = String(date);
    }
    if (status && status !== 'all') {
      where.status = String(status);
    }

    let reservations = await prisma.reservation.findMany({
      where,
      include: RESERVATION_INCLUDE,
      orderBy: [{ reservationDate: 'desc' }, { startTime: 'desc' }, { createdAt: 'desc' }],
    });

    if (search && search.trim()) {
      const kw = search.trim().toLowerCase();
      reservations = reservations.filter(
        (r) =>
          r.bookingCode.toLowerCase().includes(kw) ||
          r.user.fullName.toLowerCase().includes(kw) ||
          r.user.phone.toLowerCase().includes(kw) ||
          r.user.email.toLowerCase().includes(kw)
      );
    }

    res.json({
      reservations: reservations.map(attachReservationExtras),
    });
  } catch (err) {
    next(err);
  }
}

async function approveDeposit(req, res, next) {
  try {
    const id = Number(req.params.id);
    const reservation = await prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt bàn.' });
    }

    if (!['pending', 'waiting_deposit_confirm'].includes(reservation.status)) {
      return res.status(400).json({ message: 'Đơn đặt bàn này đã được duyệt hoặc không thể duyệt cọc.' });
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'confirmed',
        depositStatus: 'paid',
      },
      include: RESERVATION_INCLUDE,
    });

    res.json({
      message: `Đã xác nhận tiền cọc cho đơn ${updated.bookingCode}.`,
      reservation: attachReservationExtras(updated),
    });
  } catch (err) {
    next(err);
  }
}

async function checkInReservation(req, res, next) {
  try {
    const id = Number(req.params.id);
    const reservation = await prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt bàn.' });
    }

    if (!['confirmed', 'pending', 'waiting_deposit_confirm'].includes(reservation.status)) {
      return res.status(400).json({ message: 'Không thể Check-in cho đơn ở trạng thái hiện tại.' });
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: 'checked_in' },
      include: RESERVATION_INCLUDE,
    });

    res.json({
      message: `Check-in thành công cho đơn ${updated.bookingCode} (Bàn ${updated.table.tableNumber}).`,
      reservation: attachReservationExtras(updated),
    });
  } catch (err) {
    next(err);
  }
}

async function changeTable(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { newTableId } = req.body;

    if (!newTableId) {
      return res.status(400).json({ message: 'Vui lòng chọn bàn mới cần chuyển.' });
    }

    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt bàn.' });
    }

    if (['completed', 'cancelled'].includes(reservation.status)) {
      return res.status(400).json({ message: 'Không thể đổi bàn cho đơn đã hoàn tất hoặc đã hủy.' });
    }

    const targetTable = await prisma.table.findUnique({
      where: { id: Number(newTableId) },
      include: { hall: true },
    });

    if (!targetTable) {
      return res.status(404).json({ message: 'Không tìm thấy bàn mới.' });
    }

    if (targetTable.hall.branchId !== reservation.branchId) {
      return res.status(400).json({ message: 'Chỉ có thể đổi sang bàn thuộc cùng chi nhánh.' });
    }

    if (targetTable.status === 'maintenance') {
      return res.status(400).json({ message: `Bàn số ${targetTable.tableNumber} đang bảo trì.` });
    }

    const overlapping = await prisma.reservation.findMany({
      where: {
        id: { not: reservation.id },
        tableId: targetTable.id,
        reservationDate: reservation.reservationDate,
        status: { in: ACTIVE_BOOKING_STATUSES },
      },
      select: { startTime: true, endTime: true },
    });

    const hasConflict = overlapping.some((b) =>
      isTimeOverlapping(reservation.startTime, reservation.endTime, b.startTime, b.endTime)
    );

    if (hasConflict) {
      return res.status(409).json({
        message: `Bàn số ${targetTable.tableNumber} (${targetTable.hall.name}) đã có khách đặt trong khung giờ này.`,
      });
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        tableId: targetTable.id,
        hallId: targetTable.hallId,
      },
      include: RESERVATION_INCLUDE,
    });

    res.json({
      message: `Đã đổi đơn ${updated.bookingCode} sang ${targetTable.hall.name} - Bàn ${targetTable.tableNumber}.`,
      reservation: attachReservationExtras(updated),
    });
  } catch (err) {
    next(err);
  }
}

async function completeReservation(req, res, next) {
  try {
    const id = Number(req.params.id);
    const reservation = await prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt bàn.' });
    }

    if (['completed', 'cancelled'].includes(reservation.status)) {
      return res.status(400).json({ message: 'Đơn đặt bàn đã hoàn tất hoặc đã bị hủy.' });
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'completed',
        depositStatus: 'paid',
      },
      include: RESERVATION_INCLUDE,
    });

    res.json({
      message: `Đã hoàn tất thanh toán cho đơn ${updated.bookingCode}.`,
      reservation: attachReservationExtras(updated),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReservation,
  getMyReservations,
  confirmTransfer,
  cancelReservation,
  getAllReservations,
  approveDeposit,
  checkInReservation,
  changeTable,
  completeReservation,
};
