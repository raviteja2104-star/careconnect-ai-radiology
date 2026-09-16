/**
 * Teleradiology Worklist routes — mounted at /api/teleradiology/worklist
 * BEFORE the legacy /api/teleradiology router so both coexist.
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');
const { cacheSeconds } = require('../middleware/cache');
const audit = require('../middleware/audit');
const controller = require('../controllers/teleradiologyWorklistController');

router.use(protect);
router.use(audit('Teleradiology'));

// Command center stats (declared before /:studyId routes).
router.get('/stats', permitAny('RADIOLOGY.VIEW_WORKLIST', 'ADMIN.VIEW_DASHBOARD', 'DOCTOR.ORDER_RADIOLOGY'), controller.getStats);

// Worklist reads
router.get('/', permitAny('RADIOLOGY.VIEW_WORKLIST', 'ADMIN.VIEW_DASHBOARD', 'DOCTOR.ORDER_RADIOLOGY'), cacheSeconds(15), controller.getWorklist);
router.get('/:studyId', permitAny('RADIOLOGY.VIEW_WORKLIST', 'ADMIN.VIEW_DASHBOARD', 'DOCTOR.ORDER_RADIOLOGY'), controller.getStudy);

// Reading workflow (radiologist only)
router.patch('/:studyId/claim', permit('RADIOLOGY.VIEW_WORKLIST'), controller.claimStudy);
router.patch('/:studyId/status', permitAny('RADIOLOGY.EDIT_REPORT', 'ADMIN.VIEW_DASHBOARD'), controller.updateStatus);
router.put('/:studyId/report', permit('RADIOLOGY.CREATE_REPORT'), controller.saveReport);
router.post('/:studyId/sign', permit('RADIOLOGY.FINALIZE_REPORT'), controller.signReport);
router.post('/:studyId/addendum', permit('RADIOLOGY.EDIT_REPORT'), controller.addAddendum);

// Critical findings
router.post('/:studyId/critical', permit('RADIOLOGY.FINALIZE_REPORT'), controller.flagCritical);
router.post('/:studyId/critical/ack', permitAny('DOCTOR.VIEW_MEDICAL_RECORDS', 'ADMIN.VIEW_DASHBOARD'), controller.acknowledgeCritical);

module.exports = router;
