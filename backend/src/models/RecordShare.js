const mongoose = require('mongoose');

/**
 * RecordShare — patient-controlled, consent-based sharing of health records
 * (section 22/"RecordAccess" in the feature spec). Distinct from the
 * system-wide AuditLog: AuditLog records every read/write for security
 * audit regardless of consent; RecordShare is the patient's own explicit
 * grant that a doctor/hospital/lab/caregiver may access their records, and
 * can be revoked at any time. "Access History" in the UI reads from
 * AuditLog filtered to the grantee, not a duplicate log kept here.
 */
const recordShareSchema = new mongoose.Schema(
    {
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

        // At least one of sharedWithUserId/sharedWithProviderId/sharedWithLabel
        // must be set — enforced in RecordShareService, not here, since the
        // valid combination depends on whether the grantee has a CareConnect
        // account.
        sharedWithUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        sharedWithProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
        sharedWithLabel: { type: String }, // display name when the grantee has no linked account

        scope: { type: String, enum: ['ALL_RECORDS', 'SPECIFIC_DOCUMENT', 'DOCUMENT_TYPE'], required: true },
        scopeDocumentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'HealthDocument' }],
        scopeDocumentTypes: [{ type: String }],

        status: { type: String, enum: ['ACTIVE', 'REVOKED', 'EXPIRED'], default: 'ACTIVE', index: true },
        grantedAt: { type: Date, default: Date.now },
        expiresAt: { type: Date },
        revokedAt: { type: Date },
        revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

        tenantId: { type: String, default: 't-default' },
    },
    { timestamps: true }
);

recordShareSchema.index({ patientId: 1, status: 1 });

module.exports = mongoose.model('RecordShare', recordShareSchema);
