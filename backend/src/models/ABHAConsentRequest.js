const mongoose = require('mongoose');

const abhaConsentRequestSchema = new mongoose.Schema(
  {
    consentRequestId: { type: String, required: true, unique: true },
    patientAbha: { type: String, required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    requesterName: { type: String, default: 'CareConnect' },
    requesterNpi: { type: String },
    purpose: { type: String, default: 'CAREMGT' },
    purposeText: { type: String, default: 'Care Management' },
    hiTypes: [{ type: String }],
    dateFrom: { type: Date },
    dateTo: { type: Date },
    status: {
      type: String,
      enum: ['REQUESTED', 'GRANTED', 'DENIED', 'EXPIRED', 'REVOKED'],
      default: 'REQUESTED',
      index: true,
    },
    grantedAt: { type: Date },
    deniedAt: { type: Date },
    revokedAt: { type: Date },
    artefactId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ABHAConsentRequest', abhaConsentRequestSchema);
