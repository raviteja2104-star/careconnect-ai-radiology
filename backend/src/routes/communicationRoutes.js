const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  sendMessage,
  getHistory,
  getThreads,
  getThreadMessages,
} = require('../controllers/communicationController');
const { protect, authorize } = require('../middleware/auth');

// All communication endpoints require an authenticated session.
router.use(protect);

router.route('/analytics').get(getAnalytics);
router.route('/send').post(sendMessage);
router.route('/history').get(getHistory);

// Thread-structured endpoints used by the messaging UI
router.route('/threads').get(getThreads);
router.route('/threads/:threadId/messages').get(getThreadMessages);

module.exports = router;
