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

const {
  listTemplates, createTemplate, updateTemplate, publishTemplate,
} = require('../controllers/formTemplateController');

const {
  listOpsRecords, createOpsRecord, updateOpsRecord,
} = require('../controllers/adminOpsController');

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

// Form templates
router.get('/form-templates',         protect, permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), listTemplates);
router.post('/form-templates',        protect, permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), createTemplate);
router.patch('/form-templates/:id',   protect, permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), updateTemplate);
router.patch('/form-templates/:id/publish', protect, permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), publishTemplate);

// Enterprise ops records (projects, devices, lms_course, releases)
router.get('/ops/:type',         protect, permit('ADMIN.VIEW_ANALYTICS'),          listOpsRecords);
router.post('/ops/:type',        protect, permit('ADMIN.MANAGE_SYSTEM_SETTINGS'),  createOpsRecord);
router.patch('/ops/:type/:id',   protect, permit('ADMIN.MANAGE_SYSTEM_SETTINGS'),  updateOpsRecord);

module.exports = router;
