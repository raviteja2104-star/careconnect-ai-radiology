const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');
const PharmacyOrder = require('../models/PharmacyOrder');
const audit = require('../middleware/audit');

const isDB = () => { const m = require('mongoose'); return m.connection.readyState === 1; };

router.use(protect);
router.use(audit('Pharmacy'));

// ── GET /orders — list pharmacy orders ───────────────────────────────────────
// Patients see only their own orders; pharmacy/admin staff see all.
router.get('/orders', async (req, res, next) => {
    try {
        if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable' });

        const { status, page = 1, limit = 20 } = req.query;
        const filter = {};

        // Scope: patients see only own orders; staff with STAFF.PHARMACY or STAFF.VIEW_PRESCRIPTIONS see all
        const { userHasPermissions } = require('../services/PermissionService');
        const isStaff = await userHasPermissions(req.user._id, ['STAFF.PHARMACY'])
            .catch(() => false)
            || await userHasPermissions(req.user._id, ['STAFF.VIEW_PRESCRIPTIONS']).catch(() => false);

        if (!isStaff) {
            filter.patientId = req.user._id;
        }
        if (status && status !== 'all') filter.status = status.toLowerCase();

        const skip = (Number(page) - 1) * Number(limit);
        const [orders, total] = await Promise.all([
            PharmacyOrder.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('patientId', 'firstName lastName')
                .populate('doctorId', 'firstName lastName')
                .lean(),
            PharmacyOrder.countDocuments(filter),
        ]);

        const [pending, packed, shipped, delivered] = await Promise.all([
            PharmacyOrder.countDocuments({ status: 'pending' }),
            PharmacyOrder.countDocuments({ status: 'packed' }),
            PharmacyOrder.countDocuments({ status: 'shipped' }),
            PharmacyOrder.countDocuments({ status: 'delivered' }),
        ]);
        const revenueAgg = await PharmacyOrder.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);

        const stats = { pending, packed, shipped, delivered, totalRevenue: revenueAgg[0]?.total ?? 0 };
        res.json({ success: true, data: orders.map(o => ({ ...o, patientName: [o.patientId?.firstName, o.patientId?.lastName].filter(Boolean).join(' ') || o.patientName || 'Unknown' })), stats, total, page: Number(page) });
    } catch (err) { next(err); }
});

// ── POST /orders — create a new pharmacy order ────────────────────────────────
router.post(
    '/orders',
    permitAny('DOCTOR.CREATE_PRESCRIPTION', 'STAFF.PHARMACY', 'STAFF.DISPENSE_MEDICATION'),
    async (req, res, next) => {
        try {
            if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable' });

            const { patientId, patientName, patientPhone, doctorId, prescriptionId, medicines, items, amount, orderId } = req.body;
            let resolvedPatientName = patientName;
            let resolvedPatientPhone = patientPhone;
            if ((!resolvedPatientName || !resolvedPatientPhone) && patientId) {
                const User = require('../models/User');
                const patient = await User.findById(patientId).select('firstName lastName phone fullName').lean();
                if (patient) {
                    resolvedPatientName = resolvedPatientName || patient.fullName || `${patient.firstName} ${patient.lastName}`.trim();
                    resolvedPatientPhone = resolvedPatientPhone || patient.phone || '';
                }
            }
            const order = await PharmacyOrder.create({
                orderId: orderId || `RX-${Date.now()}`,
                patientId: patientId || req.user._id,
                patientName: resolvedPatientName || 'Unknown Patient',
                patientPhone: resolvedPatientPhone || '',
                doctorId: doctorId || null,
                prescriptionId: prescriptionId || null,
                medicines,
                items: items || (Array.isArray(medicines) ? medicines.length : 1),
                amount: amount || 0,
                status: 'pending',
            });
            const populated = await PharmacyOrder.findById(order._id)
                .populate('patientId', 'firstName lastName').populate('doctorId', 'firstName lastName').lean();
            res.status(201).json({ success: true, data: populated });
        } catch (err) { next(err); }
    }
);

// ── PUT /orders/:id/status — update order status ──────────────────────────────
router.put(
    '/orders/:id/status',
    permitAny('STAFF.PHARMACY', 'STAFF.DISPENSE_MEDICATION'),
    async (req, res, next) => {
        try {
            if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable' });
            const { status } = req.body;
            const VALID = ['pending', 'packed', 'shipped', 'delivered', 'cancelled'];
            if (!VALID.includes(status)) {
                return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID.join(', ')}` });
            }
            const order = await PharmacyOrder.findByIdAndUpdate(req.params.id, { status }, { new: true })
                .populate('patientId', 'firstName lastName').lean();
            if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
            res.json({ success: true, data: order });
        } catch (err) { next(err); }
    }
);

// ── GET /stock-alerts ─────────────────────────────────────────────────────────
router.get('/stock-alerts', permit('STAFF.PHARMACY'), async (req, res, next) => {
    try { res.json({ success: true, data: [] }); } catch (err) { next(err); }
});

// ── GET /prescriptions ────────────────────────────────────────────────────────
router.get(
    '/prescriptions',
    permitAny('STAFF.VIEW_PRESCRIPTIONS', 'STAFF.PHARMACY'),
    async (req, res, next) => {
        try {
            if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable' });
            const Prescription = require('../models/Prescription');
            const rxs = await Prescription.find({ status: { $in: ['active', 'pending'] } })
                .sort({ createdAt: -1 }).limit(20)
                .populate({ path: 'matchedCatalogEntryId', select: 'name', strictPopulate: false }).lean();
            res.json({ success: true, data: rxs });
        } catch (err) { next(err); }
    }
);

// ── GET /queue ────────────────────────────────────────────────────────────────
router.get('/queue', permitAny('STAFF.PHARMACY', 'STAFF.VIEW_PRESCRIPTIONS'), async (req, res, next) => {
    try {
        if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable.' });
        const orders = await PharmacyOrder.find({ status: { $nin: ['Cancelled', 'cancelled'] } })
            .sort({ createdAt: -1 }).limit(50)
            .populate('patientId', 'firstName lastName fullName name')
            .populate('doctorId', 'firstName lastName fullName name')
            .lean().catch(() => []);

        // Map DB statuses → frontend-expected statuses and shape items array
        const STATUS_MAP = {
            new: 'Verification', pending: 'Verification',
            packing: 'Ready', ready: 'Ready',
            out_for_delivery: 'Dispensed', delivered: 'Dispensed',
            Verification: 'Verification', Ready: 'Ready', Dispensed: 'Dispensed',
        };
        const mapped = orders.map(o => {
            const items = (o.medicines || []).map(m => {
                const hit = m.match(/^(.+?)\s*[×x]\s*(\d+)/);
                return hit
                    ? { name: hit[1].trim(), strength: '', quantity: parseInt(hit[2], 10), unit: 'tablet' }
                    : { name: m, strength: '', quantity: 1, unit: 'unit' };
            });
            const pat = o.patientId;
            const doc = o.doctorId;
            return {
                orderId: o.orderId,
                patientName: pat ? (pat.fullName || pat.name || `${pat.firstName} ${pat.lastName}`.trim()) : (o.patientName || 'Unknown'),
                doctorName: doc ? (doc.fullName || doc.name || `${doc.firstName} ${doc.lastName}`.trim()) : (o.doctorName || ''),
                createdAt: o.createdAt,
                status: STATUS_MAP[o.status] || 'Verification',
                items: items.length ? items : [{ name: 'Item 1', strength: '', quantity: 1, unit: 'unit' }],
                aiFlag: o.aiFlag || false,
                aiMsg: o.aiMsg || undefined,
            };
        });
        res.json({ success: true, data: mapped });
    } catch (err) { next(err); }
});

// ── GET /inventory ────────────────────────────────────────────────────────────
router.get('/inventory', permit('STAFF.PHARMACY'), async (req, res, next) => {
    try {
        if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable.' });
        res.json({ success: true, data: [] });
    } catch (err) { next(err); }
});

// ── GET /stats ────────────────────────────────────────────────────────────────
router.get(
    '/stats',
    permitAny('STAFF.PHARMACY', 'STAFF.VIEW_PRESCRIPTIONS', 'BILLING.VIEW_REVENUE'),
    async (req, res, next) => {
        try {
            if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable.' });
            const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
            const [todayRx, pendingDispense, aiAlerts] = await Promise.all([
                PharmacyOrder.countDocuments({ createdAt: { $gte: todayStart } }).catch(() => 0),
                PharmacyOrder.countDocuments({ status: { $in: ['Verification', 'Ready'] } }).catch(() => 0),
                PharmacyOrder.countDocuments({ aiFlag: true, status: { $ne: 'Dispensed' } }).catch(() => 0),
            ]);
            res.json({ success: true, data: { todayRx, pendingDispense, aiAlerts, lowStock: 0 } });
        } catch (err) { next(err); }
    }
);

// ── PATCH /queue/:rxId/verify ─────────────────────────────────────────────────
router.patch(
    '/queue/:rxId/verify',
    permit('STAFF.PHARMACY'),
    async (req, res, next) => {
        try {
            const { rxId } = req.params;
            if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable.' });
            const order = await PharmacyOrder.findOneAndUpdate(
                { orderId: rxId, status: { $in: ['new', 'pending', 'Verification'] } },
                { status: 'ready' },
                { new: true }
            );
            if (!order) return res.status(404).json({ success: false, message: 'Order not found or already verified.' });
            res.json({ success: true, data: order });
        } catch (err) { next(err); }
    }
);

// ── PATCH /queue/:rxId/dispense ───────────────────────────────────────────────
router.patch(
    '/queue/:rxId/dispense',
    permit('STAFF.DISPENSE_MEDICATION'),
    async (req, res, next) => {
        try {
            const { rxId } = req.params;
            if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable.' });
            const order = await PharmacyOrder.findOneAndUpdate(
                { orderId: rxId, status: { $ne: 'Dispensed' } },
                { status: 'Dispensed', dispensedAt: new Date() },
                { new: true }
            );
            if (!order) return res.status(404).json({ success: false, message: 'Order not found or already dispensed.' });
            res.json({ success: true, data: order });
        } catch (err) { next(err); }
    }
);

module.exports = router;
