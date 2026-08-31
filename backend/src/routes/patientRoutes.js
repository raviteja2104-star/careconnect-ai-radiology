const express = require('express');
const router = express.Router();
const { 
  getPatientWallet
} = require('../controllers/patientController');
const { protect } = require('../middleware/auth');
const audit = require('../middleware/audit');

// Authenticated read — wallet balances are patient financial data.
// protect moved to router-level (behaviorally identical: it guarded the only
// route) so the audit middleware can run after it, matching the other routers.
router.use(protect);
router.use(audit('Patient'));
router.route('/:patientId/wallet').get(getPatientWallet);

module.exports = router;
