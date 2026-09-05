const mongoose = require('mongoose');

/**
 * Organization — an owning entity for one or more Providers (e.g. a hospital
 * chain that runs several branches, or a single independent clinic). MVP
 * scope: just enough to group Providers under a chain when relevant.
 */
const organizationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        type: {
            type: String,
            enum: ['hospital_chain', 'independent'],
            default: 'independent',
        },
        tenantId: { type: String, default: 't-default', index: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
