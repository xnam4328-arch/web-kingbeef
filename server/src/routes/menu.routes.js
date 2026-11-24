const express = require('express');
const {
  getMenu,
  getLowStock,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
} = require('../controllers/menu.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', getMenu);
router.get('/low-stock', authenticate, authorize('staff', 'admin'), getLowStock);
router.post('/', authenticate, authorize('admin'), createMenuItem);
router.put('/:id', authenticate, authorize('admin'), updateMenuItem);
router.patch('/:id/availability', authenticate, authorize('staff', 'admin'), toggleAvailability);
router.delete('/:id', authenticate, authorize('admin'), deleteMenuItem);

module.exports = router;
