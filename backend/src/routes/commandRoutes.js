const express = require('express');
const router = express.Router();
const { 
  getLiveStats,
  getPatientFlow,
  getEventsLog
} = require('../controllers/commandController');
const { protect, authorize } = require('../middleware/auth');

// Command-centre dashboards expose hospital-wide operational data.
// Restricted to clinical/admin staff — patients must not see aggregate PHI.
router.use(protect);
router.use(authorize('admin', 'doctor', 'nurse', 'radiologist', 'reception'));

router.route('/live').get(getLiveStats);
router.route('/patient-flow').get(getPatientFlow);
router.route('/events').get(getEventsLog);

module.exports = router;
