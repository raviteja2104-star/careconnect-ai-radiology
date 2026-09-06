const mongoose = require('mongoose');

const telemedicineSessionSchema = new mongoose.Schema({
  // queueToken is used for walk-in queue flow; optional for booked telemedicine
  queueToken: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QueueToken',
    index: true,
    default: null,
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    index: true,
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
  roomId: { type: String },
  roomUrl: { type: String }, // Full joinable URL returned to frontend
  startedAt: { type: Date },
  endedAt: { type: Date },
  aiScribeEnabled: { type: Boolean, default: true },
  aiSummary: { type: String },
  recordingUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('TelemedicineSession', telemedicineSessionSchema);
