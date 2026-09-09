const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialty: { type: String, required: true },
  department: { type: String, default: '' },
  hospital: { type: String, default: 'CareConnect Main Hospital' },
  qualification: { type: String, default: '' },
  experienceYears: { type: Number, default: 0 },
  consultationFee: { type: Number, default: 0 },
  medicalRegNumber: { type: String, default: '' },
  consultationType: {
    type: String,
    enum: ['In-Person', 'Telemedicine', 'Both'],
    default: 'In-Person'
  },
  room: { type: String, default: '' },
  rating: { type: Number, default: 5.0 },
  availability: [{
    dayOfWeek: { type: String, required: true },
    slots: [{
      time: String,
      isBooked: { type: Boolean, default: false }
    }]
  }]
}, { timestamps: true });

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
