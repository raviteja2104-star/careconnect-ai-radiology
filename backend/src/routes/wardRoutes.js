const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/wardController');

router.use(protect);

router.get('/beds',      c.getBeds);
router.get('/emergency', c.getEmergency);
router.get('/nursing',   c.getNursing);
router.get('/icu',       c.getICU);
router.get('/ot',        c.getOT);
router.get('/ems',       c.getEMS);
router.patch('/discharge/:patientId', c.dischargePatient);

module.exports = router;
