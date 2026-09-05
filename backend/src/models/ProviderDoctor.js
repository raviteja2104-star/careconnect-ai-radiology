const mongoose = require('mongoose');

/**
 * ProviderDoctor — a doctor practicing at a Provider (hospital/clinic).
 * Distinct from the platform's User/doctor role: this is a directory entry
 * for discovery + booking, not necessarily a CareConnect user account.
 */
const providerDoctorSchema = new mongoose.Schema(
    {
        providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
        name: { type: String, required: true, trim: true },
        specialty: { type: String, required: true },
        specialties: [{ type: String }],
        qualification: { type: String },
        registrationNumber: { type: String },
        experienceYears: { type: Number },
        languages: [{ type: String }],
        photo: { type: String },
        bio: { type: String },
        consultationFee: { type: Number },
        consultationTypes: [{ type: String, enum: ['in_person', 'video'] }],
        appointmentEnabled: { type: Boolean, default: true },
        verified: { type: Boolean, default: false },
        active: { type: Boolean, default: true },
        tenantId: { type: String, default: 't-default', index: true },
    },
    { timestamps: true }
);

providerDoctorSchema.index({ providerId: 1, specialty: 1 });

module.exports = mongoose.model('ProviderDoctor', providerDoctorSchema);
