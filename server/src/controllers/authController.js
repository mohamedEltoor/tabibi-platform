const User = require('../models/User');
const Doctor = require('../models/Doctor');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendLoginOTP } = require('../services/emailService');

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, phone, governorate, city, address } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            // If user exists but is not verified, resend code and redirect
            if (!user.isEmailVerified) {
                const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
                user.emailVerificationToken = verificationToken;
                user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
                await user.save();

                await sendVerificationEmail(email, user.name, verificationToken);

                return res.status(200).json({
                    message: 'هذا الحساب موجود بالفعل ولكنه غير مفعل. تم إرسال كود جديد للإيميل.',
                    isEmailVerified: false,
                    email: user.email
                });
            }
            return res.status(400).json({ msg: 'هذا المستخدم موجود بالفعل، يرجى تسجيل الدخول' });
        }

        // Validate required fields for doctors
        if (role === 'doctor') {
            if (!phone || !governorate || !city || !address) {
                return res.status(400).json({ msg: 'Phone, governorate, city, and address are required for doctors' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Security: Only specific email can be admin, and it MUST be admin
        const ADMIN_EMAIL = 'dev.mohamedeltoor@gmail.com';
        let finalRole = role || 'patient';
        if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            finalRole = 'admin';
        } else if (finalRole === 'admin') {
            finalRole = 'patient';
        }

        // Generate 6-digit email verification code
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        console.log('Creating user with role:', finalRole);
        user = new User({
            name,
            email,
            password: hashedPassword,
            role: finalRole,
            phone,
            governorate,
            city,
            address,
            authProvider: 'local',
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
            isEmailVerified: false,
        });

        console.log('User object before save:', { role: user.role, name: user.name });
        await user.save();
        console.log('User object after save:', { role: user.role, id: user.id });

        // Send verification email
        try {
            await sendVerificationEmail(email, name, verificationToken);
            console.log('Verification email sent to:', email);
        } catch (emailError) {
            console.error('Error sending verification email:', emailError.message);
            // Don't fail registration if email sending fails
        }

        // Automatically create Doctor profile for doctor users
        if (role === 'doctor') {
            try {
                const { specialty: reqSpecialty, subspecialty } = req.body;
                const doctor = new Doctor({
                    user: user.id,
                    specialty: reqSpecialty || 'عام', // Use provided specialty or default
                    subspecialty: subspecialty || '',
                    bio: '',
                    pricing: {
                        consultationFee: 0,
                        currency: 'EGP'
                    },
                    availability: []
                });
                await doctor.save();
                console.log('Doctor profile created for user:', user.id);
            } catch (docErr) {
                console.error('Error creating doctor profile:', docErr.message);
                // Don't fail registration if doctor profile creation fails
                // User can create profile later through updateMyProfile
            }
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role,
                email: user.email
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    message: 'تم التسجيل بنجاح. يرجى التحقق من بريدك الإلكتروني',
                    messageEn: 'Registration successful. Please verify your email'
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Check if user is OAuth user trying to login with password
        if (user.authProvider === 'google' && !user.password) {
            return res.status(400).json({
                msg: 'يرجى استخدام تسجيل الدخول بواسطة جوجل',
                msgEn: 'Please use Google sign-in',
                useGoogleAuth: true
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'بيانات الدخول غير صحيحة' });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(401).json({
                msg: 'يرجى تفعيل حسابك أولاً. تم إرسال كود التحقق لبريدك.',
                isEmailVerified: false
            });
        }

        // Determine if user is new (created in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const isNewUser = user.createdAt > fiveMinutesAgo;

        // Check if user has any appointments (only for patients)
        let hasAppointments = false;
        if (user.role === 'patient') {
            const Appointment = require('../models/Appointment');
            const appointmentCount = await Appointment.countDocuments({ patient: user.id });
            hasAppointments = appointmentCount > 0;
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role,
                email: user.email
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    isNewUser,
                    hasAppointments
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ msg: 'يرجى إدخال البريد الإلكتروني والكود' });
        }

        // Find user with this email, code and check if not expired
        const user = await User.findOne({
            email,
            emailVerificationToken: code,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'الكود غير صحيح أو انتهت صلاحيته' });
        }

        // Verify user
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;

        await user.save();

        res.json({ msg: 'تم تفعيل الحساب بنجاح', success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ msg: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ msg: 'Email is already verified' });
        }

        // Generate new 6-digit code
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await user.save();

        // Send email
        await sendVerificationEmail(user.email, user.name, verificationToken);

        res.json({ msg: 'Verification email resent', success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.googleAuthCallback = async (req, res) => {
    try {
        // User is already authenticated by passport
        const user = req.user;

        // Check if user exists (should exist because passport creates/finds it)
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
        }

        // Determine if user is new (created in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const isNewUser = user.createdAt > fiveMinutesAgo;

        // Check if user has any appointments (only for patients)
        let hasAppointments = false;
        if (user.role === 'patient') {
            const Appointment = require('../models/Appointment');
            const appointmentCount = await Appointment.countDocuments({ patient: user.id });
            hasAppointments = appointmentCount > 0;
        }

        // Create JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                email: user.email
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) {
                    console.error('JWT Error:', err);
                    return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_generation_failed`);
                }

                // Redirect to frontend with token and metadata
                console.log(`[GoogleAuth] Redirecting to frontend with Role: ${user.role}, isNewUser: ${isNewUser}`);
                res.redirect(
                    `${process.env.FRONTEND_URL}/auth/google/callback?token=${token}&role=${user.role}&verified=true&isNewUser=${isNewUser}&hasAppointments=${hasAppointments}`
                );
            }
        );
    } catch (err) {
        console.error('Google Auth Error:', err.message);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
};

// Get current user info
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -emailVerificationToken -loginOTP');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Request OTP for login
exports.requestOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ msg: 'يرجى إدخال البريد الإلكتروني' });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'لا يوجد حساب بهذا البريد الإلكتروني' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to user
        user.loginOTP = otp;
        user.loginOTPExpires = otpExpires;
        await user.save();

        // Send OTP via email
        try {
            await sendLoginOTP(email, user.name, otp);
            res.json({ msg: 'تم إرسال كود التحقق إلى بريدك الإلكتروني', success: true });
        } catch (emailError) {
            console.error('Error sending OTP email:', emailError);
            return res.status(500).json({ msg: 'حدث خطأ عند إرسال البريد الإلكتروني' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Verify OTP and login
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ msg: 'يرجى إدخال البريد الإلكتروني والرمز' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'لا يوجد حساب بهذا البريد الإلكتروني' });
        }

        // Check if OTP is valid and not expired
        if (!user.loginOTP || user.loginOTP !== otp) {
            return res.status(400).json({ msg: 'الرمز غير صحيح' });
        }

        if (!user.loginOTPExpires || user.loginOTPExpires < new Date()) {
            return res.status(400).json({ msg: 'انتهى وقت الرمز. يرجى طلب رمز جديد' });
        }

        // Clear OTP and mark as verified
        user.loginOTP = undefined;
        user.loginOTPExpires = undefined;
        user.isEmailVerified = true; // Success OTP login means they own the email
        await user.save();

        // Determine if user is new (created in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const isNewUser = user.createdAt > fiveMinutesAgo;

        // Check if user has any appointments (only for patients)
        let hasAppointments = false;
        if (user.role === 'patient') {
            const Appointment = require('../models/Appointment');
            const appointmentCount = await Appointment.countDocuments({ patient: user.id });
            hasAppointments = appointmentCount > 0;
        }

        // Generate JWT token
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                email: user.email
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    role: user.role,
                    isEmailVerified: user.isEmailVerified,
                    isNewUser,
                    hasAppointments
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
