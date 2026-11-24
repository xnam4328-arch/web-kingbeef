const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { logActivity } = require('../lib/activityLog');

const STAFF_ROLES = ['admin', 'cashier', 'staff'];

async function getCustomers(req, res, next) {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'customer' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
        reservations: {
          include: {
            branch: { select: { name: true } },
            hall: { select: { name: true } },
            table: { select: { tableNumber: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = customers.map((c) => {
      let totalSpent = 0;
      let completedCount = 0;
      for (const r of c.reservations) {
        if (r.status === 'completed') {
          completedCount++;
          totalSpent += r.totalAmount > 0 ? r.totalAmount : r.depositAmount;
        } else if (['confirmed', 'checked_in'].includes(r.status)) {
          totalSpent += r.depositAmount;
        }
      }
      return {
        ...c,
        totalBookings: c.reservations.length,
        completedCount,
        totalSpent,
      };
    });

    res.json({ customers: formatted });
  } catch (err) {
    next(err);
  }
}

async function getStaff(req, res, next) {
  try {
    const staff = await prisma.user.findMany({
      where: { role: { in: STAFF_ROLES } },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        branch: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { id: 'asc' }],
    });
    res.json({ staff });
  } catch (err) {
    next(err);
  }
}

async function createStaff(req, res, next) {
  try {
    const { fullName, email, phone, password, role, branchId } = req.body;
    if (!fullName || !email || !phone || !password || !role) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin nhân sự.' });
    }
    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Vai trò nhân sự phải là admin, cashier hoặc staff.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        passwordHash,
        role,
        branchId: branchId ? Number(branchId) : null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        branch: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    await logActivity(
      req.user,
      'MANAGE_STAFF',
      'User',
      created.id,
      `Tạo tài khoản nhân sự "${created.fullName}" (${created.email}) với vai trò ${created.role}`,
      created.branchId
    );

    res.status(201).json({ message: 'Tạo tài khoản nhân sự thành công.', user: created });
  } catch (err) {
    next(err);
  }
}

async function updateStaff(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { fullName, phone, role, branchId, password } = req.body;

    if (role && !STAFF_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ.' });
    }

    const data = {
      ...(fullName && { fullName: fullName.trim() }),
      ...(phone && { phone: phone.trim() }),
      ...(role && { role }),
      ...(branchId !== undefined && { branchId: branchId ? Number(branchId) : null }),
    };

    if (password && password.length >= 6) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        branch: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    await logActivity(
      req.user,
      'MANAGE_STAFF',
      'User',
      updated.id,
      `Cập nhật nhân sự "${updated.fullName}" → vai trò ${updated.role}`,
      updated.branchId
    );

    res.json({ message: 'Cập nhật nhân sự thành công.', user: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteStaff(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Không thể tự xóa tài khoản đang đăng nhập.' });
    }
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy nhân sự.' });
    }

    await prisma.user.delete({ where: { id } });

    await logActivity(
      req.user,
      'MANAGE_STAFF',
      'User',
      id,
      `Xóa tài khoản nhân sự "${existing.fullName}" (${existing.email})`,
      existing.branchId
    );

    res.json({ message: 'Đã xóa tài khoản nhân sự.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCustomers, getStaff, createStaff, updateStaff, deleteStaff };
