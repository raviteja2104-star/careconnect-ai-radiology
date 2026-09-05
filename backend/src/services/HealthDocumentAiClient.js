const axios = require('axios');
const fs = require('fs');

/**
 * HealthDocumentAiClient — proxies to the ai-service document-capture
 * endpoints (app/routers/document_ai.py). Mirrors the exact
 * AI_SERVICE_URL/axios/timeout pattern already used in
 * emrController.suggestMedications and radiologyController — see those for
 * precedent. Unlike suggestMedications, there is no local deterministic
 * fallback for OCR/vision extraction (there is no reasonable non-AI
 * substitute for reading a photo), so callers get an honest "AI unavailable"
 * result rather than a faked one — matching ai-service's own contract.
 */

function aiUrl() {
    return process.env.AI_SERVICE_URL || 'http://localhost:8000';
}

class AiUnavailableError extends Error {
    constructor(reason = 'unavailable') {
        super(`Document AI is unavailable (${reason}).`);
        this.name = 'AiUnavailableError';
        this.reason = reason;
    }
}

// Claude's vision input only accepts image/jpeg|png|gif|webp as "image"
// blocks, and application/pdf as a "document" block (see claude_vision.py).
// healthDocumentUpload.js additionally accepts HEIC/HEIF/TIFF/BMP so a
// capture is never blocked (a phone photo defaulting to HEIC is common) —
// those formats are stored and preserved like any other page, but AI
// extraction on them will fail against the real Anthropic API today (no
// format-conversion step exists in this pass). That failure is caught the
// same as any other AI outage: the document still gets created, status
// UPLOADED, ready for manual transcription — never lost, never blocked.
// Converting HEIC/TIFF/BMP to JPEG server-side before this call is the
// natural follow-up if that gap shows up in real usage.
function mimeToMediaType(mimeType) {
    return mimeType;
}

/** Reads page files from disk and base64-encodes them for a vision call.
 *  Decrypts transparently when the page was stored encrypted. */
function pagesToImages(pages) {
    const FileEncryptionService = require('./FileEncryptionService');
    return pages.map((p) => {
        const data = p.encryption
            ? FileEncryptionService.decryptToBuffer(p.absolutePath, p.encryption).toString('base64')
            : fs.readFileSync(p.absolutePath).toString('base64');
        return { mediaType: mimeToMediaType(p.mimeType), data, pageNumber: p.pageNumber };
    });
}

async function classifyDocument(pages) {
    try {
        const images = pagesToImages(pages);
        const { data } = await axios.post(`${aiUrl()}/api/ai/classify-document`, { images }, { timeout: 60000 });
        if (data && data.available === false) throw new AiUnavailableError(data.reason);
        return data;
    } catch (err) {
        if (err instanceof AiUnavailableError) throw err;
        throw new AiUnavailableError(err.message);
    }
}

async function extractDocument(pages, documentTypeHint) {
    try {
        const images = pagesToImages(pages);
        const { data } = await axios.post(
            `${aiUrl()}/api/ai/extract-document`,
            { images, documentTypeHint },
            { timeout: 120000 }
        );
        if (data && data.available === false) throw new AiUnavailableError(data.reason);
        return data;
    } catch (err) {
        if (err instanceof AiUnavailableError) throw err;
        throw new AiUnavailableError(err.message);
    }
}

async function normalizeMedicine(rawText, candidates) {
    try {
        const { data } = await axios.post(
            `${aiUrl()}/api/ai/normalize-medicine`,
            { rawText, candidates },
            { timeout: 30000 }
        );
        if (data && data.available === false) throw new AiUnavailableError(data.reason);
        return data;
    } catch (err) {
        if (err instanceof AiUnavailableError) throw err;
        throw new AiUnavailableError(err.message);
    }
}

module.exports = { classifyDocument, extractDocument, normalizeMedicine, AiUnavailableError };
