const express = require('express');
const router = express.Router();
const { 
  getLiveStats,
  getPatientFlow,
  getEventsLog
} = require('../controllers/commandController');
const { protect } = require('../middleware/auth');

// Command-centre dashboards expose hospital-wide operational data — auth required.
router.use(protect);

router.route('/live').get(getLiveStats);
router.route('/patient-flow').get(getPatientFlow);
router.route('/events').get(getEventsLog);

module.exports = router;
