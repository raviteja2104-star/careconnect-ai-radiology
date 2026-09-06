const express = require('express');
const router = express.Router();
const {
  getSpecialties,
  getDoctors,
  getAvailability,
  bookAppointment,
  getAppointments
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');

// Public lookup endpoints (no auth required)
router.route('/specialties').get(getSpecialties);
router.route('/doctors').get(getDoctors);
router.route('/doctors/:id/availability').get(getAvailability);

// Patient-scoped endpoints require auth
router.route('/').get(protect, getAppointments).post(protect, bookAppointment);

module.exports = router;
