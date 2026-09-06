const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Demo users mirror (must match authController) ───────────────────────────
const DEMO_USERS = [
    { _id: 'demo-patient-1', firstName: 'Ravi', lastName: 'Teja', email: 'ravi@careconnect.com', role: 'patient', isActive: true, isVerified: true, bloodGroup: 'O+', allergies: ['Penicillin'], gender: 'male' },
    { _id: 'demo-patient-2', firstName: 'Priya', lastName: 'Sharma', email: 'priya@careconnect.com', role: 'patient', isActive: true, isVerified: true },
    { _id: 'demo-doctor-1', firstName: 'Raj', lastName: 'Sharma', email: 'dr.raj@careconnect.com', role: 'doctor', isActive: true, specialization: 'General Physician', hospital: 'CareConnect City Hospital', rating: 4.8, consultationFee: 300 },
    { _id: 'demo-doctor-2', firstName: 'Anita', lastName: 'Desai', email: 'dr.anita@careconnect.com', role: 'doctor', isActive: true, specialization: 'Orthopedic Surgeon', consultationFee: 500, rating: 4.9 },
    { _id: 'demo-doctor-3', firstName: 'Vikram', lastName: 'Patel', email: 'dr.vikram@careconnect.com', role: 'doctor', isActive: true, specialization: 'Cardiologist', consultationFee: 800, rating: 4.7 },
    { _id: 'demo-radiologist-1', firstName: 'Meera', lastName: 'Reddy', email: 'dr.meera@careconnect.com', role: 'radiologist', isActive: true, specialization: 'Diagnostic Radiology', certifications: ['ABR Certified', 'FRCR'] },
    { _id: 'demo-radiologist-2', firstName: 'Arjun', lastName: 'Nair', email: 'dr.arjun@careconnect.com', role: 'radiologist', isActive: true, specialization: 'Neuroradiology' },
    { _id: 'demo-admin-1', firstName: 'Admin', lastName: 'CareConnect', email: 'admin@careconnect.com', role: 'admin', isActive: true },
];

const isDBConnected = () => {
    const mongoose = require('mongoose');
    return mongoose.connection.readyState === 1;
};

// Protect routes - verify JWT
const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ── Demo / offline mode (dev/test only) ───────────────────────────────────
        if (!isDBConnected() && process.env.NODE_ENV !== 'production') {
            const demoUser = DEMO_USERS.find(u => u._id === decoded.id);
            if (!demoUser) {
                return res.status(401).json({ success: false, message: 'Demo user not found.' });
            }
            req.user = demoUser;
            return next();
        }
        if (!isDBConnected()) {
            return res.status(503).json({ success: false, message: 'Service temporarily unavailable. Please try again.' });
        }

        // ── Normal DB mode ────────────────────────────────────────────────────────
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
        if (!user.isActive) return res.status(401).json({ success: false, message: 'Account has been deactivated.' });

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not authorized. Invalid token.' });
    }
};

// Role-based access control
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this resource.',
            });
        }
        next();
    };
};

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

module.exports = { protect, authorize, generateToken };
