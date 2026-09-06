const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { permit } = require('../middleware/permit');
const AuditLog = require('../models/AuditLog');

// Admin-only: the audit trail spans every tenant/actor and includes PHI paths.
router.use(protect);
router.use(authorize('admin'));
router.use(permit('ADMIN.VIEW_AUDIT_LOG'));

/**
 * GET /?page=&limit=&actorId=&resource=&action=&from=&to=
 * Paginated audit entries, newest first.
 */
router.get('/', async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 200);

        const query = {};
        if (req.query.actorId) query.actorId = req.query.actorId;
        if (req.query.resource) query.resource = req.query.resource;
        if (req.query.action) query.action = req.query.action;
        if (req.query.from || req.query.to) {
            query.at = {};
            if (req.query.from) {
                const from = new Date(req.query.from);
                if (!Number.isNaN(from.getTime())) query.at.$gte = from;
            }
            if (req.query.to) {
                const to = new Date(req.query.to);
                if (!Number.isNaN(to.getTime())) query.at.$lte = to;
            }
            if (Object.keys(query.at).length === 0) delete query.at;
        }

        const [items, total] = await Promise.all([
            AuditLog.find(query)
                .sort({ seq: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('actorId', 'firstName lastName email role')
                .lean(),
            AuditLog.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: items,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit) || 1,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /verify — walk the whole chain in seq order recomputing every hash.
 * Returns { valid, checkedCount, firstBrokenSeq } where firstBrokenSeq is the
 * first entry whose prevHash linkage or recomputed hash does not match.
 */
router.get('/verify', async (req, res) => {
    try {
        let prevHash = AuditLog.GENESIS_HASH;
        let expectedSeq = 1;
        let checkedCount = 0;
        let firstBrokenSeq = null;

        const cursor = AuditLog.find()
            .sort({ seq: 1 })
            .select('seq actorId action resource resourceId at prevHash hash')
            .lean()
            .cursor();

        for await (const doc of cursor) {
            const recomputed = AuditLog.computeHash(prevHash, doc);
            if (doc.seq !== expectedSeq || doc.prevHash !== prevHash || doc.hash !== recomputed) {
                firstBrokenSeq = doc.seq;
                break;
            }
            checkedCount += 1;
            expectedSeq += 1;
            prevHash = doc.hash;
        }

        res.json({
            success: true,
            valid: firstBrokenSeq === null,
            checkedCount,
            firstBrokenSeq,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
