const express = require('express');
const {
  getCustomers,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/customers', authenticate, authorize('admin'), getCustomers);
router.get('/staff', authenticate, authorize('admin'), getStaff);
router.post('/staff', authenticate, authorize('admin'), createStaff);
router.put('/staff/:id', authenticate, authorize('admin'), updateStaff);
router.delete('/staff/:id', authenticate, authorize('admin'), deleteStaff);

module.exports = router;
