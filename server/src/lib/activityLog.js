const prisma = require('./prisma');

/**
 * Ghi log thao tac nhan su (Admin / Cashier / Staff) vao bang ActivityLog.
 * Khong lam gian doan request chinh neu ghi log gap loi.
 */
async function logActivity(user, action, targetType, targetId, details, branchId = null) {
  try {
    if (!user || !user.id) return;
    if (!['admin', 'cashier', 'staff'].includes(user.role)) return;

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        branchId: branchId !== null && branchId !== undefined ? Number(branchId) : user.branchId || null,
        action: String(action),
        targetType: String(targetType),
        targetId: targetId !== null && targetId !== undefined ? String(targetId) : null,
        details: String(details),
      },
    });
  } catch (err) {
    console.error('[ActivityLog Error]', err.message);
  }
}

module.exports = { logActivity };
