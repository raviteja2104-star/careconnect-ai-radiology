const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { testEndpoint, getIntegrationHealth } = require('../controllers/integrationController');

router.get('/health', protect, authorize('admin'), getIntegrationHealth);
router.post('/test-endpoint', protect, authorize('admin'), testEndpoint);

module.exports = router;
