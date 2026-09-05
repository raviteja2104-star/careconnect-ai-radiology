const mongoose = require('mongoose');

const providerRegistrationSchema = new mongoose.Schema({
    providerType: { type: String, required: true, enum: ['DOCTOR', 'CLINIC', 'HOSPITAL', 'LAB', 'PHARMACY', 'ORGANISATION'] },
    name:         { type: String, required: true, trim: true },
    contactName:  { type: String, required: true, trim: true },
    email:        { type: String, required: true, lowercase: true, trim: true },
    phone:        { type: String, required: true, trim: true },
    city:         { type: String, trim: true },
    state:        { type: String, trim: true },
    pincode:      { type: String, trim: true },
    specialties:  [String],
    description:  { type: String, trim: true },
    website:      { type: String, trim: true },
    services:     [String],
    documents:    [{ name: String, url: String, type: String }],
    qualifications: [{ degree: String, institution: String, year: Number }],
    operatingHours: mongoose.Schema.Types.Mixed,
    token:        { type: String, required: true, unique: true }, // registration session token (non-auth)
    status: {
        type: String,
        enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CHANGES', 'APPROVED', 'REJECTED'],
        default: 'DRAFT',
    },
    adminNotes:   { type: String },
    lastStep:     { type: Number, default: 1 },
    submittedAt:  { type: Date },
    reviewedAt:   { type: Date },
    reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
}, { timestamps: true });

providerRegistrationSchema.index({ email: 1, providerType: 1 });
providerRegistrationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ProviderRegistration', providerRegistrationSchema, 'provider_registrations');
