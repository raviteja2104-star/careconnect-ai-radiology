const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');
const ot = require('../controllers/otController');

router.use(protect);

const canRead  = permitAny('DOCTOR.VIEW_PATIENTS', 'STAFF.MANAGE_RECORDS');
const canWrite = permitAny('DOCTOR.EDIT_CLINICAL_NOTES', 'STAFF.MANAGE_RECORDS');

router.get('/schedule', canRead, ot.getSchedule);

router.get( '/cases/:id/anesthesia',        canRead,  ot.getAnesthesia);
router.patch('/cases/:id/anesthesia',       canWrite, ot.patchAnesthesia);
router.post('/cases/:id/anesthesia/drugs',  canWrite, ot.addDrug);

router.get( '/cases/:id/events', canRead,  ot.getEvents);
router.post('/cases/:id/events', canWrite, ot.logEvent);

router.get(   '/cases/:id/instruments',           canRead,  ot.getInstruments);
router.patch( '/cases/:id/instruments/:rowId',    canWrite, ot.updateCount);
router.post(  '/cases/:id/instruments/signoff',   canWrite, ot.signOff);

module.exports = router;
