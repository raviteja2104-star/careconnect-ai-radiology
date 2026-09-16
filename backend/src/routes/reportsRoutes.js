const express = require('express');
const { protect } = require('../middleware/auth');
const { permitAny } = require('../middleware/permit');
const { getExecutiveReport } = require('../controllers/reportsController');

const router = express.Router();

router.get('/executive', protect, permitAny('ADMIN.VIEW_ANALYTICS', 'DOCTOR.VIEW_PATIENTS'), getExecutiveReport);

module.exports = router;
