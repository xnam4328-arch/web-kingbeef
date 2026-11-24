const express = require('express');
const {
  createReservation,
  getMyReservations,
  confirmTransfer,
  cancelReservation,
  getAllReservations,
  approveDeposit,
  checkInReservation,
  changeTable,
  completeReservation,
} = require('../controllers/reservation.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Khach hang & Admin
router.post('/', authenticate, authorize('customer', 'admin'), createReservation);
router.get('/my', authenticate, getMyReservations);
router.patch('/:id/confirm-transfer', authenticate, authorize('customer', 'admin'), confirmTransfer);
router.patch('/:id/cancel', authenticate, authorize('customer', 'admin'), cancelReservation);

// Van hanh: Staff / Cashier / Admin
router.get('/', authenticate, authorize('staff', 'cashier', 'admin'), getAllReservations);
router.patch('/:id/approve-deposit', authenticate, authorize('cashier', 'admin'), approveDeposit);
router.patch('/:id/check-in', authenticate, authorize('staff', 'admin'), checkInReservation);
router.patch('/:id/change-table', authenticate, authorize('staff', 'admin'), changeTable);
router.patch('/:id/complete', authenticate, authorize('cashier', 'admin'), completeReservation);

module.exports = router;
