const prisma = require('../lib/prisma');
const { logActivity } = require('../lib/activityLog');

async function createTable(req, res, next) {
  try {
    const { hallId, tableNumber, capacity = 4, posX = 0, posY = 0, posZ = 0, status = 'available' } = req.body;

    if (!hallId || tableNumber === undefined) {
      return res.status(400).json({ message: 'Vui lòng chọn sảnh và nhập số bàn.' });
    }

    if (!['available', 'maintenance'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái bàn chỉ chấp nhận available hoặc maintenance.' });
    }

    const table = await prisma.table.create({
      data: {
        hallId: Number(hallId),
        tableNumber: Number(tableNumber),
        capacity: Number(capacity),
        posX: Number(posX),
        posY: Number(posY),
        posZ: Number(posZ),
        status,
      },
      include: { hall: true },
    });

    await logActivity(
      req.user,
      'UPDATE_TABLE',
      'Table',
      table.tableNumber,
      `Thêm Bàn số ${table.tableNumber} (${table.capacity} khách) vào ${table.hall.name}`,
      table.hall.branchId
    );

    res.status(201).json({ message: 'Thêm bàn 3D thành công.', table });
  } catch (err) {
    next(err);
  }
}

async function updateTable(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { tableNumber, capacity, posX, posY, posZ, status } = req.body;

    if (status && !['available', 'maintenance'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái bàn chỉ chấp nhận available hoặc maintenance.' });
    }

    const table = await prisma.table.update({
      where: { id },
      data: {
        ...(tableNumber !== undefined && { tableNumber: Number(tableNumber) }),
        ...(capacity !== undefined && { capacity: Number(capacity) }),
        ...(posX !== undefined && { posX: Number(posX) }),
        ...(posY !== undefined && { posY: Number(posY) }),
        ...(posZ !== undefined && { posZ: Number(posZ) }),
        ...(status !== undefined && { status }),
      },
      include: { hall: true },
    });

    await logActivity(
      req.user,
      'UPDATE_TABLE',
      'Table',
      table.tableNumber,
      `Cập nhật Bàn số ${table.tableNumber} (${table.hall.name}): sức chứa ${table.capacity}, tọa độ (${table.posX}, ${table.posY}, ${table.posZ}), trạng thái ${table.status}`,
      table.hall.branchId
    );

    res.json({ message: 'Cập nhật bàn 3D thành công.', table });
  } catch (err) {
    next(err);
  }
}

async function deleteTable(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.table.findUnique({ where: { id }, include: { hall: true } });
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy bàn.' });
    }

    const activeCount = await prisma.reservation.count({
      where: {
        tableId: id,
        status: { in: ['pending', 'waiting_deposit_confirm', 'confirmed', 'checked_in'] },
      },
    });

    if (activeCount > 0) {
      return res.status(400).json({
        message: 'Không thể xóa bàn đang có đơn đặt bàn chưa hoàn tất. Vui lòng chuyển bàn sang trạng thái bảo trì.',
      });
    }

    const totalHistory = await prisma.reservation.count({ where: { tableId: id } });
    if (totalHistory > 0) {
      return res.status(400).json({
        message: 'Bàn này đã có lịch sử giao dịch. Để bảo toàn dữ liệu thống kê, vui lòng chuyển bàn sang trạng thái bảo trì thay vì xóa.',
      });
    }

    await prisma.table.delete({ where: { id } });

    await logActivity(
      req.user,
      'UPDATE_TABLE',
      'Table',
      existing.tableNumber,
      `Xóa Bàn số ${existing.tableNumber} khỏi ${existing.hall.name}`,
      existing.hall.branchId
    );

    res.json({ message: 'Xóa bàn thành công.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTable, updateTable, deleteTable };
