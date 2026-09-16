const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getDoctorsStatus,
    getAppointments,
    checkinAppointment,
    registerWalkIn,
} = require('../controllers/receptionController');
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');
const audit = require('../middleware/audit');

router.use(protect);
router.use(audit('Reception'));

// Read-only: any staff who can view appointments (doctors, nurses, reception, admin)
router.get(
    '/dashboard',
    permitAny('STAFF.RECEPTION', 'STAFF.VIEW_APPOINTMENTS', 'ADMIN.VIEW_DASHBOARD'),
    getDashboardStats
);

router.get(
    '/doctors-status',
    permitAny('STAFF.RECEPTION', 'STAFF.VIEW_APPOINTMENTS', 'ADMIN.VIEW_DASHBOARD'),
    getDoctorsStatus
);

router.get(
    '/appointments',
    permitAny('STAFF.RECEPTION', 'STAFF.VIEW_APPOINTMENTS'),
    getAppointments
);

// Mutations: require explicit check-in permission
router.post(
    '/checkin',
    permitAny('STAFF.CHECKIN_PATIENTS', 'OPD.CHECKIN'),
    checkinAppointment
);

router.post(
    '/walkin',
    permitAny('STAFF.CREATE_APPOINTMENTS', 'PATIENTS.CREATE'),
    registerWalkIn
);

module.exports = router;
