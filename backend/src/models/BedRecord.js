const mongoose = require('mongoose');

const bedRecordSchema = new mongoose.Schema({
    bedId: { type: String, required: true, unique: true },
    ward: { type: String, required: true },
    bedType: { type: String, enum: ['General', 'Private', 'ICU', 'Isolation', 'OT', 'Emergency'], default: 'General' },
    status: { type: String, enum: ['Available', 'Occupied', 'Cleaning', 'Maintenance', 'Reserved'], default: 'Available' },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    admittedAt: { type: Date, default: null },
    isolation: { type: Boolean, default: false },
    notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('BedRecord', bedRecordSchema);
