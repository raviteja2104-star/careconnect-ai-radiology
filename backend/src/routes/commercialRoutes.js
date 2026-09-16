const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { permit } = require('../middleware/permit');
const { getTenants, createTenant, getFinancials } = require('../controllers/commercialController');

router.get('/tenants', protect, permit('ADMIN.MANAGE_TENANTS'), getTenants);
router.post('/tenants', protect, permit('ADMIN.MANAGE_TENANTS'), createTenant);
router.get('/financials', protect, permit('ADMIN.VIEW_ANALYTICS'), getFinancials);

module.exports = router;
