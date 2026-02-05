const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('../config/passport');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

// @route   POST api/auth/verify-email
// @desc   Verify email with 6-digit code
// @access  Public
router.post('/verify-email', authController.verifyEmail);

// @route   POST api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', authController.resendVerificationEmail);

// @route   GET api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', auth, authController.getCurrentUser);

// @route   POST api/auth/request-otp
// @desc    Request OTP for email login
// @access  Public
router.post('/request-otp', authController.requestOTP);

// @route   POST api/auth/verify-otp  
// @desc    Verify OTP and login
// @access  Public
router.post('/verify-otp', authController.verifyOTP);

// @route   GET api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', (req, res, next) => {
    const requestedRole = req.query.role;

    // Validate role - only allow 'doctor' or 'patient'. If not provided, it might be a login attempt.
    const role = (requestedRole === 'doctor' || requestedRole === 'patient') ? requestedRole : null;

    console.log(`[GoogleAuth] Initiation started. Requested role: ${requestedRole}, Validated role: ${role}`);

    // Store role in session if we have one
    if (role && req.session) {
        req.session.role = role;
        req.session.save((err) => {
            if (err) {
                console.error('[GoogleAuth] Session save error:', err);
            } else {
                console.log(`[GoogleAuth] Role "${role}" stored and session saved successfully`);
            }

            passport.authenticate('google', {
                scope: ['profile', 'email'],
                state: role || 'none',
                prompt: 'select_account'
            })(req, res, next);
        });
    } else {
        console.log('[GoogleAuth] No specific role requested or no session available, proceeding to auth');
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
    (req, res, next) => {
        console.log('[GoogleAuth] Callback route reached. Query params:', req.query);
        next();
    },
    passport.authenticate('google', {
        failureRedirect: '/login',
        session: false
    }),
    authController.googleAuthCallback
);

module.exports = router;

