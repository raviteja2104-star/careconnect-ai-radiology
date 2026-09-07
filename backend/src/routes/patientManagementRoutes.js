const express = require('express');
const router = express.Router();
const { listPatients, createPatient, getPatient, updatePatient } = require('../controllers/patientController');
const { protect } = require('../middleware/auth');
const audit = require('../middleware/audit');

const CLINICAL_ROLES = ['doctor', 'admin', 'nurse', 'lab_tech', 'pharmacist', 'radiologist', 'reception', 'emergency'];

function requireClinical(req, res, next) {
    if (!req.user || !CLINICAL_ROLES.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Clinical staff access required.' });
    }
    next();
}

router.use(protect);
router.use(requireClinical);
router.use(audit('PatientManagement'));

router.get('/', listPatients);
router.post('/', createPatient);
router.get('/:id', getPatient);
router.put('/:id', updatePatient);

module.exports = router;
