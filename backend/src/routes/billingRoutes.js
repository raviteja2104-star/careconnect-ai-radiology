const express = require('express');
const router = express.Router();
const {
  getRevenueDashboard,
  createInvoice,
  getInvoices,
  processPayment
} = require('../controllers/billingController');
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');
const audit = require('../middleware/audit');

router.use(protect);
router.use(audit('Billing'));

// Revenue dashboard — admin/billing staff only
router.get('/dashboard', permit('STAFF.VIEW_REVENUE'), getRevenueDashboard);

// Invoices — patients see own invoices; billing staff see all.
// Controller scopes results to req.user for patient role.
router.get('/invoices',  permitAny('PATIENT.VIEW_BILLING', 'STAFF.BILLING'), getInvoices);
router.post('/invoices', permit('STAFF.CREATE_INVOICE'), createInvoice);

// Payments — billing staff only
router.post('/payments', permit('STAFF.PROCESS_PAYMENT'), processPayment);

module.exports = router;
