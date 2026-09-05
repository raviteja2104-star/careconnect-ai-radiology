const mongoose = require('mongoose');

/**
 * DocumentExtraction — one AI processing run over a HealthDocument. This is
 * the AI's raw read of the document, staged for human review — never written
 * directly into a patient's structured record (Prescription/LabReport/
 * DiagnosticReport) without a human ACCEPT/EDIT decision per field. Mirrors
 * ImportRow's "staged, never auto-committed" role in the provider-import
 * pipeline, applied to clinical documents.
 *
 * `fields[]` is intentionally generic (key/value/confidence) rather than a
 * fixed schema, because the field set differs by documentType (a
 * prescription's fields differ from a lab report's) — HealthDocumentAiClient
 * defines the actual key vocabulary per document type; ExtractedField here
 * is just the storage shape.
 */
const extractedFieldSchema = new mongoose.Schema(
    {
        // Dot-path-style key, e.g. 'patientName', 'medications[0].name',
        // 'medications[0].strength' — lets one flat array represent nested
        // structures (a medicine list, a results table) without a rigid schema.
        key: { type: String, required: true },
        label: { type: String, required: true }, // human-readable, e.g. "Medicine name"
        value: { type: mongoose.Schema.Types.Mixed, default: null }, // null = AI could not read this field — never guessed
        confidenceLevel: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW', null], default: null },
        confidenceNote: { type: String }, // e.g. "Handwriting partially obscured by fold in paper"
        illegible: { type: Boolean, default: false },
        // Human disposition — every field starts PENDING; nothing is "confirmed
        // medical information" (per the AI-safety requirement) until a human
        // acts on it via the review endpoints.
        humanStatus: { type: String, enum: ['PENDING', 'ACCEPTED', 'EDITED', 'REJECTED'], default: 'PENDING' },
        humanValue: { type: mongoose.Schema.Types.Mixed }, // set only when humanStatus === 'EDITED'
        humanEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        humanEditedAt: { type: Date },
    },
    { _id: false }
);

const documentExtractionSchema = new mongoose.Schema(
    {
        documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthDocument', required: true, index: true },
        tenantId: { type: String, default: 't-default' },

        aiProvider: { type: String, default: 'claude' },
        aiModel: { type: String },

        classification: {
            documentType: { type: String },
            confidenceLevel: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW', null], default: null },
            confidenceNote: { type: String },
        },

        fields: [extractedFieldSchema],

        // The full raw AI JSON response, kept verbatim for audit/troubleshooting
        // — never surfaced to a clinician as if it were the reviewed record.
        rawResponse: { type: mongoose.Schema.Types.Mixed },

        status: { type: String, enum: ['PENDING', 'COMPLETE', 'FAILED'], default: 'PENDING', index: true },
        errorMessage: { type: String },
        processedAt: { type: Date },
        durationMs: { type: Number },
    },
    { timestamps: true }
);

documentExtractionSchema.index({ documentId: 1, createdAt: -1 });

module.exports = mongoose.model('DocumentExtraction', documentExtractionSchema);
