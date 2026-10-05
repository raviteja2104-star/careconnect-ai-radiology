const mongoose = require('mongoose');
const { Schema, Types: { ObjectId } } = mongoose;

const drugSchema = new Schema({
    agent:    { type: String, required: true },
    dose:     { type: String, default: '' },
    route:    { type: String, default: 'IV' },
    category: { type: String, default: 'Induction' },
    time:     { type: String, default: '' },
    addedBy:  { type: ObjectId, ref: 'User' },
    addedAt:  { type: Date, default: Date.now },
}, { _id: true });

const anesthesiaSchema = new Schema({
    appointmentId: { type: ObjectId, ref: 'Appointment', required: true, index: true },
    tenantId:      { type: ObjectId, ref: 'Organization', index: true },
    asaClass:      { type: String, enum: ['I', 'II', 'III', 'IV', 'V', 'VI'], default: 'II' },
    preOp: {
        weight:       { type: String, default: '' },
        height:       { type: String, default: '' },
        bmi:          { type: String, default: '' },
        npo:          { type: String, default: '' },
        allergies:    { type: String, default: '' },
        mallampati:   { type: String, default: '' },
        mouthOpening: { type: String, default: '' },
        neckMobility: { type: String, default: '' },
        airwayRisk:   { type: String, default: '' },
        plan:         { type: String, default: '' },
    },
    drugs: [drugSchema],
}, { timestamps: true });

anesthesiaSchema.index({ appointmentId: 1, tenantId: 1 }, { unique: true });

module.exports = mongoose.models.AnesthesiaRecord ||
    mongoose.model('AnesthesiaRecord', anesthesiaSchema);
