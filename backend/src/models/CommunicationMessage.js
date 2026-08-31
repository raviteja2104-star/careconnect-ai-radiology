const mongoose = require('mongoose');

const communicationMessageSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channel: {
    type: String,
    enum: ['SMS', 'WhatsApp', 'Email', 'Push'],
    required: true
  },
  templateId: { type: String },
  content: { type: String, required: true },
  language: { type: String, default: 'English' },
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'],
    default: 'PENDING'
  },
  failureReason: { type: String },
  relatedEvent: { type: String }, // e.g., APPOINTMENT_BOOKED, QUEUE_TOKEN_CREATED
  metadata: { type: mongoose.Schema.Types.Mixed }, // Arbitrary payload (e.g. tokenId, appointmentId)
  sentAt: { type: Date }
}, { timestamps: true });

// For analytics and fast queries
communicationMessageSchema.index({ status: 1, createdAt: 1 });
communicationMessageSchema.index({ patient: 1 });

module.exports = mongoose.model('CommunicationMessage', communicationMessageSchema);
