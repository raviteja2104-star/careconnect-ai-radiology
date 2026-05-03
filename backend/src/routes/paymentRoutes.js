/**
 * CareConnect — Razorpay Payment Gateway Integration
 * Setup: npm install razorpay
 * Config: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { protect } = require('../middleware/auth');

let Razorpay;
try { Razorpay = require('razorpay'); } catch (_) { Razorpay = null; }

const isLive = () => !!Razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

const getRazorpay = () => {
    if (!isLive()) return null;
    return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

// ── Create order ──────────────────────────────────────────────────────────────
router.post('/create-order', protect, async (req, res, next) => {
    try {
        const { amount, currency = 'INR', purpose = 'wallet_topup' } = req.body;
        if (!amount || amount < 1) return res.status(400).json({ success: false, message: 'Amount must be at least ₹1' });

        const amountPaise = Math.round(amount * 100);
        const receipt = `cc_${req.user._id}_${Date.now()}`;

        if (!isLive()) {
            // Demo mode — simulate order creation
            return res.json({
                success: true,
                demo: true,
                data: {
                    orderId: `order_demo_${Date.now()}`,
                    amount: amountPaise,
                    currency,
                    receipt,
                    key: 'rzp_test_DEMO',
                    purpose,
                    user: { name: `${req.user.firstName} ${req.user.lastName}`, email: req.user.email, phone: req.user.phone },
                },
            });
        }

        const rz = getRazorpay();
        const order = await rz.orders.create({ amount: amountPaise, currency, receipt, notes: { userId: req.user._id.toString(), purpose } });

        res.json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
                key: process.env.RAZORPAY_KEY_ID,
                purpose,
                user: { name: `${req.user.firstName} ${req.user.lastName}`, email: req.user.email, phone: req.user.phone },
            },
        });
    } catch (err) { next(err); }
});

// ── Verify payment ────────────────────────────────────────────────────────────
router.post('/verify', protect, async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, purpose } = req.body;

        if (!isLive()) {
            // Demo mode — auto-verify, credit wallet
            const User = require('../models/User');
            const WalletTransaction = require('../models/WalletTransaction');
            const isDB = require('mongoose').connection.readyState === 1;
            const creditAmount = (amount || 50000) / 100;

            if (isDB) {
                await User.findByIdAndUpdate(req.user._id, { $inc: { 'wallet.balance': creditAmount } });
                await WalletTransaction.create({ userId: req.user._id, type: 'credit', amount: creditAmount, description: `Wallet top-up (demo) — ₹${creditAmount}`, status: 'completed', paymentId: `pay_demo_${Date.now()}` });
            }
            return res.json({ success: true, demo: true, message: `₹${creditAmount} credited to wallet (demo mode).`, data: { paymentId: `pay_demo_${Date.now()}`, newBalance: (req.user.wallet?.balance || 0) + creditAmount } });
        }

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');

        if (expectedSig !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
        }

        // Credit wallet
        const User = require('../models/User');
        const WalletTransaction = require('../models/WalletTransaction');
        const creditAmount = amount / 100;

        await User.findByIdAndUpdate(req.user._id, { $inc: { 'wallet.balance': creditAmount } });
        await WalletTransaction.create({
            userId: req.user._id, type: 'credit', amount: creditAmount,
            description: `Wallet top-up via Razorpay — ₹${creditAmount}`,
            status: 'completed', paymentId: razorpay_payment_id, orderId: razorpay_order_id,
        });

        const updatedUser = await User.findById(req.user._id);
        req.io?.emit('wallet_updated', { userId: req.user._id, balance: updatedUser.wallet.balance });

        res.json({ success: true, message: `₹${creditAmount} credited.`, data: { paymentId: razorpay_payment_id, newBalance: updatedUser.wallet.balance } });
    } catch (err) { next(err); }
});

// ── Refund ─────────────────────────────────────────────────────────────────────
router.post('/refund', protect, async (req, res, next) => {
    try {
        const { paymentId, amount } = req.body;
        if (!isLive()) return res.json({ success: true, demo: true, message: 'Refund initiated (demo).' });
        const rz = getRazorpay();
        const refund = await rz.payments.refund(paymentId, { amount: amount * 100 });
        res.json({ success: true, data: refund });
    } catch (err) { next(err); }
});

module.exports = router;
