const mongoose = require('mongoose');

/**
 * Documented category list for ProviderService.category. Keep this in sync
 * with the enum below; exported so controllers/seed data can validate or
 * render a picklist without duplicating the list.
 */
const SERVICE_CATEGORIES = [
    'Consultation',
    'Follow-up',
    'Diagnostics-Imaging',
    'Diagnostics-Lab',
    'Vaccination',
    'Physiotherapy',
    'Dental',
    'Eye',
    'Other',
];

const providerServiceSchema = new mongoose.Schema(
    {
        providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
        name: { type: String, required: true, trim: true },
        category: { type: String, enum: SERVICE_CATEGORIES, default: 'Other' },
        price: { type: Number, required: true },
        durationMinutes: { type: Number, default: 15 },
        department: { type: String },
        // Optional — ties a service to a specific doctor (e.g. a consultation
        // slot type); left null for provider-level services (e.g. lab tests).
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderDoctor', default: null },
        homeCollection: { type: Boolean, default: false },
        onlineBooking: { type: Boolean, default: true },
        active: { type: Boolean, default: true },
        tenantId: { type: String, default: 't-default', index: true },
    },
    { timestamps: true }
);

providerServiceSchema.index({ providerId: 1, category: 1 });

module.exports = mongoose.model('ProviderService', providerServiceSchema);
module.exports.SERVICE_CATEGORIES = SERVICE_CATEGORIES;
