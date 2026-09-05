const mongoose = require('mongoose');

/**
 * ImportBatch — one row per uploaded Excel/CSV file in the provider import
 * pipeline (Upload → Parse & Normalize → Validate → Duplicate Detection →
 * Review/Approval → Import → Verification Queue → Claim → Bookable).
 * Rows staged from the file live in ImportRow, never written to the real
 * Provider collection until a human approves them and commitApprovedRows()
 * runs — see ProviderImportService.js.
 */
const importBatchSchema = new mongoose.Schema(
    {
        fileName: { type: String, required: true },
        sheetName: { type: String },
        uploadedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: {
            type: String,
            enum: ['PARSING', 'REVIEW_PENDING', 'IMPORTED', 'PARTIALLY_IMPORTED', 'FAILED'],
            default: 'PARSING',
            index: true,
        },
        totalRows: { type: Number, default: 0 },
        stats: {
            valid: { type: Number, default: 0 },
            invalid: { type: Number, default: 0 },
            duplicate: { type: Number, default: 0 },
            approved: { type: Number, default: 0 },
            rejected: { type: Number, default: 0 },
            imported: { type: Number, default: 0 },
        },
        errorSummary: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ImportBatch', importBatchSchema);
