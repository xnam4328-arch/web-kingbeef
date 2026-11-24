const prisma = require('../lib/prisma');

const VALID_CATEGORIES = [
  'Appetizers',
  'Soup',
  'Salad',
  'Pasta',
  'Steak & Main Course',
  'Drink & Dessert',
  'Couple Set',
];

async function getMenu(req, res, next) {
  try {
    const { category, search, availableOnly } = req.query;
    const where = {};

    if (category && category !== 'all') {
      where.category = String(category);
    }
    if (availableOnly === 'true') {
      where.isAvailable = true;
      where.stockQuantity = { gt: 0 };
    }

    let items = await prisma.menuItem.findMany({
      where,
      orderBy: [{ id: 'asc' }],
    });

    if (search && search.trim()) {
      const keyword = search.trim().toLowerCase();
      items = items.filter(
        (m) =>
          m.name.toLowerCase().includes(keyword) ||
          m.description.toLowerCase().includes(keyword) ||
          m.category.toLowerCase().includes(keyword)
      );
    }

    res.json({
      vatNotice: 'Giá trên chưa bao gồm thuế VAT',
      categories: VALID_CATEGORIES,
      items,
    });
  } catch (err) {
    next(err);
  }
}

async function getLowStock(req, res, next) {
  try {
    const threshold = Number(req.query.threshold || 10);
    const items = await prisma.menuItem.findMany({
      where: {
        OR: [{ stockQuantity: { lte: threshold } }, { isAvailable: false }],
      },
      orderBy: { stockQuantity: 'asc' },
    });
    res.json({ items, threshold });
  } catch (err) {
    next(err);
  }
}

async function createMenuItem(req, res, next) {
  try {
    const {
      name,
      category,
      description = '',
      price,
      imageUrl = null,
      badge = null,
      stockQuantity = 50,
      isAvailable = true,
      requiresAdvanceOrderHours = 0,
    } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ message: 'Vui lòng nhập tên món, danh mục và giá bán.' });
    }

    const parsedStock = Math.max(0, Number(stockQuantity));
    const computedAvailable = parsedStock === 0 ? false : Boolean(isAvailable);

    const item = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price),
        imageUrl,
        badge,
        stockQuantity: parsedStock,
        isAvailable: computedAvailable,
        requiresAdvanceOrderHours: Math.max(0, Number(requiresAdvanceOrderHours)),
      },
    });

    res.status(201).json({ message: 'Thêm món ăn thành công.', item });
  } catch (err) {
    next(err);
  }
}

async function updateMenuItem(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn.' });
    }

    const {
      name,
      category,
      description,
      price,
      imageUrl,
      badge,
      stockQuantity,
      isAvailable,
      requiresAdvanceOrderHours,
    } = req.body;

    const nextStock =
      stockQuantity !== undefined ? Math.max(0, Number(stockQuantity)) : existing.stockQuantity;

    // Quy tac bat buoc: tu dong chuyen isAvailable = false khi ton kho ve 0
    let nextAvailable = isAvailable !== undefined ? Boolean(isAvailable) : existing.isAvailable;
    if (nextStock === 0) {
      nextAvailable = false;
    } else if (stockQuantity !== undefined && existing.stockQuantity === 0 && nextStock > 0 && isAvailable === undefined) {
      nextAvailable = true;
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(price !== undefined && { price: Number(price) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(badge !== undefined && { badge }),
        stockQuantity: nextStock,
        isAvailable: nextAvailable,
        ...(requiresAdvanceOrderHours !== undefined && {
          requiresAdvanceOrderHours: Math.max(0, Number(requiresAdvanceOrderHours)),
        }),
      },
    });

    res.json({ message: 'Cập nhật thực đơn & tồn kho thành công.', item });
  } catch (err) {
    next(err);
  }
}

async function toggleAvailability(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy món ăn.' });
    }

    const { isAvailable, stockQuantity } = req.body;
    const nextStock =
      stockQuantity !== undefined ? Math.max(0, Number(stockQuantity)) : existing.stockQuantity;
    const desiredAvailable =
      isAvailable !== undefined ? Boolean(isAvailable) : !existing.isAvailable;

    if (desiredAvailable && nextStock === 0) {
      return res.status(400).json({
        message: 'Tồn kho đang bằng 0. Vui lòng cập nhật số lượng tồn kho lớn hơn 0 trước khi mở bán lại.',
      });
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        stockQuantity: nextStock,
        isAvailable: nextStock === 0 ? false : desiredAvailable,
      },
    });

    res.json({
      message: item.isAvailable ? 'Đã mở bán món ăn.' : 'Đã chuyển sang trạng thái Hết món.',
      item,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteMenuItem(req, res, next) {
  try {
    const id = Number(req.params.id);
    const usedCount = await prisma.reservationItem.count({ where: { menuItemId: id } });
    if (usedCount > 0) {
      return res.status(400).json({
        message: 'Món ăn đã tồn tại trong lịch sử đơn hàng. Vui lòng tắt trạng thái phục vụ thay vì xóa.',
      });
    }
    await prisma.menuItem.delete({ where: { id } });
    res.json({ message: 'Xóa món ăn thành công.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMenu,
  getLowStock,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
};
