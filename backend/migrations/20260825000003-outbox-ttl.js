/**
 * TTL cleanup for completed outbox events (EXPAND phase — additive index).
 *
 * Outbox events that reached status 'completed' have been dispatched and are
 * only retained for observability. This partial TTL index lets MongoDB
 * expire them 7 days after `occurredAt`, keeping the outboxevents collection
 * bounded without any application-side cleanup job.
 *
 * Partial + TTL: the TTL monitor only deletes documents matched by the
 * partialFilterExpression, so pending/processing/failed events are never
 * expired regardless of age.
 *
 * Down drops the index (documents already expired are gone — TTL deletion is
 * inherently a contract-style effect, which is why the window is generous).
 */

const INDEX_NAME = 'occurredAt_ttl_completed';
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60; // 604800

module.exports = {
    async up(db) {
        await db.collection('outboxevents').createIndex(
            { occurredAt: 1 },
            {
                name: INDEX_NAME,
                expireAfterSeconds: SEVEN_DAYS_SECONDS,
                partialFilterExpression: { status: 'completed' },
            }
        );
    },

    async down(db) {
        try {
            await db.collection('outboxevents').dropIndex(INDEX_NAME);
        } catch (err) {
            // Collection or index may not exist; rollback should not fail.
            console.warn(`down: skip drop outboxevents.${INDEX_NAME}: ${err.message}`);
        }
    },
};
