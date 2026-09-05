const path = require('path');
const fs = require('fs');

const HealthDocument = require('../models/HealthDocument');
const DocumentExtraction = require('../models/DocumentExtraction');
const Prescription = require('../models/Prescription');
const LabReport = require('../models/LabReport');
const DiagnosticReport = require('../models/DiagnosticReport');
const CaregiverAuthorization = require('../models/CaregiverAuthorization');
const RecordShare = require('../models/RecordShare');
const AuditLog = require('../models/AuditLog');

const CaregiverAuthzService = require('../services/CaregiverAuthzService');
const HealthDocumentPipeline = require('../services/HealthDocumentPipeline');
const HealthDocumentAiClient = require('../services/HealthDocumentAiClient');
const HealthRecordService = require('../services/HealthRecordService');
const StructuredRecordBuilder = require('../services/StructuredRecordBuilder');
const MedicineNormalizer = require('../services/MedicineNormalizer');

function isCastError(err) {
    return err && err.name === 'CastError';
}
function isValidationError(err) {
    return err && err.name === 'ValidationError';
}

const STRUCTURED_MODELS = { Prescription, LabReport, DiagnosticReport };

/* ─────────────────────────── serializers ─────────────────────────── */

function serializeDocument(d) {
    return {
        _id: String(d._id),
        patientId: String(d.patientId),
        documentType: d.documentType,
        documentTypeSource: d.documentTypeSource,
        documentTypeConfidence: d.documentTypeConfidence,
        pages: (d.pages || []).map((p) => ({
            pageNumber: p.pageNumber,
            originalName: p.originalName,
            mimeType: p.mimeType,
            sizeBytes: p.sizeBytes,
            quality: p.quality,
            // fileKey deliberately omitted — never expose the storage path;
            // the file is fetched via getPageFile, not by client-known path.
        })),
        capturedBy: d.capturedBy,
        capturedVia: d.capturedVia,
        caregiverAuthorizationId: d.caregiverAuthorizationId ? String(d.caregiverAuthorizationId) : null,
        status: d.status,
        currentExtractionId: d.currentExtractionId ? String(d.currentExtractionId) : null,
        structuredRecord: d.structuredRecord,
        reviews: d.reviews || [],
        notes: d.notes,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
    };
}

function serializeExtraction(e) {
    if (!e) return null;
    return {
        _id: String(e._id),
        documentId: String(e.documentId),
        aiProvider: e.aiProvider,
        aiModel: e.aiModel,
        classification: e.classification,
        fields: e.fields,
        status: e.status,
        errorMessage: e.errorMessage,
        processedAt: e.processedAt,
        createdAt: e.createdAt,
        // rawResponse intentionally omitted from the default serialization —
        // it's audit-only, fetched via a separate admin/debug path if ever needed.
    };
}

/* ─────────────────────────── documents ─────────────────────────── */

// POST /api/health-records/documents  (multipart: files[], patientId, documentType?, capturedVia, caregiverAuthorizationId?)
exports.uploadDocument = async (req, res) => {
    try {
        const { patientId, documentType, capturedVia, caregiverAuthorizationId } = req.body;
        if (!patientId) return res.status(400).json({ message: 'patientId is required.' });
        if (!req.files || !req.files.length) return res.status(400).json({ message: 'At least one file is required.' });
        if (!['CAMERA', 'UPLOAD_IMAGE', 'UPLOAD_PDF'].includes(capturedVia)) {
            return res.status(400).json({ message: 'capturedVia must be CAMERA, UPLOAD_IMAGE or UPLOAD_PDF.' });
        }

        const perm = await CaregiverAuthzService.canCapture(req.user, patientId);
        if (!perm.allowed) return res.status(403).json({ message: 'You are not authorized to add records for this patient.' });

        const { checksumFile } = require('../middleware/healthDocumentUpload');
        const files = await Promise.all(
            req.files.map(async (f) => ({
                absolutePath: f.path,
                fileKey: path.relative(require('../middleware/healthDocumentUpload').SECURE_ROOT, f.path),
                mimeType: f.mimetype,
                originalName: f.originalname,
                sizeBytes: f.size,
                checksum: await checksumFile(f.path),
            }))
        );

        const { document, extraction } = await HealthDocumentPipeline.createDocument({
            files,
            patientId,
            capturedBy: { userId: req.user._id, role: req.user.role },
            capturedVia,
            documentTypeHint: documentType,
            caregiverAuthorizationId: perm.via === 'caregiver' ? perm.authorizationId : caregiverAuthorizationId,
            tenantId: req.user.tenantId,
        });

        res.status(201).json({ document: serializeDocument(document), extraction: serializeExtraction(extraction) });
    } catch (err) {
        if (err.code === 'VIRUS_DETECTED') return res.status(422).json({ message: err.message, code: 'VIRUS_DETECTED' });
        if (isValidationError(err)) return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

// POST /api/health-records/documents/:id/reprocess — retry AI extraction (e.g. after an AI-service outage).
exports.reprocessDocument = async (req, res) => {
    try {
        const document = await HealthDocument.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found.' });
        const perm = await CaregiverAuthzService.canCapture(req.user, document.patientId);
        if (!perm.allowed) return res.status(403).json({ message: 'You are not authorized to reprocess this document.' });

        const { SECURE_ROOT } = require('../middleware/healthDocumentUpload');
        const aiPages = document.pages.map((p) => ({
            absolutePath: path.join(SECURE_ROOT, p.fileKey),
            mimeType: p.mimeType,
            pageNumber: p.pageNumber,
            encryption: p.encryption || null,
        }));
        const result = await HealthDocumentAiClient.extractDocument(aiPages, document.documentType);
        const fields = (result.fields || []).map((f) => ({
            key: f.key, label: f.label || f.key, value: f.value ?? null,
            confidenceLevel: f.confidenceLevel || null, confidenceNote: f.confidenceNote || '',
            illegible: !!f.illegible, humanStatus: 'PENDING',
        }));
        const extraction = await DocumentExtraction.create({
            documentId: document._id, tenantId: document.tenantId, aiProvider: 'claude',
            classification: { documentType: result.documentType, confidenceLevel: result.documentTypeConfidence || null, confidenceNote: result.documentTypeNote || '' },
            fields, rawResponse: result, status: 'COMPLETE', processedAt: new Date(),
        });
        document.currentExtractionId = extraction._id;
        document.status = 'REVIEW_REQUIRED';
        await document.save();
        res.json({ document: serializeDocument(document), extraction: serializeExtraction(extraction) });
    } catch (err) {
        if (err instanceof HealthDocumentAiClient.AiUnavailableError) {
            return res.status(503).json({ message: err.message, available: false });
        }
        if (isCastError(err)) return res.status(404).json({ message: 'Document not found.' });
        res.status(500).json({ message: err.message });
    }
};

// GET /api/health-records/documents?patientId=&status=
exports.listDocuments = async (req, res) => {
    try {
        const { patientId, status } = req.query;
        if (!patientId) return res.status(400).json({ message: 'patientId is required.' });
        const perm = await CaregiverAuthzService.canView(req.user, patientId);
        if (!perm.allowed) return res.status(403).json({ message: 'You are not authorized to view this patient\'s records.' });

        const filter = { patientId, active: { $ne: false } };
        if (status) filter.status = status;
        const documents = await HealthDocument.find(filter).sort({ createdAt: -1 }).limit(200).lean();
        res.json({ documents: documents.map(serializeDocument) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/health-records/documents/:id
exports.getDocument = async (req, res) => {
    try {
        const document = await HealthDocument.findById(req.params.id).lean();
        if (!document) return res.status(404).json({ message: 'Document not found.' });
        const perm = await CaregiverAuthzService.canView(req.user, document.patientId);
        if (!perm.allowed) return res.status(403).json({ message: 'You are not authorized to view this document.' });

        const extraction = document.currentExtractionId
            ? await DocumentExtraction.findById(document.currentExtractionId).lean()
            : null;
        res.json({ document: serializeDocument(document), extraction: serializeExtraction(extraction) });
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Document not found.' });
        res.status(500).json({ message: err.message });
    }
};

// GET /api/health-records/documents/:id/pages/:pageNumber/file — the ONLY
// way to read a page's bytes back. Never served via /uploads static.
exports.getPageFile = async (req, res) => {
    try {
        const document = await HealthDocument.findById(req.params.id).lean();
        if (!document) return res.status(404).json({ message: 'Document not found.' });
        const perm = await CaregiverAuthzService.canView(req.user, document.patientId);
        if (!perm.allowed) return res.status(403).json({ message: 'You are not authorized to view this document.' });

        const page = document.pages.find((p) => p.pageNumber === Number(req.params.pageNumber));
        if (!page) return res.status(404).json({ message: 'Page not found.' });

        const { SECURE_ROOT } = require('../middleware/healthDocumentUpload');
        const absolutePath = path.join(SECURE_ROOT, page.fileKey);
        // Defense in depth against a fileKey ever containing traversal
        // segments (shouldn't happen — it's server-generated — but this is a
        // medical-document file stream, worth the extra check).
        if (!absolutePath.startsWith(path.join(SECURE_ROOT))) {
            return res.status(400).json({ message: 'Invalid page reference.' });
        }
        if (!fs.existsSync(absolutePath)) return res.status(404).json({ message: 'File no longer available.' });

        res.setHeader('Content-Type', page.mimeType);
        res.setHeader('Cache-Control', 'private, no-store'); // never cache a medical document response
        if (page.encryption) {
            const FileEncryptionService = require('../services/FileEncryptionService');
            FileEncryptionService.decryptToStream(absolutePath, page.encryption).pipe(res);
        } else {
            fs.createReadStream(absolutePath).pipe(res);
        }
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Document not found.' });
        res.status(500).json({ message: err.message });
    }
};

/* ───────────────────── extraction field review ───────────────────── */

// PATCH /api/health-records/documents/:id/fields/:fieldKey  { decision: ACCEPT|EDIT|REJECT, value? }
exports.decideField = async (req, res) => {
    try {
        const document = await HealthDocument.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found.' });
        if (!CaregiverAuthzService.canFirstPassReview(req.user) && String(document.patientId) !== String(req.user._id)) {
            return res.status(403).json({ message: 'You are not authorized to review this document.' });
        }
        const extraction = await DocumentExtraction.findById(document.currentExtractionId);
        if (!extraction) return res.status(404).json({ message: 'No extraction to review for this document.' });

        const fieldKey = decodeURIComponent(req.params.fieldKey);
        const field = extraction.fields.find((f) => f.key === fieldKey);
        if (!field) return res.status(404).json({ message: `Field "${fieldKey}" not found.` });

        const { decision, value } = req.body;
        if (!['ACCEPT', 'EDIT', 'REJECT'].includes(decision)) {
            return res.status(400).json({ message: 'decision must be ACCEPT, EDIT or REJECT.' });
        }
        if (decision === 'EDIT' && value === undefined) {
            return res.status(400).json({ message: 'value is required when decision is EDIT.' });
        }

        field.humanStatus = decision === 'ACCEPT' ? 'ACCEPTED' : decision === 'EDIT' ? 'EDITED' : 'REJECTED';
        if (decision === 'EDIT') field.humanValue = value;
        field.humanEditedBy = req.user._id;
        field.humanEditedAt = new Date();
        await extraction.save();

        res.json(serializeExtraction(extraction));
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Document not found.' });
        res.status(500).json({ message: err.message });
    }
};

// POST /api/health-records/documents/:id/confirm — after all fields have a
// human decision, builds the structured record (if this documentType has
// one) and moves the document forward.
exports.confirmDocument = async (req, res) => {
    try {
        const document = await HealthDocument.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found.' });
        const isPatientSelf = String(document.patientId) === String(req.user._id);
        if (!CaregiverAuthzService.canFirstPassReview(req.user) && !isPatientSelf) {
            return res.status(403).json({ message: 'You are not authorized to confirm this document.' });
        }
        const extraction = document.currentExtractionId
            ? await DocumentExtraction.findById(document.currentExtractionId)
            : null;

        let structured = null;
        if (extraction) {
            const pending = extraction.fields.filter((f) => f.humanStatus === 'PENDING');
            if (pending.length) {
                return res.status(409).json({
                    message: `${pending.length} field(s) still need a review decision before confirming.`,
                    pendingFields: pending.map((f) => f.key),
                });
            }
            structured = await StructuredRecordBuilder.buildFromExtraction({ document, extraction, actingUser: req.user });
        }

        document.reviews.push({
            reviewerUserId: req.user._id,
            reviewerRole: req.user.role,
            decision: 'ACCEPT',
            notes: req.body?.notes,
        });
        if (structured) {
            document.structuredRecord = { model: structured.model, id: structured.record._id };
            // Lab reports and diagnostic reports commonly need clinician sign-off;
            // a patient confirming their own scanned prescription can be enough
            // to make it usable, but still flagged for clinical review before
            // being treated as verified medical fact.
            document.status = isPatientSelf ? 'PATIENT_CONFIRMED' : 'CLINICIAN_REVIEW_REQUIRED';
        } else {
            document.status = isPatientSelf ? 'PATIENT_CONFIRMED' : 'VERIFIED';
        }
        await document.save();

        res.json({
            document: serializeDocument(document),
            structuredRecord: structured ? { model: structured.model, id: String(structured.record._id) } : null,
        });
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Document not found.' });
        if (isValidationError(err)) return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

// POST /api/health-records/documents/:id/review  { decision: ACCEPT|EDIT|REJECT|RESCAN_REQUESTED, notes? }
// A lighter-weight, whole-document review action (distinct from confirmDocument,
// which additionally builds the structured record) — e.g. for a quick reject/rescan.
exports.reviewDocument = async (req, res) => {
    try {
        const document = await HealthDocument.findById(req.params.id);
        if (!document) return res.status(404).json({ message: 'Document not found.' });
        const isPatientSelf = String(document.patientId) === String(req.user._id);
        if (!CaregiverAuthzService.canFirstPassReview(req.user) && !isPatientSelf) {
            return res.status(403).json({ message: 'You are not authorized to review this document.' });
        }
        const { decision, notes } = req.body;
        if (!['ACCEPT', 'EDIT', 'REJECT', 'RESCAN_REQUESTED'].includes(decision)) {
            return res.status(400).json({ message: 'decision must be ACCEPT, EDIT, REJECT or RESCAN_REQUESTED.' });
        }
        document.reviews.push({ reviewerUserId: req.user._id, reviewerRole: req.user.role, decision, notes });
        if (decision === 'REJECT') document.status = 'REJECTED';
        if (decision === 'RESCAN_REQUESTED') document.status = 'REVIEW_REQUIRED';
        await document.save();
        res.json(serializeDocument(document));
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Document not found.' });
        res.status(500).json({ message: err.message });
    }
};

/* ─────────────────── clinical review of structured records ─────────────────── */

// POST /api/health-records/records/:model/:id/clinical-review  { decision: ACCEPT|EDIT|REJECT, notes? }
// decision ACCEPT by a doctor -> status VERIFIED (immutable from then on).
exports.clinicalReview = async (req, res) => {
    try {
        const Model = STRUCTURED_MODELS[req.params.model];
        if (!Model) return res.status(400).json({ message: `Unknown record type "${req.params.model}".` });
        const record = await Model.findById(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found.' });

        const perm = await CaregiverAuthzService.canView(req.user, record.patientId);
        if (!perm.allowed) return res.status(403).json({ message: 'You are not authorized to review this record.' });

        const { decision, notes } = req.body;
        if (!['ACCEPT', 'EDIT', 'REJECT'].includes(decision)) {
            return res.status(400).json({ message: 'decision must be ACCEPT, EDIT or REJECT.' });
        }
        if (decision === 'ACCEPT' && !CaregiverAuthzService.canClinicallyVerify(req.user)) {
            return res.status(403).json({ message: 'Only a doctor can clinically verify this record.' });
        }

        record.reviews.push({ reviewerUserId: req.user._id, reviewerRole: req.user.role, decision, notes });
        if (decision === 'ACCEPT') {
            record.status = 'VERIFIED';
            record.verifiedBy = req.user._id;
            record.verifiedAt = new Date();
        } else if (decision === 'REJECT') {
            record.status = 'REJECTED';
        } else {
            record.status = 'CLINICIAN_REVIEW_REQUIRED';
        }
        await record.save();
        res.json({ model: req.params.model, record });
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Record not found.' });
        if (isValidationError(err)) return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

/* ─────────────────────── medicine normalization ─────────────────────── */

// GET /api/health-records/medicine-suggestions?rawText=
exports.suggestMedicine = async (req, res) => {
    try {
        const { rawText } = req.query;
        if (!rawText) return res.status(400).json({ message: 'rawText is required.' });
        const suggestion = await MedicineNormalizer.suggest(rawText);
        res.json(suggestion);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ─────────────────────────── timeline / summary ─────────────────────────── */

// GET /api/health-records/patients/:patientId/timeline
exports.getTimeline = async (req, res) => {
    try {
        const perm = await CaregiverAuthzService.canView(req.user, req.params.patientId);
        if (!perm.allowed) return res.status(403).json({ message: 'You are not authorized to view this patient\'s timeline.' });
        const timeline = await HealthRecordService.getTimeline(req.params.patientId);
        res.json({ timeline });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/health-records/patients/:patientId/summary
exports.getSummary = async (req, res) => {
    try {
        const perm = await CaregiverAuthzService.canView(req.user, req.params.patientId);
        if (!perm.allowed) return res.status(403).json({ message: 'You are not authorized to view this patient\'s summary.' });
        const summary = await HealthRecordService.getStructuredSummary(req.params.patientId);
        if (!summary) return res.status(404).json({ message: 'Patient not found.' });
        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ───────────────────────── staff dashboard ───────────────────────── */

// GET /api/health-records/dashboard — staff-facing counts + worklists (section 26).
exports.getDashboard = async (req, res) => {
    try {
        if (!CaregiverAuthzService.STAFF_VIEW_ROLES.includes(req.user.role)) {
            return res.status(403).json({ message: 'Staff access only.' });
        }
        const [awaitingReview, clinicianReviewRequired, recentDocuments] = await Promise.all([
            HealthDocument.find({ status: 'REVIEW_REQUIRED' }).sort({ createdAt: -1 }).limit(50).lean(),
            HealthDocument.find({ status: 'CLINICIAN_REVIEW_REQUIRED' }).sort({ createdAt: -1 }).limit(50).lean(),
            HealthDocument.find({}).sort({ createdAt: -1 }).limit(20).lean(),
        ]);
        const lowConfidenceDocs = await DocumentExtraction.find({
            status: 'COMPLETE',
            'fields.confidenceLevel': 'LOW',
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .select('documentId classification createdAt')
            .lean();

        res.json({
            awaitingReview: awaitingReview.map(serializeDocument),
            clinicianReviewRequired: clinicianReviewRequired.map(serializeDocument),
            lowConfidenceExtractions: lowConfidenceDocs,
            recentDocuments: recentDocuments.map(serializeDocument),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ───────────────────────── caregiver authorization ───────────────────────── */

// POST /api/health-records/patients/:patientId/caregivers
exports.grantCaregiverAuthorization = async (req, res) => {
    try {
        const { patientId } = req.params;
        const isPatientSelf = String(patientId) === String(req.user._id);
        const isAdminOrStaff = req.user.role === 'admin' || CaregiverAuthzService.STAFF_CAPTURE_ROLES.includes(req.user.role);
        if (!isPatientSelf && !isAdminOrStaff) {
            return res.status(403).json({ message: 'Only the patient (or authorized staff) can grant caregiver access.' });
        }
        const { caregiverUserId, relationship, relationshipNote, permissionScope, endDate, method } = req.body;
        if (!caregiverUserId || !relationship) {
            return res.status(400).json({ message: 'caregiverUserId and relationship are required.' });
        }
        const authorization = await CaregiverAuthorization.create({
            patientId,
            caregiverUserId,
            relationship,
            relationshipNote,
            permissionScope,
            endDate,
            status: 'ACTIVE',
            authorizedBy: {
                userId: req.user._id,
                method: isPatientSelf ? 'PATIENT_CONSENT' : method || 'STAFF_VERIFIED',
            },
        });
        res.status(201).json(authorization);
    } catch (err) {
        if (isValidationError(err)) return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

// GET /api/health-records/patients/:patientId/caregivers
exports.listCaregiverAuthorizations = async (req, res) => {
    try {
        const perm = await CaregiverAuthzService.canView(req.user, req.params.patientId);
        if (!perm.allowed) return res.status(403).json({ message: 'You are not authorized to view this.' });
        const rows = await CaregiverAuthorization.find({ patientId: req.params.patientId }).sort({ createdAt: -1 }).lean();
        res.json({ authorizations: rows });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PATCH /api/health-records/caregivers/:id/revoke  { reason? }
exports.revokeCaregiverAuthorization = async (req, res) => {
    try {
        const authorization = await CaregiverAuthorization.findById(req.params.id);
        if (!authorization) return res.status(404).json({ message: 'Authorization not found.' });
        const isPatientSelf = String(authorization.patientId) === String(req.user._id);
        if (!isPatientSelf && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only the patient (or an admin) can revoke this authorization.' });
        }
        authorization.status = 'REVOKED';
        authorization.revokedAt = new Date();
        authorization.revokedBy = req.user._id;
        authorization.revokeReason = req.body?.reason;
        await authorization.save();
        res.json(authorization);
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Authorization not found.' });
        res.status(500).json({ message: err.message });
    }
};

/* ───────────────────────── sharing / consent ───────────────────────── */

// POST /api/health-records/patients/:patientId/shares
exports.createShare = async (req, res) => {
    try {
        const { patientId } = req.params;
        if (String(patientId) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Only the patient can control sharing of their own records.' });
        }
        const { sharedWithUserId, sharedWithProviderId, sharedWithLabel, scope, scopeDocumentIds, scopeDocumentTypes, expiresAt } = req.body;
        if (!sharedWithUserId && !sharedWithProviderId && !sharedWithLabel) {
            return res.status(400).json({ message: 'One of sharedWithUserId, sharedWithProviderId or sharedWithLabel is required.' });
        }
        if (!['ALL_RECORDS', 'SPECIFIC_DOCUMENT', 'DOCUMENT_TYPE'].includes(scope)) {
            return res.status(400).json({ message: 'scope must be ALL_RECORDS, SPECIFIC_DOCUMENT or DOCUMENT_TYPE.' });
        }
        const share = await RecordShare.create({
            patientId, sharedWithUserId, sharedWithProviderId, sharedWithLabel,
            scope, scopeDocumentIds, scopeDocumentTypes, expiresAt,
        });
        res.status(201).json(share);
    } catch (err) {
        if (isValidationError(err)) return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

// GET /api/health-records/patients/:patientId/shares
exports.listShares = async (req, res) => {
    try {
        if (String(req.params.patientId) !== String(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to view this.' });
        }
        const shares = await RecordShare.find({ patientId: req.params.patientId }).sort({ createdAt: -1 }).lean();
        res.json({ shares });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PATCH /api/health-records/shares/:id/revoke
exports.revokeShare = async (req, res) => {
    try {
        const share = await RecordShare.findById(req.params.id);
        if (!share) return res.status(404).json({ message: 'Share not found.' });
        if (String(share.patientId) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Only the patient can revoke their own share grants.' });
        }
        share.status = 'REVOKED';
        share.revokedAt = new Date();
        share.revokedBy = req.user._id;
        await share.save();
        res.json(share);
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Share not found.' });
        res.status(500).json({ message: err.message });
    }
};

// GET /api/health-records/patients/:patientId/access-history — reads from
// the existing hash-chained AuditLog (see middleware/audit.js) rather than a
// second duplicate access log. AuditLog.resourceId is whatever :param the
// route naturally carries (a document id, a caregiver-authorization id, a
// share id, or the patientId itself for patient-scoped routes) — so this
// gathers every record id that belongs to the patient first, then queries
// AuditLog for actions against any of them.
exports.getAccessHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        if (String(patientId) !== String(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You are not authorized to view this.' });
        }
        const [documents, prescriptions, labReports, diagnosticReports, authorizations, shares] = await Promise.all([
            HealthDocument.find({ patientId }).select('_id').lean(),
            Prescription.find({ patientId }).select('_id').lean(),
            LabReport.find({ patientId }).select('_id').lean(),
            DiagnosticReport.find({ patientId }).select('_id').lean(),
            CaregiverAuthorization.find({ patientId }).select('_id').lean(),
            RecordShare.find({ patientId }).select('_id').lean(),
        ]);
        const resourceIds = [
            patientId,
            ...[...documents, ...prescriptions, ...labReports, ...diagnosticReports, ...authorizations, ...shares].map((r) => String(r._id)),
        ];
        const entries = await AuditLog.find({ resource: 'HealthRecordCapture', resourceId: { $in: resourceIds } })
            .sort({ at: -1 })
            .limit(200)
            .lean();
        res.json({ entries });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
