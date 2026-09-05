const mongoose = require('mongoose');

/**
 * LabReport — a captured/external lab report (scanned or uploaded), part of
 * CareConnect's EMR-independent health record layer. Deliberately distinct
 * from LabWorkItem.js: a LabWorkItem is CareConnect's OWN in-house LIS work
 * item (order -> sample -> process -> verify -> release, performed by a
 * CareConnect-connected lab). A LabReport here is a record of a test result
 * that happened somewhere else — the patient (or staff) is just getting it
 * into their digital record. Never cross-write between the two.
 *
 * `referenceRange`/`flag` on results[] are transcribed VERBATIM from the
 * source document — never recomputed against LabReferenceRange.js (that
 * master is for tests CareConnect's own LIS performs and controls the
 * methodology for; a report from an unknown external lab has no basis for
 * CareConnect to reinterpret its reference range or flag).
 */
const resultSchema = new mongoose.Schema(
    {
        testName: { type: String, required: true },
        result: { type: mongoose.Schema.Types.Mixed }, // numeric or qualitative text, as printed
        unit: { type: String },
        // Verbatim from the source report — see file header. Never invented
        // when absent (per the AI-safety rule: "Do NOT invent reference ranges").
        referenceRange: { type: String },
        flag: { type: String }, // as printed on the report, e.g. "NORMAL"/"HIGH"/"LOW"/"CRITICAL" — not recomputed
        comments: { type: String },
        confidenceLevel: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW', null], default: null },
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

const labReportSchema = new mongoose.Schema(
    {
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        tenantId: { type: String, default: 't-default' },

        documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthDocument' },
        extractionId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentExtraction' },
        source: { type: String, enum: ['SCANNED', 'UPLOADED', 'IMPORTED'], required: true },

        labName: { type: String },
        labProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
        // As printed on the report — kept for provenance/audit; never used to
        // auto-confirm patient identity (patient linkage is via patientId,
        // set explicitly by whoever captured the document).
        patientNameOnReport: { type: String },
        patientIdOnReport: { type: String },

        sampleDate: { type: Date },
        reportDate: { type: Date },
        reportNumber: { type: String },
        specimen: { type: String },
        orderingDoctor: { type: String },

        results: [resultSchema],

        status: {
            type: String,
            enum: ['DRAFT_EXTRACTED', 'REVIEW_REQUIRED', 'CLINICIAN_REVIEW_REQUIRED', 'VERIFIED', 'REJECTED', 'AMENDED'],
            default: 'DRAFT_EXTRACTED',
            index: true,
        },
        reviews: [reviewSchema],

        version: { type: Number, default: 1 },
        supersedes: { type: mongoose.Schema.Types.ObjectId, ref: 'LabReport' },

        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: { type: Date },

        createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdByRole: { type: String, required: true },
    },
    { timestamps: true }
);

labReportSchema.index({ patientId: 1, reportDate: -1 });

labReportSchema.pre('save', async function blockVerifiedMutation(next) {
    if (this.isNew) return next();
    const prior = await this.constructor.findById(this._id).select('status').lean();
    if (!prior || prior.status !== 'VERIFIED') return next();
    if (this.status === 'AMENDED' && this.$locals.allowAmendTransition) return next();
    return next(new Error('A VERIFIED lab report is immutable. Create a new version (supersedes) instead.'));
});

module.exports = mongoose.model('LabReport', labReportSchema);
