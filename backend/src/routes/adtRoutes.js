const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { permitAny } = require('../middleware/permit');
const adtController = require('../controllers/adtController');

router.use(protect);

router.get('/stats',      permitAny('DOCTOR.VIEW_PATIENTS', 'STAFF.MANAGE_RECORDS'), adtController.getStats);
router.get('/admissions', permitAny('DOCTOR.VIEW_PATIENTS', 'STAFF.MANAGE_RECORDS'), adtController.getAdmissions);
router.get('/discharges', permitAny('DOCTOR.VIEW_PATIENTS', 'STAFF.MANAGE_RECORDS'), adtController.getDischarges);
router.get('/transfers',  permitAny('DOCTOR.VIEW_PATIENTS', 'STAFF.MANAGE_RECORDS'), adtController.getTransfers);

module.exports = router;
