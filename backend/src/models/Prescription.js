const mongoose = require('mongoose');

/**
 * Prescription — a structured prescription record in CareConnect's
 * EMR-independent health record layer (see docs on "Case 1/2/3" — this is
 * how Case 3, a paper prescription, and Case 2, an externally-authored
 * prescription a patient uploads, both become a real CareConnect record).
 *
 * Deliberately NOT the same thing as ClinicalOrder{category:'medication'}:
 * a ClinicalOrder is a doctor's in-session order tied to a live Encounter
 * inside CareConnect's own EMR. A Prescription here may have no Encounter at
 * all (a patient scanning a 2-year-old paper prescription from a doctor who
 * has never used CareConnect) — that's the entire point of this feature.
 * `source: 'DOCTOR_CREATED'` covers a doctor authoring directly into this
 * layer without a full EMR encounter (e.g. a small clinic's doctor).
 *
 * Versioning/immutability follows the same idiom as ClinicalNote.js
 * (version + supersedes self-ref, signed-equivalent = VERIFIED is immutable,
 * corrections create a new version) — reused, not reinvented.
 */
const medicationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        generic: { type: String },
        strength: { type: String },
        dosageForm: { type: String }, // tablet, syrup, injection, ...
        route: { type: String },
        frequency: { type: String }, // e.g. "TID"
        duration: { type: String }, // e.g. "5 days"
        instructions: { type: String },
        // The AI's verbatim OCR'd/interpreted text before any normalization —
        // kept so a reviewer can always see what the source actually said.
        aiRawText: { type: String },
        confidenceLevel: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW', null], default: null },
        // Set only once a human selects the correct entry from the medicine
        // master (CatalogEntry, kind:'medication') — see MedicineNormalizer.js.
        // Never auto-set from an AI guess (per the no-auto-prescribe rule).
        matchedCatalogEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogEntry', default: null },
        humanVerified: { type: Boolean, default: false },
        editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        editedAt: { type: Date },
    },
    { _id: false }
);

const reviewSchema = new mongoose.Schema(
    {
        reviewerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        reviewerRole: { type: String, required: true },
        decision: { type: String, enum: ['ACCEPT', 'EDIT', 'REJECT'], required: true },
        notes: { type: String },
        reviewedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
    {
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        tenantId: { type: String, default: 't-default' },

        documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthDocument' }, // null for DOCTOR_CREATED
        extractionId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentExtraction' },
        source: { type: String, enum: ['DOCTOR_CREATED', 'SCANNED', 'UPLOADED', 'IMPORTED'], required: true },

        prescriptionDate: { type: Date },
        // Free text as written on the paper — not necessarily a CareConnect
        // user. doctorUserId is set only when matched/confirmed against a
        // real CareConnect account.
        doctorName: { type: String },
        doctorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        providerName: { type: String },
        providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' }, // optional link into the Nearby directory

        diagnosis: [{ type: String }],
        medications: [medicationSchema],
        investigationsOrdered: [{ type: String }],
        followUpDate: { type: Date },

        status: {
            type: String,
            // AMENDED = superseded by a newer version (this record is still
            // immutable, just no longer the current one) — same lineage
            // marker idiom as ClinicalNote's signed->amended transition.
            enum: ['DRAFT_EXTRACTED', 'REVIEW_REQUIRED', 'CLINICIAN_REVIEW_REQUIRED', 'VERIFIED', 'REJECTED', 'AMENDED'],
            default: 'DRAFT_EXTRACTED',
            index: true,
        },
        reviews: [reviewSchema],

        version: { type: Number, default: 1 },
        supersedes: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },

        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: { type: Date },

        createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdByRole: { type: String, required: true },
    },
    { timestamps: true }
);

prescriptionSchema.index({ patientId: 1, prescriptionDate: -1 });

// Immutability once VERIFIED — same contract as ClinicalNote.js: a VERIFIED
// record can only transition to AMENDED (lineage marker when a superseding
// version is created, via $locals.allowAmendTransition), never edited or
// silently overwritten in place.
prescriptionSchema.pre('save', async function blockVerifiedMutation(next) {
    if (this.isNew) return next();
    const prior = await this.constructor.findById(this._id).select('status').lean();
    if (!prior || prior.status !== 'VERIFIED') return next();
    if (this.status === 'AMENDED' && this.$locals.allowAmendTransition) return next();
    return next(new Error('A VERIFIED prescription is immutable. Create a new version (supersedes) instead.'));
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
