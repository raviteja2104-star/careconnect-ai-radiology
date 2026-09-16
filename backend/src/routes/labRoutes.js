const express = require('express');
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');
const { createBooking, getBookings, updateBooking, getCatalog, getLabOrders, createLabOrder } = require('../controllers/labController');
const audit = require('../middleware/audit');

const router = express.Router();

router.use(protect);
router.use(audit('Lab'));

// Patient bookings — patient books own tests; staff may book on their behalf
router.post(
    '/bookings',
    permitAny('PATIENT.BOOK_APPOINTMENT', 'STAFF.CREATE_APPOINTMENTS', 'DOCTOR.ORDER_LAB'),
    createBooking
);
router.get(
    '/bookings',
    permitAny('PATIENT.VIEW_APPOINTMENTS', 'STAFF.VIEW_LAB_ORDERS', 'DOCTOR.ORDER_LAB'),
    getBookings
);
router.put(
    '/bookings/:id',
    permitAny('STAFF.PROCESS_LAB', 'STAFF.UPLOAD_LAB_RESULTS'),
    updateBooking
);

// Public lab test catalogue (no PHI — no auth restriction beyond being logged in)
router.get('/catalog', getCatalog);

// Lab orders (doctor orders → lab technician processes)
router.get(
    '/orders',
    permitAny('STAFF.LAB', 'STAFF.VIEW_LAB_ORDERS', 'DOCTOR.ORDER_LAB'),
    getLabOrders
);
router.post(
    '/orders',
    permitAny('DOCTOR.ORDER_LAB', 'STAFF.LAB'),
    createLabOrder
);

module.exports = router;
