const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');
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

router.get('/command-center', protect, permit('ADMIN.VIEW_DASHBOARD'), getCommandCenter);
router.get('/platform-stats', protect, permit('ADMIN.VIEW_ANALYTICS'), getPlatformStats);
router.post('/ai-scribe', protect, permitAny('ADMIN.VIEW_ANALYTICS', 'DOCTOR.EDIT_CLINICAL_NOTES'), generateScribe);
router.post('/invoices', protect, permit('STAFF.CREATE_INVOICE'), createInvoice);
router.get('/system-health', protect, permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), getSystemHealth);
router.get('/organizations', protect, permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), getOrganizations);
router.get('/audit-logs', protect, permit('ADMIN.VIEW_AUDIT_LOG'), getAdminAuditLogs);
router.get('/migration-jobs', protect, permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), getMigrationJobs);
router.post('/migration-jobs', protect, permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), createMigrationJob);
router.get('/support-tickets', protect, permit('ADMIN.VIEW_USERS'), getSupportTickets);
router.post('/support-tickets', protect, permit('ADMIN.VIEW_USERS'), createSupportTicket);

module.exports = router;
