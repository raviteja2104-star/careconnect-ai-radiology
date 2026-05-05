const mongoose = require('mongoose');

const radiologyScanSchema = new mongoose.Schema(
    {
        scanId: {
            type: String,
            unique: true,
            required: true,
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // doctor who requested
        },
        assignedRadiologist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        scanType: {
            type: String,
            enum: ['CT', 'MRI', 'XRAY'],
            required: true,
        },
        bodyPart: {
            type: String,
            required: true,
        },
        fileUrl: {
            type: String,
            required: true,
        },
        fileName: String,
        fileSize: Number,
        mimeType: String,

        // PACS simulation
        pacsId: {
            type: String,
            unique: true,
            sparse: true,  // allows multiple null values
        },
        pacsPath: String,
        dicomMetadata: {
            studyInstanceUID: String,
            seriesInstanceUID: String,
            sopInstanceUID: String,
            modality: String,
            studyDate: Date,
            institutionName: String,
            patientPosition: String,
        },

        // AI Report
        aiReport: {
            findings: { type: String, default: '' },
            riskLevel: {
                type: String,
                enum: ['low', 'medium', 'high', 'critical'],
                default: 'low',
            },
            confidence: { type: Number, default: 0 },
            detectedIssues: [
                {
                    name: String,
                    probability: Number,
                    description: String,
                    location: String,
                },
            ],
            recommendations: [String],
            processedAt: Date,
            modelVersion: String,
        },

        // Radiologist Final Report
        finalReport: {
            findings: { type: String, default: '' },
            impression: { type: String, default: '' },
            recommendations: [String],
            riskLevel: {
                type: String,
                enum: ['low', 'medium', 'high', 'critical'],
            },
            reviewedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            reviewedAt: Date,
            notes: String,
        },

        status: {
            type: String,
            enum: [
                'uploaded',
                'ai_processing',
                'ai_completed',
                'radiologist_review',
                'reviewed',
                'approved',
                'rejected',
            ],
            default: 'uploaded',
        },

        priority: {
            type: String,
            enum: ['normal', 'urgent', 'emergency'],
            default: 'normal',
        },

        clinicalNotes: String,
        tags: [String],

        statusHistory: [
            {
                status: String,
                changedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                changedAt: { type: Date, default: Date.now },
                notes: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Indexes for fast queries
radiologyScanSchema.index({ patientId: 1, createdAt: -1 });
radiologyScanSchema.index({ status: 1 });
radiologyScanSchema.index({ assignedRadiologist: 1, status: 1 });
radiologyScanSchema.index({ priority: 1, createdAt: 1 });

module.exports = mongoose.model('RadiologyScan', radiologyScanSchema);
