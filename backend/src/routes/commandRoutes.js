const express = require('express');
const router = express.Router();
const {
  getLiveStats,
  getPatientFlow,
  getEventsLog
} = require('../controllers/commandController');
const { protect } = require('../middleware/auth');
const { permitAny } = require('../middleware/permit');

// Command-centre dashboards expose hospital-wide operational data.
// Restricted to clinical/admin staff — patients must not see aggregate PHI.
router.use(protect);
router.use(permitAny('ADMIN.VIEW_DASHBOARD', 'PATIENTS.VIEW_ALL', 'PATIENTS.SEARCH'));

router.route('/live').get(getLiveStats);
router.route('/patient-flow').get(getPatientFlow);
router.route('/events').get(getEventsLog);

module.exports = router;
