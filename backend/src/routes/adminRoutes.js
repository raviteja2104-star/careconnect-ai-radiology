const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getCommandCenter, getPlatformStats, generateScribe, createInvoice } = require('../controllers/adminController');

router.get('/command-center', protect, authorize('admin'), getCommandCenter);
router.get('/platform-stats', protect, authorize('admin'), getPlatformStats);
router.post('/ai-scribe', protect, authorize('admin', 'doctor'), generateScribe);
router.post('/invoices', protect, authorize('admin'), createInvoice);

module.exports = router;
