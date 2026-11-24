const express = require('express');
const {
  getBranches,
  createBranch,
  updateBranch,
  createHall,
  updateHall,
  getHallTablesWithAvailability,
} = require('../controllers/branch.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Chi nhanh
router.get('/branches', getBranches);
router.post('/branches', authenticate, authorize('admin'), createBranch);
router.put('/branches/:id', authenticate, authorize('admin'), updateBranch);

// Sanh & so do ban 3D theo khung gio
router.get('/halls/:hallId/tables', getHallTablesWithAvailability);
router.post('/halls', authenticate, authorize('admin'), createHall);
router.put('/halls/:id', authenticate, authorize('admin'), updateHall);

module.exports = router;
