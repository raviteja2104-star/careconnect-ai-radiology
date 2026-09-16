const express = require('express');
const router = express.Router();
const {
  requestConsent,
  signConsent,
  getConsents
} = require('../controllers/consentController');
const { protect } = require('../middleware/auth');
const { permitAny } = require('../middleware/permit');
const audit = require('../middleware/audit');

router.use(protect);
router.use(audit('Consent'));

// Requesting consent is a clinician/admin action; patients sign their own consents.
router.route('/').post(permitAny('CLINICAL.MANAGE_TREATMENT_PLAN', 'ADMIN.VIEW_USERS'), requestConsent).get(getConsents);
router.route('/:id/sign').post(signConsent);

module.exports = router;
