const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
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
  specialty: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  visitType: {
    type: String,
    enum: ['In-Person', 'Video Call', 'Home Visit'],
    default: 'In-Person'
  },
  reason: {
    type: String
  },
  status: {
    type: String,
    enum: ['Booked', 'Confirmed', 'Checked_In', 'Waiting', 'Vitals', 'Doctor_Ready', 'In_Consultation', 'Completed', 'Cancelled'],
    default: 'Booked'
  },
  insuranceApplied: {
    type: Boolean,
    default: false
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Refunded'],
    default: 'Pending'
  },
  meetingLink: {
    type: String // For Video Call
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
