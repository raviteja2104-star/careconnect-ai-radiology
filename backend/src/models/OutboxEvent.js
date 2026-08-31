const mongoose = require('mongoose');

const outboxEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
  },
  version: {
    type: String,
    default: '1.0'
  },
  occurredAt: {
    type: Date,
    default: Date.now
  },
  aggregateId: {
    type: String
  },
  tenantId: {
    type: String
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastError: String,
  traceId: String,
}, { timestamps: true });

module.exports = mongoose.model('OutboxEvent', outboxEventSchema);
