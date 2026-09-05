const mongoose = require('mongoose');

/**
 * ScheduleException — a one-off override of a ProviderSchedule for a single
 * calendar date: a holiday/closure (no slots), or extra hours (overrideHours
 * replaces the regular weekly window for that date).
 */
const scheduleExceptionSchema = new mongoose.Schema(
    {
        providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderDoctor', default: null },
        date: { type: Date, required: true },
        type: { type: String, enum: ['holiday', 'extra', 'closed'], required: true },
        reason: { type: String, default: null },
        // Only meaningful for type:'extra' — replaces the regular window.
        overrideHours: {
            startTime: { type: String },
            endTime: { type: String },
        },
        tenantId: { type: String, default: 't-default', index: true },
    },
    { timestamps: true }
);

scheduleExceptionSchema.index({ providerId: 1, doctorId: 1, date: 1 });

module.exports = mongoose.model('ScheduleException', scheduleExceptionSchema);
