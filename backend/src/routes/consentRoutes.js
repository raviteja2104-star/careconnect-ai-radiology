const express = require('express');
const router = express.Router();
const { 
  requestConsent,
  signConsent,
  getConsents
} = require('../controllers/consentController');
const { protect, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');

// All consent endpoints require an authenticated session.
router.use(protect);
// Hash-chained audit trail for every consent access (fire-and-forget).
router.use(audit('Consent'));

// Requesting consent is a clinician/admin action; patients sign their own
// consents, so signing is open to any authenticated user.
router.route('/').post(authorize('doctor', 'admin'), requestConsent).get(getConsents);
router.route('/:id/sign').post(signConsent);

module.exports = router;
