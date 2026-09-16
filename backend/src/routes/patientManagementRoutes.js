const express = require('express');
const router = express.Router();
const { listPatients, createPatient, getPatient, updatePatient } = require('../controllers/patientController');
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');
const { requirePatientAccess, requireSameTenant } = require('../middleware/resourceAuth');
const audit = require('../middleware/audit');

router.use(protect);
router.use(requireSameTenant());
router.use(audit('PatientManagement'));

// List: any staff role that can see all patients
router.get(
    '/',
    permit('PATIENTS.VIEW_ALL'),
    listPatients
);

// Register new patient
router.post(
    '/',
    permit('PATIENTS.CREATE'),
    createPatient
);

// Get individual patient — enforces resource-level ownership check
router.get(
    '/:id',
    permitAny('PATIENTS.VIEW_ALL', 'DOCTOR.VIEW_PATIENTS', 'PATIENT.VIEW_PROFILE'),
    requirePatientAccess('id'),
    getPatient
);

// Update patient demographics
router.put(
    '/:id',
    permitAny('PATIENTS.UPDATE', 'PATIENT.EDIT_PROFILE'),
    requirePatientAccess('id'),
    updatePatient
);

module.exports = router;
