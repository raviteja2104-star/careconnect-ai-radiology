const mongoose = require('mongoose');

/**
 * BillableMasterService — master-data engine behind /api/masters/billables.
 *
 * Source of truth is the in-code starter catalogue (src/data/billableCatalog.js),
 * seeded into MongoDB per-type once connected so admins can extend/edit it.
 * Reads fall back to the in-memory catalogue whenever the DB is unavailable
 * (source: 'reference'); writes are refused honestly in that case.
 *
 * Also exports PURE, unit-testable helpers (no mongoose, no I/O):
 *   parseCsv(text)                 — RFC-4180-ish CSV → rows of cells
 *   toCsv(rows, columns)           — objects → CSV text (quoted as needed)
 *   buildBulkChange(action, value) — bulk-edit action → {$set} payload or error
 *   classifyImportRow(row, index)  — import decision: create/update/skip/error
 */

function loadCatalog() {
    try {
        // eslint-disable-next-line global-require
        return require('../data/billableCatalog');
    } catch (err) {
        console.warn('[BillableMaster] Catalogue missing or invalid:', err.message);
        return { labTests: [], panels: [], imagingServices: [], consumables: [], ivdKits: [], bloodBankServices: [] };
    }
}

/* ────────────────────────── Catalogue → doc mapping ───────────────────────── */

function mapLabTest(t) {
    return {
        itemCode: t.code,
        name: t.name,
        type: 'lab_test',
        category: t.category,
        subcategory: t.subcategory,
        unit: t.unit,
        unitPrice: t.price,
        gst: t.gst,
        hsnSac: t.hsnSac,
        labExt: {
            testCode: t.code,
            specimen: t.specimen,
            container: t.container,
            tatHours: t.tatHours,
            refRange: t.refRange,
            method: t.method,
            resultType: t.resultType,
        },
    };
}

function mapPanel(p) {
    return {
        itemCode: p.code,
        name: p.name,
        type: 'panel',
        category: p.category,
        unit: 'panel',
        unitPrice: p.price,
        gst: 0,
        hsnSac: '999316',
        labExt: { memberCodes: p.memberCodes || [] },
    };
}

function mapImaging(s) {
    return {
        itemCode: s.code,
        name: s.name,
        type: 'imaging',
        category: s.modality,
        department: 'Radiology & Diagnostics',
        unit: 'study',
        unitPrice: s.price,
        gst: s.gst || 0,
        hsnSac: '999316',
    };
}

function mapConsumable(c) {
    return {
        itemCode: c.code,
        name: c.name,
        type: 'consumable',
        category: c.category,
        unit: c.unit,
        unitPrice: c.price,
        gst: c.gst,
        inventoryTracked: c.inventoryTracked !== false,
        batchTracked: c.batchTracked !== false,
        expiryTracked: c.expiryTracked !== false,
        notes: c.packSize ? `Pack size: ${c.packSize}` : undefined,
    };
}

function mapIvdKit(k) {
    return {
        itemCode: k.code,
        name: k.name,
        type: 'ivd_kit',
        category: k.category,
        manufacturer: k.manufacturer || undefined,
        unit: k.unit,
        unitPrice: k.price,
        gst: k.gst,
        inventoryTracked: true,
        batchTracked: true,
        expiryTracked: true,
        ivdExt: {
            packSize: k.packSize,
            storageTemp: k.storageTemp,
            regulatoryClass: k.regulatoryClass || undefined,
        },
    };
}

function mapBloodBank(b) {
    return {
        itemCode: b.code,
        name: b.name,
        type: 'blood_bank',
        category: 'Blood Bank & Transfusion',
        unit: 'service',
        unitPrice: b.price,
        gst: 0,
        hsnSac: '999316',
    };
}

/* ─────────────────────────────── Pure helpers ─────────────────────────────── */

/**
 * Parse CSV text into rows of string cells. Handles quoted fields containing
 * commas, escaped quotes ("") and newlines; accepts \n or \r\n line endings.
 * Blank lines are skipped. Pure — safe for unit tests.
 */
function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    const src = String(text == null ? '' : text);

    const pushCell = () => { row.push(cell); cell = ''; };
    const pushRow = () => {
        pushCell();
        // Skip rows that are entirely empty (blank line artifacts).
        if (!(row.length === 1 && row[0] === '')) rows.push(row);
        row = [];
    };

    for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        if (inQuotes) {
            if (ch === '"') {
                if (src[i + 1] === '"') { cell += '"'; i++; } // escaped quote
                else inQuotes = false;
            } else {
                cell += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            pushCell();
        } else if (ch === '\n') {
            pushRow();
        } else if (ch === '\r') {
            if (src[i + 1] === '\n') i++; // CRLF
            pushRow();
        } else {
            cell += ch;
        }
    }
    if (cell !== '' || row.length > 0) pushRow();
    return rows;
}

/** Escape a single CSV value: quote when it contains comma, quote or newline. */
function csvEscape(value) {
    const s = value == null ? '' : String(value);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Serialize row objects to CSV text (header + one line per row) using the
 * given column keys. Pure — round-trips through parseCsv.
 */
function toCsv(rows, columns) {
    const cols = Array.isArray(columns) && columns.length > 0 ? columns : [];
    const header = cols.map(csvEscape).join(',');
    const lines = (rows || []).map((r) => cols.map((c) => csvEscape(r[c])).join(','));
    return [header, ...lines].join('\n');
}

const BULK_ACTIONS = ['activate', 'deactivate', 'price', 'gst', 'category'];

/**
 * Build the $set payload for a bulk action. Returns
 * { ok: true, set: {...} } or { ok: false, message }. Pure.
 */
function buildBulkChange(action, value) {
    switch (action) {
        case 'activate':
            return { ok: true, set: { active: true } };
        case 'deactivate':
            return { ok: true, set: { active: false } };
        case 'price': {
            const n = Number(value);
            if (!Number.isFinite(n) || n < 0) return { ok: false, message: 'Bulk price requires a non-negative number.' };
            return { ok: true, set: { unitPrice: n } };
        }
        case 'gst': {
            const n = Number(value);
            if (!Number.isFinite(n) || n < 0 || n > 28) return { ok: false, message: 'Bulk GST requires a number between 0 and 28.' };
            return { ok: true, set: { gst: n } };
        }
        case 'category': {
            const v = String(value == null ? '' : value).trim();
            if (!v) return { ok: false, message: 'Bulk category requires a non-empty value.' };
            return { ok: true, set: { category: v } };
        }
        default:
            return { ok: false, message: `Unknown bulk action '${action}'. Valid: ${BULK_ACTIONS.join(', ')}.` };
    }
}

const IMPORT_TYPES = ['lab_test', 'panel', 'imaging', 'consumable', 'ivd_kit', 'blood_bank', 'service', 'medicine'];

/** Case-insensitive name+type key used for duplicate detection. */
function nameTypeKey(name, type) {
    return `${String(name || '').trim().toLowerCase()}|${String(type || '').trim()}`;
}

/**
 * Decide what to do with one parsed import row. Pure.
 *
 * @param {object} row       — { itemCode, name, type, ... }
 * @param {object} existing  — { byCode: Map<itemCode, any>, byNameType: Map<key, any> }
 * @returns {{ action: 'create'|'update'|'skip-duplicate'|'error', message?: string }}
 *
 * Rules: upsert by itemCode; a row whose name+type already exists under a
 * DIFFERENT itemCode is a duplicate and is skipped (never silently merged).
 */
function classifyImportRow(row, existing) {
    const code = String(row?.itemCode || '').trim();
    const name = String(row?.name || '').trim();
    const type = String(row?.type || '').trim();
    if (!code) return { action: 'error', message: 'Missing itemCode.' };
    if (!name) return { action: 'error', message: 'Missing name.' };
    if (!IMPORT_TYPES.includes(type)) {
        return { action: 'error', message: `Invalid type '${type}'. Valid: ${IMPORT_TYPES.join(', ')}.` };
    }
    if (existing.byCode.has(code)) return { action: 'update' };
    const clash = existing.byNameType.get(nameTypeKey(name, type));
    if (clash && String(clash.itemCode) !== code) return { action: 'skip-duplicate' };
    return { action: 'create' };
}

/* ────────────────────────────────── Service ───────────────────────────────── */

class BillableMasterService {
    constructor() {
        this._docs = null;
        this._seeding = null;
    }

    /** Memoized flat list of catalogue entries mapped to BillableItem shape. */
    catalogDocs() {
        if (this._docs) return this._docs;
        const data = loadCatalog();
        this._docs = [
            ...(data.labTests || []).map(mapLabTest),
            ...(data.panels || []).map(mapPanel),
            ...(data.imagingServices || []).map(mapImaging),
            ...(data.consumables || []).map(mapConsumable),
            ...(data.ivdKits || []).map(mapIvdKit),
            ...(data.bloodBankServices || []).map(mapBloodBank),
        ];
        return this._docs;
    }

    /**
     * Seed Mongo from the catalogue. Per-type top-up (types added after an
     * earlier seed still land); single-flight and idempotent.
     */
    async seedFromCatalog() {
        if (mongoose.connection.readyState !== 1) return false;
        if (this._seeding) return this._seeding;
        this._seeding = (async () => {
            const BillableItem = require('../models/BillableItem');
            const docs = this.catalogDocs();
            if (docs.length === 0) return false;
            const types = [...new Set(docs.map((d) => d.type))];
            let inserted = 0;
            for (const type of types) {
                const count = await BillableItem.countDocuments({ type });
                if (count > 0) continue;
                const batch = docs.filter((d) => d.type === type);
                await BillableItem.insertMany(
                    batch.map((d) => ({ ...d, active: true, source: 'seed' })),
                    { ordered: false }
                );
                inserted += batch.length;
            }
            if (inserted > 0) console.log(`[BillableMaster] Seeded ${inserted} billable items.`);
            return true;
        })().catch((err) => {
            console.warn('[BillableMaster] Seeding failed:', err.message);
            this._seeding = null; // allow retry on next call
            return false;
        });
        return this._seeding;
    }

    /**
     * DB-down read fallback over the reference catalogue. Mirrors the list
     * endpoint's filters and pagination; items get synthetic _ids.
     *
     * @returns {{ items, total, page, limit, source: 'reference' }}
     */
    inMemorySearch(type, filters = {}) {
        const { category, q, active, page = 1, limit = 20 } = filters;
        let rows = this.catalogDocs();
        if (type) rows = rows.filter((r) => r.type === type);
        if (category) rows = rows.filter((r) => (r.category || '') === category);
        // Catalogue entries are all conceptually active; active=false matches none.
        if (active === false) rows = [];
        if (q && String(q).trim()) {
            const needle = String(q).trim().toLowerCase();
            rows = rows.filter((r) =>
                [r.itemCode, r.name, r.category, r.subcategory, r.hsnSac, r.labExt?.testCode]
                    .filter(Boolean)
                    .some((h) => String(h).toLowerCase().includes(needle))
            );
        }
        const total = rows.length;
        const p = Math.max(1, Number(page) || 1);
        const l = Math.max(1, Math.min(200, Number(limit) || 20));
        const items = rows.slice((p - 1) * l, (p - 1) * l + l).map((r) => ({
            _id: `ref-${r.itemCode}`,
            active: true,
            ...r,
        }));
        return { items, total, page: p, limit: l, source: 'reference' };
    }

    /** DB-down fallback for the categories endpoint. */
    inMemoryCategories(type) {
        const counts = new Map();
        for (const r of this.catalogDocs()) {
            if (type && r.type !== type) continue;
            const c = r.category || 'Uncategorized';
            counts.set(c, (counts.get(c) || 0) + 1);
        }
        return [...counts.entries()]
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => a.category.localeCompare(b.category));
    }

    /** Boot hook: seed as soon as a DB connection opens. */
    init() {
        if (mongoose.connection.readyState === 1) {
            this.seedFromCatalog();
        } else {
            mongoose.connection.once('open', () => this.seedFromCatalog());
        }
    }
}

const service = new BillableMasterService();

module.exports = service;
// Pure, unit-testable helpers (no DB, no I/O):
module.exports.parseCsv = parseCsv;
module.exports.toCsv = toCsv;
module.exports.csvEscape = csvEscape;
module.exports.buildBulkChange = buildBulkChange;
module.exports.classifyImportRow = classifyImportRow;
module.exports.nameTypeKey = nameTypeKey;
module.exports.BULK_ACTIONS = BULK_ACTIONS;
