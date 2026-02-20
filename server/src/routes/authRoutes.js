const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('../config/passport');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { msg: 'Too many attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { msg: 'Too many verification attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authLimiter, authController.register);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, authController.login);

// @route   POST api/auth/verify-email
// @desc   Verify email with 6-digit code
// @access  Public
router.post('/verify-email', verifyLimiter, authController.verifyEmail);

// @route   POST api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', authLimiter, authController.resendVerificationEmail);

// @route   GET api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', auth, authController.getCurrentUser);

// @route   POST api/auth/request-otp
// @desc    Request OTP for email login
// @access  Public
router.post('/request-otp', authLimiter, authController.requestOTP);

// @route   POST api/auth/verify-otp  
// @desc    Verify OTP and login
// @access  Public
router.post('/verify-otp', verifyLimiter, authController.verifyOTP);

// @route   GET api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', (req, res, next) => {
    const requestedRole = req.query.role;
    const role = (requestedRole === 'doctor' || requestedRole === 'patient') ? requestedRole : null;

    if (role && req.session) {
        req.session.role = role;
        req.session.save((err) => {
            if (err) console.error('[GoogleAuth] Session save error:', err);
            passport.authenticate('google', {
                scope: ['profile', 'email'],
                state: role || 'none',
                prompt: 'select_account'
            })(req, res, next);
        });
    } else {
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            state: role || 'none',
            prompt: 'select_account'
        })(req, res, next);
    }
});

// @route   GET api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login',
        session: false
    }),
    authController.googleAuthCallback
);

module.exports = router;

