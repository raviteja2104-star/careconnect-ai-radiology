const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { createBooking, getBookings, updateBooking } = require('../controllers/labController');

const router = express.Router();

router.use(protect);

router.post('/bookings', createBooking);
router.get('/bookings', getBookings);
router.put('/bookings/:id', restrictTo('lab_tech', 'admin'), updateBooking);

module.exports = router;
