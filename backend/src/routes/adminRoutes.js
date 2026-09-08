const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCommandCenter,
  getPlatformStats,
  generateScribe,
  createInvoice,
  getSystemHealth,
  getOrganizations,
  getAdminAuditLogs,
} = require('../controllers/adminController');

router.get('/command-center', protect, authorize('admin'), getCommandCenter);
router.get('/platform-stats', protect, authorize('admin'), getPlatformStats);
router.post('/ai-scribe', protect, authorize('admin', 'doctor'), generateScribe);
router.post('/invoices', protect, authorize('admin'), createInvoice);
router.get('/system-health', protect, authorize('admin'), getSystemHealth);
router.get('/organizations', protect, authorize('admin'), getOrganizations);
router.get('/audit-logs', protect, authorize('admin'), getAdminAuditLogs);

module.exports = router;
