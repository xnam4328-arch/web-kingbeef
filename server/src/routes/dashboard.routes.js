const express = require('express');
const { getOverview, getCharts } = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/overview', authenticate, authorize('cashier', 'admin'), getOverview);
router.get('/charts', authenticate, authorize('cashier', 'admin'), getCharts);

module.exports = router;
