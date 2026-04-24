const Emergency = require('../models/Emergency');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Trigger SOS
// @route   POST /api/emergency/sos
const triggerSOS = async (req, res, next) => {
    try {
        const { type, location, description, vitalSigns } = req.body;

        const emergency = await Emergency.create({
            patientId: req.user._id,
            type: type || 'other',
            location: {
                type: 'Point',
                coordinates: location?.coordinates || [0, 0],
                address: location?.address || 'Unknown',
            },
            description,
            priority: 'critical',
            vitalSigns,
            // Simulate ambulance dispatch
            assignedAmbulance: {
                vehicleId: `AMB-${Math.floor(Math.random() * 1000)}`,
                driverName: 'Rajesh Kumar',
                driverPhone: '+91-9876543210',
                eta: Math.floor(Math.random() * 10) + 3, // 3-12 min ETA
            },
            nearestHospital: {
                name: 'CareConnect City Hospital',
                address: '123 Healthcare Avenue, Medical District',
                distance: parseFloat((Math.random() * 5 + 1).toFixed(1)),
                phone: '+91-1800-123-4567',
            },
        });

        // Quick status update to "dispatched"
        emergency.status = 'dispatched';
        await emergency.save();

        // Notify emergency contact
        if (req.user.emergencyContact?.phone) {
            console.log(`📱 SMS to ${req.user.emergencyContact.phone}: Emergency SOS triggered by ${req.user.firstName}`);
        }

        res.status(201).json({
            success: true,
            message: 'Emergency SOS triggered. Help is on the way!',
            data: emergency,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get emergency status
// @route   GET /api/emergency/:id
const getEmergencyStatus = async (req, res, next) => {
    try {
        const emergency = await Emergency.findById(req.params.id)
            .populate('patientId', 'firstName lastName phone emergencyContact');

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: 'Emergency record not found.',
            });
        }

        res.json({
            success: true,
            data: emergency,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update emergency status
// @route   PUT /api/emergency/:id/status
const updateEmergencyStatus = async (req, res, next) => {
    try {
        const { status, notes } = req.body;
        const emergency = await Emergency.findById(req.params.id);

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: 'Emergency record not found.',
            });
        }

        emergency.status = status;
        if (notes) emergency.notes = notes;
        if (status === 'resolved') emergency.resolvedAt = new Date();
        await emergency.save();

        // Notify patient
        await Notification.create({
            userId: emergency.patientId,
            type: 'emergency_update',
            title: 'Emergency Update',
            message: `Emergency status: ${status.toUpperCase()}${status === 'en_route' ? ` - ETA: ${emergency.assignedAmbulance.eta} min` : ''}`,
            data: { emergencyId: emergency._id },
        });

        res.json({
            success: true,
            message: 'Emergency status updated.',
            data: emergency,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get patient's emergency history
// @route   GET /api/emergency/history
const getEmergencyHistory = async (req, res, next) => {
    try {
        const emergencies = await Emergency.find({ patientId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            data: emergencies,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { triggerSOS, getEmergencyStatus, updateEmergencyStatus, getEmergencyHistory };
