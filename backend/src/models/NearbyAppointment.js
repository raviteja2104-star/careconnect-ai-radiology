const mongoose = require('mongoose');

const patientDetailsSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        age: { type: Number },
        gender: { type: String },
        phone: { type: String },
    },
    { _id: false }
);

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN'];

const nearbyAppointmentSchema = new mongoose.Schema(
    {
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
        // null = provider-level booking (e.g. a diagnostic center slot not
        // tied to one doctor).
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderDoctor', default: null },
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderService', default: null },
        type: { type: String, enum: ['in_person', 'video', 'home_collection'], required: true },
        date: { type: Date, required: true },
        startTime: { type: String, required: true }, // 'HH:mm'
        endTime: { type: String, required: true }, // 'HH:mm'
        status: {
            type: String,
            enum: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
            default: 'PENDING',
            index: true,
        },
        patientDetails: { type: patientDetailsSchema, required: true },
        notes: { type: String },
        paymentMode: {
            type: String,
            enum: ['pay_at_location', 'upi', 'card', 'insurance'],
            default: 'pay_at_location',
        },
        paymentStatus: { type: String, default: 'pending' },
        confirmationCode: { type: String, required: true, unique: true },
        createdVia: { type: String, default: 'app' },
        cancelReason: { type: String },
        tenantId: { type: String, default: 't-default', index: true },
    },
    { timestamps: true }
);

// Hard DB-level double-booking guard: only one active (PENDING/CONFIRMED/
// CHECKED_IN) appointment may occupy a given provider+doctor+date+startTime.
//
// KNOWN LIMITATION (follow-up): this is a row-level uniqueness constraint,
// so it only ever allows ONE booking per exact slot — it does not by itself
// support maxPerSlot > 1 for provider-level resources (doctorId: null) such
// as a diagnostic center that can serve several patients in the same slot.
// AvailabilityEngine enforces maxPerSlot via an in-transaction capacity
// re-check before insert; this index is the last-resort guard against exact
// duplicate races for the common maxPerSlot=1 doctor-appointment case. A
// proper high-capacity slot model (e.g. a per-slot counter/bucket document)
// is future work if maxPerSlot > 1 provider-level booking is needed.
nearbyAppointmentSchema.index(
    { providerId: 1, doctorId: 1, date: 1, startTime: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: ACTIVE_STATUSES } },
    }
);

nearbyAppointmentSchema.index({ patientId: 1, status: 1, date: -1 });

module.exports = mongoose.model('NearbyAppointment', nearbyAppointmentSchema);
module.exports.ACTIVE_STATUSES = ACTIVE_STATUSES;
