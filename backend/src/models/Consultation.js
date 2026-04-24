const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['in_person', 'video', 'chat'],
            default: 'chat',
        },
        status: {
            type: String,
            enum: ['pending', 'active', 'completed', 'cancelled'],
            default: 'pending',
        },
        symptoms: [String],
        aiSymptomAnalysis: {
            possibleConditions: [
                {
                    name: String,
                    probability: Number,
                    description: String,
                },
            ],
            severity: {
                type: String,
                enum: ['mild', 'moderate', 'severe', 'critical'],
            },
            recommendations: [String],
            shouldSeeDoctor: Boolean,
            urgencyLevel: {
                type: String,
                enum: ['low', 'medium', 'high', 'emergency'],
            },
        },
        diagnosis: String,
        prescription: [
            {
                medicine: String,
                dosage: String,
                frequency: String,
                duration: String,
                notes: String,
            },
        ],
        notes: String,
        followUpDate: Date,
        relatedScans: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'RadiologyScan',
            },
        ],
        fee: Number,
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'refunded'],
            default: 'pending',
        },
        scheduledAt: Date,
        startedAt: Date,
        endedAt: Date,
    },
    {
        timestamps: true,
    }
);

consultationSchema.index({ patientId: 1, createdAt: -1 });
consultationSchema.index({ doctorId: 1, status: 1 });

module.exports = mongoose.model('Consultation', consultationSchema);
