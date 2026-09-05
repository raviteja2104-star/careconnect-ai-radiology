/**
 * HealthDocumentPipeline — orchestrates Upload -> Quality Check -> AI
 * Classification+Extraction -> staged-for-review, for one captured document.
 *
 * The document ALWAYS gets created even if AI extraction fails or the AI
 * service is unavailable — a paper document entering the record must never
 * be blocked on an AI vendor being reachable (same "AI is optional, never a
 * hard dependency" principle as emrController.suggestMedications). In that
 * case status stays UPLOADED with a note, and it sits in a manual-entry
 * queue for a human to transcribe directly instead of correcting AI output.
 *
 * Processing here runs synchronously inside the request handler (bounded by
 * ai-service's 120s extract-document timeout) rather than through a queue —
 * this is a deliberate scope decision for this pass, not a claim that a
 * background job/worker pipeline exists. A high-volume deployment would want
 * to move this behind OutboxWorker-style async dispatch.
 */

const HealthDocument = require('../models/HealthDocument');
const DocumentExtraction = require('../models/DocumentExtraction');
const DocumentQualityCheck = require('./DocumentQualityCheck');
const HealthDocumentAiClient = require('./HealthDocumentAiClient');
const VirusScanService = require('./VirusScanService');
const FileEncryptionService = require('./FileEncryptionService');

/**
 * @param {object} params
 * @param {Array<{absolutePath, mimeType, originalName, sizeBytes, fileKey, checksum}>} params.files
 * @param {string} params.patientId
 * @param {{userId, role}} params.capturedBy
 * @param {'CAMERA'|'UPLOAD_IMAGE'|'UPLOAD_PDF'} params.capturedVia
 * @param {string} [params.documentTypeHint] — one of HealthDocument.DOCUMENT_TYPES, if the user pre-selected one
 * @param {string} [params.caregiverAuthorizationId]
 */
async function createDocument({ files, patientId, capturedBy, capturedVia, documentTypeHint, caregiverAuthorizationId, tenantId }) {
    if (!files || !files.length) throw new Error('At least one page is required.');

    // Quality check (synchronous heuristics — no I/O)
    const qualityResults = files.map((f) => DocumentQualityCheck.checkFile(f));

    // Virus scan — throws (deleting all uploaded files) if any page is infected.
    // In dev without clamd, this is a no-op warn unless REQUIRE_VIRUS_SCAN=true.
    await VirusScanService.scanFiles(files);

    // Encrypt each page file at rest. Mutates each file entry with .encryption
    // metadata (null in dev when FILE_ENCRYPTION_KEY is not set).
    for (const f of files) {
        f.encryption = FileEncryptionService.encryptFile(f.absolutePath);
    }

    const pages = files.map((f, i) => ({
        pageNumber: i + 1,
        fileKey: f.fileKey,
        originalName: f.originalName,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
        checksum: f.checksum,
        quality: { warnings: qualityResults[i].warnings },
        encryption: f.encryption || undefined, // undefined → omit field rather than store null
        _absolutePath: f.absolutePath, // stripped before save; used only for the AI call below
    }));

    const document = await HealthDocument.create({
        patientId,
        tenantId: tenantId || 't-default',
        documentType: documentTypeHint || 'OTHER',
        // Placeholder pre-classification state — overwritten to AI_CLASSIFIED
        // below once (if) extraction succeeds.
        documentTypeSource: 'USER_SELECTED',
        pages: pages.map(({ _absolutePath, ...p }) => p),
        capturedBy,
        capturedVia,
        caregiverAuthorizationId: caregiverAuthorizationId || undefined,
        status: 'PROCESSING',
    });

    let extraction = null;
    try {
        const aiPages = pages.map((p) => ({ absolutePath: p._absolutePath, mimeType: p.mimeType, pageNumber: p.pageNumber, encryption: p.encryption || null }));
        const result = await HealthDocumentAiClient.extractDocument(aiPages, documentTypeHint);

        const fields = (result.fields || []).map((f) => ({
            key: f.key,
            label: f.label || f.key,
            value: f.value ?? null,
            confidenceLevel: f.confidenceLevel || null,
            confidenceNote: f.confidenceNote || '',
            illegible: !!f.illegible,
            humanStatus: 'PENDING',
        }));

        extraction = await DocumentExtraction.create({
            documentId: document._id,
            tenantId: tenantId || 't-default',
            aiProvider: 'claude',
            aiModel: result.model,
            classification: {
                documentType: result.documentType,
                confidenceLevel: result.documentTypeConfidence || null,
                confidenceNote: result.documentTypeNote || result.overallNote || '',
            },
            fields,
            rawResponse: result,
            status: 'COMPLETE',
            processedAt: new Date(),
        });

        document.documentType = result.documentType || document.documentType;
        document.documentTypeSource = 'AI_CLASSIFIED';
        document.documentTypeConfidence = result.documentTypeConfidence || null;
        document.currentExtractionId = extraction._id;
        document.status = 'REVIEW_REQUIRED';
        await document.save();
    } catch (err) {
        // AI unavailable/failed — the document still exists for manual entry.
        document.status = 'UPLOADED';
        document.notes = `${document.notes ? document.notes + ' | ' : ''}AI extraction unavailable: ${err.message}`;
        await document.save();
    }

    return { document, extraction };
}

module.exports = { createDocument };
