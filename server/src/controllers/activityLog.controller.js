const prisma = require('../lib/prisma');

async function getActivityLogs(req, res, next) {
  try {
    const {
      branchId,
      userId,
      action,
      fromDate,
      toDate,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};

    if (branchId && branchId !== 'all') {
      where.branchId = Number(branchId);
    }
    if (userId && userId !== 'all') {
      where.userId = Number(userId);
    }
    if (action && action !== 'all') {
      where.action = String(action);
    }
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = new Date(`${fromDate}T00:00:00`);
      }
      if (toDate) {
        where.createdAt.lte = new Date(`${toDate}T23:59:59.999`);
      }
    }

    const pageNum = Math.max(1, Number(page));
    const pageSize = Math.min(100, Math.max(5, Number(limit)));

    let allLogs = await prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (search && search.trim()) {
      const kw = search.trim().toLowerCase();
      allLogs = allLogs.filter(
        (log) =>
          (log.targetId || '').toLowerCase().includes(kw) ||
          log.details.toLowerCase().includes(kw) ||
          (log.user?.fullName || '').toLowerCase().includes(kw) ||
          log.action.toLowerCase().includes(kw)
      );
    }

    const total = allLogs.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const startIdx = (pageNum - 1) * pageSize;
    const logs = allLogs.slice(startIdx, startIdx + pageSize);

    const staffList = await prisma.user.findMany({
      where: { role: { in: ['admin', 'cashier', 'staff'] } },
      select: { id: true, fullName: true, role: true },
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    });

    res.json({
      logs,
      staffList,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getActivityLogs };
