const express = require('express');
const router = express.Router();
const {
    getPatients,
    getPatientHistory,
    getConsultations,
    updateConsultation,
    requestScan,
    viewScanReport,
    getDoctorStats,
} = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');
const { permit } = require('../middleware/permit');

// All doctor routes require authentication + doctor-level permissions
router.use(protect);

// Patient management
router.get('/patients',                       permit('DOCTOR.VIEW_PATIENTS'),         getPatients);
router.get('/patients/:patientId/history',    permit('DOCTOR.VIEW_MEDICAL_RECORDS'),  getPatientHistory);

// Consultations
router.get('/consultations',                  permit('DOCTOR.VIEW_APPOINTMENTS'),      getConsultations);
router.put('/consultations/:id',              permit('DOCTOR.EDIT_CLINICAL_NOTES'),    updateConsultation);

// Radiology orders from doctor side
router.post('/request-scan',                  permit('DOCTOR.ORDER_RADIOLOGY'),        requestScan);
router.get('/scans/:id',                      permit('RADIOLOGY.VIEW_STUDIES'),        viewScanReport);

// Stats — requires both doctor workspace + stats view
router.get('/stats',                          permit('DOCTOR.VIEW_PATIENTS'),          getDoctorStats);

module.exports = router;
