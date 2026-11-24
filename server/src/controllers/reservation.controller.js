const prisma = require('../lib/prisma');
const { buildVietQR } = require('../lib/vietqr');
const { logActivity } = require('../lib/activityLog');
const {
  buildExcelBuffer,
  getSyncConfig,
  saveSyncConfig,
  fetchAllReservationsForExcel,
  formatReservationRow,
  syncLocalExcelFile,
  pushToWebhook,
  syncReservationEverywhere,
} = require('../lib/excelSync');
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
    customerDisplayName: reservation.guestName || reservation.user?.fullName || 'Khách vãng lai',
    customerDisplayPhone: reservation.guestPhone || reservation.user?.phone || '',
    customerDisplayEmail: reservation.guestEmail || reservation.user?.email || '',
    isGuestBooking: !reservation.userId,
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
      guestName,
      guestPhone,
      guestEmail,
      items = [],
      hasWinePromo = false,
      specialRequest = '',
    } = req.body;

    if (!branchId || !hallId || !tableId || !reservationDate || !startTime || !guestCount) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp đầy đủ chi nhánh, sảnh, bàn, ngày, khung giờ và số lượng khách.',
      });
    }

    const finalGuestName = (guestName || req.user?.fullName || '').trim();
    const finalGuestPhone = (guestPhone || req.user?.phone || '').trim();
    const finalGuestEmail = (guestEmail || req.user?.email || '').trim() || null;

    if (!finalGuestName || !finalGuestPhone) {
      return res.status(400).json({
        message: 'Vui lòng nhập Họ tên và Số điện thoại để nhà hàng xác nhận đặt bàn.',
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

    const createdReservation = await prisma.$transaction(async (tx) => {
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

      let preOrderTotal = 0;
      let hasCoupleSet = false;
      const preparedItems = [];

      if (Array.isArray(items) && items.length > 0) {
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
          userId: req.user ? req.user.id : null,
          guestName: finalGuestName,
          guestPhone: finalGuestPhone,
          guestEmail: finalGuestEmail,
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

    // Tu dong dong bo sang file Excel & Webhook (khong chan phan hoi)
    syncReservationEverywhere(createdReservation, 'CREATED').catch(() => {});

    res.status(201).json({
      message: 'Đặt bàn thành công! Vui lòng quét mã VietQR để hoàn tất đặt cọc giữ bàn.',
      reservation: attachReservationExtras(createdReservation),
    });
  } catch (err) {
    next(err);
  }
}

// Public lookup: tra cuu bang BookingCode hoac So dien thoai (khong can dang nhap)
async function lookupReservation(req, res, next) {
  try {
    const rawQuery = (req.params.bookingCode || req.query.q || '').trim();
    if (!rawQuery) {
      return res.status(400).json({ message: 'Vui lòng nhập Mã đặt bàn hoặc Số điện thoại để tra cứu.' });
    }

    const normalizedUpper = rawQuery.toUpperCase();
    const cleanedPhone = rawQuery.replace(/\s+/g, '');

    const byCode = await prisma.reservation.findUnique({
      where: { bookingCode: normalizedUpper },
      include: RESERVATION_INCLUDE,
    });

    if (byCode) {
      const formatted = attachReservationExtras(byCode);
      return res.json({
        reservation: formatted,
        reservations: [formatted],
      });
    }

    const byPhone = await prisma.reservation.findMany({
      where: {
        OR: [
          { guestPhone: rawQuery },
          { guestPhone: cleanedPhone },
          { user: { phone: rawQuery } },
        ],
      },
      include: RESERVATION_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    if (byPhone.length === 0) {
      return res.status(404).json({
        message: `Không tìm thấy đơn đặt bàn nào khớp với "${rawQuery}". Vui lòng kiểm tra lại Mã đặt bàn hoặc Số điện thoại.`,
      });
    }

    const formattedList = byPhone.map(attachReservationExtras);
    res.json({
      reservation: formattedList[0],
      reservations: formattedList,
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

    if (req.user) {
      if (req.user.role === 'customer' && reservation.userId && reservation.userId !== req.user.id) {
        return res.status(403).json({ message: 'Bạn không có quyền thao tác trên đơn đặt bàn này.' });
      }
    } else {
      // Khach vang lai xac nhan chuyen khoan bang ma bookingCode tuong ung
      const providedCode = String(req.body?.bookingCode || '').trim().toUpperCase();
      if (!providedCode || providedCode !== reservation.bookingCode) {
        return res.status(403).json({ message: 'Mã đặt bàn xác thực không khớp.' });
      }
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

    syncReservationEverywhere(updated, 'TRANSFER_REPORTED').catch(() => {});

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
      include: { items: true, hall: true, table: true },
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
          message: 'Chỉ có thể hủy đơn đặt bàn trước giờ ăn tối thiểu 2 tiếng. Vui lòng liên hệ hotline 0562 275 375.',
        });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
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

    await logActivity(
      req.user,
      'CANCEL_BOOKING',
      'Reservation',
      updated.bookingCode,
      `Hủy đơn đặt bàn ${updated.bookingCode} của khách ${updated.guestName} (${updated.hall.name} - Bàn ${updated.table.tableNumber})`,
      updated.branchId
    );

    syncReservationEverywhere(updated, 'CANCELLED').catch(() => {});

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
          (r.guestName || '').toLowerCase().includes(kw) ||
          (r.guestPhone || '').toLowerCase().includes(kw) ||
          (r.guestEmail || '').toLowerCase().includes(kw) ||
          (r.user?.fullName || '').toLowerCase().includes(kw) ||
          (r.user?.phone || '').toLowerCase().includes(kw)
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

    await logActivity(
      req.user,
      'CONFIRM_DEPOSIT',
      'Reservation',
      updated.bookingCode,
      `Duyệt cọc QR ${updated.depositAmount.toLocaleString('vi-VN')}đ cho đơn ${updated.bookingCode} (${updated.hall.name} - Bàn ${updated.table.tableNumber})`,
      updated.branchId
    );

    syncReservationEverywhere(updated, 'DEPOSIT_CONFIRMED').catch(() => {});

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

    await logActivity(
      req.user,
      'CHECK_IN',
      'Reservation',
      updated.bookingCode,
      `Check-in khách ${updated.guestName} tại đơn ${updated.bookingCode} (${updated.hall.name} - Bàn ${updated.table.tableNumber})`,
      updated.branchId
    );

    syncReservationEverywhere(updated, 'CHECKED_IN').catch(() => {});

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

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { hall: true, table: true },
    });
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

    const oldDesc = `${reservation.hall.name} - Bàn ${reservation.table.tableNumber}`;
    const newDesc = `${targetTable.hall.name} - Bàn ${targetTable.tableNumber}`;

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        tableId: targetTable.id,
        hallId: targetTable.hallId,
      },
      include: RESERVATION_INCLUDE,
    });

    await logActivity(
      req.user,
      'CHANGE_TABLE',
      'Reservation',
      updated.bookingCode,
      `Đổi bàn đơn ${updated.bookingCode} từ ${oldDesc} sang ${newDesc}`,
      updated.branchId
    );

    syncReservationEverywhere(updated, 'TABLE_CHANGED').catch(() => {});

    res.json({
      message: `Đã đổi đơn ${updated.bookingCode} sang ${newDesc}.`,
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

    await logActivity(
      req.user,
      'COMPLETE_BOOKING',
      'Reservation',
      updated.bookingCode,
      `Hoàn tất thanh toán đơn ${updated.bookingCode} (${updated.hall.name} - Bàn ${updated.table.tableNumber})`,
      updated.branchId
    );

    syncReservationEverywhere(updated, 'COMPLETED').catch(() => {});

    res.json({
      message: `Đã hoàn tất thanh toán cho đơn ${updated.bookingCode}.`,
      reservation: attachReservationExtras(updated),
    });
  } catch (err) {
    next(err);
  }
}

async function exportReservationsExcel(req, res, next) {
  try {
    const { branchId, date, status } = req.query;
    const where = {};
    if (branchId && branchId !== 'all') where.branchId = Number(branchId);
    if (date) where.reservationDate = String(date);
    if (status && status !== 'all') where.status = String(status);

    const reservations = await prisma.reservation.findMany({
      where,
      include: RESERVATION_INCLUDE,
      orderBy: [{ reservationDate: 'desc' }, { startTime: 'desc' }, { createdAt: 'desc' }],
    });

    const buffer = buildExcelBuffer(reservations);
    const today = new Date().toISOString().slice(0, 10);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="KingBeef_DatBan_${today}.xlsx"`
    );
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

async function getExcelSyncConfig(req, res) {
  res.json({ config: getSyncConfig() });
}

async function updateExcelSyncConfig(req, res, next) {
  try {
    const { webhookUrl, autoSync } = req.body;
    const config = saveSyncConfig({ webhookUrl, autoSync });
    res.json({ message: 'Đã lưu cấu hình liên kết Excel / Google Sheets.', config });
  } catch (err) {
    next(err);
  }
}

async function triggerExcelSyncNow(req, res, next) {
  try {
    const localResult = await syncLocalExcelFile();
    const cfg = getSyncConfig();
    let webhookResult = { skipped: true };

    if (cfg.webhookUrl) {
      const all = await fetchAllReservationsForExcel();
      webhookResult = await pushToWebhook({
        event: 'SYNC_ALL',
        syncedAt: new Date().toISOString(),
        rows: all.map(formatReservationRow),
      });
    }

    res.json({
      message: cfg.webhookUrl
        ? webhookResult.ok
          ? `Đã cập nhật file Excel cục bộ (${localResult?.count || 0} đơn) và đồng bộ thành công lên Excel Online / Google Sheets!`
          : `Đã cập nhật file Excel cục bộ (${localResult?.count || 0} đơn), nhưng Webhook chưa phản hồi (${webhookResult.error || webhookResult.status}).`
        : `Đã xuất & cập nhật thành công ${localResult?.count || 0} đơn vào file KingBeef_DatBan.xlsx!`,
      localResult,
      webhookResult,
      config: getSyncConfig(),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReservation,
  lookupReservation,
  getMyReservations,
  confirmTransfer,
  cancelReservation,
  getAllReservations,
  approveDeposit,
  checkInReservation,
  changeTable,
  completeReservation,
  exportReservationsExcel,
  getExcelSyncConfig,
  updateExcelSyncConfig,
  triggerExcelSyncNow,
};
