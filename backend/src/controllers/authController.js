const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const connectDB = require('../config/database');
const mongoose = require('mongoose');

// Helper: wait for DB to be ready (handles Vercel serverless cold starts)
const waitForDB = async (maxMs = 12000) => {
    await connectDB();
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
    { _id: 'demo-doctor-2', firstName: 'Anita', lastName: 'Desai', email: 'dr.anita@careconnect.com', password: 'password123', phone: '+91-9876543011', role: 'doctor', isActive: true, isVerified: true, specialization: 'Orthopedic Surgeon', experience: 15, consultationFee: 500, hospital: 'CareConnect City Hospital', rating: 4.9 },
    { _id: 'demo-doctor-3', firstName: 'Vikram', lastName: 'Patel', email: 'dr.vikram@careconnect.com', password: 'password123', phone: '+91-9876543012', role: 'doctor', isActive: true, isVerified: true, specialization: 'Cardiologist', experience: 18, consultationFee: 800, hospital: 'CareConnect City Hospital', rating: 4.7 },
    { _id: 'demo-radiologist-1', firstName: 'Meera', lastName: 'Reddy', email: 'dr.meera@careconnect.com', password: 'password123', phone: '+91-9876543020', role: 'radiologist', isActive: true, isVerified: true, specialization: 'Diagnostic Radiology', experience: 10, certifications: ['ABR Certified', 'FRCR'], subspecialty: 'Musculoskeletal Radiology' },
    { _id: 'demo-radiologist-2', firstName: 'Arjun', lastName: 'Nair', email: 'dr.arjun@careconnect.com', password: 'password123', phone: '+91-9876543021', role: 'radiologist', isActive: true, isVerified: true, specialization: 'Neuroradiology', experience: 8, certifications: ['ABR Certified'], subspecialty: 'Neuroradiology' },
    { _id: 'demo-admin-1', firstName: 'Admin', lastName: 'CareConnect', email: 'admin@careconnect.com', password: 'admin123', phone: '+91-9876543000', role: 'admin', isActive: true, isVerified: true },
];

const isDBConnected = () => {
    const mongoose = require('mongoose');
    return mongoose.connection.readyState === 1;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
    try {
        await waitForDB(); // Ensure DB is connected (handles Vercel cold starts)
        const { firstName, lastName, email, password, phone, role, ...rest } = req.body;

        if (!isDBConnected()) {
            // Demo mode: check duplicate email
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

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
    try {
        await waitForDB(); // Ensure DB is connected (handles Vercel cold starts)
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password.' });
        }

        // ── Demo / offline mode ───────────────────────────────────────────────────
        if (!isDBConnected()) {
            const demoUser = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (!demoUser) {
                return res.status(401).json({ success: false, message: 'Invalid credentials. Try: ravi@careconnect.com / password123' });
            }
            if (demoUser.password !== password) {
                return res.status(401).json({ success: false, message: 'Invalid credentials.' });
            }
            const { password: _pw, ...safeUser } = demoUser;
            const token = generateToken(demoUser._id);
            console.log(`🔓 Demo login: ${demoUser.firstName} (${demoUser.role})`);
            return res.json({ success: true, message: 'Login successful (demo mode).', data: { user: safeUser, token } });
        }

        // ── Normal DB mode ────────────────────────────────────────────────────────
        const user = await User.findOne({ email }).select('+password');
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        if (!user.isActive) return res.status(401).json({ success: false, message: 'Account has been deactivated.' });

        const token = generateToken(user._id);
        res.json({ success: true, message: 'Login successful.', data: { user, token } });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.json({ success: true, data: req.user });
        }
        const user = await User.findById(req.user._id);
        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.json({ success: true, message: 'Profile updated (demo mode).', data: { ...req.user, ...req.body } });
        }
        const fieldsToUpdate = { ...req.body };
        delete fieldsToUpdate.password;
        delete fieldsToUpdate.role;
        delete fieldsToUpdate.email;
        const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, { new: true, runValidators: true });
        res.json({ success: true, message: 'Profile updated.', data: user });
    } catch (error) {
        next(error);
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.json({ success: true, message: 'Password changed (demo mode).', data: { token: generateToken(req.user._id) } });
        }
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        user.password = newPassword;
        await user.save();
        const token = generateToken(user._id);
        res.json({ success: true, message: 'Password changed successfully.', data: { token } });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
