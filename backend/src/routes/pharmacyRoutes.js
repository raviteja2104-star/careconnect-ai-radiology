const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const isDB = () => { const m = require('mongoose'); return m.connection.readyState === 1; };

// ─── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_ORDERS = [
    { _id: 'ord-4421', orderId: 'ORD-4421', patientName: 'Ravi Teja', medicines: 'Nexpro Fast 40mg, Pantocid DSR', items: 2, amount: 342, status: 'packed', createdAt: new Date().toISOString() },
    { _id: 'ord-4420', orderId: 'ORD-4420', patientName: 'Anita Sharma', medicines: 'Amoxicillin 500mg x 21', items: 1, amount: 189, status: 'shipped', createdAt: new Date().toISOString() },
    { _id: 'ord-4419', orderId: 'ORD-4419', patientName: 'Kabir Das', medicines: 'Ibuprofen 400mg, Muscle Relaxant', items: 2, amount: 256, status: 'pending', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { _id: 'ord-4418', orderId: 'ORD-4418', patientName: 'Priya Verma', medicines: 'Insulin Glargine 100IU', items: 1, amount: 1450, status: 'delivered', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { _id: 'ord-4417', orderId: 'ORD-4417', patientName: 'Sanjay Gupta', medicines: 'Metformin 500mg, Atorvastatin 10mg', items: 2, amount: 178, status: 'delivered', createdAt: new Date(Date.now() - 172800000).toISOString() },
];

const MOCK_STOCK_ALERTS = [
    { _id: 'stk-1', medicine: 'Amoxicillin 500mg', stock: 12, threshold: 50, urgency: 'critical' },
    { _id: 'stk-2', medicine: 'Pantoprazole 40mg', stock: 28, threshold: 40, urgency: 'warning' },
    { _id: 'stk-3', medicine: 'Insulin Glargine', stock: 5, threshold: 20, urgency: 'critical' },
];

const MOCK_RX = [
    { _id: 'rx-1', doctor: 'Dr. Ravi Teja', patient: 'Ravi Teja', items: 3, status: 'converted' },
    { _id: 'rx-2', doctor: 'Dr. Ravi Teja', patient: 'Kabir Das', items: 2, status: 'pending' },
    { _id: 'rx-3', doctor: 'Dr. Priya', patient: 'Anita Sharma', items: 1, status: 'converted' },
];

// ── GET /orders — list pharmacy orders ─────────────────────────────────────────
router.get('/orders', protect, async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        let orders = [...MOCK_ORDERS];
        if (status && status !== 'all') orders = orders.filter(o => o.status === status.toLowerCase());
        const stats = {
            pending: MOCK_ORDERS.filter(o => o.status === 'pending').length,
            packed: MOCK_ORDERS.filter(o => o.status === 'packed').length,
            shipped: MOCK_ORDERS.filter(o => o.status === 'shipped').length,
            delivered: MOCK_ORDERS.filter(o => o.status === 'delivered').length,
            totalRevenue: MOCK_ORDERS.reduce((s, o) => s + o.amount, 0),
        };
        res.json({ success: true, data: orders, stats, total: orders.length });
    } catch (err) { next(err); }
});

// ── POST /orders — create a new pharmacy order ────────────────────────────────
router.post('/orders', protect, async (req, res, next) => {
    try {
        const { patientName, medicines, amount } = req.body;
        const order = {
            _id: `ord-${Date.now()}`,
            orderId: `ORD-${Date.now().toString().slice(-4)}`,
            patientName, medicines, amount,
            items: medicines.split(',').length,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };
        MOCK_ORDERS.unshift(order);
        res.status(201).json({ success: true, data: order });
    } catch (err) { next(err); }
});

// ── PUT /orders/:id/status — update order status ──────────────────────────────
router.put('/orders/:id/status', protect, async (req, res, next) => {
    try {
        const { status } = req.body;
        const order = MOCK_ORDERS.find(o => o._id === req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        order.status = status;
        res.json({ success: true, data: order });
    } catch (err) { next(err); }
});

// ── GET /stock-alerts — low stock items ───────────────────────────────────────
router.get('/stock-alerts', protect, async (req, res, next) => {
    try {
        res.json({ success: true, data: MOCK_STOCK_ALERTS });
    } catch (err) { next(err); }
});

// ── GET /prescriptions — recent prescriptions ─────────────────────────────────
router.get('/prescriptions', protect, async (req, res, next) => {
    try {
        res.json({ success: true, data: MOCK_RX });
    } catch (err) { next(err); }
});

module.exports = router;
