const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const connectDB = require('../config/database');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ensureUserHasRole, getEffectivePermissions } = require('../services/PermissionService');

// In-memory OTP store for demonstration
const otpStore = new Map();

// Helper: wait for DB to be ready (handles Vercel serverless cold starts)
const waitForDB = async (maxMs = 12000) => {
    const conn = await connectDB();
    // connectDB returns null when Mongo is down (single-flight + cooldown):
    // skip the poll loop so handlers hit their demo fallback immediately.
    if (!conn) return;
    const start = Date.now();
    while (mongoose.connection.readyState !== 1 && Date.now() - start < maxMs) {
        await new Promise(resolve => setTimeout(resolve, 200));
    }
};


const isDBConnected = () => {
    return mongoose.connection.readyState === 1;
};

// ─── Standard Auth Controllers ───────────────────────────────────────────────

const register = async (req, res, next) => {
    try {
        await waitForDB();
        const { firstName, lastName, email, password, phone, role, ...rest } = req.body;

        if (!isDBConnected()) {
            return res.status(503).json({ success: false, message: 'Database unavailable. Please try again shortly.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered.' });

        const user = await User.create({ firstName, lastName, email, password, phone, role: role || 'patient', ...rest });
        const token = generateToken(user._id);
        await ensureUserHasRole(user).catch(() => {});
        const { permissions, workspaces } = await getEffectivePermissions(user._id).catch(() => ({ permissions: [], workspaces: [] }));
        res.status(201).json({ success: true, message: 'Registration successful.', data: { user, token, permissions, workspaces } });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        await waitForDB();
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password.' });
        }

        if (!isDBConnected()) {
            return res.status(503).json({ success: false, message: 'Database unavailable. Please try again shortly.' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
        if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated.' });

        const token = generateToken(user._id);

        // Auto-assign RBAC role if user has none, then resolve effective permissions
        await ensureUserHasRole(user).catch(() => {});
        const { permissions, workspaces } = await getEffectivePermissions(user._id).catch(() => ({ permissions: [], workspaces: [] }));

        res.json({ success: true, message: 'Login successful.', data: { user, token, permissions, workspaces } });
    } catch (error) {
        next(error);
    }
};

// ─── OTP Based Auth (Mobile/Email) ───────────────────────────────────────────

const sendOtp = async (req, res, next) => {
    try {
        const { identifier } = req.body; // email or phone
        if (!identifier) return res.status(400).json({ success: false, message: 'Please provide phone or email.' });

        // Generate a 6-digit OTP. Set STATIC_OTP env var for testing only — never in production.
        const otp = process.env.STATIC_OTP || Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP with expiration (5 mins)
        otpStore.set(identifier, { otp, expires: Date.now() + 5 * 60 * 1000 });

        if (process.env.NODE_ENV !== 'production') {
            // Never log OTPs in production — development/test only
            console.log(`🔑 OTP for ${identifier} is ${otp}`);
        }

        res.json({ success: true, message: `OTP sent successfully to ${identifier}` });
    } catch (error) {
        next(error);
    }
};

const verifyOtp = async (req, res, next) => {
    try {
        await waitForDB();
        const { identifier, otp, isRegistration } = req.body;
        
        if (!identifier || !otp) return res.status(400).json({ success: false, message: 'Provide identifier and OTP.' });

        const record = otpStore.get(identifier);
        if (!record || record.otp !== otp || record.expires < Date.now()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }

        // OTP is valid, clear it
        otpStore.delete(identifier);

        if (!isDBConnected()) {
            return res.status(503).json({ success: false, message: 'Database unavailable. Please try again shortly.' });
        }

        // Check if user exists
        let user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
        
        let isNewUser = false;
        if (!user) {
            if (!isRegistration) {
                // Return flag to frontend that user doesn't exist, proceed to registration screen
                return res.json({ success: true, isNewUser: true, message: 'User not found, please register.' });
            }
            // Create a shell user
            const isEmail = identifier.includes('@');
            user = await User.create({
                email: isEmail ? identifier : undefined,
                phone: !isEmail ? identifier : undefined,
                firstName: 'New',
                lastName: 'User',
                role: 'patient',
                isVerified: true
            });
            isNewUser = true;
        }

        const token = generateToken(user._id);
        res.json({ success: true, message: 'Authentication successful.', isNewUser, data: { user, token } });
    } catch (error) {
        next(error);
    }
};

// ─── Social Login ────────────────────────────────────────────────────────────

const socialLogin = async (req, res, next) => {
    try {
        await waitForDB();
        const { provider, token, profile } = req.body; 
        // Expected profile: { email, firstName, lastName, googleId/appleId }
        
        if (!isDBConnected()) {
            return res.status(503).json({ success: false, message: 'Database unavailable. Please try again shortly.' });
        }

        let user = await User.findOne({ email: profile.email });
        let isNewUser = false;

        if (!user) {
            user = await User.create({
                firstName: profile.firstName || 'Unknown',
                lastName: profile.lastName || 'User',
                email: profile.email,
                role: 'patient',
                isVerified: true,
                authProviders: {
                    [provider + 'Id']: profile.id
                }
            });
            isNewUser = true;
        } else {
            // Link account if not linked
            if (!user.authProviders[provider + 'Id']) {
                user.authProviders[provider + 'Id'] = profile.id;
                await user.save();
            }
        }

        const authToken = generateToken(user._id);
        res.json({ success: true, message: 'Social login successful.', isNewUser, data: { user, token: authToken } });
    } catch (error) {
        next(error);
    }
};

// ─── Profile Setup Steps ─────────────────────────────────────────────────────

const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const { permissions, workspaces } = await getEffectivePermissions(user._id).catch(() => ({ permissions: [], workspaces: [] }));
        res.json({ success: true, data: { ...user.toObject(), permissions, workspaces } });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const fieldsToUpdate = { ...req.body };
        ['password', 'pin', 'role', 'email', 'phone'].forEach(k => delete fieldsToUpdate[k]); // Protect sensitive fields
        
        const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, { new: true, runValidators: true });
        res.json({ success: true, message: 'Profile updated.', data: user });
    } catch (error) {
        next(error);
    }
};

const setupProfile = async (req, res, next) => {
    try {
        const { firstName, lastName, dateOfBirth, gender, bloodGroup, height, weight, nationality, language, occupation, emergencyContact, location } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { firstName, lastName, dateOfBirth, gender, bloodGroup, height, weight, nationality, language, occupation, emergencyContact, location },
            { new: true, runValidators: true }
        );
        res.json({ success: true, message: 'Personal profile setup completed.', data: user });
    } catch (error) {
        next(error);
    }
};

const setupMedicalProfile = async (req, res, next) => {
    try {
        const { allergies, chronicDiseases, medications, surgeries, familyHistory, lifestyle, pregnancyStatus, disabilityInfo, insurance } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { allergies, chronicDiseases, medications, surgeries, familyHistory, lifestyle, pregnancyStatus, disabilityInfo, insurance },
            { new: true, runValidators: true }
        );
        res.json({ success: true, message: 'Medical profile setup completed.', data: user });
    } catch (error) {
        next(error);
    }
};

const setupSecurity = async (req, res, next) => {
    try {
        const { twoFactorEnabled, pin, recoveryEmail } = req.body;
        
        const user = await User.findById(req.user._id);
        if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;
        if (pin) user.pin = pin; // Will be hashed by pre-save hook
        if (recoveryEmail) user.recoveryEmail = recoveryEmail;

        await user.save();
        res.json({ success: true, message: 'Security settings updated.' });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');
        const isMatch = await user.comparePassword(currentPassword);
        
        if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        
        user.password = newPassword;
        await user.save();
        res.json({ success: true, message: 'Password changed successfully.', data: { token: generateToken(user._id) } });
    } catch (error) {
        next(error);
    }
};

module.exports = { 
    register, login, getMe, updateProfile, changePassword,
    sendOtp, verifyOtp, socialLogin, setupProfile, setupMedicalProfile, setupSecurity
};
