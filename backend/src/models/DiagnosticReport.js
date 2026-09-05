const mongoose = require('mongoose');

/**
 * DiagnosticReport — a captured/external imaging/diagnostic report (X-Ray,
 * CT, MRI, Ultrasound, Mammography, Echo, ECG, ...), scanned or uploaded.
 * Distinct from RadiologyScan.js/RadiologyStudy.js, which back CareConnect's
 * OWN teleradiology workflow (a study CareConnect's PACS/worklist processed)
 * — this is a record of a study that happened elsewhere, captured into the
 * patient's CareConnect record. See LabReport.js's header for the same
 * "captured vs. performed-by-us" distinction applied to lab data.
 */
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

const MODALITIES = ['XRAY', 'CT', 'MRI', 'ULTRASOUND', 'MAMMOGRAPHY', 'ECHO', 'ECG', 'OTHER'];

const diagnosticReportSchema = new mongoose.Schema(
    {
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        tenantId: { type: String, default: 't-default' },

        documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthDocument' },
        extractionId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentExtraction' },
        source: { type: String, enum: ['SCANNED', 'UPLOADED', 'IMPORTED'], required: true },

        modality: { type: String, enum: MODALITIES },
        studyDescription: { type: String },
        studyDate: { type: Date },
        providerName: { type: String },
        providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },

        clinicalHistory: { type: String },
        findings: { type: String },
        impression: { type: String },
        radiologistName: { type: String },

        confidenceLevel: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW', null], default: null },

        status: {
            type: String,
            enum: ['DRAFT_EXTRACTED', 'REVIEW_REQUIRED', 'CLINICIAN_REVIEW_REQUIRED', 'VERIFIED', 'REJECTED', 'AMENDED'],
            default: 'DRAFT_EXTRACTED',
            index: true,
        },
        reviews: [reviewSchema],

        version: { type: Number, default: 1 },
        supersedes: { type: mongoose.Schema.Types.ObjectId, ref: 'DiagnosticReport' },

        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: { type: Date },

        createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        createdByRole: { type: String, required: true },
    },
    { timestamps: true }
);

diagnosticReportSchema.index({ patientId: 1, studyDate: -1 });

diagnosticReportSchema.pre('save', async function blockVerifiedMutation(next) {
    if (this.isNew) return next();
    const prior = await this.constructor.findById(this._id).select('status').lean();
    if (!prior || prior.status !== 'VERIFIED') return next();
    if (this.status === 'AMENDED' && this.$locals.allowAmendTransition) return next();
    return next(new Error('A VERIFIED diagnostic report is immutable. Create a new version (supersedes) instead.'));
});

module.exports = mongoose.model('DiagnosticReport', diagnosticReportSchema);
module.exports.MODALITIES = MODALITIES;
