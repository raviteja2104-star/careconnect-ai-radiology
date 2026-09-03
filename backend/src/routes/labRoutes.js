const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { createBooking, getBookings, updateBooking } = require('../controllers/labController');

const router = express.Router();

router.use(protect);

router.post('/bookings', createBooking);
router.get('/bookings', getBookings);
router.put('/bookings/:id', authorize('lab_tech', 'admin'), updateBooking);

module.exports = router;
