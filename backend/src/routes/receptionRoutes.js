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

// NOTE: there is no 'reception' role in the User model; front-desk write flows
// are gated to 'admin'/'doctor' until a reception role is introduced.
router.route('/dashboard').get(getDashboardStats);
router.route('/appointments').get(getAppointments);
router.route('/checkin').post(authorize('admin', 'doctor', 'reception'), checkinAppointment);
router.route('/walkin').post(authorize('admin', 'doctor', 'reception'), registerWalkIn);

module.exports = router;
