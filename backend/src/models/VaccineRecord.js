const mongoose = require('mongoose');
const schema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vaccineName: { type: String, required: true },
    dose: { type: String },
    administeredDate: { type: Date, required: true },
    nextDueDate: { type: Date },
    administeredBy: String,
    batchNumber: String,
    status: { type: String, enum: ['Completed', 'Scheduled', 'Overdue'], default: 'Completed' },
}, { timestamps: true });
module.exports = mongoose.model('VaccineRecord', schema);
