const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['credit', 'debit', 'refund'], required: true },
    amount: { type: Number, required: true },
    label: { type: String, required: true },
    referenceId: String, // scan._id, consultation._id, etc.
    referenceType: { type: String, enum: ['scan', 'consultation', 'topup', 'refund'] },
    paymentMethod: { type: String, enum: ['upi', 'card', 'netbanking', 'wallet', 'system'] },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    balanceAfter: Number,
    meta: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

walletTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
