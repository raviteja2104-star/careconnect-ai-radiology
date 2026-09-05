/**
 * ImportDuplicateDetector — flags candidate duplicates for one normalized
 * import row, checked against (a) existing live Provider records and (b)
 * other rows already staged earlier in the same batch. Never merges
 * anything automatically — every match is surfaced for a human reviewer to
 * accept or dismiss (see docs/nearby-data-master-plan.md §2, "do not
 * blindly merge records").
 *
 * Matching is intentionally simple and explainable (exact match on
 * normalized name+locality, or exact phone) rather than fuzzy, because a
 * silent fuzzy false-positive is worse than a reviewer seeing one extra
 * candidate — matches this same 3-part signal (normalized name+locality,
 * phone) as the original data-quality analysis in docs/nearby-data-master-plan.md.
 */

function normalize(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * @param {object} normalizedRow — the row being checked (name, locality, phone)
 * @param {Array<{normalizedKey: string, phone?: string, rowIndex: number}>} seenInBatch — earlier rows in this same batch
 * @param {Array<{_id, name, locality, phone}>} existingCandidates — live Provider docs to compare against (pre-fetched, lean)
 * @returns {{normalizedKey: string, matches: Array}}
 */
function detect(normalizedRow, seenInBatch, existingCandidates) {
    const normalizedKey = `${normalize(normalizedRow.name)}::${normalize(normalizedRow.locality)}`;
    const normalizedPhone = normalizedRow.phone ? String(normalizedRow.phone).replace(/\D/g, '') : null;
    const matches = [];

    for (const existing of existingCandidates || []) {
        const existingKey = `${normalize(existing.name)}::${normalize(existing.locality)}`;
        if (normalizedKey && existingKey === normalizedKey) {
            matches.push({ matchType: 'existing_name_locality', providerId: existing._id, providerName: existing.name });
        } else if (normalizedPhone && existing.phone && String(existing.phone).replace(/\D/g, '') === normalizedPhone) {
            matches.push({ matchType: 'existing_phone', providerId: existing._id, providerName: existing.name });
        }
    }

    for (const seen of seenInBatch || []) {
        if (normalizedKey && seen.normalizedKey === normalizedKey) {
            matches.push({ matchType: 'batch_duplicate', matchedRowIndex: seen.rowIndex });
        } else if (normalizedPhone && seen.phone && seen.phone === normalizedPhone) {
            matches.push({ matchType: 'batch_duplicate', matchedRowIndex: seen.rowIndex });
        }
    }

    return { normalizedKey, normalizedPhone, matches };
}

module.exports = { detect, normalize };
