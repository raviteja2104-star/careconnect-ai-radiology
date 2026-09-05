const mongoose = require('mongoose');

/**
 * ImportRow — one staged row from an ImportBatch. Never a live Provider
 * record: this is the "discovery" side of the pipeline, held for human
 * review before anything reaches the real Provider collection. See
 * ProviderImportService.js.
 */
const duplicateMatchSchema = new mongoose.Schema(
    {
        matchType: { type: String, enum: ['existing_name_locality', 'existing_phone', 'batch_duplicate'], required: true },
        // Set for existing_* matches (points at a real Provider); unset for
        // batch_duplicate, which points at an earlier row in the same batch.
        providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
        providerName: { type: String },
        matchedRowIndex: { type: Number },
    },
    { _id: false }
);

const importRowSchema = new mongoose.Schema(
    {
        batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImportBatch', required: true, index: true },
        rowIndex: { type: Number, required: true },
        // The raw parsed cell values, keyed by the source file's own headers —
        // kept verbatim for audit/troubleshooting.
        rawData: { type: mongoose.Schema.Types.Mixed },
        // Mapped onto CareConnect's field names (name, type, locality, ...),
        // with providerTypeId/localityId already resolved against the masters
        // where possible. This is what actually gets written to Provider on
        // commit — a reviewer may hand-edit it before approving.
        normalizedData: { type: mongoose.Schema.Types.Mixed },
        validationErrors: [{ type: String }],
        validationWarnings: [{ type: String }],
        duplicateMatches: [duplicateMatchSchema],
        status: {
            type: String,
            enum: ['VALID', 'INVALID', 'DUPLICATE', 'APPROVED', 'REJECTED', 'IMPORTED'],
            default: 'VALID',
            index: true,
        },
        reviewedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: { type: Date },
        reviewNotes: { type: String },
        importedProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
    },
    { timestamps: true }
);

importRowSchema.index({ batchId: 1, rowIndex: 1 }, { unique: true });
importRowSchema.index({ batchId: 1, status: 1 });

module.exports = mongoose.model('ImportRow', importRowSchema);
