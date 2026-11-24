const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'kingbeef_luxury_steak_pasta_jwt_secret_2026';

async function loadUserFromToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET);
  return prisma.user.findUnique({
    where: { id: decoded.userId },
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
}

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
    }

    const token = authHeader.split(' ')[1];
    const user = await loadUserFromToken(token);

    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại hoặc phiên đăng nhập đã hết hạn.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

// Middleware tuy chon cho Guest Booking: co token thi gan req.user, khong co thi tiep tuc la khach vang lai
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const user = await loadUserFromToken(token);
      req.user = user || null;
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Chưa xác thực người dùng.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Bạn không có quyền thực hiện thao tác này (yêu cầu quyền: ${allowedRoles.join(', ')}).`,
      });
    }
    next();
  };
}

module.exports = { authenticate, optionalAuthenticate, authorize, JWT_SECRET };
