const mongoose = require('mongoose');

const providerEnquirySchema = new mongoose.Schema(
    {
        name:         { type: String, required: true, trim: true },
        phone:        { type: String, trim: true },
        email:        { type: String, required: true, trim: true, lowercase: true },
        providerType: { type: String, required: true, trim: true },
        city:         { type: String, trim: true },
        message:      { type: String, trim: true },
        status: {
            type: String,
            enum: ['new', 'contacted', 'converted', 'closed'],
            default: 'new',
            index: true,
        },
        assignedTo: { type: String, trim: true },
        notes:      { type: String, trim: true },
        source:     { type: String, default: 'website-business-page' },
        ipAddress:  { type: String },
        userAgent:  { type: String },
    },
    {
        timestamps: true,
        collection: 'provider_enquiries',
    }
);

providerEnquirySchema.index({ email: 1 });
providerEnquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('ProviderEnquiry', providerEnquirySchema);
