const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getExecutiveReport } = require('../controllers/reportsController');

const router = express.Router();

router.get('/executive', protect, authorize('admin', 'doctor'), getExecutiveReport);

module.exports = router;
