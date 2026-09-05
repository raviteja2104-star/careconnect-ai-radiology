const mongoose = require('mongoose');

/**
 * HealthDocument — CareConnect Health Record Capture: one uploaded/scanned
 * paper-origin document (prescription, lab report, discharge summary, ...)
 * belonging to a patient. This is the "discovery" layer for clinical
 * documents, mirroring the same design principle already used for the
 * Nearby provider-import pipeline (ImportBatch/ImportRow): nothing here is
 * clinical truth until a human has reviewed it — see DocumentExtraction for
 * the AI's read of it, and Prescription/LabReport/DiagnosticReport for the
 * structured record a reviewer confirms from it.
 *
 * DELIBERATE MODEL-REUSE DECISIONS (see docs — do not "fix" these by adding
 * the missing top-level collections without re-reading why):
 *   - No separate "RecordReview" collection: reviews[] is embedded here (and
 *     on Prescription/LabReport/DiagnosticReport) — the same locality
 *     ClinicalNote/LabWorkItem/ClinicalOrder already use for their own
 *     review/audit subdocuments in this codebase.
 *   - No separate "DocumentAudit" collection: the existing AuditLog +
 *     src/middleware/audit.js (`router.use(audit('HealthRecordCapture'))`)
 *     already gives every request a hash-chained audit entry; duplicating
 *     that here would just create two audit trails that can drift.
 *   - No separate "Patient"/"HealthRecord" demographic store: "patient" is
 *     `role: 'patient'` on the existing User model, and the unified
 *     timeline/structured view is a computed aggregation (see
 *     HealthRecordService.js), not a synced duplicate collection.
 */
const pageQualitySchema = new mongoose.Schema(
    {
        blurDetected: { type: Boolean, default: false },
        glareDetected: { type: Boolean, default: false },
        lowLight: { type: Boolean, default: false },
        skewDetected: { type: Boolean, default: false },
        warnings: [{ type: String }], // e.g. "Document quality is low. Retake recommended."
    },
    { _id: false }
);

const pageSchema = new mongoose.Schema(
    {
        pageNumber: { type: Number, required: true },
        // Server-relative storage key under the health-documents upload root
        // (see middleware/healthDocumentUpload.js) — NEVER a public URL.
        // Files are served only via the authenticated
        // GET /api/health-records/documents/:id/pages/:pageNumber/file route,
        // which checks patient/caregiver/clinical-staff authorization before
        // streaming — unlike the pre-existing /uploads static mount (used for
        // radiology/general files) which has no such check. See
        // healthDocumentController.getPageFile for the enforcement point.
        fileKey: { type: String, required: true },
        originalName: { type: String },
        mimeType: { type: String, required: true },
        sizeBytes: { type: Number },
        checksum: { type: String }, // sha256 of the stored file, for integrity/dedupe checks
        quality: pageQualitySchema,
        // Null when the file is stored unencrypted (dev mode / no FILE_ENCRYPTION_KEY).
        // Set by FileEncryptionService.encryptFile() immediately after upload and virus scan.
        // The ciphertext lives on disk; all key material lives only here, never on disk.
        encryption: {
            type: new mongoose.Schema({
                algorithm:    { type: String }, // 'aes-256-gcm'
                encryptedKey: { type: String }, // hex: per-file DEK wrapped with KEK
                kekIv:        { type: String }, // hex: IV used to wrap the DEK
                kekAuthTag:   { type: String }, // hex: GCM auth tag for the DEK wrapping
                fileIv:       { type: String }, // hex: IV for the file encryption
                fileAuthTag:  { type: String }, // hex: GCM auth tag for the file ciphertext
                keyVersion:   { type: Number }, // which KEK version to use for decryption
            }, { _id: false }),
            default: null,
        },
    },
    { _id: false }
);

const reviewSchema = new mongoose.Schema(
    {
        reviewerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        reviewerRole: { type: String, required: true },
        decision: { type: String, enum: ['ACCEPT', 'EDIT', 'REJECT', 'RESCAN_REQUESTED'], required: true },
        notes: { type: String },
        reviewedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const DOCUMENT_TYPES = [
    'HANDWRITTEN_PRESCRIPTION', 'PRINTED_PRESCRIPTION', 'OPD_NOTE', 'DOCTOR_NOTE',
    'LAB_REPORT', 'DIAGNOSTIC_REPORT', 'DISCHARGE_SUMMARY', 'REFERRAL_LETTER',
    'MEDICAL_CERTIFICATE', 'VACCINATION_RECORD', 'PREVIOUS_MEDICAL_RECORD',
    'NURSING_NOTE', 'HOSPITAL_DOCUMENT', 'MEDICAL_BILL', 'OTHER',
];

const STATUSES = [
    'UPLOADED', 'PROCESSING', 'EXTRACTED', 'REVIEW_REQUIRED',
    'PATIENT_CONFIRMED', 'CLINICIAN_REVIEW_REQUIRED', 'VERIFIED', 'REJECTED', 'ARCHIVED',
];

const healthDocumentSchema = new mongoose.Schema(
    {
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        tenantId: { type: String, default: 't-default', index: true },

        documentType: { type: String, enum: DOCUMENT_TYPES, required: true },
        // How documentType was arrived at — never silently overwritten: an AI
        // guess starts as AI_CLASSIFIED with documentTypeConfidence set; a
        // human changing it moves to USER_CORRECTED.
        documentTypeSource: { type: String, enum: ['AI_CLASSIFIED', 'USER_SELECTED', 'USER_CORRECTED'], default: 'USER_SELECTED' },
        documentTypeConfidence: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW', null], default: null },

        pages: { type: [pageSchema], validate: (v) => Array.isArray(v) && v.length > 0 },

        capturedBy: {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            role: { type: String, required: true }, // snapshot of the actor's role at capture time
        },
        capturedVia: { type: String, enum: ['CAMERA', 'UPLOAD_IMAGE', 'UPLOAD_PDF'], required: true },
        // Set only when capturedBy acted as an attendant on someone else's
        // record — links back to the authorization that made it legitimate.
        caregiverAuthorizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'CaregiverAuthorization' },

        status: { type: String, enum: STATUSES, default: 'UPLOADED', index: true },

        currentExtractionId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentExtraction' },

        // Set once a reviewer confirms this document into a structured
        // clinical record (Prescription | LabReport | DiagnosticReport).
        structuredRecord: {
            model: { type: String, enum: ['Prescription', 'LabReport', 'DiagnosticReport', null], default: null },
            id: { type: mongoose.Schema.Types.ObjectId, default: null },
        },

        reviews: [reviewSchema],

        notes: { type: String },
        active: { type: Boolean, default: true }, // false once ARCHIVED
    },
    { timestamps: true }
);

healthDocumentSchema.index({ patientId: 1, createdAt: -1 });
// status already has its own index via `index: true` on the field above.

module.exports = mongoose.model('HealthDocument', healthDocumentSchema);
module.exports.DOCUMENT_TYPES = DOCUMENT_TYPES;
module.exports.STATUSES = STATUSES;
