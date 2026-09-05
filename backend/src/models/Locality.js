const mongoose = require('mongoose');

/**
 * Locality — database-backed replacement for the old 13-item hardcoded
 * VIZAG_LOCALITIES enum on Provider. Seeded from the real 57-area
 * Vizag_Areas_Master sheet in the user-supplied master workbook plus a small
 * gap-fill set found by cross-referencing Provider_Master's actual locality
 * strings (see docs/nearby-data-master-plan.md §4) — see
 * src/data/localitySeed.js for provenance of every entry. Never a place we
 * invented: every name here traces back to the workbook or to a locality
 * string already in this codebase's own prior seed/demo data.
 */
const localitySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        // lowercase, alphanumeric-only — the same normalization the data-quality
        // analysis used to detect "Seethammadhara" vs "Sheethammadhara"-style
        // variants; used as the unique dedup key instead of the display name.
        normalizedName: { type: String, required: true, unique: true, index: true },
        // Known spelling/format variants seen in source data, so an import
        // resolver can match "China Waltair" or "P M Palem" to the same
        // locality without a fuzzy-match pass. Informational only — search
        // still matches on `name`.
        aliases: [{ type: String, trim: true }],
        city: { type: String, default: 'Visakhapatnam' },
        district: { type: String, default: 'Visakhapatnam' },
        state: { type: String, default: 'Andhra Pradesh' },
        // 'city' = inside Greater Vizag; 'district_wide' = wider
        // Visakhapatnam-district/tourist-route places (e.g. Araku Valley)
        // that shouldn't be mixed into the city locality picker by default.
        region: { type: String, enum: ['city', 'district_wide'], default: 'city' },
        geo: {
            type: { type: String, enum: ['Point'], default: undefined },
            coordinates: { type: [Number], default: undefined }, // [lng, lat] — only set once a real center point is verified
        },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Locality', localitySchema);
