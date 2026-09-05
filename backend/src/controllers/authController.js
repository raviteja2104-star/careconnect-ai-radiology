const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const connectDB = require('../config/database');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// ─── Demo users for when MongoDB is unavailable ──────────────────────────────
const DEMO_USERS = [
    { _id: 'demo-patient-1', firstName: 'Ravi', lastName: 'Teja', email: 'ravi@careconnect.com', password: 'password123', phone: '+91-9876543001', role: 'patient', isActive: true, isVerified: true, dateOfBirth: new Date('1995-06-15'), gender: 'male', bloodGroup: 'O+', allergies: ['Penicillin'], location: { coordinates: [78.4867, 17.3850], address: 'Hyderabad, Telangana' }, emergencyContact: { name: 'Sita Teja', phone: '+91-9876543099', relationship: 'Mother' } },
    { _id: 'demo-patient-2', firstName: 'Priya', lastName: 'Sharma', email: 'priya@careconnect.com', password: 'password123', phone: '+91-9876543002', role: 'patient', isActive: true, isVerified: true, dateOfBirth: new Date('1990-03-22'), gender: 'female', bloodGroup: 'A+', allergies: [] },
    { _id: 'demo-doctor-1', firstName: 'Raj', lastName: 'Sharma', email: 'dr.raj@careconnect.com', password: 'password123', phone: '+91-9876543010', role: 'doctor', isActive: true, isVerified: true, specialization: 'General Physician', licenseNumber: 'MCI-2015-12345', experience: 12, consultationFee: 300, hospital: 'CareConnect City Hospital', department: 'General Medicine', rating: 4.8, availability: { isAvailable: true, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] } },
    { _id: 'demo-radiologist-1', firstName: 'Meera', lastName: 'Reddy', email: 'dr.meera@careconnect.com', password: 'password123', phone: '+91-9876543020', role: 'radiologist', isActive: true, isVerified: true, specialization: 'Diagnostic Radiology', experience: 10, certifications: ['ABR Certified', 'FRCR'], subspecialty: 'Musculoskeletal Radiology' },
    { _id: 'demo-admin-1', firstName: 'Admin', lastName: 'CareConnect', email: 'admin@careconnect.com', password: 'admin123', phone: '+91-9876543000', role: 'admin', isActive: true, isVerified: true },
];

const isDBConnected = () => {
    return mongoose.connection.readyState === 1;
};

// ─── Standard Auth Controllers ───────────────────────────────────────────────

const register = async (req, res, next) => {
    try {
        await waitForDB();
        const { firstName, lastName, email, password, phone, role, ...rest } = req.body;

        if (!isDBConnected()) {
            const exists = DEMO_USERS.find(u => u.email === email);
            if (exists) return res.status(400).json({ success: false, message: 'Email already registered.' });

            const newUser = { _id: `demo-${Date.now()}`, firstName, lastName, email, phone, role: role || 'patient', isActive: true, isVerified: true, ...rest };
            DEMO_USERS.push(newUser);
            const token = generateToken(newUser._id);
            return res.status(201).json({ success: true, message: 'Registration successful (demo mode).', data: { user: newUser, token } });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered.' });

        const user = await User.create({ firstName, lastName, email, password, phone, role: role || 'patient', ...rest });
        const token = generateToken(user._id);
        res.status(201).json({ success: true, message: 'Registration successful.', data: { user, token } });
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
            const demoUser = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (!demoUser || demoUser.password !== password) {
                return res.status(401).json({ success: false, message: 'Invalid credentials.' });
            }
            const { password: _pw, ...safeUser } = demoUser;
            return res.json({ success: true, message: 'Login successful (demo mode).', data: { user: safeUser, token: generateToken(demoUser._id) } });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
        if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated.' });

        const token = generateToken(user._id);
        res.json({ success: true, message: 'Login successful.', data: { user, token } });
    } catch (error) {
        next(error);
    }
};

// ─── OTP Based Auth (Mobile/Email) ───────────────────────────────────────────

const sendOtp = async (req, res, next) => {
    try {
        const { identifier } = req.body; // email or phone
        if (!identifier) return res.status(400).json({ success: false, message: 'Please provide phone or email.' });

        // Generate a 6 digit OTP (static for demo, random for prod)
        const otp = process.env.NODE_ENV === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
        
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
             return res.json({ success: true, message: 'OTP Verified (demo).', data: { token: 'demo-token' } });
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
            return res.json({ success: true, message: 'Social login demo', data: { token: 'demo-token' } });
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
        if (!isDBConnected()) return res.json({ success: true, data: req.user });
        const user = await User.findById(req.user._id);
        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        if (!isDBConnected()) return res.json({ success: true, data: { ...req.user, ...req.body } });
        
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
        if (!isDBConnected()) return res.json({ success: true, message: 'Profile setup complete (demo).' });

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
        if (!isDBConnected()) return res.json({ success: true, message: 'Medical profile setup complete (demo).' });

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
        if (!isDBConnected()) return res.json({ success: true, message: 'Security setup complete (demo).' });

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
        if (!isDBConnected()) return res.json({ success: true, data: { token: generateToken(req.user._id) } });

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
