const express = require('express');
const router = express.Router();
const { 
  getRevenueDashboard,
  createInvoice,
  getInvoices,
  processPayment
} = require('../controllers/billingController');
const { protect, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');

// All billing endpoints require an authenticated session; writes are admin-only.
router.use(protect);
// Hash-chained audit trail for every billing access (fire-and-forget).
router.use(audit('Billing'));

router.route('/dashboard').get(getRevenueDashboard);
router.route('/invoices').get(getInvoices).post(authorize('admin'), createInvoice);
router.route('/payments').post(authorize('admin'), processPayment);

module.exports = router;
