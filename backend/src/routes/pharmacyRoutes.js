const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const PharmacyOrder = require('../models/PharmacyOrder');

const isDB = () => { const m = require('mongoose'); return m.connection.readyState === 1; };

// ── GET /orders — list pharmacy orders ─────────────────────────────────────────
// Patients see only their own orders; pharmacy/admin staff see all.
router.get('/orders', protect, async (req, res, next) => {
    try {
        if (!isDB()) {
            return res.status(503).json({ success: false, message: 'Database unavailable' });
        }
        const { status, page = 1, limit = 20 } = req.query;
        const STAFF_ROLES = ['admin', 'doctor', 'nurse', 'pharmacist', 'radiologist'];
        const filter = {};
        if (!STAFF_ROLES.includes(req.user?.role)) {
            // Non-staff users may only see their own orders
            filter.patientId = req.user._id;
        }
        if (status && status !== 'all') filter.status = status.toLowerCase();

        const skip = (Number(page) - 1) * Number(limit);
        const [orders, total] = await Promise.all([
            PharmacyOrder.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('patientId', 'name')
                .populate('doctorId', 'name')
                .lean(),
            PharmacyOrder.countDocuments(filter),
        ]);

        const [pending, packed, shipped, delivered] = await Promise.all([
            PharmacyOrder.countDocuments({ status: 'pending' }),
            PharmacyOrder.countDocuments({ status: 'packed' }),
            PharmacyOrder.countDocuments({ status: 'shipped' }),
            PharmacyOrder.countDocuments({ status: 'delivered' }),
        ]);
        const revenueAgg = await PharmacyOrder.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const stats = {
            pending, packed, shipped, delivered,
            totalRevenue: revenueAgg[0]?.total ?? 0,
        };

        const data = orders.map(o => ({
            ...o,
            patientName: o.patientId?.name || o.patientName || 'Unknown',
        }));

        res.json({ success: true, data, stats, total, page: Number(page) });
    } catch (err) { next(err); }
});

// ── POST /orders — create a new pharmacy order ────────────────────────────────
router.post('/orders', protect, async (req, res, next) => {
    try {
        if (!isDB()) {
            return res.status(503).json({ success: false, message: 'Database unavailable' });
        }
        const { patientId, doctorId, prescriptionId, medicines, items, amount } = req.body;
        const order = await PharmacyOrder.create({
            patientId: patientId || req.user._id,
            doctorId: doctorId || null,
            prescriptionId: prescriptionId || null,
            medicines,
            items: items || (Array.isArray(medicines) ? medicines.length : 1),
            amount: amount || 0,
            status: 'pending',
        });
        const populated = await PharmacyOrder.findById(order._id)
            .populate('patientId', 'name')
            .populate('doctorId', 'name')
            .lean();
        res.status(201).json({ success: true, data: populated });
    } catch (err) { next(err); }
});

// ── PUT /orders/:id/status — update order status ──────────────────────────────
router.put('/orders/:id/status', protect, async (req, res, next) => {
    try {
        if (!isDB()) {
            return res.status(503).json({ success: false, message: 'Database unavailable' });
        }
        const { status } = req.body;
        const VALID = ['pending', 'packed', 'shipped', 'delivered', 'cancelled'];
        if (!VALID.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID.join(', ')}` });
        }
        const order = await PharmacyOrder.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('patientId', 'name').lean();
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, data: order });
    } catch (err) { next(err); }
});

// ── GET /stock-alerts — low stock items ───────────────────────────────────────
// Stock management requires a dedicated inventory model. Return empty until implemented.
router.get('/stock-alerts', protect, async (req, res, next) => {
    try {
        res.json({ success: true, data: [] });
    } catch (err) { next(err); }
});

// ── GET /prescriptions — recent prescriptions linked to pharmacy ───────────────
router.get('/prescriptions', protect, async (req, res, next) => {
    try {
        if (!isDB()) {
            return res.status(503).json({ success: false, message: 'Database unavailable' });
        }
        const Prescription = require('../models/Prescription');
        const rxs = await Prescription.find({ status: { $in: ['active', 'pending'] } })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('matchedCatalogEntryId', 'name')
            .lean();
        res.json({ success: true, data: rxs });
    } catch (err) { next(err); }
});

module.exports = router;
