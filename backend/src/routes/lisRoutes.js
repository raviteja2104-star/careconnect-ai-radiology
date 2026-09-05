const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');
const lis = require('../controllers/lisController');

router.use(protect);
router.use(audit('Laboratory'));

// ── Worklist ─────────────────────────────────────────────────────────────────
// Reads are protect-only.
router.get('/worklist', lis.getWorklist);
router.get('/worklist/:id', lis.getWorkItem);

// Sample collection & grading, result entry — lab technicians.
router.post('/worklist/:id/collect', authorize('lab_tech', 'admin'), lis.collectSample);
router.patch('/worklist/:id/sample', authorize('lab_tech', 'admin'), lis.gradeSample);
router.put('/worklist/:id/results', authorize('lab_tech', 'admin'), lis.enterResults);

// Two-level verification: technical (lab_tech) vs pathologist (doctor) —
// per-level role split is enforced in the controller based on body.level.
router.post('/worklist/:id/verify', authorize('lab_tech', 'doctor', 'admin'), lis.verify);

// Critical result acknowledgement, release, post-release amendment — clinicians.
router.post('/worklist/:id/critical/ack', authorize('doctor', 'admin'), lis.acknowledgeCritical);
router.post('/worklist/:id/release', authorize('doctor', 'admin'), lis.release);
router.post('/worklist/:id/amend', authorize('doctor', 'admin'), lis.amend);

// ── Cumulative history ───────────────────────────────────────────────────────
router.get('/history', lis.history);

// ── Reference range administration (reads open, writes admin-only) ──────────
router.get('/reference-ranges', lis.listReferenceRanges);
router.post('/reference-ranges', authorize('admin'), lis.createReferenceRange);
router.put('/reference-ranges/:id', authorize('admin'), lis.updateReferenceRange);

module.exports = router;
