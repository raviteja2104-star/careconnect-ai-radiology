const mongoose = require('mongoose');

/**
 * Tenant — represents a hospital / clinic organisation on the platform.
 */
const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    region: { type: String },
    plan: {
      type: String,
      enum: ['Starter', 'Professional', 'Enterprise', 'Enterprise+'],
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended', 'Trial'],
      default: 'Active',
    },
    maxUsers: { type: Number },
    currentUsers: { type: Number, default: 0 },
    contactEmail: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tenant', tenantSchema);
