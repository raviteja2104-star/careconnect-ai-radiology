const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { cacheSeconds } = require('../middleware/cache');
const audit = require('../middleware/audit');
const emr = require('../controllers/emrController');

// Every EMR route requires an authenticated session.
router.use(protect);
// Hash-chained audit trail for every authenticated EMR access (fire-and-forget).
router.use(audit('EMR'));

const clinicians = authorize('doctor', 'admin');

// Patient 360 — clinicians, or the patient reading their own record
// (self-access is enforced inside the controller).
// Cached 30s per user in Redis; mutations don't invalidate yet — the short
// TTL bounds staleness.
router.get('/patients/:patientId/summary', cacheSeconds(30), emr.getPatient360);

// Encounters
router.post('/encounters', clinicians, emr.createEncounter);
router.get('/encounters', emr.listEncounters);
router.get('/encounters/:id', emr.getEncounter);
router.post('/encounters/:id/vitals', authorize('doctor', 'admin'), emr.addVitals);
router.post('/encounters/:id/diagnoses', clinicians, emr.addDiagnosis);

// Clinical notes (versioned, signed notes immutable)
router.put('/encounters/:id/note', clinicians, emr.saveNote);
router.post('/notes/:noteId/sign', clinicians, emr.signNote);
router.post('/notes/:noteId/amend', clinicians, emr.amendNote);

// Unified orders
router.post('/encounters/:id/orders', clinicians, emr.createOrder);
router.get('/orders', emr.listOrders);
router.patch('/orders/:orderId/status', clinicians, emr.updateOrderStatus);

module.exports = router;
