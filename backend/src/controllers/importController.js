const ImportBatch = require('../models/ImportBatch');
const ImportRow = require('../models/ImportRow');
const ProviderImportService = require('../services/ProviderImportService');

function serializeBatch(b) {
    return {
        _id: String(b._id),
        fileName: b.fileName,
        sheetName: b.sheetName,
        status: b.status,
        totalRows: b.totalRows,
        stats: b.stats,
        errorSummary: b.errorSummary,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
    };
}

function serializeRow(r) {
    return {
        _id: String(r._id),
        batchId: String(r.batchId),
        rowIndex: r.rowIndex,
        rawData: r.rawData,
        normalizedData: r.normalizedData,
        validationErrors: r.validationErrors || [],
        validationWarnings: r.validationWarnings || [],
        duplicateMatches: r.duplicateMatches || [],
        status: r.status,
        reviewedByUserId: r.reviewedByUserId ? String(r.reviewedByUserId) : null,
        reviewedAt: r.reviewedAt,
        reviewNotes: r.reviewNotes,
        importedProviderId: r.importedProviderId ? String(r.importedProviderId) : null,
    };
}

function isCastError(err) {
    return err && err.name === 'CastError';
}

// POST /api/nearby/admin/import/upload  (multipart, field name "file")
exports.uploadBatch = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'A file upload (field name "file") is required.' });
        const batch = await ProviderImportService.createBatchFromBuffer({
            buffer: req.file.buffer,
            fileName: req.file.originalname,
            uploadedByUserId: req.user._id,
        });
        const rows = await ImportRow.find({ batchId: batch._id }).sort({ rowIndex: 1 }).limit(50).lean();
        res.status(201).json({ batch: serializeBatch(batch), previewRows: rows.map(serializeRow) });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// GET /api/nearby/admin/import/batches
exports.listBatches = async (req, res) => {
    try {
        const batches = await ImportBatch.find({}).sort({ createdAt: -1 }).limit(100).lean();
        res.json(batches.map(serializeBatch));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/nearby/admin/import/batches/:id
exports.getBatch = async (req, res) => {
    try {
        const batch = await ImportBatch.findById(req.params.id).lean();
        if (!batch) return res.status(404).json({ message: 'Import batch not found.' });
        res.json(serializeBatch(batch));
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Import batch not found.' });
        res.status(500).json({ message: err.message });
    }
};

// GET /api/nearby/admin/import/batches/:id/rows?status=&page=&limit=
exports.listRows = async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        const filter = { batchId: req.params.id };
        if (status) filter.status = status;
        const p = Math.max(1, Number(page) || 1);
        const l = Math.max(1, Math.min(200, Number(limit) || 50));
        const [rows, total] = await Promise.all([
            ImportRow.find(filter).sort({ rowIndex: 1 }).skip((p - 1) * l).limit(l).lean(),
            ImportRow.countDocuments(filter),
        ]);
        res.json({ rows: rows.map(serializeRow), total, page: p, limit: l });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PATCH /api/nearby/admin/import/batches/:id/rows/:rowId  { decision, editedData?, reviewNotes? }
exports.decideRow = async (req, res) => {
    try {
        const { decision, editedData, reviewNotes } = req.body;
        const row = await ProviderImportService.decideRow(req.params.id, req.params.rowId, {
            decision,
            editedData,
            reviewerUserId: req.user._id,
            reviewNotes,
        });
        res.json(serializeRow(row));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// POST /api/nearby/admin/import/batches/:id/bulk-decide  { rowIds: [], decision }
exports.bulkDecide = async (req, res) => {
    try {
        const { rowIds, decision } = req.body;
        if (!Array.isArray(rowIds) || !rowIds.length) return res.status(400).json({ message: 'rowIds must be a non-empty array.' });
        const results = await ProviderImportService.bulkDecide(req.params.id, rowIds, decision, req.user._id);
        res.json({ results });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// POST /api/nearby/admin/import/batches/:id/commit — creates real Provider
// records for every APPROVED row in the batch.
exports.commitBatch = async (req, res) => {
    try {
        const result = await ProviderImportService.commitApprovedRows(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
