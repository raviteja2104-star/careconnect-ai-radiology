const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');
const audit = require('../middleware/audit');
const { uploadHealthDocument } = require('../middleware/healthDocumentUpload');
const ctrl = require('../controllers/healthRecordController');

/**
 * CareConnect Health Record Capture — mounted at /api/health-records.
 * Every route requires auth. Fine-grained per-action ownership (self /
 * caregiver / clinical-staff / doctor-only) is also enforced inside the
 * controller via CaregiverAuthzService for multi-party access patterns.
 * Route-level permit() provides the first gate; the controller is the
 * second gate for ownership / delegation checks.
 */
router.use(protect);
router.use(audit('HealthRecordCapture'));

// ── Documents ─────────────────────────────────────────────────────────────────
// Upload: patients upload their own; staff can upload on behalf of patients.
router.post('/documents',
    permitAny('PATIENT.UPLOAD_DOCUMENT', 'STAFF.MANAGE_RECORDS'),
    uploadHealthDocument.array('files', 15),
    ctrl.uploadDocument
);

// List/get: patient sees own docs; clinical staff sees all.
router.get('/documents',
    permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'DOCTOR.VIEW_MEDICAL_RECORDS', 'STAFF.MANAGE_RECORDS'),
    ctrl.listDocuments
);
router.get('/documents/:id',
    permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'DOCTOR.VIEW_MEDICAL_RECORDS', 'STAFF.MANAGE_RECORDS'),
    ctrl.getDocument
);
router.get('/documents/:id/pages/:pageNumber/file',
    permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'DOCTOR.VIEW_MEDICAL_RECORDS', 'STAFF.MANAGE_RECORDS'),
    ctrl.getPageFile
);

// Reprocess / field decisions / confirm / review — clinical/staff actions
router.post('/documents/:id/reprocess',        permit('STAFF.MANAGE_RECORDS'),   ctrl.reprocessDocument);
router.patch('/documents/:id/fields/:fieldKey', permit('STAFF.MANAGE_RECORDS'),   ctrl.decideField);
router.post('/documents/:id/confirm',          permit('STAFF.MANAGE_RECORDS'),   ctrl.confirmDocument);
router.post('/documents/:id/review',           permit('DOCTOR.EDIT_CLINICAL_NOTES'), ctrl.reviewDocument);

// ── Clinical review of structured records ─────────────────────────────────────
router.post('/records/:model/:id/clinical-review',
    permit('DOCTOR.EDIT_CLINICAL_NOTES'),
    ctrl.clinicalReview
);

// ── Medicine normalization — typeahead, open to any authenticated clinician ───
router.get('/medicine-suggestions',
    permitAny('DOCTOR.CREATE_PRESCRIPTION', 'STAFF.MANAGE_RECORDS'),
    ctrl.suggestMedicine
);

// ── Timeline / summary — patient self or clinical reader ─────────────────────
router.get('/patients/:patientId/timeline',
    permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'DOCTOR.VIEW_MEDICAL_RECORDS', 'STAFF.MANAGE_RECORDS'),
    ctrl.getTimeline
);
router.get('/patients/:patientId/summary',
    permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'DOCTOR.VIEW_MEDICAL_RECORDS', 'STAFF.MANAGE_RECORDS'),
    ctrl.getSummary
);

// ── Staff dashboard ────────────────────────────────────────────────────────────
router.get('/dashboard', permit('STAFF.MANAGE_RECORDS'), ctrl.getDashboard);

// ── Caregiver / attendant authorization ───────────────────────────────────────
router.post('/patients/:patientId/caregivers',
    permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'STAFF.MANAGE_RECORDS'),
    ctrl.grantCaregiverAuthorization
);
router.get('/patients/:patientId/caregivers',
    permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'DOCTOR.VIEW_MEDICAL_RECORDS', 'STAFF.MANAGE_RECORDS'),
    ctrl.listCaregiverAuthorizations
);
router.patch('/caregivers/:id/revoke',
    permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'STAFF.MANAGE_RECORDS'),
    ctrl.revokeCaregiverAuthorization
);

// ── Sharing / consent ─────────────────────────────────────────────────────────
router.post('/patients/:patientId/shares',
    permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'STAFF.MANAGE_RECORDS'),
    ctrl.createShare
);
router.get('/patients/:patientId/shares',
    permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'DOCTOR.VIEW_MEDICAL_RECORDS', 'STAFF.MANAGE_RECORDS'),
    ctrl.listShares
);
router.patch('/shares/:id/revoke',
    permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'STAFF.MANAGE_RECORDS'),
    ctrl.revokeShare
);
router.get('/patients/:patientId/access-history',
    permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'STAFF.MANAGE_RECORDS'),
    ctrl.getAccessHistory
);

module.exports = router;
