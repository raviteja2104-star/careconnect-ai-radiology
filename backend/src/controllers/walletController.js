const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');

/**
 * GET /api/wallet/balance
 * Returns authenticated user's credit balance.
 */
exports.getBalance = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('credits firstName');
        res.json({ success: true, data: { balance: user.credits || 0, name: user.firstName } });
    } catch (err) { next(err); }
};

/**
 * GET /api/wallet/transactions
 * Returns paginated transaction history for authenticated user.
 */
exports.getTransactions = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const txs = await WalletTransaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));
        const total = await WalletTransaction.countDocuments({ userId: req.user._id });
        res.json({ success: true, data: txs, total, pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

/**
 * POST /api/wallet/topup
 * Add credits (simulates payment gateway confirmation).
 * Body: { amount, paymentMethod }
 */
exports.topUp = async (req, res, next) => {
    try {
        const { amount, paymentMethod = 'upi', bonus = 0 } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

        const totalCredits = Number(amount) + Number(bonus);

        // Increment balance atomically
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $inc: { credits: totalCredits } },
            { new: true }
        );

        const tx = await WalletTransaction.create({
            userId: req.user._id,
            type: 'credit',
            amount: totalCredits,
            label: `Credits Added via ${paymentMethod.toUpperCase()}${bonus > 0 ? ` (+₹${bonus} bonus)` : ''}`,
            paymentMethod,
            referenceType: 'topup',
            status: 'completed',
            balanceAfter: user.credits,
        });

        res.json({ success: true, data: { balanceAfter: user.credits, transaction: tx } });
    } catch (err) { next(err); }
};

/**
 * POST /api/wallet/deduct
 * Internal controller — deducts credits for a service.
 * Body: { amount, label, referenceId, referenceType }
 */
exports.deductCredits = async (userId, { amount, label, referenceId, referenceType }) => {
    const user = await User.findById(userId);
    if (!user || (user.credits || 0) < amount) throw new Error('Insufficient credits');

    const updated = await User.findByIdAndUpdate(
        userId,
        { $inc: { credits: -amount } },
        { new: true }
    );

    await WalletTransaction.create({
        userId,
        type: 'debit',
        amount,
        label,
        referenceId,
        referenceType,
        paymentMethod: 'wallet',
        status: 'completed',
        balanceAfter: updated.credits,
    });

    return updated.credits;
};
