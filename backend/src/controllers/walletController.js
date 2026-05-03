const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');

const isDB = () => { const m = require('mongoose'); return m.connection.readyState === 1; };

let mockBalance = 1250;
let mockTransactions = [
    { _id: 'tx-1', type: 'credit', amount: 5000, label: 'Initial Topup', createdAt: new Date().toISOString() }
];

exports.getBalance = async (req, res, next) => {
    try {
        if (!isDB()) return res.json({ success: true, data: { balance: mockBalance, name: req.user.firstName } });
        const user = await User.findById(req.user._id).select('credits firstName');
        res.json({ success: true, data: { balance: user?.credits || 0, name: user?.firstName || '' } });
    } catch (err) { next(err); }
};

exports.getTransactions = async (req, res, next) => {
    try {
        if (!isDB()) return res.json({ success: true, data: mockTransactions, total: mockTransactions.length, pages: 1 });
        const { page = 1, limit = 20 } = req.query;
        const txs = await WalletTransaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit).limit(Number(limit));
        const total = await WalletTransaction.countDocuments({ userId: req.user._id });
        res.json({ success: true, data: txs, total, pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

exports.topUp = async (req, res, next) => {
    try {
        const { amount, paymentMethod = 'upi', bonus = 0 } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });
        const totalCredits = Number(amount) + Number(bonus);

        if (!isDB()) {
            mockBalance += totalCredits;
            const tx = { _id: `tx-${Date.now()}`, type: 'credit', amount: totalCredits, label: `Topup via ${paymentMethod}`, createdAt: new Date().toISOString() };
            mockTransactions.unshift(tx);
            return res.json({ success: true, data: { balanceAfter: mockBalance, transaction: tx } });
        }

        const user = await User.findByIdAndUpdate(req.user._id, { $inc: { credits: totalCredits } }, { new: true });
        const tx = await WalletTransaction.create({ userId: req.user._id, type: 'credit', amount: totalCredits, label: `Topup`, status: 'completed', balanceAfter: user.credits });
        res.json({ success: true, data: { balanceAfter: user.credits, transaction: tx } });
    } catch (err) { next(err); }
};

exports.deductCredits = async (userId, { amount, label, referenceId, referenceType }) => {
    if (!isDB()) {
        if (mockBalance < amount) throw new Error('Insufficient credits');
        mockBalance -= amount;
        mockTransactions.unshift({ _id: `tx-${Date.now()}`, type: 'debit', amount, label, referenceId, createdAt: new Date().toISOString() });
        return mockBalance;
    }
    const user = await User.findById(userId);
    if (!user || (user.credits || 0) < amount) throw new Error('Insufficient credits');
    const updated = await User.findByIdAndUpdate(userId, { $inc: { credits: -amount } }, { new: true });
    await WalletTransaction.create({ userId, type: 'debit', amount, label, referenceId, referenceType, paymentMethod: 'wallet', status: 'completed', balanceAfter: updated.credits });
    return updated.credits;
};
