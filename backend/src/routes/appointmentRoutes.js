const express = require('express');
const router = express.Router();
const { 
  getSpecialties, 
  getDoctors, 
  getAvailability, 
  bookAppointment, 
  getAppointments 
} = require('../controllers/appointmentController');

// In a real scenario, use the auth protect middleware:
// const { protect } = require('../middleware/auth');
// router.use(protect);

router.route('/specialties').get(getSpecialties);
router.route('/doctors').get(getDoctors);
router.route('/doctors/:id/availability').get(getAvailability);
router.route('/').get(getAppointments).post(bookAppointment);

module.exports = router;
