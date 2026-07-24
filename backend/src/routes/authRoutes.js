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

const router = express.Router();

// Standard Auth
router.post('/register', register);
router.post('/login', login);

// OTP Auth
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Social Login
router.post('/social-login', socialLogin);

// Profile & Setup
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile); // General profile update
router.put('/setup-profile', protect, setupProfile); // Specific patient onboarding step
router.put('/setup-medical', protect, setupMedicalProfile); // Specific patient medical setup
router.put('/setup-security', protect, setupSecurity); // Security preferences setup

router.put('/change-password', protect, changePassword);

module.exports = router;
