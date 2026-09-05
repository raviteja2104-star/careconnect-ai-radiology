const mongoose = require('mongoose');

/**
 * ProviderReview — genuine-feedback-only: every review MUST be tied to a
 * real, completed NearbyAppointment (enforced in the controller, which
 * checks the appointment belongs to req.user and is status COMPLETED before
 * allowing the write). The unique index below additionally guarantees one
 * review per completed visit at the DB level.
 */
const providerReviewSchema = new mongoose.Schema(
    {
        providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'NearbyAppointment', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
        createdAt: { type: Date, default: () => new Date() },
    },
    { timestamps: { createdAt: false, updatedAt: false } }
);

providerReviewSchema.index({ providerId: 1, appointmentId: 1 }, { unique: true });

module.exports = mongoose.model('ProviderReview', providerReviewSchema);
