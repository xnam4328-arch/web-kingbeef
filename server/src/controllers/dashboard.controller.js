const prisma = require('../lib/prisma');
const { formatDateYMD } = require('../lib/time');

function resolveDateRange(range, role) {
  // Thu ngan xem bao cao doanh thu trong ngay
  const effectiveRange = role === 'cashier' ? 'today' : range || '30d';
  const today = new Date();
  const endDate = formatDateYMD(today);

  if (effectiveRange === 'today') {
    return { startDate: endDate, endDate, effectiveRange };
  }
  if (effectiveRange === '7d') {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return { startDate: formatDateYMD(d), endDate, effectiveRange };
  }
  if (effectiveRange === '30d') {
    const d = new Date(today);
    d.setDate(d.getDate() - 29);
    return { startDate: formatDateYMD(d), endDate, effectiveRange };
  }
  return { startDate: null, endDate: null, effectiveRange: 'all' };
}

function reservationRevenue(r) {
  // Doanh thu ghi nhan tu don da xac nhan / check-in / hoan tat
  if (r.status === 'completed') {
    return r.totalAmount > 0 ? r.totalAmount : r.depositAmount;
  }
  if (['confirmed', 'checked_in'].includes(r.status)) {
    return r.depositAmount;
  }
  return 0;
}

async function getOverview(req, res, next) {
  try {
    const { branchId, range } = req.query;
    const { startDate, endDate, effectiveRange } = resolveDateRange(range, req.user.role);

    const where = {};
    if (branchId && branchId !== 'all') {
      where.branchId = Number(branchId);
    }
    if (startDate && endDate) {
      where.reservationDate = { gte: startDate, lte: endDate };
    }

    const [reservations, lowStockCount, totalCustomers] = await Promise.all([
      prisma.reservation.findMany({ where }),
      prisma.menuItem.count({
        where: { OR: [{ stockQuantity: { lte: 10 } }, { isAvailable: false }] },
      }),
      prisma.user.count({ where: { role: 'customer' } }),
    ]);

    const todayStr = formatDateYMD(new Date());
    let totalRevenue = 0;
    let todayRevenue = 0;
    let waitingDepositCount = 0;
    let confirmedCount = 0;
    let checkedInCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    for (const r of reservations) {
      const rev = reservationRevenue(r);
      totalRevenue += rev;
      if (r.reservationDate === todayStr) {
        todayRevenue += rev;
      }
      if (r.status === 'waiting_deposit_confirm') waitingDepositCount++;
      if (r.status === 'confirmed') confirmedCount++;
      if (r.status === 'checked_in') checkedInCount++;
      if (r.status === 'completed') completedCount++;
      if (r.status === 'cancelled') cancelledCount++;
    }

    res.json({
      range: effectiveRange,
      totalRevenue,
      todayRevenue,
      totalReservations: reservations.length,
      waitingDepositCount,
      confirmedCount,
      checkedInCount,
      completedCount,
      cancelledCount,
      lowStockCount,
      totalCustomers,
    });
  } catch (err) {
    next(err);
  }
}

async function getCharts(req, res, next) {
  try {
    const { branchId, range } = req.query;
    const { startDate, endDate, effectiveRange } = resolveDateRange(range, req.user.role);

    const where = {};
    const hallWhere = {};
    if (branchId && branchId !== 'all') {
      where.branchId = Number(branchId);
      hallWhere.branchId = Number(branchId);
    }
    if (startDate && endDate) {
      where.reservationDate = { gte: startDate, lte: endDate };
    }

    const [reservations, halls] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: { hall: { select: { id: true, name: true } } },
        orderBy: { reservationDate: 'asc' },
      }),
      prisma.hall.findMany({
        where: hallWhere,
        include: {
          branch: { select: { name: true } },
          _count: { select: { tables: true } },
        },
        orderBy: { id: 'asc' },
      }),
    ]);

    // 1. Doanh thu theo ngay
    const revMap = new Map();
    for (const r of reservations) {
      if (r.status === 'cancelled') continue;
      const cur = revMap.get(r.reservationDate) || { date: r.reservationDate, revenue: 0, bookings: 0 };
      cur.revenue += reservationRevenue(r);
      cur.bookings += 1;
      revMap.set(r.reservationDate, cur);
    }
    const revenueByDate = Array.from(revMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // 2. Ty le lap day tung sanh
    const hallCounts = new Map();
    for (const r of reservations) {
      if (r.status === 'cancelled') continue;
      hallCounts.set(r.hallId, (hallCounts.get(r.hallId) || 0) + 1);
    }

    const daysSpan =
      effectiveRange === 'today' ? 1 : effectiveRange === '7d' ? 7 : effectiveRange === '30d' ? 30 : 30;
    const hallOccupancy = halls.map((h) => {
      const bookings = hallCounts.get(h.id) || 0;
      const totalTables = h._count.tables || 1;
      // Gia dinh moi ban co trung binh 2 luot phuc vu/ngay (trua/toi) de tinh ty le lap day thuc te
      const capacitySlots = totalTables * Math.min(daysSpan, 7);
      const occupancyRate = Math.min(100, Math.round((bookings / Math.max(1, capacitySlots)) * 100));
      return {
        hallId: h.id,
        hallName: `${h.name} (${h.branch.name})`,
        shortName: h.name,
        branchName: h.branch.name,
        hallType: h.type,
        totalTables,
        bookings,
        occupancyRate,
      };
    });

    // 3. Bieu do gio cao diem (Peak Hours)
    const hourSlots = [
      '11:00',
      '12:00',
      '13:00',
      '17:00',
      '17:30',
      '18:00',
      '18:30',
      '19:00',
      '19:30',
      '20:00',
      '20:30',
      '21:00',
    ];
    const hourMap = new Map(hourSlots.map((h) => [h, { hour: h, bookings: 0, guests: 0 }]));

    for (const r of reservations) {
      if (r.status === 'cancelled') continue;
      const key = r.startTime;
      const cur = hourMap.get(key) || { hour: key, bookings: 0, guests: 0 };
      cur.bookings += 1;
      cur.guests += r.guestCount;
      hourMap.set(key, cur);
    }
    const peakHours = Array.from(hourMap.values()).sort((a, b) => a.hour.localeCompare(b.hour));

    res.json({
      range: effectiveRange,
      revenueByDate,
      hallOccupancy,
      peakHours,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getOverview, getCharts };
