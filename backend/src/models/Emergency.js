const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['cardiac', 'accident', 'breathing', 'stroke', 'other'],
            default: 'other',
        },
        status: {
            type: String,
            enum: ['triggered', 'dispatched', 'en_route', 'arrived', 'resolved'],
            default: 'triggered',
        },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true },
            address: String,
        },
        description: String,
        priority: {
            type: String,
            enum: ['normal', 'urgent', 'critical'],
            default: 'critical',
        },
        assignedAmbulance: {
            vehicleId: String,
            driverName: String,
            driverPhone: String,
            eta: Number, // minutes
        },
        nearestHospital: {
            name: String,
            address: String,
            distance: Number, // km
            phone: String,
        },
        vitalSigns: {
            heartRate: Number,
            bloodPressure: String,
            oxygenLevel: Number,
            temperature: Number,
        },
        resolvedAt: Date,
        notes: String,
    },
    {
        timestamps: true,
    }
);

emergencySchema.index({ 'location.coordinates': '2dsphere' });
emergencySchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('Emergency', emergencySchema);
