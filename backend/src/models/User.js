const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
        password: { type: String, minlength: 6 },
        phone: { type: String, unique: true, sparse: true },
        role: {
            type: String,
            enum: ['patient', 'doctor', 'radiologist', 'admin', 'lab_tech', 'pharmacist', 'reception', 'emergency'],
            required: true,
            default: 'patient'
        },
        avatar: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        isVerified: { type: Boolean, default: false },

        // Authentication & Security
        authProviders: {
            googleId: { type: String, sparse: true },
            appleId: { type: String, sparse: true },
            facebookId: { type: String, sparse: true },
        },
        biometricPublicKey: { type: String }, // For WebAuthn/FIDO2
        twoFactorEnabled: { type: Boolean, default: false },
        pin: { type: String }, // Hashed PIN for quick access
        recoveryEmail: { type: String },
        trustedDevices: [
            {
                deviceId: String,
                deviceName: String,
                lastUsed: Date,
            }
        ],

        // Patient-specific - Basic Profile
        dateOfBirth: Date,
        gender: { type: String, enum: ['male', 'female', 'other'] },
        bloodGroup: String,
        height: Number, // in cm
        weight: Number, // in kg
        nationality: String,
        language: [String],
        occupation: String,
        
        // Patient-specific - Medical Profile
        allergies: [String],
        chronicDiseases: [String],
        medications: [String],
        surgeries: [String],
        familyHistory: [String],
        lifestyle: {
            smoking: { type: String, enum: ['never', 'occasional', 'regular', 'former'] },
            alcohol: { type: String, enum: ['never', 'occasional', 'regular', 'former'] },
            exercise: { type: String, enum: ['none', 'light', 'moderate', 'active'] },
            diet: { type: String },
        },
        pregnancyStatus: String,
        disabilityInfo: String,
        insurance: {
            providerName: String,
            policyNumber: String,
            validTill: Date,
        },
        primaryDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        
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
            country: String,
            zipCode: String,
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

// Hash password and PIN before save
userSchema.pre('save', async function (next) {
    if (this.isModified('password') && this.password) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    if (this.isModified('pin') && this.pin) {
        this.pin = await bcrypt.hash(this.pin, 12);
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Compare PIN method
userSchema.methods.comparePin = async function (candidatePin) {
    if (!this.pin) return false;
    return await bcrypt.compare(candidatePin, this.pin);
};

// Remove sensitive info from JSON output
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.pin;
    delete obj.biometricPublicKey;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
