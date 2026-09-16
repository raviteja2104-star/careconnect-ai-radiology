const express = require('express');
const router = express.Router();
const {
  getDoctorSchedule,
  saveDoctorSchedule,
  getDoctorSlots,
  blockSlot,
  getDoctorLeaves,
  addLeave,
  deleteLeave,
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');

router.use(protect);

// Weekly schedule CRUD
router.get('/:doctorId', getDoctorSchedule);
router.post('/', permitAny('DOCTOR.MANAGE_SCHEDULE', 'CLINIC.MANAGE_SCHEDULES'), saveDoctorSchedule);

// Slot queries and blocking
router.get('/:doctorId/slots', getDoctorSlots);
router.post('/:doctorId/slots/block', permit('CLINIC.MANAGE_SCHEDULES'), blockSlot);

// Leave management
router.get('/:doctorId/leaves', getDoctorLeaves);
router.post('/:doctorId/leaves', permitAny('DOCTOR.MANAGE_SCHEDULE', 'CLINIC.MANAGE_SCHEDULES'), addLeave);
router.delete('/:doctorId/leaves/:leaveId', permitAny('DOCTOR.MANAGE_SCHEDULE', 'CLINIC.MANAGE_SCHEDULES'), deleteLeave);

module.exports = router;
