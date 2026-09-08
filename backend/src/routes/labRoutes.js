const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { createBooking, getBookings, updateBooking, getCatalog, getLabOrders, createLabOrder } = require('../controllers/labController');

const router = express.Router();

router.use(protect);

router.post('/bookings', createBooking);
router.get('/bookings', getBookings);
router.put('/bookings/:id', authorize('lab_tech', 'admin'), updateBooking);
router.get('/catalog', getCatalog);

router.get('/orders', authorize('doctor', 'nurse', 'lab_tech', 'admin'), getLabOrders);
router.post('/orders', authorize('doctor', 'admin'), createLabOrder);

module.exports = router;
