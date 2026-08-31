/**
 * Teleradiology Worklist routes — mounted at /api/teleradiology/worklist
 * BEFORE the legacy /api/teleradiology router so both coexist.
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { cacheSeconds } = require('../middleware/cache');
const audit = require('../middleware/audit');
const controller = require('../controllers/teleradiologyWorklistController');

// Every route is authenticated.
router.use(protect);
// Hash-chained audit trail for every worklist access (fire-and-forget).
router.use(audit('Teleradiology'));

// Command center stats (must be declared before /:studyId routes).
router.get('/stats', authorize('radiologist', 'admin', 'doctor'), controller.getStats);

// Worklist — cached 15s per user in Redis; mutations don't invalidate yet
// (short TTL bounds staleness).
router.get('/', authorize('radiologist', 'admin', 'doctor'), cacheSeconds(15), controller.getWorklist);
router.get('/:studyId', authorize('radiologist', 'admin', 'doctor'), controller.getStudy);

// Reading workflow
router.patch('/:studyId/claim', authorize('radiologist'), controller.claimStudy);
router.patch('/:studyId/status', authorize('radiologist', 'admin'), controller.updateStatus);
router.put('/:studyId/report', authorize('radiologist'), controller.saveReport);
router.post('/:studyId/sign', authorize('radiologist'), controller.signReport);
router.post('/:studyId/addendum', authorize('radiologist'), controller.addAddendum);

// Critical findings
router.post('/:studyId/critical', authorize('radiologist'), controller.flagCritical);
router.post('/:studyId/critical/ack', authorize('doctor', 'admin'), controller.acknowledgeCritical);

module.exports = router;
