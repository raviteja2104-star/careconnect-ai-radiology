const express = require('express');
const {
    getPatients,
    getPatientHistory,
    getConsultations,
    updateConsultation,
    requestScan,
    viewScanReport,
    getDoctorStats,
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('doctor'));

router.get('/patients', getPatients);
router.get('/patients/:patientId/history', getPatientHistory);
router.get('/consultations', getConsultations);
router.put('/consultations/:id', updateConsultation);
router.post('/request-scan', requestScan);
router.get('/scans/:id', viewScanReport);
router.get('/stats', getDoctorStats);

module.exports = router;
