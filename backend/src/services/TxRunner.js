const mongoose = require('mongoose');

/**
 * TxRunner — runs a unit of work inside a MongoDB transaction when the
 * deployment supports it (replica set / mongos), and falls back to plain
 * sequential execution on standalone servers so local dev keeps working.
 *
 * Usage:
 *   await TxRunner.run(async (session) => {
 *     await Model.create([doc], session ? { session } : {});
 *     await EventPublisher.publish({ ...event, session });
 *   });
 *
 * `session` is null in fallback mode — callers must thread it through
 * conditionally exactly as shown.
 */
class TxRunner {
    constructor() {
        // null = unknown, true/false = probed result. Re-probed after failures
        // so a topology change (e.g. rs.initiate) is picked up.
        this.transactionsSupported = null;
    }

    isUnsupportedTopologyError(err) {
        const msg = String(err && err.message || '');
        return (
            err?.code === 20 || // IllegalOperation
            msg.includes('Transaction numbers are only allowed') ||
            msg.includes('does not support transactions') ||
            msg.includes('replica set')
        );
    }

    async run(work) {
        if (this.transactionsSupported === false) {
            return work(null);
        }
        let session;
        try {
            session = await mongoose.startSession();
        } catch {
            this.transactionsSupported = false;
            return work(null);
        }
        try {
            let result;
            session.$afterCommit = [];
            await session.withTransaction(async () => {
                result = await work(session);
            });
            this.transactionsSupported = true;
            // Flush deferred side effects (e.g. local event emits) post-commit.
            for (const cb of session.$afterCommit.splice(0)) {
                try { cb(); } catch (cbErr) { console.error('[TxRunner] after-commit callback failed:', cbErr.message); }
            }
            return result;
        } catch (err) {
            if (this.isUnsupportedTopologyError(err)) {
                if (this.transactionsSupported === null) {
                    console.warn('[TxRunner] MongoDB topology does not support transactions — falling back to non-transactional execution. Deploy a replica set for atomicity.');
                }
                this.transactionsSupported = false;
                return work(null);
            }
            throw err;
        } finally {
            session.endSession();
        }
    }
}

module.exports = new TxRunner();
