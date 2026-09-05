const mongoose = require('mongoose');

/**
 * CaregiverAuthorization — grants a caregiver/attendant User scoped access to
 * a patient User's records. Explicitly NOT unrestricted: `permissionScope`
 * defaults to document-capture-only, and every other capability (viewing
 * records, appointments, billing) must be granted deliberately. See
 * CaregiverAuthzService.js for the enforcement point every capture/read
 * endpoint calls before honoring a non-self, non-staff request.
 */
const caregiverAuthorizationSchema = new mongoose.Schema(
    {
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        caregiverUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        relationship: {
            type: String,
            enum: ['PARENT', 'CHILD', 'SPOUSE', 'GUARDIAN', 'OTHER_FAMILY', 'OTHER'],
            required: true,
        },
        relationshipNote: { type: String }, // free text when relationship is OTHER/OTHER_FAMILY

        permissionScope: {
            canUploadDocuments: { type: Boolean, default: true },
            canViewRecords: { type: Boolean, default: true },
            canManageAppointments: { type: Boolean, default: false },
            canViewBilling: { type: Boolean, default: false },
        },

        status: { type: String, enum: ['PENDING', 'ACTIVE', 'REVOKED', 'EXPIRED'], default: 'PENDING', index: true },
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date }, // null = indefinite until explicitly revoked

        // How this authorization was actually proven, not merely claimed —
        // the patient consenting themselves is the strong path; staff/admin
        // grants exist for cases the patient can't consent (minors, incapacity).
        authorizedBy: {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            method: { type: String, enum: ['PATIENT_CONSENT', 'OTP_VERIFIED', 'STAFF_VERIFIED', 'ADMIN_GRANTED'], required: true },
        },

        revokedAt: { type: Date },
        revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        revokeReason: { type: String },

        tenantId: { type: String, default: 't-default' },
    },
    { timestamps: true }
);

caregiverAuthorizationSchema.index({ patientId: 1, caregiverUserId: 1, status: 1 });

module.exports = mongoose.model('CaregiverAuthorization', caregiverAuthorizationSchema);
