const express = require('express');
const {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    sendOtp,
    verifyOtp,
    socialLogin,
    setupProfile,
    setupMedicalProfile,
    setupSecurity
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

const router = express.Router();

// Stricter per-endpoint rate limit for credential and OTP endpoints (10 req / 15 min per IP)
const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

// Standard Auth
router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);

// OTP Auth
router.post('/send-otp', authRateLimit, sendOtp);
router.post('/verify-otp', authRateLimit, verifyOtp);

// Social Login
router.post('/social-login', authRateLimit, socialLogin);

// Profile & Setup
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile); // General profile update
router.put('/setup-profile', protect, setupProfile); // Specific patient onboarding step
router.put('/setup-medical', protect, setupMedicalProfile); // Specific patient medical setup
router.put('/setup-security', protect, setupSecurity); // Security preferences setup

router.put('/change-password', protect, changePassword);

module.exports = router;
