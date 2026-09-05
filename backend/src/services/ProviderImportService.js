/**
 * ProviderImportService — orchestrates the provider import pipeline:
 *
 *   Upload → Parse & Normalize → Validate → Duplicate Detection →
 *   Review / Human Approval → Import → Verification Queue → Provider Claim → Bookable
 *
 * Everything through "Review / Human Approval" only touches ImportBatch/
 * ImportRow (staging collections) — nothing is written to the real Provider
 * collection until commitApprovedRows() runs on rows a human has explicitly
 * approved. Imported providers always land as verificationStatus: 'UNVERIFIED'
 * — the existing verify/claim endpoints (nearbyController.verifyProvider,
 * claimProvider) are the "Verification Queue" and "Provider Claim" steps;
 * "Bookable" is the existing appointmentEnabled + real schedule-connection
 * gate, unchanged by this pipeline.
 */

const ExcelImportParser = require('./ExcelImportParser');
const ProviderImportValidator = require('./ProviderImportValidator');
const ImportDuplicateDetector = require('./ImportDuplicateDetector');
const ProviderMasterResolver = require('./ProviderMasterResolver');

const MAX_ROWS_PER_BATCH = 5000;

function tally(rows) {
    return {
        valid: rows.filter((r) => r.status === 'VALID').length,
        invalid: rows.filter((r) => r.status === 'INVALID').length,
        duplicate: rows.filter((r) => r.status === 'DUPLICATE').length,
        approved: 0,
        rejected: 0,
        imported: 0,
    };
}

/** Builds the normalizedData for one row, resolving type/locality against the masters where possible. */
async function buildNormalizedRow(rawRow, headerMap) {
    const normalized = ExcelImportParser.normalizeRow(rawRow, headerMap);
    const { validate, toBool, toNumber } = ProviderImportValidator;
    const { errors: baseErrors, warnings } = validate(normalized);
    const errors = [...baseErrors];

    let providerTypeId;
    let resolvedType = normalized.type;
    if (normalized.type) {
        try {
            const t = await ProviderMasterResolver.resolveProviderType({ type: normalized.type });
            providerTypeId = t._id;
            resolvedType = t.code;
        } catch (err) {
            errors.push(err.message);
        }
    }

    let localityId;
    let resolvedLocality = normalized.locality;
    if (normalized.locality) {
        try {
            const l = await ProviderMasterResolver.resolveLocality({ locality: normalized.locality });
            localityId = l._id;
            resolvedLocality = l.name;
        } catch (err) {
            errors.push(err.message);
        }
    }

    const mapped = {
        name: normalized.name,
        type: resolvedType,
        providerTypeId,
        locality: resolvedLocality,
        localityId,
        branchName: normalized.branchName,
        address: normalized.address,
        pincode: normalized.pincode ? String(normalized.pincode).trim() : undefined,
        city: normalized.city,
        district: normalized.district,
        state: normalized.state,
        phone: normalized.phone ? String(normalized.phone).trim() : undefined,
        email: normalized.email,
        website: normalized.website,
        specialties: normalized.specialties ? String(normalized.specialties).split(',').map((s) => s.trim()).filter(Boolean) : [],
        servicesOffered: normalized.servicesOffered ? String(normalized.servicesOffered).split(',').map((s) => s.trim()).filter(Boolean) : [],
        emergencyAvailable: toBool(normalized.emergencyAvailable),
        homeCollection: toBool(normalized.homeCollection),
        teleconsultation: toBool(normalized.teleconsultation),
        consultationFee: toNumber(normalized.consultationFee),
        lat: toNumber(normalized.lat),
        lng: toNumber(normalized.lng),
        sourceLabel: normalized.sourceLabel,
        sourceUrl: normalized.sourceUrl,
        notes: normalized.notes,
    };

    return { normalized: mapped, errors, warnings };
}

async function createBatchFromBuffer({ buffer, fileName, uploadedByUserId }) {
    const ImportBatch = require('../models/ImportBatch');
    const ImportRow = require('../models/ImportRow');
    const Provider = require('../models/Provider');

    const batch = await ImportBatch.create({ fileName, uploadedByUserId, status: 'PARSING' });
    try {
        const { sheetName, headerMap, rawRows } = await ExcelImportParser.parse(buffer, fileName);
        if (rawRows.length > MAX_ROWS_PER_BATCH) {
            throw new Error(`This file has ${rawRows.length} rows; the import pipeline accepts at most ${MAX_ROWS_PER_BATCH} per batch.`);
        }

        // Pre-fetch a lean candidate set for existing-record duplicate
        // detection once, rather than per row.
        const existingCandidates = await Provider.find({ active: { $ne: false } })
            .select('name locality phone')
            .lean();

        const rowsToInsert = [];
        const seenInBatch = [];
        for (let i = 0; i < rawRows.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            const { normalized, errors, warnings } = await buildNormalizedRow(rawRows[i], headerMap);
            const { normalizedKey, normalizedPhone, matches } = ImportDuplicateDetector.detect(
                normalized,
                seenInBatch,
                existingCandidates
            );
            seenInBatch.push({ normalizedKey, phone: normalizedPhone, rowIndex: i });

            let status;
            if (errors.length) status = 'INVALID';
            else if (matches.length) status = 'DUPLICATE';
            else status = 'VALID';

            rowsToInsert.push({
                batchId: batch._id,
                rowIndex: i,
                rawData: rawRows[i],
                normalizedData: normalized,
                validationErrors: errors,
                validationWarnings: warnings,
                duplicateMatches: matches,
                status,
            });
        }

        if (rowsToInsert.length) await ImportRow.insertMany(rowsToInsert);

        batch.sheetName = sheetName;
        batch.totalRows = rowsToInsert.length;
        batch.stats = tally(rowsToInsert);
        batch.status = 'REVIEW_PENDING';
        await batch.save();
        return batch;
    } catch (err) {
        batch.status = 'FAILED';
        batch.errorSummary = err.message;
        await batch.save();
        throw err;
    }
}

async function recomputeBatchStats(batchId) {
    const ImportBatch = require('../models/ImportBatch');
    const ImportRow = require('../models/ImportRow');
    const rows = await ImportRow.find({ batchId }).select('status').lean();
    const stats = {
        valid: rows.filter((r) => r.status === 'VALID').length,
        invalid: rows.filter((r) => r.status === 'INVALID').length,
        duplicate: rows.filter((r) => r.status === 'DUPLICATE').length,
        approved: rows.filter((r) => r.status === 'APPROVED').length,
        rejected: rows.filter((r) => r.status === 'REJECTED').length,
        imported: rows.filter((r) => r.status === 'IMPORTED').length,
    };
    await ImportBatch.updateOne({ _id: batchId }, { $set: { stats } });
    return stats;
}

/** Approve or reject one staged row, optionally with human-edited field corrections. */
async function decideRow(batchId, rowId, { decision, editedData, reviewerUserId, reviewNotes }) {
    const ImportRow = require('../models/ImportRow');
    const row = await ImportRow.findOne({ _id: rowId, batchId });
    if (!row) throw new Error('Import row not found.');
    if (row.status === 'IMPORTED') throw new Error('This row has already been imported.');

    if (editedData && typeof editedData === 'object') {
        const merged = { ...row.normalizedData, ...editedData };
        // Re-resolve type/locality if the reviewer changed either.
        if (editedData.type || editedData.locality) {
            if (editedData.type) {
                const t = await ProviderMasterResolver.resolveProviderType({ type: editedData.type });
                merged.type = t.code;
                merged.providerTypeId = t._id;
            }
            if (editedData.locality) {
                const l = await ProviderMasterResolver.resolveLocality({ locality: editedData.locality });
                merged.locality = l.name;
                merged.localityId = l._id;
            }
        }
        row.normalizedData = merged;
        row.markModified('normalizedData');
    }

    if (decision === 'APPROVE') {
        if (!row.normalizedData || !row.normalizedData.providerTypeId || !row.normalizedData.localityId) {
            throw new Error('Cannot approve a row with an unresolved provider type or locality — edit it first.');
        }
        row.status = 'APPROVED';
    } else if (decision === 'REJECT') {
        row.status = 'REJECTED';
    } else {
        throw new Error("decision must be 'APPROVE' or 'REJECT'.");
    }
    row.reviewedByUserId = reviewerUserId;
    row.reviewedAt = new Date();
    if (reviewNotes != null) row.reviewNotes = reviewNotes;
    await row.save();
    await recomputeBatchStats(batchId);
    return row;
}

async function bulkDecide(batchId, rowIds, decision, reviewerUserId) {
    const results = [];
    for (const rowId of rowIds) {
        try {
            // eslint-disable-next-line no-await-in-loop
            const row = await decideRow(batchId, rowId, { decision, reviewerUserId });
            results.push({ rowId, ok: true, status: row.status });
        } catch (err) {
            results.push({ rowId, ok: false, message: err.message });
        }
    }
    return results;
}

/** Commits every APPROVED row in the batch into real Provider records. Idempotent — already-IMPORTED rows are skipped. */
async function commitApprovedRows(batchId) {
    const ImportBatch = require('../models/ImportBatch');
    const ImportRow = require('../models/ImportRow');
    const Provider = require('../models/Provider');

    const batch = await ImportBatch.findById(batchId);
    if (!batch) throw new Error('Import batch not found.');

    const approvedRows = await ImportRow.find({ batchId, status: 'APPROVED' });
    let imported = 0;
    const failures = [];
    for (const row of approvedRows) {
        try {
            const d = row.normalizedData;
            // eslint-disable-next-line no-await-in-loop
            const provider = await Provider.create({
                name: d.name,
                type: d.type,
                providerTypeId: d.providerTypeId,
                locality: d.locality,
                localityId: d.localityId,
                address: d.address,
                pincode: d.pincode,
                city: d.city || 'Visakhapatnam',
                district: d.district,
                state: d.state || 'Andhra Pradesh',
                phone: d.phone,
                email: d.email,
                website: d.website,
                specialties: d.specialties,
                servicesOffered: d.servicesOffered,
                emergencyAvailable: !!d.emergencyAvailable,
                homeCollection: !!d.homeCollection,
                teleconsultation: !!d.teleconsultation,
                consultationFeeRange: d.consultationFee != null ? { min: d.consultationFee, max: d.consultationFee } : undefined,
                geo: d.lat != null && d.lng != null ? { type: 'Point', coordinates: [d.lng, d.lat] } : undefined,
                // Always UNVERIFIED regardless of anything the source file
                // claimed — see ProviderImportValidator's sourceVerification
                // warning. Never bookable on import: appointmentEnabled stays
                // at the schema default (true) but verificationStatus gates
                // display as "unverified directory listing" everywhere the
                // frontend already checks it.
                verificationStatus: 'UNVERIFIED',
                careconnectVerified: false,
                appointmentEnabled: false,
                discovery: {
                    source: 'import',
                    sourceUrl: d.sourceUrl,
                    importedAt: new Date(),
                },
            });
            row.status = 'IMPORTED';
            row.importedProviderId = provider._id;
            // eslint-disable-next-line no-await-in-loop
            await row.save();
            imported += 1;
        } catch (err) {
            failures.push({ rowId: String(row._id), message: err.message });
        }
    }

    const stats = await recomputeBatchStats(batchId);
    const remainingRows = await ImportRow.countDocuments({ batchId, status: { $nin: ['IMPORTED', 'REJECTED'] } });
    batch.status = remainingRows === 0 ? 'IMPORTED' : 'PARTIALLY_IMPORTED';
    await batch.save();

    return { imported, failed: failures.length, failures, stats, batchStatus: batch.status };
}

module.exports = {
    MAX_ROWS_PER_BATCH,
    createBatchFromBuffer,
    decideRow,
    bulkDecide,
    commitApprovedRows,
    recomputeBatchStats,
};
