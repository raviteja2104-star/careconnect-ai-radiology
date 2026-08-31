const express = require('express');
const router = express.Router();
const { 
  kioskCheckIn,
  kioskRegister
} = require('../controllers/kioskController');

// PUBLIC: patient-facing self-service kiosk device endpoints. Kiosk hardware has
// no user session, so these are deliberately left unauthenticated.
router.route('/checkin').post(kioskCheckIn);
router.route('/register').post(kioskRegister);

module.exports = router;
