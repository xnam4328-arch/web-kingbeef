const express = require('express');
const { getActivityLogs } = require('../controllers/activityLog.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/activity-logs', authenticate, authorize('admin'), getActivityLogs);

module.exports = router;
