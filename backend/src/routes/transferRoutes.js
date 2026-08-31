const express = require('express');
const router = express.Router();
const { 
  createTransfer,
  getPatientJourney
} = require('../controllers/transferController');
const { protect, authorize } = require('../middleware/auth');

// All transfer endpoints require an authenticated session.
router.use(protect);

router.route('/').post(authorize('doctor', 'admin'), createTransfer);
router.route('/journey/:patientId').get(getPatientJourney);

module.exports = router;
