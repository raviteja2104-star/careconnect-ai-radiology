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
  getMigrationJobs,
  createMigrationJob,
  getSupportTickets,
  createSupportTicket,
} = require('../controllers/adminController');

router.get('/command-center', protect, authorize('admin'), getCommandCenter);
router.get('/platform-stats', protect, authorize('admin'), getPlatformStats);
router.post('/ai-scribe', protect, authorize('admin', 'doctor'), generateScribe);
router.post('/invoices', protect, authorize('admin'), createInvoice);
router.get('/system-health', protect, authorize('admin'), getSystemHealth);
router.get('/organizations', protect, authorize('admin'), getOrganizations);
router.get('/audit-logs', protect, authorize('admin'), getAdminAuditLogs);
router.get('/migration-jobs', protect, authorize('admin'), getMigrationJobs);
router.post('/migration-jobs', protect, authorize('admin'), createMigrationJob);
router.get('/support-tickets', protect, authorize('admin'), getSupportTickets);
router.post('/support-tickets', protect, authorize('admin'), createSupportTicket);

module.exports = router;
