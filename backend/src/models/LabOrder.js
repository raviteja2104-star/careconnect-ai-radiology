const mongoose = require('mongoose');

const labResultSchema = new mongoose.Schema({
  test: { type: String, required: true },
  loincCode: { type: String },
  value: { type: mongoose.Schema.Types.Mixed },
  unit: { type: String },
  referenceRange: { type: String },
  status: { type: String, enum: ['normal', 'low', 'high', 'critical-low', 'critical-high'], default: 'normal' },
  delta: { type: Number },
}, { _id: false });

const labOrderSchema = new mongoose.Schema({
  mrn: { type: String, required: true },
  patientName: { type: String, required: true },
  patientAge: { type: Number },
  patientGender: { type: String, enum: ['M', 'F', 'Other'] },
  panelName: { type: String, required: true },
  orderedBy: { type: String, required: true },
  department: { type: String },
  specimenType: { type: String, default: 'Serum' },
  clinicalNotes: { type: String },
  priority: { type: String, enum: ['Routine', 'Urgent', 'STAT'], default: 'Routine' },
  status: {
    type: String,
    enum: ['Pending', 'Specimen Collected', 'In Process', 'Partial', 'Final', 'Verified'],
    default: 'Pending',
  },
  results: [labResultSchema],
  reportedAt: { type: Date },
  orderedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('LabOrder', labOrderSchema);
