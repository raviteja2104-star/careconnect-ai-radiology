const express = require('express');
const { body, validationResult } = require('express-validator');
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
    setupSecurity,
    refresh,
    logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// Stricter per-endpoint rate limit for credential and OTP endpoints (10 req / 15 min per IP)
const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

// Rejects the request with 422 if any prior body() checks failed
function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, message: errors.array()[0].msg });
    }
    next();
}

// Standard Auth
router.post('/register',
    authRateLimit,
    body('firstName').trim().notEmpty().withMessage('First name is required.').isLength({ max: 100 }),
    body('lastName').trim().notEmpty().withMessage('Last name is required.').isLength({ max: 100 }),
    body('email').normalizeEmail().isEmail().withMessage('A valid email address is required.'),
    body('password').isLength({ min: 6, max: 128 }).withMessage('Password must be 6–128 characters.'),
    body('phone').optional().trim().isLength({ max: 20 }),
    validate,
    register,
);

router.post('/login',
    authRateLimit,
    body('email').normalizeEmail().isEmail().withMessage('A valid email address is required.'),
    body('password').notEmpty().isLength({ max: 128 }).withMessage('Password is required.'),
    validate,
    login,
);

// OTP Auth
router.post('/send-otp',
    authRateLimit,
    body('identifier').trim().notEmpty().withMessage('Email or phone number is required.').isLength({ max: 200 }),
    validate,
    sendOtp,
);

router.post('/verify-otp',
    authRateLimit,
    body('identifier').trim().notEmpty().withMessage('Identifier is required.').isLength({ max: 200 }),
    body('otp').trim().isLength({ min: 4, max: 8 }).withMessage('OTP must be 4–8 digits.'),
    validate,
    verifyOtp,
);

// Social Login
router.post('/social-login',
    authRateLimit,
    body('provider').trim().notEmpty().withMessage('Provider is required.').isLength({ max: 32 }),
    body('token').notEmpty().withMessage('Token is required.').isLength({ max: 4096 }),
    validate,
    socialLogin,
);

// Token lifecycle
router.post('/refresh',
    authRateLimit,
    body('refreshToken').notEmpty().withMessage('Refresh token is required.').isLength({ max: 256 }),
    validate,
    refresh,
);

router.post('/logout', protect, logout);

// Profile & Setup
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile); // General profile update
router.put('/setup-profile', protect, setupProfile); // Specific patient onboarding step
router.put('/setup-medical', protect, setupMedicalProfile); // Specific patient medical setup
router.put('/setup-security', protect, setupSecurity); // Security preferences setup

router.put('/change-password', protect, changePassword);

module.exports = router;
