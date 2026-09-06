const express = require('express');
const router = express.Router();
const { 
  createTransfer,
  getPatientJourney
} = require('../controllers/transferController');
const { protect, authorize } = require('../middleware/auth');

// All transfer endpoints require an authenticated session.
router.use(protect);

router.route('/').post(authorize('doctor', 'admin'), createTransfer);
// Ownership guard: patients may only fetch their own journey; clinical staff see any.
router.route('/journey/:patientId').get((req, res, next) => {
    const STAFF_ROLES = ['admin', 'doctor', 'nurse', 'radiologist', 'reception'];
    const isStaff = STAFF_ROLES.includes(req.user?.role);
    if (!isStaff && String(req.user?._id) !== String(req.params.patientId)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    return next();
}, getPatientJourney);

module.exports = router;
