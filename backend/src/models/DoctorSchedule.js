const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  name: { type: String, enum: ['Morning', 'Afternoon', 'Evening', 'Night', 'Custom'], default: 'Morning' },
  startTime: { type: String, required: true }, // e.g., '09:00'
  endTime: { type: String, required: true },   // e.g., '13:00'
  consultationDuration: { type: Number, default: 15 }, // minutes
  bufferTime: { type: Number, default: 0 }, // minutes between slots
  maxPatients: { type: Number },
  isTelemedicineEnabled: { type: Boolean, default: true },
  isWalkInEnabled: { type: Boolean, default: true },
  breaks: [{
    name: String,
    startTime: String,
    endTime: String
  }]
});

const doctorScheduleSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  hospital: {
    type: String,
    required: true,
    default: 'CareConnect Main Hospital'
  },
  effectiveFrom: { type: Date, required: true, default: Date.now },
  effectiveTo: { type: Date }, // null if permanent until changed
  weeklySchedule: {
    Monday: [shiftSchema],
    Tuesday: [shiftSchema],
    Wednesday: [shiftSchema],
    Thursday: [shiftSchema],
    Friday: [shiftSchema],
    Saturday: [shiftSchema],
    Sunday: [shiftSchema]
  },
  leaves: [{
    startDate: Date,
    endDate: Date,
    reason: String,
    type: { type: String, enum: ['Vacation', 'Sick', 'Conference', 'Emergency', 'Other'], default: 'Other' }
  }],
  exceptions: [{
    date: Date,
    shifts: [shiftSchema], // Overrides normal schedule for this date
    isCancelled: { type: Boolean, default: false }, // Entire day cancelled
    reason: String
  }]
}, { timestamps: true });

// Ensure one active schedule per doctor per hospital (simplified)
doctorScheduleSchema.index({ doctor: 1, hospital: 1, effectiveFrom: 1 }, { unique: true });

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);
