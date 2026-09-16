const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');
const audit = require('../middleware/audit');
const lis = require('../controllers/lisController');

router.use(protect);
router.use(audit('Laboratory'));

// ── Worklist ─────────────────────────────────────────────────────────────────
// Clinical staff only — patients must not see other patients' lab work items.
const WORKLIST_PERMS = ['STAFF.VIEW_LAB_ORDERS', 'STAFF.PROCESS_LAB', 'DOCTOR.VIEW_MEDICAL_RECORDS', 'ADMIN.VIEW_DASHBOARD'];
router.get('/worklist',     permitAny(...WORKLIST_PERMS), lis.getWorklist);
router.get('/worklist/:id', permitAny(...WORKLIST_PERMS), lis.getWorkItem);

// Sample collection & grading, result entry — lab technicians and admins.
router.post('/worklist/:id/collect', permitAny('STAFF.PROCESS_LAB', 'ADMIN.VIEW_DASHBOARD'), lis.collectSample);
router.patch('/worklist/:id/sample', permitAny('STAFF.PROCESS_LAB', 'ADMIN.VIEW_DASHBOARD'), lis.gradeSample);
router.put('/worklist/:id/results', permitAny('STAFF.UPLOAD_LAB_RESULTS', 'ADMIN.VIEW_DASHBOARD'), lis.enterResults);

// Two-level verification: technical (lab_tech) vs pathologist (doctor).
router.post('/worklist/:id/verify', permitAny('STAFF.PROCESS_LAB', 'DOCTOR.VIEW_MEDICAL_RECORDS', 'ADMIN.VIEW_DASHBOARD'), lis.verify);

// Critical result acknowledgement, release, post-release amendment — clinicians.
router.post('/worklist/:id/critical/ack', permitAny('DOCTOR.VIEW_MEDICAL_RECORDS', 'ADMIN.VIEW_DASHBOARD'), lis.acknowledgeCritical);
router.post('/worklist/:id/release', permitAny('DOCTOR.VIEW_MEDICAL_RECORDS', 'ADMIN.VIEW_DASHBOARD'), lis.release);
router.post('/worklist/:id/amend', permitAny('DOCTOR.VIEW_MEDICAL_RECORDS', 'ADMIN.VIEW_DASHBOARD'), lis.amend);

// ── Cumulative history ───────────────────────────────────────────────────────
// Patients may view their OWN history (ownership enforced in controller).
// Clinical staff may view any patient's history.
router.get('/history',
    permitAny('PATIENT.VIEW_LAB_RESULTS', 'STAFF.VIEW_LAB_ORDERS', 'DOCTOR.VIEW_MEDICAL_RECORDS', 'ADMIN.VIEW_DASHBOARD'),
    lis.history
);

// ── Reference range administration (reads open, writes admin-only) ──────────
router.get('/reference-ranges', lis.listReferenceRanges);
router.post('/reference-ranges', permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), lis.createReferenceRange);
router.put('/reference-ranges/:id', permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), lis.updateReferenceRange);

module.exports = router;
