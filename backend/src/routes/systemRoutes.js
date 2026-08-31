const express = require('express');
const router = express.Router();
const { 
  getHealth,
  getPerformance,
  getSecurityStatus
} = require('../controllers/systemController');
const { protect, authorize } = require('../middleware/auth');

// PUBLIC: health/readiness probes for load balancers and uptime monitors.
router.route('/health').get(getHealth);
router.route('/readiness').get(getHealth);

// Operational telemetry and security/compliance posture — admins only.
router.use(protect, authorize('admin'));

router.route('/performance').get(getPerformance);
router.route('/metrics').get(getPerformance);
router.route('/security').get(getSecurityStatus);
router.route('/compliance').get(getSecurityStatus);

module.exports = router;
