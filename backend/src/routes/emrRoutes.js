const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');
const { cacheSeconds } = require('../middleware/cache');
const audit = require('../middleware/audit');
const emr = require('../controllers/emrController');

// Clinical catalog typeahead — PUBLIC reference data (drug names, complaint
// terms, ICD labels, lab tests). Contains no patient data.
router.get('/catalog', emr.searchCatalog);

// Every other EMR route requires an authenticated session.
router.use(protect);
router.use(audit('EMR'));

// Patient 360 summary — OR logic: the patient reads their own record, or a
// doctor reads an assigned patient's record. The controller enforces ownership
// (a patient's patientId param must match req.user._id).
router.get(
    '/patients/:patientId/summary',
    permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'DOCTOR.VIEW_MEDICAL_RECORDS'),
    cacheSeconds(30),
    emr.getPatient360
);

// Encounter creation — doctors only
router.post('/encounters', permit('DOCTOR.CREATE_ENCOUNTER'), emr.createEncounter);

// Reading encounters — clinicians (DOCTOR.VIEW_PATIENTS) or patient's own (PATIENT.VIEW_MEDICAL_RECORDS)
// Controller scopes results to caller for patients.
router.get('/encounters',     permitAny('DOCTOR.VIEW_PATIENTS', 'PATIENT.VIEW_MEDICAL_RECORDS'), emr.listEncounters);
router.get('/encounters/:id', permitAny('DOCTOR.VIEW_PATIENTS', 'PATIENT.VIEW_MEDICAL_RECORDS'), emr.getEncounter);

// Clinical documentation — explicit doctor permission on each action
router.post('/encounters/:id/vitals',    permit('DOCTOR.EDIT_CLINICAL_NOTES'), emr.addVitals);
router.post('/encounters/:id/diagnoses', permit('DOCTOR.EDIT_CLINICAL_NOTES'), emr.addDiagnosis);
router.put('/encounters/:id/note',       permit('DOCTOR.EDIT_CLINICAL_NOTES'), emr.saveNote);
router.post('/notes/:noteId/sign',       permit('DOCTOR.SIGN_CLINICAL_NOTES'), emr.signNote);
router.post('/notes/:noteId/amend',      permit('DOCTOR.EDIT_CLINICAL_NOTES'), emr.amendNote);

// AI medication suggestions — only users who can prescribe
router.post('/ai/medication-suggestions', permit('DOCTOR.CREATE_PRESCRIPTION'), emr.suggestMedications);

// Orders
router.post('/encounters/:id/orders',   permit('DOCTOR.ORDER_LAB'), emr.createOrder);
router.get('/orders',                   permitAny('DOCTOR.VIEW_PATIENTS', 'PATIENT.VIEW_LAB_RESULTS'), emr.listOrders);
router.patch('/orders/:orderId/status', permit('DOCTOR.ORDER_LAB'), emr.updateOrderStatus);

module.exports = router;
