const express = require('express');
const router = express.Router();
const {
  getHealth,
  getPerformance,
  getSecurityStatus
} = require('../controllers/systemController');
const { protect } = require('../middleware/auth');
const { permit } = require('../middleware/permit');

// PUBLIC: health/readiness probes for load balancers and uptime monitors.
router.route('/health').get(getHealth);
router.route('/readiness').get(getHealth);

// Operational telemetry and security/compliance posture.
router.route('/performance').get(protect, permit('ADMIN.VIEW_ANALYTICS'), getPerformance);
router.route('/metrics').get(protect, permit('ADMIN.VIEW_ANALYTICS'), getPerformance);
router.route('/security').get(protect, permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), getSecurityStatus);
router.route('/compliance').get(protect, permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), getSecurityStatus);

module.exports = router;
