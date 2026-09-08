const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getTenants, createTenant, getFinancials } = require('../controllers/commercialController');

router.get('/tenants', protect, authorize('admin'), getTenants);
router.post('/tenants', protect, authorize('admin'), createTenant);
router.get('/financials', protect, authorize('admin'), getFinancials);

module.exports = router;
