const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { permitAny } = require('../middleware/permit');
const consultationController = require('../controllers/consultationController');

router.use(protect);

router.get('/today', permitAny('DOCTOR.VIEW_PATIENTS', 'DOCTOR.EDIT_CLINICAL_NOTES', 'STAFF.MANAGE_RECORDS'), consultationController.getToday);

module.exports = router;
