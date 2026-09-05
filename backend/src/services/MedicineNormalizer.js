/**
 * MedicineNormalizer — suggests (never confirms) a match between an
 * AI-extracted/handwritten medicine string and CareConnect's own medicine
 * master (CatalogEntry, kind:'medication'). Per the feature's explicit rule:
 * "Do not automatically prescribe or recommend medicines based only on
 * OCR" — this always returns a shortlist for a human to pick from, never a
 * single auto-selected answer. Prescription.medications[].matchedCatalogEntryId
 * is only ever set by a human's explicit choice from this shortlist (or a
 * manual catalog search), never by this module directly.
 */

function normalize(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Cheap local candidate search — substring/prefix match against the label. Always runs first; free, no AI call. */
async function localCandidates(rawText, limit = 8) {
    const CatalogEntry = require('../models/CatalogEntry');
    const needle = normalize(rawText).slice(0, 6); // first few chars are usually the most reliable OCR signal
    if (!needle) return [];
    const escaped = String(rawText).trim().split(/\s+/)[0]?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || '';
    if (!escaped) return [];
    const rx = new RegExp(escaped, 'i');
    const rows = await CatalogEntry.find({ kind: 'medication', label: rx }).limit(limit).lean();
    return rows.map((r) => ({
        catalogEntryId: String(r._id),
        label: r.label,
        generic: r.meta?.generic,
        brand: r.meta?.brand,
        strength: r.meta?.strength,
        form: r.meta?.form,
    }));
}

/**
 * Full suggestion pass: local candidates first; if inconclusive (0 or many
 * ambiguous matches) AND the AI service is reachable, ask it to interpret
 * the raw text and rank the local candidates — still just a suggestion.
 * @returns {{interpretation: string|null, confidenceLevel: string|null, note: string, candidates: Array}}
 */
async function suggest(rawText) {
    const candidates = await localCandidates(rawText);
    if (candidates.length === 1) {
        return {
            interpretation: candidates[0].label,
            confidenceLevel: 'MEDIUM',
            note: 'Single local catalog match by name prefix — confirm before accepting.',
            candidates,
        };
    }

    try {
        const HealthDocumentAiClient = require('./HealthDocumentAiClient');
        const ai = await HealthDocumentAiClient.normalizeMedicine(rawText, candidates);
        const ranked = (ai.suggestedCandidateLabels || [])
            .map((label) => candidates.find((c) => c.label === label))
            .filter(Boolean);
        const rest = candidates.filter((c) => !ranked.includes(c));
        return {
            interpretation: ai.interpretation || null,
            confidenceLevel: ai.confidenceLevel || null,
            note: ai.note || '',
            candidates: [...ranked, ...rest],
        };
    } catch {
        // AI unavailable — local candidates (however many) are still useful,
        // just without an AI-ranked interpretation on top.
        return {
            interpretation: null,
            confidenceLevel: null,
            note: candidates.length
                ? 'AI normalization unavailable — showing local catalog matches by name only.'
                : 'AI normalization unavailable and no local catalog match found. Search the medicine master manually.',
            candidates,
        };
    }
}

module.exports = { suggest, localCandidates };
