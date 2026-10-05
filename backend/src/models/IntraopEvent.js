const mongoose = require('mongoose');
const { Schema, Types: { ObjectId } } = mongoose;

const intraopEventSchema = new Schema({
    appointmentId: { type: ObjectId, ref: 'Appointment', required: true, index: true },
    tenantId:      { type: ObjectId, ref: 'Organization', index: true },
    type:      { type: String, required: true },
    note:      { type: String, required: true },
    time:      { type: String, required: true },
    loggedBy:  { type: ObjectId, ref: 'User' },
    loggedAt:  { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.models.IntraopEvent ||
    mongoose.model('IntraopEvent', intraopEventSchema);
