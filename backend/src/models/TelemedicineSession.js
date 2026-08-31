const mongoose = require('mongoose');

const telemedicineSessionSchema = new mongoose.Schema({
  queueToken: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QueueToken',
    required: true,
    index: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'PATIENT_WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    default: 'SCHEDULED'
  },
  videoProvider: {
    type: String,
    enum: ['WebRTC', 'Daily', 'Twilio', 'LiveKit'],
    default: 'WebRTC'
  },
  roomId: { type: String }, // e.g., daily.co room URL or WebRTC peer ID
  startedAt: { type: Date },
  endedAt: { type: Date },
  aiScribeEnabled: { type: Boolean, default: true },
  aiSummary: { type: String },
  recordingUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('TelemedicineSession', telemedicineSessionSchema);
