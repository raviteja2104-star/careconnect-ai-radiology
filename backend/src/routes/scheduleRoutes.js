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
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Weekly schedule CRUD
router.get('/:doctorId', getDoctorSchedule);
router.post('/', authorize('doctor', 'admin'), saveDoctorSchedule);

// Slot queries and blocking
router.get('/:doctorId/slots', getDoctorSlots);
router.post('/:doctorId/slots/block', authorize('admin'), blockSlot);

// Leave management
router.get('/:doctorId/leaves', getDoctorLeaves);
router.post('/:doctorId/leaves', authorize('admin', 'doctor'), addLeave);
router.delete('/:doctorId/leaves/:leaveId', authorize('admin', 'doctor'), deleteLeave);

module.exports = router;
