const express = require('express');
const {
    triggerSOS,
    getEmergencyStatus,
    updateEmergencyStatus,
    getEmergencyHistory,
} = require('../controllers/emergencyController');
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');

const router = express.Router();

router.use(protect);

router.post('/sos', permit('PATIENT.TRIGGER_EMERGENCY'), triggerSOS);
router.get('/history', permit('PATIENT.TRIGGER_EMERGENCY'), getEmergencyHistory);
router.get('/:id', getEmergencyStatus);
router.put('/:id/status', permitAny('STAFF.RESPOND_EMERGENCY', 'DOCTOR.VIEW_PATIENTS', 'ADMIN.VIEW_DASHBOARD'), updateEmergencyStatus);

module.exports = router;
