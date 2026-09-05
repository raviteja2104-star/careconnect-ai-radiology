const mongoose = require('mongoose');
const BillableItem = require('../models/BillableItem');
const BillableMasterService = require('../services/BillableMasterService');
const { parseCsv, toCsv, buildBulkChange, classifyImportRow, nameTypeKey } = BillableMasterService;

/**
 * billableController — admin master-data CRUD for billable items
 * (lab tests, panels, imaging, consumables, IVD kits, blood bank, ...).
 *
 * Response contract matches web-portal/src/app/admin/billables/_lib/api.ts:
 *   GET    /                → { items, total, page, limit, source }        (raw page object)
 *   GET    /categories      → { categories: [{ category, count }] }
 *   POST   /                → created item (raw doc JSON, 201; 409 on dup itemCode)
 *   PUT    /:id             → updated item (raw doc JSON)
 *   DELETE /:id             → { ok: true }                                  (soft deactivate)
 *   POST   /bulk            → { modified }
 *   POST   /import          → { created, updated, skippedDuplicates, errors }
 *   GET    /export          → text/csv
 *
 * DB down: reads fall back to the reference catalogue (source: 'reference');
 * writes return 503 with an honest message. Error bodies carry { message }.
 */

const isDb = () => mongoose.connection.readyState === 1;

const WRITE_UNAVAILABLE =
    'Database unavailable — billable master-data changes cannot be saved right now. ' +
    'Reads are being served from the built-in reference catalogue.';

/** Fields an admin may set through create/update (everything else is managed). */
const EDITABLE_FIELDS = [
    'itemCode', 'name', 'type', 'category', 'subcategory', 'department', 'unit',
    'unitPrice', 'gst', 'hsnSac', 'barcode', 'manufacturer', 'brand',
    'catalogueNumber', 'active', 'inventoryTracked', 'batchTracked',
    'expiryTracked', 'location', 'notes', 'labExt', 'ivdExt',
];

const EXPORT_COLUMNS = [
    'itemCode', 'name', 'type', 'category', 'subcategory', 'department',
    'unit', 'unitPrice', 'gst', 'hsnSac', 'active',
];

const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const actorOf = (req) => (req.user && (req.user.email || String(req.user._id))) || 'unknown';

function pickEditable(body) {
    const out = {};
    for (const f of EDITABLE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(body || {}, f)) out[f] = body[f];
    }
    return out;
}

function parseListQuery(query) {
    const { type, category, q } = query;
    const active =
        query.active === 'true' ? true : query.active === 'false' ? false : undefined;
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(200, parseInt(query.limit, 10) || 20));
    return { type, category, q, active, page, limit };
}

/* ────────────────────────────────── Reads ─────────────────────────────────── */

// GET /api/masters/billables
exports.list = async (req, res) => {
    const { type, category, q, active, page, limit } = parseListQuery(req.query);
    const fallback = () =>
        res.json(BillableMasterService.inMemorySearch(type, { category, q, active, page, limit }));

    if (!isDb()) return fallback();
    try {
        await BillableMasterService.seedFromCatalog();
        const filter = {};
        if (type) filter.type = type;
        if (category) filter.category = category;
        if (typeof active === 'boolean') filter.active = active;
        if (q && q.trim()) {
            const rx = new RegExp(escapeRegExp(q.trim()), 'i');
            filter.$or = [
                { itemCode: rx }, { name: rx }, { category: rx },
                { subcategory: rx }, { hsnSac: rx }, { 'labExt.testCode': rx },
            ];
        }
        const [items, total] = await Promise.all([
            BillableItem.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
            BillableItem.countDocuments(filter),
        ]);
        return res.json({ items, total, page, limit, source: 'db' });
    } catch (err) {
        console.warn('[Billables] list failed, using reference catalogue:', err.message);
        return fallback();
    }
};

// GET /api/masters/billables/categories
exports.categories = async (req, res) => {
    const { type } = req.query;
    const fallback = () =>
        res.json({ categories: BillableMasterService.inMemoryCategories(type) });

    if (!isDb()) return fallback();
    try {
        await BillableMasterService.seedFromCatalog();
        const match = type ? { type } : {};
        const rows = await BillableItem.aggregate([
            { $match: match },
            { $group: { _id: { $ifNull: ['$category', 'Uncategorized'] }, count: { $sum: 1 } } },
            { $project: { _id: 0, category: '$_id', count: 1 } },
            { $sort: { category: 1 } },
        ]);
        return res.json({ categories: rows });
    } catch (err) {
        console.warn('[Billables] categories failed, using reference catalogue:', err.message);
        return fallback();
    }
};

// GET /api/masters/billables/export?type=
exports.exportCsv = async (req, res) => {
    const { type } = req.query;
    try {
        let rows;
        if (isDb()) {
            await BillableMasterService.seedFromCatalog();
            rows = await BillableItem.find(type ? { type } : {}).sort({ type: 1, name: 1 }).lean();
        } else {
            rows = BillableMasterService.inMemorySearch(type, { page: 1, limit: 100000 }).items;
        }
        const csv = toCsv(rows, EXPORT_COLUMNS);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="billables${type ? '-' + type : ''}.csv"`);
        return res.send(csv);
    } catch (err) {
        return res.status(500).json({ message: `Export failed: ${err.message}` });
    }
};

/* ────────────────────────────────── Writes ────────────────────────────────── */

// POST /api/masters/billables
exports.create = async (req, res) => {
    if (!isDb()) return res.status(503).json({ message: WRITE_UNAVAILABLE });
    try {
        const body = pickEditable(req.body);
        if (!body.itemCode || !body.name || !body.type) {
            return res.status(400).json({ message: 'itemCode, name and type are required.' });
        }
        body.itemCode = String(body.itemCode).trim();
        const existing = await BillableItem.findOne({ itemCode: body.itemCode }).lean();
        if (existing) {
            return res.status(409).json({ message: `Item code '${body.itemCode}' already exists.` });
        }
        const doc = await BillableItem.create({
            ...body,
            source: 'manual',
            history: [{ at: new Date(), by: actorOf(req), action: 'create', changes: undefined }],
        });
        return res.status(201).json(doc);
    } catch (err) {
        if (err && err.code === 11000) {
            return res.status(409).json({ message: 'Duplicate item code.' });
        }
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        return res.status(500).json({ message: `Create failed: ${err.message}` });
    }
};

// PUT /api/masters/billables/:id
exports.update = async (req, res) => {
    if (!isDb()) return res.status(503).json({ message: WRITE_UNAVAILABLE });
    try {
        const doc = await BillableItem.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Billable item not found.' });

        const patch = pickEditable(req.body);
        const changes = {};
        for (const [key, value] of Object.entries(patch)) {
            const before = doc.get(key);
            const beforeCmp = before && before.toObject ? before.toObject() : before;
            if (JSON.stringify(beforeCmp) !== JSON.stringify(value)) {
                changes[key] = { from: beforeCmp === undefined ? null : beforeCmp, to: value };
            }
            doc.set(key, value);
        }
        doc.history.push({ at: new Date(), by: actorOf(req), action: 'update', changes });
        await doc.save();
        return res.json(doc);
    } catch (err) {
        if (err && err.code === 11000) {
            return res.status(409).json({ message: 'Duplicate item code.' });
        }
        if (err && (err.name === 'ValidationError' || err.name === 'CastError')) {
            return res.status(400).json({ message: err.message });
        }
        return res.status(500).json({ message: `Update failed: ${err.message}` });
    }
};

// DELETE /api/masters/billables/:id — soft deactivate, never hard-delete.
exports.remove = async (req, res) => {
    if (!isDb()) return res.status(503).json({ message: WRITE_UNAVAILABLE });
    try {
        const doc = await BillableItem.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Billable item not found.' });
        doc.active = false;
        doc.history.push({
            at: new Date(), by: actorOf(req), action: 'deactivate',
            changes: { active: { from: true, to: false } },
        });
        await doc.save();
        return res.json({ ok: true });
    } catch (err) {
        if (err && err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid item id.' });
        }
        return res.status(500).json({ message: `Deactivate failed: ${err.message}` });
    }
};

// POST /api/masters/billables/bulk  { ids, action, value } → { modified }
exports.bulk = async (req, res) => {
    if (!isDb()) return res.status(503).json({ message: WRITE_UNAVAILABLE });
    try {
        const { ids, action, value } = req.body || {};
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'ids must be a non-empty array.' });
        }
        const change = buildBulkChange(action, value);
        if (!change.ok) return res.status(400).json({ message: change.message });

        const result = await BillableItem.updateMany(
            { _id: { $in: ids } },
            {
                $set: change.set,
                $push: {
                    history: {
                        at: new Date(), by: actorOf(req),
                        action: `bulk-${action}`, changes: change.set,
                    },
                },
            }
        );
        return res.json({ modified: result.modifiedCount || 0 });
    } catch (err) {
        return res.status(500).json({ message: `Bulk update failed: ${err.message}` });
    }
};

/* ────────────────────────────────── Import ────────────────────────────────── */

const BOOL_TRUE = new Set(['true', '1', 'yes', 'y']);

function coerceImportValue(field, raw) {
    const s = String(raw == null ? '' : raw).trim();
    if (s === '') return undefined;
    if (field === 'unitPrice' || field === 'gst') {
        const n = Number(s);
        return Number.isFinite(n) ? n : undefined;
    }
    if (field === 'active' || field === 'inventoryTracked' || field === 'batchTracked' || field === 'expiryTracked') {
        return BOOL_TRUE.has(s.toLowerCase());
    }
    return s;
}

// POST /api/masters/billables/import  { csv } → { created, updated, skippedDuplicates, errors }
exports.importCsv = async (req, res) => {
    if (!isDb()) return res.status(503).json({ message: WRITE_UNAVAILABLE });
    try {
        const csv = req.body && req.body.csv;
        if (!csv || typeof csv !== 'string') {
            return res.status(400).json({ message: 'Request body must include a csv string.' });
        }
        const rows = parseCsv(csv);
        if (rows.length < 2) {
            return res.status(400).json({ message: 'CSV must include a header row and at least one data row.' });
        }
        const header = rows[0].map((h) => String(h).trim());
        for (const required of ['itemCode', 'name', 'type']) {
            if (!header.includes(required)) {
                return res.status(400).json({ message: `CSV header must include '${required}'.` });
            }
        }

        // Existing index for upsert / duplicate decisions (kept updated as we go
        // so duplicates within the same file are also caught).
        const existingDocs = await BillableItem.find({}, 'itemCode name type').lean();
        const byCode = new Map(existingDocs.map((d) => [d.itemCode, d]));
        const byNameType = new Map(existingDocs.map((d) => [nameTypeKey(d.name, d.type), d]));

        const result = { created: 0, updated: 0, skippedDuplicates: 0, errors: [] };

        for (let i = 1; i < rows.length; i++) {
            const line = i + 1; // 1-based, counting the header
            const cells = rows[i];
            const row = {};
            header.forEach((col, idx) => {
                if (!col) return;
                const v = coerceImportValue(col, cells[idx]);
                if (v !== undefined) row[col] = v;
            });

            const decision = classifyImportRow(row, { byCode, byNameType });
            if (decision.action === 'error') {
                result.errors.push({ line, message: decision.message });
                continue;
            }
            if (decision.action === 'skip-duplicate') {
                result.skippedDuplicates += 1;
                continue;
            }

            const fields = pickEditable(row);
            try {
                if (decision.action === 'update') {
                    await BillableItem.updateOne(
                        { itemCode: row.itemCode },
                        {
                            $set: fields,
                            $push: {
                                history: {
                                    at: new Date(), by: actorOf(req),
                                    action: 'import-update', changes: fields,
                                },
                            },
                        }
                    );
                    result.updated += 1;
                } else {
                    await BillableItem.create({
                        ...fields,
                        source: 'import',
                        history: [{ at: new Date(), by: actorOf(req), action: 'import-create', changes: undefined }],
                    });
                    result.created += 1;
                    const stub = { itemCode: row.itemCode, name: row.name, type: row.type };
                    byCode.set(row.itemCode, stub);
                    byNameType.set(nameTypeKey(row.name, row.type), stub);
                }
            } catch (err) {
                result.errors.push({ line, message: err.message });
            }
        }
        return res.json(result);
    } catch (err) {
        return res.status(500).json({ message: `Import failed: ${err.message}` });
    }
};
