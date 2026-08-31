const mongoose = require('mongoose');

/**
 * ClinicalNote — versioned clinical documentation (SOAP / DAP / BIRP / custom).
 *
 * IMMUTABILITY CONTRACT:
 *  - A note in status 'signed' can never be modified or deleted.
 *  - Corrections happen by creating a NEW note version with `supersedes`
 *    pointing at the signed note (status 'amended' marks the lineage tip).
 *  - Enforced both here (pre-hooks) and in the controller.
 */
const clinicalNoteSchema = new mongoose.Schema(
    {
        encounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter', required: true, index: true },
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        tenantId: { type: String, default: 't-default' },
        format: { type: String, enum: ['SOAP', 'DAP', 'BIRP', 'CUSTOM'], default: 'SOAP' },
        templateKey: String, // specialty template identifier, e.g. 'cardiology-followup'
        // Section keys depend on format: SOAP → subjective/objective/assessment/plan;
        // extended history sections are shared across formats.
        sections: {
            chiefComplaint: String,
            historyOfPresentIllness: String,
            pastMedicalHistory: String,
            pastSurgicalHistory: String,
            familyHistory: String,
            socialHistory: String,
            physicalExamination: String,
            subjective: String,
            objective: String,
            assessment: String,
            plan: String,
            data: String,       // DAP
            behavior: String,   // BIRP
            intervention: String,
            response: String,
            custom: mongoose.Schema.Types.Mixed,
        },
        aiDraft: {
            // AI-generated draft kept separate from clinician content until accepted.
            content: mongoose.Schema.Types.Mixed,
            generatedAt: Date,
            acceptedAt: Date,
            acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        },
        version: { type: Number, default: 1 },
        supersedes: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicalNote' },
        status: { type: String, enum: ['draft', 'signed', 'amended'], default: 'draft', index: true },
        signedAt: Date,
        signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        signatureHash: String, // sha256 of canonical sections at signing time
        auditTrail: [
            {
                action: { type: String, required: true }, // created | updated | ai_draft | signed | amended
                by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                at: { type: Date, default: Date.now },
                note: String,
            },
        ],
        traceId: String,
    },
    { timestamps: true }
);

clinicalNoteSchema.index({ encounterId: 1, version: -1 });

// Block in-place mutation of signed notes at the schema layer.
// The single sanctioned transition on a signed note is signed → amended
// (lineage marker when a superseding version is created), which the
// controller requests via $locals.allowAmendTransition.
clinicalNoteSchema.pre('save', async function blockSignedMutation(next) {
    if (this.isNew) return next();
    const prior = await this.constructor.findById(this._id).select('status').lean();
    if (!prior || prior.status === 'draft') return next();
    if (prior.status === 'signed' && this.status === 'amended' && this.$locals.allowAmendTransition) {
        return next();
    }
    return next(new Error('Signed clinical notes are immutable. Create an amendment instead.'));
});

clinicalNoteSchema.pre(['updateOne', 'findOneAndUpdate', 'deleteOne', 'findOneAndDelete'], async function blockSignedQueryMutation(next) {
    const doc = await this.model.findOne(this.getQuery()).select('status').lean();
    if (doc && doc.status !== 'draft') {
        return next(new Error('Signed clinical notes are immutable. Create an amendment instead.'));
    }
    next();
});

module.exports = mongoose.model('ClinicalNote', clinicalNoteSchema);
