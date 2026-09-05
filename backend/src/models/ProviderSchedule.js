const mongoose = require('mongoose');

const breakSchema = new mongoose.Schema(
    {
        start: { type: String, required: true }, // 'HH:mm'
        end: { type: String, required: true }, // 'HH:mm'
    },
    { _id: false }
);

/**
 * ProviderSchedule — a weekly recurring availability window for either a
 * specific doctor (doctorId set) or the provider as a whole (doctorId null,
 * e.g. a diagnostic lab's walk-in/collection hours).
 */
const providerScheduleSchema = new mongoose.Schema(
    {
        providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderDoctor', default: null },
        // 0-6, Sunday=0 — matches JS Date#getDay().
        dayOfWeek: { type: Number, min: 0, max: 6, required: true },
        startTime: { type: String, required: true }, // 'HH:mm'
        endTime: { type: String, required: true }, // 'HH:mm'
        slotMinutes: { type: Number, required: true, default: 15 },
        breaks: [breakSchema],
        maxPerSlot: { type: Number, default: 1 },
        effectiveFrom: { type: Date, required: true, default: () => new Date() },
        effectiveTo: { type: Date, default: null },
        active: { type: Boolean, default: true },
        tenantId: { type: String, default: 't-default', index: true },
    },
    { timestamps: true }
);

providerScheduleSchema.index({ providerId: 1, doctorId: 1, dayOfWeek: 1 });

module.exports = mongoose.model('ProviderSchedule', providerScheduleSchema);
