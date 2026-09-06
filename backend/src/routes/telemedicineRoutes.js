const express = require('express');
const router = express.Router();
const {
  joinWaitingRoom,
  getSession,
  startConsultation,
  endConsultation,
} = require('../controllers/telemedicineController');
const { protect, authorize } = require('../middleware/auth');

// All telemedicine endpoints require an authenticated session.
router.use(protect);

// Patient: join waiting room for a booked appointment
router.post('/join', joinWaitingRoom);
// Patient or doctor: retrieve session for an appointment
router.get('/session/:appointmentId', getSession);
// Doctor/admin: control the consultation lifecycle
router.post('/start', authorize('doctor', 'admin'), startConsultation);
router.post('/end',   authorize('doctor', 'admin'), endConsultation);

module.exports = router;
