const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Doctor = require('../models/Doctor');

// Configure Google OAuth Strategy
console.log('--- Google OAuth Config Debug ---');
console.log('Client ID loaded:', process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 15) + '...' : 'MISSING');
console.log('Callback URL:', process.env.GOOGLE_CALLBACK_URL);
console.log('---------------------------------');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
            // Allow both localhost and production URLs
            proxy: true,
            passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                // Get role from query parameter (passed from frontend)
                // Note: The role is usually in req.query when initiated, 
                // but passport might need help keeping it through the flow.
                // We'll also check if it's stored in the 'state' if we used state.
                // For simplicity, we'll try to get it from the URL if we can 
                // or default to patient and let them change it.
                // Actually, a better way is for the frontend to pass it to the /google endpoint
                // and we can capture it there.

                // Get role from session (most reliable) or state (fallback)
                let requestedRole = null;

                if (req.session && req.session.role) {
                    requestedRole = req.session.role;
                    console.log('[GoogleAuth] Role recovered from SESSION:', requestedRole);
                } else if (req.query.state && req.query.state !== 'none') {
                    requestedRole = req.query.state;
                    console.log('[GoogleAuth] Role recovered from STATE:', requestedRole);
                }

                // Validate role - only 'doctor' or 'patient'
                const validRequestedRole = (requestedRole === 'doctor' || requestedRole === 'patient') ? requestedRole : null;

                console.log('[GoogleAuth] Validated Requested Role:', validRequestedRole);

                const email = profile.emails[0].value;
                const ADMIN_EMAIL = 'dev.mohamedeltoor@gmail.com';
                const isAuthorizedAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

                // Helper to ensure doctor profile (ONLY for non-admins)
                const ensureDoctorProfile = async (user) => {
                    if (user.role === 'doctor' && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
                        const existingDoctor = await Doctor.findOne({ user: user._id });
                        if (!existingDoctor) {
                            console.log('[GoogleAuth] Creating missing Doctor profile for:', user.email);
                            const doctorProfile = new Doctor({
                                user: user._id,
                                specialty: 'عام', // Default for OAuth
                                bio: '',
                                pricing: { consultationFee: 0, currency: 'EGP' },
                                availability: []
                            });
                            await doctorProfile.save();
                            console.log('[GoogleAuth] Doctor profile created successfully');
                        }
                    }
                };

                // Check if user already exists with this Google ID
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    console.log('[GoogleAuth] User found by GoogleID:', user.email, 'Current Database Role:', user.role);

                    // Force Admin role if email matches
                    if (isAuthorizedAdmin && user.role !== 'admin') {
                        console.log(`[GoogleAuth] Elevating user "${user.email}" to ADMIN`);
                        user.role = 'admin';
                        await user.save();
                    } else if (validRequestedRole === 'doctor' && user.role === 'patient') {
                        console.log(`[GoogleAuth] Upgrading existing user "${user.email}" from patient to doctor`);
                        user.role = 'doctor';
                        await user.save();
                    }

                    await ensureDoctorProfile(user);
                    return done(null, user);
                }

                // Check if user exists with the same email
                user = await User.findOne({ email });

                if (user) {
                    console.log('[GoogleAuth] User found by Email:', email, 'Current Database Role:', user.role);
                    // User exists with same email but different auth method
                    user.googleId = profile.id;
                    user.isEmailVerified = true;

                    // Force Admin role or upgrade to Doctor
                    if (isAuthorizedAdmin) {
                        user.role = 'admin';
                    } else if (validRequestedRole === 'doctor' && user.role === 'patient') {
                        console.log(`[GoogleAuth] Upgrading existing user email match "${email}" from patient to doctor`);
                        user.role = 'doctor';
                    }

                    if (!user.authProvider || user.authProvider === 'local') {
                        user.authProvider = 'google';
                    }
                    await user.save();

                    await ensureDoctorProfile(user);
                    return done(null, user);
                }

                // FOR NEW USERS:
                const finalRole = isAuthorizedAdmin ? 'admin' : (validRequestedRole || 'patient');
                console.log('[GoogleAuth] Creating NEW user. Final Role:', finalRole);

                // Create new user
                user = new User({
                    name: profile.displayName,
                    email: email,
                    googleId: profile.id,
                    authProvider: 'google',
                    isEmailVerified: true,
                    role: finalRole,
                });

                await user.save();
                console.log('[GoogleAuth] New User saved successfully:', user.email, 'Role:', user.role);

                await ensureDoctorProfile(user);
                return done(null, user);
            } catch (error) {
                console.error('Error in Google OAuth strategy:', error);
                return done(error, null);
            }
        }
    )
);

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
