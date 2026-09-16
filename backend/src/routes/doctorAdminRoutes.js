const express = require('express');
const router = express.Router();
const {
  listDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  toggleDoctorStatus,
} = require('../controllers/doctorAdminController');
const { protect } = require('../middleware/auth');
const { permit } = require('../middleware/permit');

router.use(protect);
router.use(permit('CLINIC.MANAGE_DOCTORS'));

router.get('/', listDoctors);
router.post('/', createDoctor);
router.get('/:id', getDoctorById);
router.patch('/:id', updateDoctor);
router.patch('/:id/status', toggleDoctorStatus);

module.exports = router;
