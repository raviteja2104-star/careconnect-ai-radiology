const mongoose = require('mongoose');

const slotReservationSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  time: {
    type: String, // HH:mm
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index: auto-deletes when expiresAt is reached
  },
  status: {
    type: String,
    enum: ['Reserved', 'Confirmed', 'Released'],
    default: 'Reserved'
  },
  sessionId: {
    type: String // To track which client reserved it
  }
}, { timestamps: true });

// Prevent double booking via unique index on doctor + date + time for active reservations/bookings
// In a full implementation, you'd also check the Appointment collection, 
// or unify Reserved slots and Appointments.
slotReservationSchema.index({ doctor: 1, date: 1, time: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['Reserved', 'Confirmed'] } } });

module.exports = mongoose.model('SlotReservation', slotReservationSchema);
