const crypto = require('crypto');
const mongoose = require('mongoose');

/**
 * AuditLog — append-only, hash-chained audit trail.
 *
 * CHAIN DESIGN
 *   hash = sha256(prevHash + JSON.stringify({ seq, actorId, action, resource, resourceId, at }))
 *   - `at` is serialized as an ISO-8601 string, actorId/resourceId as strings
 *     (null when absent) so the payload is canonically recomputable.
 *   - The first entry (seq 1) chains from the sentinel prevHash 'GENESIS'.
 *
 * CONCURRENCY NOTE
 *   append() reads the current tail ({seq, hash}) and then inserts, so two
 *   concurrent appends can race on the same tail. The unique index on `seq`
 *   turns that race into a duplicate-key (11000) error instead of a forked
 *   chain, and append() retries once against the fresh tail. A second
 *   collision (extremely hot write path) surfaces the error to the caller —
 *   acceptable for now; revisit with a dedicated counter/transaction if audit
 *   volume ever makes retries common.
 */

const GENESIS_HASH = 'GENESIS';

const auditLogSchema = new mongoose.Schema({
    seq: { type: Number, required: true, unique: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorRole: { type: String },
    // e.g. READ | CREATE | UPDATE | DELETE | SIGN | ORDER | LOGIN
    action: { type: String, required: true, index: true },
    // e.g. EMR | Patient360 | ClinicalNote | RadiologyStudy | Billing | Consent
    resource: { type: String, required: true, index: true },
    resourceId: { type: String },
    method: { type: String },
    path: { type: String },
    statusCode: { type: Number },
    ip: { type: String },
    traceId: { type: String },
    tenantId: { type: String, default: 't-default' },
    at: { type: Date, default: Date.now, index: true },
    prevHash: { type: String, required: true },
    hash: { type: String, required: true },
});

auditLogSchema.index({ actorId: 1, at: -1 });

/** Canonical JSON payload for the hash — must only use stored, immutable fields. */
function canonicalPayload(doc) {
    return JSON.stringify({
        seq: doc.seq,
        actorId: doc.actorId != null ? String(doc.actorId) : null,
        action: doc.action,
        resource: doc.resource,
        resourceId: doc.resourceId != null ? String(doc.resourceId) : null,
        at: new Date(doc.at).toISOString(),
    });
}

/** Recompute the chain hash for a (lean or hydrated) entry. Used by append and /verify. */
auditLogSchema.statics.computeHash = function computeHash(prevHash, doc) {
    return crypto.createHash('sha256').update(prevHash + canonicalPayload(doc)).digest('hex');
};

auditLogSchema.statics.GENESIS_HASH = GENESIS_HASH;

/**
 * Append an entry to the chain.
 * entry: { actorId?, actorRole?, action, resource, resourceId?, method?, path?,
 *          statusCode?, ip?, traceId?, tenantId?, at? }
 * Returns the created document. Retries exactly once on a seq collision.
 */
auditLogSchema.statics.append = async function append(entry) {
    const attempt = async () => {
        const tail = await this.findOne().sort({ seq: -1 }).select('seq hash').lean();
        const seq = tail ? tail.seq + 1 : 1;
        const prevHash = tail ? tail.hash : GENESIS_HASH;
        const at = entry.at ? new Date(entry.at) : new Date();
        const doc = { ...entry, seq, at, prevHash };
        doc.hash = this.computeHash(prevHash, doc);
        return this.create(doc);
    };

    try {
        return await attempt();
    } catch (err) {
        // Duplicate seq: another append won the race — re-read the tail and retry once.
        if (err && err.code === 11000) return attempt();
        throw err;
    }
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
