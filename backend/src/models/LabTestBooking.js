const mongoose = require('mongoose');

const labTestBookingSchema = new mongoose.Schema(
    {
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
        tests: [
            {
                name: { type: String, required: true },
                price: { type: Number, required: true },
                _id: false,
            },
        ],
        collectionMethod: { type: String, enum: ['center_visit', 'home_collection'], required: true },
        // Required when collectionMethod === 'home_collection'.
        address: { type: String },
        date: { type: Date, required: true },
        slot: { type: String, required: true }, // 'HH:mm'
        status: {
            type: String,
            enum: ['PENDING', 'CONFIRMED', 'SAMPLE_COLLECTED', 'COMPLETED', 'CANCELLED'],
            default: 'PENDING',
            index: true,
        },
        totalPrice: { type: Number, required: true },
        confirmationCode: { type: String, required: true, unique: true },
        tenantId: { type: String, default: 't-default', index: true },
    },
    { timestamps: true }
);

labTestBookingSchema.index({ patientId: 1, status: 1, date: -1 });

module.exports = mongoose.model('LabTestBooking', labTestBookingSchema);
