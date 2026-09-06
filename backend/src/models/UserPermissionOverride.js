const mongoose = require('mongoose');

const userPermissionOverrideSchema = new mongoose.Schema(
    {
        user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        permission: { type: String, required: true },
        granted:    { type: Boolean, required: true },
        grantedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        reason:     { type: String, default: '' },
        expiresAt:  { type: Date, default: null },
        isActive:   { type: Boolean, default: true },
    },
    { timestamps: true }
);

userPermissionOverrideSchema.index({ user: 1, permission: 1, isActive: 1 });
userPermissionOverrideSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('UserPermissionOverride', userPermissionOverrideSchema);
