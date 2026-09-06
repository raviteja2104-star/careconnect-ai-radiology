const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        displayName: { type: String, required: true },
        description:  { type: String, default: '' },
        workspaces:   [{ type: String }],
        permissions:  [{ type: String }],
        isSystem:     { type: Boolean, default: false },
        isActive:     { type: Boolean, default: true },
        createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

roleSchema.index({ name: 1 }, { unique: true });
roleSchema.index({ isActive: 1 });

module.exports = mongoose.model('Role', roleSchema);
