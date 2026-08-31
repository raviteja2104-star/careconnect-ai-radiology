const express = require('express');
const router = express.Router();
const { 
  joinWaitingRoom,
  startConsultation,
  endConsultation
} = require('../controllers/telemedicineController');
const { protect, authorize } = require('../middleware/auth');

// All telemedicine endpoints require an authenticated session.
router.use(protect);

// Patients join the waiting room themselves — no role restriction beyond auth.
router.route('/join').post(joinWaitingRoom);
// Starting/ending a consultation is a clinician action.
router.route('/start').post(authorize('doctor', 'admin'), startConsultation);
router.route('/end').post(authorize('doctor', 'admin'), endConsultation);

module.exports = router;
