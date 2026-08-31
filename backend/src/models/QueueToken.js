const mongoose = require('mongoose');

const queueTokenSchema = new mongoose.Schema({
  tokenNumber: {
    type: String,
    required: true,
    index: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Optional for anonymous walk-ins
  },
  patientName: { type: String, required: true },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  department: { type: String, required: true },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  room: { type: String },
  priority: {
    type: Number,
    default: 0 // Higher number = higher priority (e.g. 10 = Emergency)
  },
  priorityReason: { type: String, enum: ['Emergency', 'VIP', 'Senior Citizen', 'Pregnant', 'Child', 'Normal'], default: 'Normal' },
  status: {
    type: String,
    enum: ['CREATED', 'CHECKED_IN', 'WAITING', 'CALLED', 'IN_PROGRESS', 'TRANSFERRED', 'COMPLETED', 'MISSED', 'CANCELLED'],
    default: 'WAITING'
  },
  calledAt: { type: Date },
  completedAt: { type: Date },
  estimatedWaitMinutes: { type: Number, default: 15 }
}, { timestamps: true });

// Ensure fast lookup for active queue boards
queueTokenSchema.index({ department: 1, status: 1, priority: -1, createdAt: 1 });

module.exports = mongoose.model('QueueToken', queueTokenSchema);
