const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, minlength: 6 },
        phone: { type: String, required: true },
        role: {
            type: String,
            enum: ['patient', 'doctor', 'radiologist', 'admin', 'lab_tech', 'pharmacist'],
            required: true,
        },
        avatar: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        isVerified: { type: Boolean, default: false },

        // Patient-specific
        dateOfBirth: Date,
        gender: { type: String, enum: ['male', 'female', 'other'] },
        bloodGroup: String,
        allergies: [String],
        medicalHistory: [
            {
                condition: String,
                diagnosedDate: Date,
                notes: String,
            },
        ],
        emergencyContact: {
            name: String,
            phone: String,
            relationship: String,
        },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] },
            address: String,
            city: String,
            state: String,
        },

        // Doctor-specific
        specialization: String,
        licenseNumber: String,
        experience: Number, // years
        consultationFee: Number,
        availability: {
            isAvailable: { type: Boolean, default: true },
            days: [String],
            timeSlots: [
                {
                    start: String,
                    end: String,
                },
            ],
        },
        hospital: String,
        department: String,
        rating: { type: Number, default: 0 },

        // Radiologist-specific
        certifications: [String],
        subspecialty: String,
        isMarketplaceListed: { type: Boolean, default: false },
        marketplaceFee: { type: Number, default: 0 },
        marketplaceRating: { type: Number, default: 0 },
        marketplaceReviews: { type: Number, default: 0 },

        // Wallet
        credits: { type: Number, default: 0 },
        abhaId: { type: String, default: '' },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Index for geo queries
userSchema.index({ 'location.coordinates': '2dsphere' });

// Hash password before save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
