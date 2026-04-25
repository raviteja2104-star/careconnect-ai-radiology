const express = require('express');
const { getBalance, getTransactions, topUp, deductCredits } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/balance', getBalance);
router.get('/transactions', getTransactions);
router.post('/topup', topUp);
router.post('/deduct', async (req, res, next) => {
    try {
        const { amount, label, referenceId, referenceType } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });
        const balanceAfter = await deductCredits(req.user._id, { amount, label: label || 'Service Charge', referenceId, referenceType: referenceType || 'service' });
        res.json({ success: true, data: { balanceAfter } });
    } catch (err) {
        if (err.message === 'Insufficient credits') return res.status(402).json({ success: false, message: 'Insufficient credits' });
        next(err);
    }
});

module.exports = router;
