const mongoose = require('mongoose');

const consentDocumentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  templateId: {
    type: String, // e.g., 'SURGERY_GENERAL', 'TELEMEDICINE_CONSENT'
    required: true
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  language: { type: String, default: 'English' },
  status: {
    type: String,
    enum: ['REQUESTED', 'VIEWED', 'SIGNED', 'REJECTED', 'EXPIRED'],
    default: 'REQUESTED'
  },
  signatures: [{
    signerType: { type: String, enum: ['PATIENT', 'GUARDIAN', 'DOCTOR', 'WITNESS'] },
    signerName: String,
    signatureData: String, // Base64 image or crypto hash
    signedAt: Date,
    ipAddress: String
  }],
  metadata: { type: mongoose.Schema.Types.Mixed }, // Store dynamic form answers here
  documentHash: { type: String }, // SHA-256 of the signed document
  pdfUrl: { type: String }
}, { timestamps: true });

// For analytics and fast queries
consentDocumentSchema.index({ status: 1 });

module.exports = mongoose.model('ConsentDocument', consentDocumentSchema);
