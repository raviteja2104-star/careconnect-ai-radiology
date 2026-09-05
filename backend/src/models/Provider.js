const mongoose = require('mongoose');

const workingHoursSchema = new mongoose.Schema(
    {
        // 0-6, Sunday=0 — matches JS Date#getDay() so GeoSearch's openNow
        // check and ProviderSchedule.dayOfWeek stay consistent.
        day: { type: Number, min: 0, max: 6, required: true },
        open: { type: String }, // 'HH:mm', ignored when is24h
        close: { type: String }, // 'HH:mm', ignored when is24h
        is24h: { type: Boolean, default: false },
    },
    { _id: false }
);

const providerSchema = new mongoose.Schema(
    {
        orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
        name: { type: String, required: true, trim: true },
        // Reference into the ProviderType master (src/models/ProviderType.js) —
        // the source of truth going forward. `type` below is kept as a
        // denormalized code string (e.g. 'hospital') for the many existing
        // query/UI call sites (GeoSearch's exact-match filter, frontend
        // PROVIDER_TYPE_LABELS lookups) that read it directly; controllers
        // resolve and keep the two in sync on every write — see
        // ProviderMasterResolver.js. No hardcoded enum anymore: unknown
        // codes/labels are rejected against the master at write time instead.
        providerTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderType', index: true },
        type: { type: String, required: true, index: true },
        // Free-text subtype, e.g. 'multi_specialty', 'government', 'pathology_lab'.
        subtype: { type: String, trim: true },
        description: { type: String },
        logo: { type: String },
        photos: [{ type: String }],

        address: { type: String },
        // Reference into the Locality master (src/models/Locality.js),
        // replacing the old 13-item hardcoded enum. `locality` is kept as the
        // denormalized display name (e.g. 'MVP Colony') for GeoSearch's
        // free-text `$or` matching and every frontend component that renders
        // it directly — see the providerTypeId comment above for the same
        // pattern.
        localityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Locality', index: true },
        locality: { type: String, default: 'Other', index: true },
        city: { type: String, default: 'Visakhapatnam' },
        state: { type: String, default: 'Andhra Pradesh' },
        pincode: { type: String },

        geo: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [83.2185, 17.6868] }, // [lng, lat]
        },

        phone: { type: String },
        email: { type: String },
        website: { type: String },

        workingHours: [workingHoursSchema],
        emergencyAvailable: { type: Boolean, default: false },

        servicesOffered: [{ type: String }],
        specialties: [{ type: String }],
        consultationFeeRange: {
            min: { type: Number },
            max: { type: Number },
        },
        insuranceAccepted: [{ type: String }],

        homeCollection: { type: Boolean, default: false },
        teleconsultation: { type: Boolean, default: false },
        appointmentEnabled: { type: Boolean, default: true },

        // ── Verification ── (kept as flat fields rather than a nested
        // subdocument to avoid rewriting every existing controller/frontend
        // call site that reads provider.verificationStatus directly; this is
        // the same grouping the architecture calls for, just not nested.)
        careconnectVerified: { type: Boolean, default: false },
        verificationStatus: {
            type: String,
            // SUSPENDED replaces the old TEMPORARILY_UNAVAILABLE label — same
            // meaning (provider paused / not currently taking appointments),
            // renamed to match the current spec.
            enum: ['VERIFIED', 'CLAIMED', 'UNVERIFIED', 'SUSPENDED', 'CLOSED'],
            default: 'UNVERIFIED',
            index: true,
        },
        lastVerifiedAt: { type: Date },
        verifiedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verificationNotes: { type: String },
        claimedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

        // ── Discovery ── replaces the old flat `source: String`. Where a
        // record came from, and when — kept separate from `verification`
        // above so a discovery/import record can never be confused with a
        // CareConnect-verified one (see docs/nearby-data-master-plan.md,
        // "keep discovery data and verified data separate").
        discovery: {
            // e.g. 'seed_sample' (honesty-rule sample dataset), 'admin'
            // (staff-entered), 'import' (bulk Excel/CSV import), 'claim'
            // (provider self-submitted via claim flow).
            source: { type: String, default: 'unknown' },
            sourceUrl: { type: String },
            importedAt: { type: Date },
            lastCheckedAt: { type: Date },
        },

        active: { type: Boolean, default: true },
        tenantId: { type: String, default: 't-default', index: true },
    },
    { timestamps: true }
);

providerSchema.index({ geo: '2dsphere' });
providerSchema.index({ name: 'text', description: 'text', servicesOffered: 'text', specialties: 'text' });

module.exports = mongoose.model('Provider', providerSchema);
