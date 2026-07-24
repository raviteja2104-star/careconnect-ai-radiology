const mongoose = require('mongoose');

const PharmacyOrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientName: { type: String, required: true },
    patientPhone: { type: String, required: true },
    type: { type: String, enum: ['Digital Rx', 'Refill Request'], default: 'Digital Rx' },
    status: { 
        type: String, 
        enum: ['new', 'pending', 'packing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'new'
    },
    medicines: [{ type: String, required: true }],
    items: { type: Number, required: true },
    amount: { type: Number, required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    doctorName: { type: String },
    isDelivery: { type: Boolean, default: true },
    address: { type: String },
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' }
}, { timestamps: true });

module.exports = mongoose.model('PharmacyOrder', PharmacyOrderSchema);
