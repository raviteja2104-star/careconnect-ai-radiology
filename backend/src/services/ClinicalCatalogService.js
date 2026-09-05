const mongoose = require('mongoose');

/**
 * ClinicalCatalogService — typeahead suggestions for medications, complaints,
 * diagnoses (ICD-10) and lab tests.
 *
 * Source of truth is the in-code dataset (src/data/clinicalCatalog.js), which
 * is seeded into MongoDB once connected so admins can extend it later. Search
 * prefers the database (includes admin-added entries) and falls back to the
 * in-memory dataset whenever the DB is unavailable — suggestions must work in
 * demo mode too.
 */

function loadDataset() {
    try {
        // eslint-disable-next-line global-require
        return require('../data/clinicalCatalog');
    } catch (err) {
        console.warn('[ClinicalCatalog] Dataset missing or invalid — suggestions limited:', err.message);
        return { medications: [], complaints: [], diagnoses: [], labTests: [], durations: [], instructions: [] };
    }
}

class ClinicalCatalogService {
    constructor() {
        this._flat = null;
        this._seeding = null;
    }

    /** Flattened, memoized entry list: {kind, label, code, meta}. */
    entries() {
        if (this._flat) return this._flat;
        const data = loadDataset();
        this._flat = [
            ...data.medications.map((m) => ({
                kind: 'medication',
                label: m.name,
                code: undefined,
                meta: { generic: m.generic, brand: m.brand, strength: m.strength, form: m.form },
            })),
            ...data.complaints.map((c) => ({ kind: 'complaint', label: c, code: undefined, meta: undefined })),
            ...data.diagnoses.map((d) => ({ kind: 'diagnosis', label: d.term, code: d.code, meta: undefined })),
            ...data.labTests.map((t) => ({ kind: 'lab_test', label: t.name, code: t.code, meta: undefined })),
            ...(data.durations || []).map((d) => ({ kind: 'duration', label: d, code: undefined, meta: undefined })),
            ...(data.instructions || []).map((i) => ({ kind: 'instruction', label: i, code: undefined, meta: undefined })),
        ];
        return this._flat;
    }

    /** Seed Mongo once per empty collection; single-flight and idempotent. */
    async ensureSeeded() {
        if (mongoose.connection.readyState !== 1) return false;
        if (this._seeding) return this._seeding;
        this._seeding = (async () => {
            const CatalogEntry = require('../models/CatalogEntry');
            const docs = this.entries();
            if (docs.length === 0) return false;
            // Per-kind top-up: kinds added after an earlier seed still land.
            const kinds = [...new Set(docs.map((d) => d.kind))];
            let inserted = 0;
            for (const kind of kinds) {
                const count = await CatalogEntry.countDocuments({ kind });
                if (count > 0) continue;
                const batch = docs.filter((d) => d.kind === kind);
                await CatalogEntry.insertMany(batch.map((d) => ({ ...d, source: 'seed' })), { ordered: false });
                inserted += batch.length;
            }
            if (inserted > 0) console.log(`[ClinicalCatalog] Seeded ${inserted} catalog entries.`);
            return true;
        })().catch((err) => {
            console.warn('[ClinicalCatalog] Seeding failed:', err.message);
            this._seeding = null; // allow retry on next search
            return false;
        });
        return this._seeding;
    }

    /** Rank helper: prefix matches first, then substring; shorter labels first. */
    _rank(items, q, limit) {
        const needle = q.toLowerCase();
        const scored = [];
        for (const item of items) {
            const hay = [item.label, item.code, item.meta?.generic, item.meta?.brand]
                .filter(Boolean)
                .map((s) => String(s).toLowerCase());
            let score = -1;
            for (const h of hay) {
                if (h.startsWith(needle)) { score = 0; break; }
                const wordStart = h.includes(' ' + needle);
                if (wordStart && score !== 0) score = 1;
                else if (h.includes(needle) && score < 0) score = 2;
            }
            if (score >= 0) scored.push({ item, score, len: item.label.length });
        }
        scored.sort((a, b) => a.score - b.score || a.len - b.len || a.item.label.localeCompare(b.item.label));
        return scored.slice(0, limit).map((s) => s.item);
    }

    /**
     * Search suggestions. DB-backed when connected (admin-added entries
     * included), in-memory otherwise. Never throws.
     */
    async search(kind, q, limit = 12) {
        const query = String(q || '').trim();
        if (!query) return [];
        const inMemory = () => this._rank(this.entries().filter((e) => e.kind === kind), query, limit);

        if (mongoose.connection.readyState !== 1) return inMemory();
        try {
            await this.ensureSeeded();
            const CatalogEntry = require('../models/CatalogEntry');
            const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const rx = new RegExp(escaped, 'i');
            const docs = await CatalogEntry.find({
                kind,
                $or: [{ label: rx }, { code: rx }, { 'meta.generic': rx }, { 'meta.brand': rx }],
            })
                .limit(60)
                .lean();
            if (docs.length === 0) return inMemory(); // kind not in DB yet
            return this._rank(
                docs.map((d) => ({ kind: d.kind, label: d.label, code: d.code, meta: d.meta })),
                query,
                limit
            );
        } catch (err) {
            console.warn('[ClinicalCatalog] DB search failed, using in-memory:', err.message);
            return inMemory();
        }
    }

    /** Boot hook: seed as soon as a DB connection opens. */
    init() {
        if (mongoose.connection.readyState === 1) {
            this.ensureSeeded();
        } else {
            mongoose.connection.once('open', () => this.ensureSeeded());
        }
    }
}

module.exports = new ClinicalCatalogService();
