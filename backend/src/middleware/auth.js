const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
        const resolvedId = decoded.id || decoded._id || decoded.userId;

        // ── Offline fallback ──────────────────────────────────────────────────────
        if (!isDBConnected()) {
            return res.status(503).json({ success: false, message: 'Service temporarily unavailable. Please try again.' });
        }

        // ── Normal DB mode ────────────────────────────────────────────────────────
        const user = await User.findById(resolvedId).select('-password');
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
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

module.exports = { protect, authorize, generateToken };
