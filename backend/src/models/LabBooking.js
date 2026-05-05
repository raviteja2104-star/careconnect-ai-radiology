const mongoose = require('mongoose');

const LabBookingSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true },
    patientPhone: { type: String, required: true },
    tests: [{ type: String, required: true }],
    amountTotal: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['confirmed', 'sample_collected', 'report_ready', 'cancelled', 'pending_payment'],
        default: 'confirmed'
    },
    type: { 
        type: String, 
        enum: ['Lab Visit', 'Home Collection'],
        default: 'Lab Visit'
    }
}, { timestamps: true });

module.exports = mongoose.model('LabBooking', LabBookingSchema);
