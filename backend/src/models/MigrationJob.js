const mongoose = require('mongoose');

const migrationJobSchema = new mongoose.Schema({
  sourceSystem: {
    type: String,
    enum: ['EPIC_EHR', 'CERNER', 'LOCAL_EXCEL', 'ORTHANC_PACS', 'LEGACY_LIS'],
    required: true,
  },
  dataType: {
    type: String,
    enum: ['PATIENTS', 'EMR_ENCOUNTERS', 'LAB_RESULTS', 'DICOM_IMAGES', 'BILLING_MASTERS'],
    required: true,
  },
  recordCount: { type: Number, required: true, min: 1 },
  processedCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('MigrationJob', migrationJobSchema);
