const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { searchUsers } = require('../controllers/userSearchController');

// Tight rate limit for search — prevents patient-database enumeration.
// 30 requests per minute per IP; passes through silently when Redis is down.
router.use(rateLimit({ windowMs: 60 * 1000, max: 30 }));
router.use(protect);

router.get('/search', searchUsers);

module.exports = router;
