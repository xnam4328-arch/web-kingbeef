const prisma = require('../lib/prisma');
const { addHoursToTime, isTimeOverlapping } = require('../lib/time');

const ACTIVE_BOOKING_STATUSES = ['pending', 'waiting_deposit_confirm', 'confirmed', 'checked_in'];

async function getBranches(req, res, next) {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        halls: {
          orderBy: { id: 'asc' },
          include: {
            _count: { select: { tables: true } },
          },
        },
      },
      orderBy: { id: 'asc' },
    });
    res.json({ branches });
  } catch (err) {
    next(err);
  }
}

async function createBranch(req, res, next) {
  try {
    const { name, address, phone } = req.body;
    if (!name || !address || !phone) {
      return res.status(400).json({ message: 'Vui lòng nhập tên chi nhánh, địa chỉ và số điện thoại.' });
    }
    const branch = await prisma.branch.create({
      data: { name: name.trim(), address: address.trim(), phone: phone.trim() },
    });
    res.status(201).json({ message: 'Tạo chi nhánh thành công.', branch });
  } catch (err) {
    next(err);
  }
}

async function updateBranch(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name, address, phone } = req.body;
    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(address && { address: address.trim() }),
        ...(phone && { phone: phone.trim() }),
      },
    });
    res.json({ message: 'Cập nhật chi nhánh thành công.', branch });
  } catch (err) {
    next(err);
  }
}

async function createHall(req, res, next) {
  try {
    const { branchId, name, type, description } = req.body;
    if (!branchId || !name || !type) {
      return res.status(400).json({ message: 'Vui lòng nhập chi nhánh, tên sảnh và loại sảnh.' });
    }
    if (!['indoor', 'outdoor', 'vip'].includes(type)) {
      return res.status(400).json({ message: 'Loại sảnh phải là indoor, outdoor hoặc vip.' });
    }
    const hall = await prisma.hall.create({
      data: {
        branchId: Number(branchId),
        name: name.trim(),
        type,
        description: (description || '').trim(),
      },
    });
    res.status(201).json({ message: 'Tạo sảnh thành công.', hall });
  } catch (err) {
    next(err);
  }
}

async function updateHall(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name, type, description } = req.body;
    if (type && !['indoor', 'outdoor', 'vip'].includes(type)) {
      return res.status(400).json({ message: 'Loại sảnh phải là indoor, outdoor hoặc vip.' });
    }
    const hall = await prisma.hall.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(type && { type }),
        ...(description !== undefined && { description: description.trim() }),
      },
    });
    res.json({ message: 'Cập nhật sảnh thành công.', hall });
  } catch (err) {
    next(err);
  }
}

async function getHallTablesWithAvailability(req, res, next) {
  try {
    const hallId = Number(req.params.hallId);
    const { date, startTime } = req.query;

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: {
        branch: true,
        tables: {
          orderBy: { tableNumber: 'asc' },
        },
      },
    });

    if (!hall) {
      return res.status(404).json({ message: 'Không tìm thấy sảnh yêu cầu.' });
    }

    let bookedTableIds = new Set();

    if (date && startTime) {
      const endTime = addHoursToTime(startTime, 2);
      const existingBookings = await prisma.reservation.findMany({
        where: {
          hallId,
          reservationDate: String(date),
          status: { in: ACTIVE_BOOKING_STATUSES },
        },
        select: {
          tableId: true,
          startTime: true,
          endTime: true,
        },
      });

      for (const b of existingBookings) {
        if (isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)) {
          bookedTableIds.add(b.tableId);
        }
      }
    }

    const tables = hall.tables.map((t) => {
      let displayStatus = 'available';
      if (t.status === 'maintenance') {
        displayStatus = 'maintenance';
      } else if (bookedTableIds.has(t.id)) {
        displayStatus = 'booked';
      }
      return {
        ...t,
        displayStatus,
      };
    });

    res.json({
      hall: {
        id: hall.id,
        name: hall.name,
        type: hall.type,
        description: hall.description,
        branchId: hall.branchId,
        branch: hall.branch,
      },
      tables,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBranches,
  createBranch,
  updateBranch,
  createHall,
  updateHall,
  getHallTablesWithAvailability,
};
