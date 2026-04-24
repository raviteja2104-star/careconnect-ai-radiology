const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: [
                'scan_uploaded',
                'ai_report_ready',
                'report_reviewed',
                'report_approved',
                'consultation_scheduled',
                'consultation_started',
                'emergency_update',
                'prescription_ready',
                'general',
            ],
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        data: mongoose.Schema.Types.Mixed,
        isRead: { type: Boolean, default: false },
        readAt: Date,
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
