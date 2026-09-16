const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { permit } = require('../middleware/permit');
const {
  getFeatureFlags,
  setFeatureFlag,
  getConfigItems,
  upsertConfigItem,
} = require('../controllers/masterDataController');

router.get('/feature-flags', protect, permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), getFeatureFlags);
router.patch('/feature-flags/:key', protect, permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), setFeatureFlag);
router.get('/items', protect, permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), getConfigItems);
router.post('/items', protect, permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), upsertConfigItem);

module.exports = router;
