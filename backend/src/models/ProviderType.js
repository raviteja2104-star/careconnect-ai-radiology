const mongoose = require('mongoose');

/**
 * ProviderType — database-backed replacement for the old 7-value hardcoded
 * enum on Provider.type. Seeded from the master workbook's Provider_Types
 * sheet (20 entries) plus the long-tail values actually seen in
 * All_Providers_Master (see src/data/providerTypeSeed.js for provenance).
 */
const providerTypeSchema = new mongoose.Schema(
    {
        // Slug used as the FK target and as Provider's denormalized `type` value
        // for the original 7 codes (hospital/clinic/diagnostic/pharmacy/
        // blood_bank/home_healthcare/ambulance), so existing seed/demo data and
        // frontend PROVIDER_TYPE_LABELS keys keep resolving unchanged.
        code: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
        label: { type: String, required: true, trim: true },
        // Loose grouping for future filter UIs — not enforced.
        category: { type: String, trim: true },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ProviderType', providerTypeSchema);
