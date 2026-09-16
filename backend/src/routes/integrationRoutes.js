const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { permit } = require('../middleware/permit');
const { testEndpoint, getIntegrationHealth } = require('../controllers/integrationController');

router.get('/health', protect, permit('INTEGRATIONS.VIEW'), getIntegrationHealth);
router.post('/test-endpoint', protect, permit('INTEGRATIONS.MANAGE'), testEndpoint);

module.exports = router;
