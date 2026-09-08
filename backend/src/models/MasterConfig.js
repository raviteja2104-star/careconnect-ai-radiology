const mongoose = require('mongoose');

/**
 * MasterConfig — key/value configuration store with feature-flag support.
 * isFeatureFlag=true entries carry isEnabled; plain config items carry value.
 */
const masterConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed },
    category: { type: String, index: true },
    description: { type: String },
    isFeatureFlag: { type: Boolean, default: false, index: true },
    isEnabled: { type: Boolean, default: false },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MasterConfig', masterConfigSchema);
