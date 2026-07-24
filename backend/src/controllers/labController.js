const LabBooking = require('../models/LabBooking');
const LabCatalogItem = require('../models/LabCatalogItem');
const { emitEvent } = require('../services/EventBus');
const EVENTS = require('../config/events');

// @desc    Get Lab Catalog (tests and packages)
// @route   GET /api/lab/catalog
// @access  Private
const getCatalog = async (req, res, next) => {
    try {
        let catalog = await LabCatalogItem.find({});
        
        // Seed if empty for MVP
        if (catalog.length === 0) {
            const seedData = [
                { type: 'test', name: 'Complete Blood Count (CBC)', price: 400, originalPrice: 550, tat: '12 hrs', category: 'Fever' },
                { type: 'test', name: 'Lipid Profile', price: 600, originalPrice: 800, tat: '24 hrs', category: 'Heart' },
                { type: 'test', name: 'Thyroid Panel (T3, T4, TSH)', price: 800, originalPrice: 1000, tat: '24 hrs', category: 'Women' },
                { type: 'test', name: 'HbA1c (Diabetes)', price: 500, originalPrice: 650, tat: '12 hrs', category: 'Diabetes' },
                { type: 'package', name: 'Comprehensive Full Body Checkup', testsCount: 64, originalPrice: 4000, price: 1999, tag: 'Bestseller', image: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png', category: 'Fever' },
                { type: 'package', name: 'Advanced Cardiac Risk Profile', testsCount: 18, originalPrice: 3500, price: 1499, tag: 'Trending', image: 'https://cdn-icons-png.flaticon.com/512/2966/2966453.png', category: 'Heart' }
            ];
            await LabCatalogItem.insertMany(seedData);
            catalog = await LabCatalogItem.find({});
        }

        res.status(200).json({ success: true, data: catalog });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new lab booking
// @route   POST /api/lab/bookings
// @access  Private (Patient)
const createBooking = async (req, res, next) => {
    try {
        const { tests, amountTotal, amountPaid, date, time, type } = req.body;
        
        const booking = await LabBooking.create({
            patientId: req.user._id,
            patientName: `${req.user.firstName} ${req.user.lastName}`,
            patientPhone: req.user.phone,
            tests,
            amountTotal,
            amountPaid,
            amountDue: amountTotal - amountPaid,
            date,
            time,
            type,
            status: amountTotal > amountPaid ? 'pending_payment' : 'confirmed'
        });

        // Trigger Event
        emitEvent('LAB_BOOKING_CREATED', { bookingId: booking._id, patientId: req.user._id });

        res.status(201).json({ success: true, data: booking });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all lab bookings (Lab Tech view)
// @route   GET /api/lab/bookings
// @access  Private (Lab Tech)
const getBookings = async (req, res, next) => {
    try {
        // If patient, only return their bookings. If lab tech, return all.
        let query = {};
        if (req.user.role === 'patient') {
            query.patientId = req.user._id;
        }

        const bookings = await LabBooking.find(query).sort({ date: 1, time: 1 });
        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        next(error);
    }
};

// @desc    Update booking status or payment
// @route   PUT /api/lab/bookings/:id
// @access  Private (Lab Tech)
const updateBooking = async (req, res, next) => {
    try {
        const { status, amountPaid } = req.body;
        
        let updateData = {};
        if (status) updateData.status = status;
        
        if (amountPaid !== undefined) {
            const booking = await LabBooking.findById(req.params.id);
            if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
            
            updateData.amountPaid = booking.amountPaid + amountPaid;
            updateData.amountDue = Math.max(0, booking.amountTotal - updateData.amountPaid);
            if (updateData.amountDue === 0 && booking.status === 'pending_payment') {
                updateData.status = 'confirmed';
            }
        }

        const updatedBooking = await LabBooking.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (status === 'report_ready') {
            emitEvent('LAB_RESULTS_UPLOADED', { bookingId: req.params.id, patientId: updatedBooking.patientId });
        }

        res.status(200).json({ success: true, data: updatedBooking });
    } catch (error) {
        next(error);
    }
};

module.exports = { createBooking, getBookings, updateBooking, getCatalog };
