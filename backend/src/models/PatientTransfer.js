const mongoose = require('mongoose');

const patientTransferSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: { type: String, required: true },
  fromDepartment: { type: String, required: true },
  toDepartment: { type: String, required: true },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Doctor or Nurse
  },
  priority: {
    type: String,
    enum: ['Routine', 'Urgent', 'STAT', 'Emergency'],
    default: 'Routine'
  },
  clinicalReason: { type: String },
  expectedTAT: { type: Number }, // in minutes
  status: {
    type: String,
    enum: ['REQUESTED', 'WAITING', 'ACCEPTED', 'IN_PROGRESS', 'ARRIVED', 'COMPLETED', 'CANCELLED'],
    default: 'REQUESTED'
  },
  queueToken: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QueueToken' // The token generated for the receiving department
  }
}, { timestamps: true });

// For analytics and fast queries
patientTransferSchema.index({ toDepartment: 1, status: 1 });
patientTransferSchema.index({ patient: 1 });

module.exports = mongoose.model('PatientTransfer', patientTransferSchema);
