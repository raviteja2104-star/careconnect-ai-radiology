const PharmacyOrder = require('../models/PharmacyOrder');
const { emitEvent } = require('../services/EventBus');

// @desc    Get all pharmacy orders
// @route   GET /api/pharmacy/orders
// @access  Private (Pharmacist / Admin)
const getOrders = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        let query = {};
        
        if (req.user.role === 'patient') {
            query.patientId = req.user._id;
        }
        
        if (status && status !== 'all') {
            query.status = status;
        }

        const orders = await PharmacyOrder.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        const total = await PharmacyOrder.countDocuments(query);
        
        // Calculate stats for pharmacist
        let stats = null;
        if (req.user.role !== 'patient') {
            const allOrders = await PharmacyOrder.find({});
            stats = {
                new: allOrders.filter(o => o.status === 'new').length,
                packing: allOrders.filter(o => o.status === 'packing').length,
                out_for_delivery: allOrders.filter(o => o.status === 'out_for_delivery').length,
                delivered: allOrders.filter(o => o.status === 'delivered').length,
                totalRevenue: allOrders.reduce((sum, o) => sum + (o.amount || 0), 0)
            };
        }

        res.status(200).json({ success: true, data: orders, stats, total });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new pharmacy order
// @route   POST /api/pharmacy/orders
// @access  Private (Patient / Doctor)
const createOrder = async (req, res, next) => {
    try {
        const { patientId, patientName, patientPhone, type, medicines, amount, doctorName, isDelivery, address } = req.body;
        
        const orderId = \`ORD-\${Date.now().toString().slice(-4)}\`;
        
        const order = await PharmacyOrder.create({
            orderId,
            patientId: patientId || req.user._id,
            patientName: patientName || \`\${req.user.firstName} \${req.user.lastName}\`,
            patientPhone: patientPhone || req.user.phone || 'N/A',
            type,
            medicines,
            items: medicines.length,
            amount,
            doctorName,
            isDelivery,
            address,
            status: 'new'
        });

        emitEvent('PHARMACY_ORDER_CREATED', { orderId: order._id, patientId: order.patientId });

        res.status(201).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status
// @route   PUT /api/pharmacy/orders/:id/status
// @access  Private (Pharmacist)
const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        
        const order = await PharmacyOrder.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        emitEvent('PHARMACY_ORDER_UPDATED', { orderId: order._id, status, patientId: order.patientId });

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

// Mock endpoints for now
const getStockAlerts = async (req, res, next) => {
    res.json({ success: true, data: [
        { _id: 'stk-1', medicine: 'Amoxicillin 500mg', stock: 12, threshold: 50, urgency: 'critical' },
        { _id: 'stk-2', medicine: 'Pantoprazole 40mg', stock: 28, threshold: 40, urgency: 'warning' },
        { _id: 'stk-3', medicine: 'Insulin Glargine', stock: 5, threshold: 20, urgency: 'critical' },
    ] });
};

const getPrescriptions = async (req, res, next) => {
    res.json({ success: true, data: [
        { _id: 'rx-1', doctor: 'Dr. Ravi Teja', patient: 'Ravi Teja', items: 3, status: 'converted' },
        { _id: 'rx-2', doctor: 'Dr. Ravi Teja', patient: 'Kabir Das', items: 2, status: 'pending' },
    ] });
};

module.exports = { getOrders, createOrder, updateOrderStatus, getStockAlerts, getPrescriptions };
