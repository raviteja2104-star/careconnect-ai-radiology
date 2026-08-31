const express = require('express');
const router = express.Router();
const { 
  getAnalytics,
  sendMessage,
  getHistory
} = require('../controllers/communicationController');
const { protect, authorize } = require('../middleware/auth');

// All communication endpoints require an authenticated session.
router.use(protect);

router.route('/analytics').get(getAnalytics);
router.route('/send').post(authorize('doctor', 'admin'), sendMessage);
router.route('/history').get(getHistory);

module.exports = router;
