const express = require('express');
const {
  createReservation,
  lookupReservation,
  getMyReservations,
  confirmTransfer,
  cancelReservation,
  getAllReservations,
  approveDeposit,
  checkInReservation,
  changeTable,
  completeReservation,
} = require('../controllers/reservation.controller');
const { authenticate, optionalAuthenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public / Guest Booking & Tra cuu don khong can dang nhap
router.post('/', optionalAuthenticate, createReservation);
router.get('/lookup', lookupReservation);
router.get('/lookup/:bookingCode', lookupReservation);
router.patch('/:id/confirm-transfer', optionalAuthenticate, confirmTransfer);

// Tai khoan khach hang / da dang nhap
router.get('/my', authenticate, getMyReservations);
router.patch('/:id/cancel', authenticate, authorize('customer', 'admin'), cancelReservation);

// Van hanh: Staff / Cashier / Admin
router.get('/', authenticate, authorize('staff', 'cashier', 'admin'), getAllReservations);
router.patch('/:id/approve-deposit', authenticate, authorize('cashier', 'admin'), approveDeposit);
router.patch('/:id/check-in', authenticate, authorize('staff', 'admin'), checkInReservation);
router.patch('/:id/change-table', authenticate, authorize('staff', 'admin'), changeTable);
router.patch('/:id/complete', authenticate, authorize('cashier', 'admin'), completeReservation);

module.exports = router;
