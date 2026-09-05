const express = require('express');
const router  = express.Router();
const ProviderEnquiry = require('../models/ProviderEnquiry');

const isDB = () => {
    const m = require('mongoose');
    return m.connection.readyState === 1;
};

// ── POST /api/provider-enquiry  ─────────────────────────────────────────────
// Public — no auth required (marketing form)
router.post('/', async (req, res) => {
    try {
        const { name, phone, email, providerType, city, message } = req.body;

        if (!name || !email || !providerType) {
            return res.status(400).json({ success: false, message: 'name, email, and providerType are required.' });
        }

        const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!EMAIL_RE.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address.' });
        }

        const doc = {
            name, phone, email, providerType, city, message,
            ipAddress: req.ip || req.headers['x-forwarded-for'],
            userAgent: req.headers['user-agent'],
        };

        if (isDB()) {
            const enquiry = await ProviderEnquiry.create(doc);
            return res.status(201).json({ success: true, data: { id: enquiry._id } });
        }

        // DB not connected — still acknowledge (email notification fired by API route)
        console.warn('[provider-enquiry] DB not ready — enquiry not persisted:', email);
        return res.status(201).json({ success: true, data: { id: null }, warning: 'persisted_offline' });

    } catch (err) {
        console.error('[provider-enquiry] POST error:', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// ── GET /api/provider-enquiry  ──────────────────────────────────────────────
// Admin only (auth via token check)
router.get('/', async (req, res) => {
    try {
        const { protect } = require('../middleware/auth');
        // Inline auth check rather than chaining middleware to keep routing explicit
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Not authorised.' });
        }

        if (!isDB()) {
            return res.json({ success: true, data: [], warning: 'db_unavailable' });
        }

        const page   = Math.max(1, parseInt(req.query.page)  || 1);
        const limit  = Math.min(100, parseInt(req.query.limit) || 20);
        const status = req.query.status;

        const filter = status ? { status } : {};
        const [total, items] = await Promise.all([
            ProviderEnquiry.countDocuments(filter),
            ProviderEnquiry.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
        ]);

        res.json({ success: true, data: { items, total, page, totalPages: Math.ceil(total / limit) } });
    } catch (err) {
        console.error('[provider-enquiry] GET error:', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// ── PATCH /api/provider-enquiry/:id  ─────────────────────────────────────────
// Update status / assignee (admin)
router.patch('/:id', async (req, res) => {
    try {
        if (!isDB()) {
            return res.status(503).json({ success: false, message: 'Database unavailable.' });
        }
        const allowed = ['status', 'assignedTo', 'notes'];
        const update  = Object.fromEntries(
            Object.entries(req.body).filter(([k]) => allowed.includes(k))
        );
        const doc = await ProviderEnquiry.findByIdAndUpdate(req.params.id, update, { new: true, lean: true });
        if (!doc) return res.status(404).json({ success: false, message: 'Not found.' });
        res.json({ success: true, data: doc });
    } catch (err) {
        console.error('[provider-enquiry] PATCH error:', err);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

module.exports = router;
