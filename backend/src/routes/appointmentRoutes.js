const express = require('express');
const router = express.Router();
const {
  getSpecialties,
  getDoctors,
  getAvailability,
  bookAppointment,
  getAppointments,
  cancelAppointment,
  rescheduleAppointment,
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

// POST / — patient books own appointment, OR staff/admin books on behalf of patient
const { permitAny } = require('../middleware/permit');
router.post(
    '/',
    permitAny('PATIENT.BOOK_APPOINTMENT', 'STAFF.CREATE_APPOINTMENTS'),
    bookAppointment
);

// PATCH /:id/cancel — patient cancels own appointment; staff may cancel on their behalf
// Ownership and status validation are enforced inside the controller.
router.patch('/:id/cancel', cancelAppointment);

// PATCH /:id/reschedule — patient or staff reschedules to a new date + time slot
router.patch('/:id/reschedule', rescheduleAppointment);

module.exports = router;
