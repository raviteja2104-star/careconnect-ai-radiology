const express = require('express');
const router = express.Router();
const {
  listDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  toggleDoctorStatus,
} = require('../controllers/doctorAdminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/', listDoctors);
router.post('/', createDoctor);
router.get('/:id', getDoctorById);
router.patch('/:id', updateDoctor);
router.patch('/:id/status', toggleDoctorStatus);

module.exports = router;
