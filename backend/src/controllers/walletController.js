const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');

const isDB = () => { const m = require('mongoose'); return m.connection.readyState === 1; };

exports.getBalance = async (req, res, next) => {
    try {
        if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable. Please try again shortly.' });
        const user = await User.findById(req.user._id).select('credits firstName');
        res.json({ success: true, data: { balance: user?.credits || 0, name: user?.firstName || '' } });
    } catch (err) { next(err); }
};

exports.getTransactions = async (req, res, next) => {
    try {
        if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable. Please try again shortly.' });
        const { page = 1, limit = 20 } = req.query;
        const txs = await WalletTransaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit).limit(Number(limit));
        const total = await WalletTransaction.countDocuments({ userId: req.user._id });
        res.json({ success: true, data: txs, total, pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

exports.topUp = async (req, res, next) => {
    // Wallet credits are managed exclusively through verified Razorpay payment flows.
    // Direct credit top-up is disabled to prevent payment bypass.
    // Credits are applied automatically via the payment webhook or /api/payment/verify.
    return res.status(403).json({
        success: false,
        message: 'Direct wallet top-up is not permitted. Use the payment flow to add credits.',
    });
};

exports.deductCredits = async (userId, { amount, label, referenceId, referenceType }) => {
    if (!isDB()) throw new Error('Database unavailable — credit deduction requires a live DB connection');
    const user = await User.findById(userId);
    if (!user || (user.credits || 0) < amount) throw new Error('Insufficient credits');
    const updated = await User.findByIdAndUpdate(userId, { $inc: { credits: -amount } }, { new: true });
    await WalletTransaction.create({ userId, type: 'debit', amount, label, referenceId, referenceType, paymentMethod: 'wallet', status: 'completed', balanceAfter: updated.credits });
    return updated.credits;
};
