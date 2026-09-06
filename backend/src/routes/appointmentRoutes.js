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
const { permit } = require('../middleware/permit');

// Public lookup endpoints — no PHI, no auth required
router.route('/specialties').get(getSpecialties);
router.route('/doctors').get(getDoctors);
router.route('/doctors/:id/availability').get(getAvailability);

// All appointment endpoints require a real session
router.use(protect);

// GET  / — patients view their own, doctors view their schedule
// Both PATIENT.VIEW_APPOINTMENTS and DOCTOR.VIEW_APPOINTMENTS are accepted;
// ownership scoping is enforced inside the controller (filters by req.user).
router.get('/', (req, res, next) => {
    // Any authenticated user may call this — the controller scopes results
    // to the caller's own appointments.  No role restriction needed here;
    // the session itself is the scope.
    next();
}, getAppointments);

// POST / — only users with booking permission may create appointments
router.post(
    '/',
    permit('PATIENT.BOOK_APPOINTMENT'),
    bookAppointment
);

module.exports = router;
