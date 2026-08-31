/**
 * Baseline indexes (EXPAND phase).
 *
 * Ensures the indexes the Mongoose models rely on exist even on databases
 * where the app has not yet run autoIndex (fresh environments, restored
 * dumps). createIndex is idempotent: if the app already built an index with
 * the same key spec and options, this is a no-op.
 *
 * Collections may not exist yet (e.g. auditlogs before the first write);
 * createIndex implicitly creates the collection, which is fine.
 *
 * Down drops ONLY the indexes this migration names, guarded per-index so a
 * partially-applied state (or an index that never existed) does not abort
 * the rollback.
 */

// [collection, keys, options] — options are background-safe: since MongoDB
// 4.2 all index builds use the optimized (non-blocking) build process, so no
// `background: true` flag is needed (it is ignored by modern servers).
const INDEXES = [
    // clinicalorders — mirrors src/models/ClinicalOrder.js
    ['clinicalorders', { patientId: 1, category: 1, createdAt: -1 }, { name: 'patientId_1_category_1_createdAt_-1' }],
    ['clinicalorders', { status: 1, priority: 1 }, { name: 'status_1_priority_1' }],
    ['clinicalorders', { orderCode: 1 }, { name: 'orderCode_1', unique: true }],

    // radiologystudies — mirrors src/models/RadiologyStudy.js
    ['radiologystudies', { status: 1, priority: 1 }, { name: 'status_1_priority_1' }],
    ['radiologystudies', { assignedRadiologistId: 1, status: 1 }, { name: 'assignedRadiologistId_1_status_1' }],
    ['radiologystudies', { accessionNumber: 1 }, { name: 'accessionNumber_1', unique: true }],

    // auditlogs — hash-chained audit trail; seq must be unique.
    // Collection may not exist yet; createIndex creates it empty.
    ['auditlogs', { seq: 1 }, { name: 'seq_1', unique: true }],

    // outboxevents — dispatcher polls pending events in occurrence order.
    ['outboxevents', { status: 1, occurredAt: 1 }, { name: 'status_1_occurredAt_1' }],
];

module.exports = {
    async up(db) {
        for (const [collection, keys, options] of INDEXES) {
            await db.collection(collection).createIndex(keys, options);
        }
    },

    async down(db) {
        for (const [collection, , options] of INDEXES) {
            try {
                await db.collection(collection).dropIndex(options.name);
            } catch (err) {
                // Index or collection may not exist (never created, already
                // dropped, or created by the app with a different name).
                // Rollback should not fail on that.
                console.warn(`down: skip drop ${collection}.${options.name}: ${err.message}`);
            }
        }
    },
};
