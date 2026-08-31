const mongoose = require('mongoose');

const capacityRecommendationSchema = new mongoose.Schema({
  department: { type: String, required: true },
  predictionType: {
    type: String,
    enum: ['CONGESTION', 'DOCTOR_OVERLOAD', 'BOTTLENECK', 'SMART_ROUTING'],
    required: true
  },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  predictedWaitTime: { type: Number }, // in minutes
  confidenceScore: { type: Number }, // 0 to 100
  recommendationTitle: { type: String, required: true },
  recommendationDetails: { type: String, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXECUTED'],
    default: 'PENDING'
  },
  actionData: { type: mongoose.Schema.Types.Mixed }, // Payload needed to execute the recommendation automatically
  aiModelVersion: { type: String, default: 'v1.4.2' }
}, { timestamps: true });

// For analytics and fast queries
capacityRecommendationSchema.index({ status: 1 });
capacityRecommendationSchema.index({ department: 1, severity: 1 });

module.exports = mongoose.model('CapacityRecommendation', capacityRecommendationSchema);
