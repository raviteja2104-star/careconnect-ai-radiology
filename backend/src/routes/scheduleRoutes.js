const express = require('express');
const router = express.Router();
const { 
  getDoctorSchedule,
  saveDoctorSchedule
} = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/auth');

// All schedule endpoints require an authenticated session.
router.use(protect);

router.route('/:doctorId').get(getDoctorSchedule);
router.route('/').post(authorize('doctor', 'admin'), saveDoctorSchedule);

module.exports = router;
