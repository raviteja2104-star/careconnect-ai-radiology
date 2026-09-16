/**
 * EmergencyAccess — Break-glass / emergency override log.
 *
 * When a clinician needs access to a restricted patient record in an
 * emergency, they must explicitly request emergency access. Every
 * access is recorded here for audit purposes and administrators are
 * notified. The access grant is time-limited (default 60 minutes).
 *
 * This collection is APPEND-ONLY — records may never be deleted.
 */

const mongoose = require('mongoose');

const emergencyAccessSchema = new mongoose.Schema({
    // Who is requesting access
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    requestedByRole: { type: String, required: true },

    // The patient whose record is being accessed
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

    // Why access is needed — mandatory
    reason: {
        type: String,
        required: [true, 'A reason must be provided for emergency access.'],
        minlength: 10,
        maxlength: 2000,
    },

    // Resources that were accessed under this grant
    resourcesAccessed: [{
        resource: String,   // e.g. 'ClinicalNote', 'Prescription'
        resourceId: String,
        accessedAt: { type: Date, default: Date.now },
    }],

    // Access window
    grantedAt:  { type: Date, default: Date.now },
    expiresAt:  { type: Date, required: true },

    // Context
    tenantId:   { type: String, index: true },
    ip:         { type: String },
    userAgent:  { type: String },
    sessionId:  { type: String },

    // Whether an admin has reviewed/acknowledged the access
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNote: { type: String },

    status: {
        type: String,
        enum: ['active', 'expired', 'revoked', 'reviewed'],
        default: 'active',
        index: true,
    },
}, {
    timestamps: true,
    // Prevent any update that changes immutable audit fields
    strict: true,
});

// TTL — automatically mark expired (does not delete; just for status update)
// Real expiry is enforced by the middleware checking expiresAt.
emergencyAccessSchema.index({ expiresAt: 1 });

/**
 * isValid() — returns true if this grant is still within its access window.
 */
emergencyAccessSchema.methods.isValid = function () {
    return this.status === 'active' && new Date() < this.expiresAt;
};

/**
 * EmergencyAccess.findActiveGrant(requestedBy, patient)
 * Returns the first valid (non-expired) grant for this user+patient pair.
 */
emergencyAccessSchema.statics.findActiveGrant = function (requestedBy, patient) {
    return this.findOne({
        requestedBy,
        patient,
        status: 'active',
        expiresAt: { $gt: new Date() },
    }).lean();
};

module.exports = mongoose.model('EmergencyAccess', emergencyAccessSchema);
