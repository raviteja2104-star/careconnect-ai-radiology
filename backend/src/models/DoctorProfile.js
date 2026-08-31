const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialty: {
    type: String,
    required: true
  },
  experienceYears: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 5.0
  },
  hospital: {
    type: String,
    default: 'CareConnect Main Hospital'
  },
  room: {
    type: String
  },
  availability: [{
    dayOfWeek: {
      type: String, // e.g., 'Monday'
      required: true
    },
    slots: [{
      time: String,
      isBooked: { type: Boolean, default: false }
    }]
  }]
}, { timestamps: true });

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
