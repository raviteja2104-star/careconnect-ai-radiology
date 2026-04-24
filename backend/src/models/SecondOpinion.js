const mongoose = require('mongoose');

const secondOpinionSchema = new mongoose.Schema({
    scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'RadiologyScan', required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // patient or doctor
    specialistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    specialistMeta: {
        // denormalised so it persists even if specialist account changes
        name: String,
        specialization: String,
        fee: Number,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'in_review', 'completed', 'rejected', 'refunded'],
        default: 'pending',
    },
    priority: { type: String, enum: ['normal', 'urgent', 'emergency'], default: 'normal' },
    clinicalQuestion: String,  // what the requester wants clarified
    report: {
        findings: String,
        impression: String,
        recommendations: [String],
        completedAt: Date,
    },
    creditsCharged: Number,
    slaHours: Number,
    dueBy: Date,
}, { timestamps: true });

secondOpinionSchema.index({ requestedBy: 1, status: 1 });
secondOpinionSchema.index({ specialistId: 1, status: 1 });

module.exports = mongoose.model('SecondOpinion', secondOpinionSchema);
