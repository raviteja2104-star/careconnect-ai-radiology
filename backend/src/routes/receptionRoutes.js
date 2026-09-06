const express = require('express');
const router = express.Router();
const { 
  getDashboardStats,
  getAppointments,
  checkinAppointment,
  registerWalkIn
} = require('../controllers/receptionController');
const { protect, authorize } = require('../middleware/auth');

// All reception endpoints require an authenticated session.
router.use(protect);

// Dashboard/appointments expose aggregated patient data — restrict to clinical staff.
// Write operations additionally require an elevated role.
router.route('/dashboard').get(authorize('admin', 'doctor', 'nurse', 'reception'), getDashboardStats);
router.route('/appointments').get(authorize('admin', 'doctor', 'nurse', 'reception'), getAppointments);
router.route('/checkin').post(authorize('admin', 'doctor', 'nurse'), checkinAppointment);
router.route('/walkin').post(authorize('admin', 'doctor', 'nurse'), registerWalkIn);

module.exports = router;
