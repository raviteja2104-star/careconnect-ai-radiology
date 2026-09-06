const express = require('express');
const router = express.Router();
const {
  joinWaitingRoom,
  getSession,
  startConsultation,
  endConsultation,
} = require('../controllers/telemedicineController');
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');

// All telemedicine endpoints require an authenticated session.
router.use(protect);

// Patient: join waiting room for their own booked appointment.
// Controller verifies the appointment belongs to req.user (ownership check).
router.post('/join', permit('PATIENT.USE_TELEMEDICINE'), joinWaitingRoom);

// Patient or doctor: retrieve session for an appointment.
// Controller verifies the caller is a participant of the appointment.
router.get('/session/:appointmentId', permitAny('PATIENT.USE_TELEMEDICINE', 'DOCTOR.START_TELEMEDICINE'), getSession);

// Doctor: control the consultation lifecycle
router.post('/start', permit('DOCTOR.START_TELEMEDICINE'), startConsultation);
router.post('/end',   permit('DOCTOR.END_TELEMEDICINE'),   endConsultation);

module.exports = router;
