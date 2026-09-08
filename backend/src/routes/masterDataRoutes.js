const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getFeatureFlags,
  setFeatureFlag,
  getConfigItems,
  upsertConfigItem,
} = require('../controllers/masterDataController');

router.get('/feature-flags', protect, authorize('admin'), getFeatureFlags);
router.patch('/feature-flags/:key', protect, authorize('admin'), setFeatureFlag);
router.get('/items', protect, authorize('admin'), getConfigItems);
router.post('/items', protect, authorize('admin'), upsertConfigItem);

module.exports = router;
