const express = require('express');
const { createTable, updateTable, deleteTable } = require('../controllers/table.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', authenticate, authorize('admin'), createTable);
router.put('/:id', authenticate, authorize('admin'), updateTable);
router.delete('/:id', authenticate, authorize('admin'), deleteTable);

module.exports = router;
