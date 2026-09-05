const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const audit = require('../middleware/audit');
const { uploadHealthDocument } = require('../middleware/healthDocumentUpload');
const ctrl = require('../controllers/healthRecordController');

/**
 * CareConnect Health Record Capture — mounted at /api/health-records.
 * Every route requires auth (no public/anonymous capture — even a patient
 * uploading their own record needs to be signed in as that patient). Fine-
 * grained per-action authorization (self / caregiver / clinical-staff /
 * doctor-only) is enforced inside healthRecordController via
 * CaregiverAuthzService, not at the route layer, because the same route
 * (e.g. GET a document) is reachable by several different legitimate actor
 * types with different reasons for being allowed through.
 */
router.use(protect);
router.use(audit('HealthRecordCapture'));

/* ── Documents ── */
router.post('/documents', uploadHealthDocument.array('files', 15), ctrl.uploadDocument);
router.get('/documents', ctrl.listDocuments);
router.get('/documents/:id', ctrl.getDocument);
router.get('/documents/:id/pages/:pageNumber/file', ctrl.getPageFile);
router.post('/documents/:id/reprocess', ctrl.reprocessDocument);
router.patch('/documents/:id/fields/:fieldKey', ctrl.decideField);
router.post('/documents/:id/confirm', ctrl.confirmDocument);
router.post('/documents/:id/review', ctrl.reviewDocument);

/* ── Clinical review of structured records ── */
router.post('/records/:model/:id/clinical-review', ctrl.clinicalReview);

/* ── Medicine normalization ── */
router.get('/medicine-suggestions', ctrl.suggestMedicine);

/* ── Timeline / summary ── */
router.get('/patients/:patientId/timeline', ctrl.getTimeline);
router.get('/patients/:patientId/summary', ctrl.getSummary);

/* ── Staff dashboard ── */
router.get('/dashboard', ctrl.getDashboard);

/* ── Caregiver / attendant authorization ── */
router.post('/patients/:patientId/caregivers', ctrl.grantCaregiverAuthorization);
router.get('/patients/:patientId/caregivers', ctrl.listCaregiverAuthorizations);
router.patch('/caregivers/:id/revoke', ctrl.revokeCaregiverAuthorization);

/* ── Sharing / consent ── */
router.post('/patients/:patientId/shares', ctrl.createShare);
router.get('/patients/:patientId/shares', ctrl.listShares);
router.patch('/shares/:id/revoke', ctrl.revokeShare);
router.get('/patients/:patientId/access-history', ctrl.getAccessHistory);

module.exports = router;
