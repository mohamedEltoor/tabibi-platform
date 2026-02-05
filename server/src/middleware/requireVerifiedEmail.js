/**
 * Middleware to check if user's email is verified
 * Use this middleware on routes that require email verification
 */
const requireVerifiedEmail = (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
        return res.status(401).json({ msg: 'غير مصرح - Not authorized' });
    }

    // Check if email is verified
    if (!req.user.isEmailVerified) {
        return res.status(403).json({
            msg: 'يرجى التحقق من بريدك الإلكتروني لاستخدام هذه الميزة',
            msgEn: 'Please verify your email to use this feature',
            requiresVerification: true
        });
    }

    next();
};

module.exports = requireVerifiedEmail;
