const mongoose = require('mongoose');

const userRoleSchema = new mongoose.Schema(
    {
        user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role:      { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
        grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        grantedAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, default: null },
        isActive:  { type: Boolean, default: true },
    },
    { timestamps: true }
);

userRoleSchema.index({ user: 1, role: 1 }, { unique: true });
userRoleSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('UserRole', userRoleSchema);
