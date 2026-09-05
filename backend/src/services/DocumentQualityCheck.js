/**
 * DocumentQualityCheck — pre-OCR sanity checks on an uploaded page.
 *
 * SCOPE NOTE (read before extending): this is deliberately NOT a computer-
 * vision blur/glare/skew detector. Decoding and analyzing pixel data for
 * that (e.g. Laplacian-variance blur detection) needs an image-processing
 * library; the two lightweight candidates evaluated for this feature
 * (`sharp` — native binary, `image-size` — pure JS) were rejected: `sharp`
 * is a heavy native dependency for a single pre-check, and `image-size`
 * currently ships unpatched DoS advisories (GHSA-w3rx-r6r6-pgpr,
 * GHSA-5p2g-fcmc-qvqq) in exactly the HEIC/HEIF file types this feature
 * accepts. So real "is this photo blurry/glare/skewed" quality signals come
 * from the AI extraction step itself (Claude actually looks at the image and
 * reports it via DocumentExtraction.classification.confidenceNote /
 * overallNote) — surfaced to the reviewer, not computed here. What this
 * module DOES check, cheaply and safely (no file parsing): implausible file
 * sizes that indicate a failed/corrupt capture before it's even sent to AI.
 */

const MIN_BYTES = 5 * 1024; // below this, a photo capture is almost certainly corrupt/blank
const MAX_BYTES = 20 * 1024 * 1024; // matches healthDocumentUpload's multer limit (defense in depth)

/**
 * @param {{sizeBytes: number, mimeType: string, originalName?: string}} file
 * @returns {{warnings: string[], retakeRecommended: boolean}}
 */
function checkFile(file) {
    const warnings = [];
    if (!file || !Number.isFinite(file.sizeBytes)) {
        return { warnings: ['Could not read file size.'], retakeRecommended: true };
    }
    if (file.sizeBytes < MIN_BYTES) {
        warnings.push('This file is unusually small for a document photo — the capture may have failed. Document quality is low. Retake recommended.');
    }
    if (file.sizeBytes > MAX_BYTES) {
        warnings.push('This file exceeds the maximum allowed size.');
    }
    return { warnings, retakeRecommended: warnings.some((w) => w.includes('Retake recommended')) };
}

module.exports = { checkFile, MIN_BYTES, MAX_BYTES };
