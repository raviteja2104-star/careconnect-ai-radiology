const mongoose = require('mongoose');

const AdminOpsRecordSchema = new mongoose.Schema({
  recordType: { type: String, required: true, index: true },
  data:       mongoose.Schema.Types.Mixed,
}, { timestamps: true });

AdminOpsRecordSchema.index({ recordType: 1, createdAt: -1 });

module.exports = mongoose.model('AdminOpsRecord', AdminOpsRecordSchema);
