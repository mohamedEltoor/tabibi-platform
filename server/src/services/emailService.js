const nodemailer = require('nodemailer');

// Create reusable transporter using Gmail SMTP
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

/**
 * Send email verification email to user
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {string} token - Verification token
 */
const sendVerificationEmail = async (email, name, token) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"منصة حجز الأطباء" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'كود تفعيل الحساب - Verification Code',
            html: `
                <!DOCTYPE html>
                <html dir="rtl" lang="ar">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 30px; text-align: center; }
                        .content { padding: 40px 30px; color: #333333; text-align: center; }
                        .code-box { background-color: #f0f4ff; padding: 20px; text-align: center; margin: 25px 0; border-radius: 10px; border: 2px dashed #667eea; }
                        .code { color: #667eea; font-size: 36px; font-weight: bold; letter-spacing: 10px; margin: 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🏥 منصة حجز الأطباء</h1>
                        </div>
                        <div class="content">
                            <h2>مرحباً ${name}! 👋</h2>
                            <p>شكراً لتسجيلك معنا. استخدم كود التفعيل التالي لتأكيد حسابك:</p>
                            <div class="code-box">
                                <p class="code">${token}</p>
                            </div>
                            <p style="color: #666; font-size: 14px;">هذا الكود صالح لمدة 24 ساعة.</p>
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            
                            <div style="direction: ltr; text-align: left;">
                                <h3 style="color: #667eea;">Welcome ${name}! 👋</h3>
                                <p>Thank you for registering. Use the following verification code to activate your account:</p>
                                <p style="color: #888; font-size: 14px;">This code is valid for 24 hours.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `مرحباً ${name}!\n\nكود تفعيل حسابك هو: ${token}\n\nهذا الكود صالح لمدة 24 ساعة.`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
};

/**
 * Send password reset email (for future use)
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {string} token - Reset token
 */
const sendPasswordResetEmail = async (email, name, token) => {
    try {
        const transporter = createTransporter();

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"منصة حجز الأطباء" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'إعادة تعيين كلمة المرور - Password Reset',
            html: `
                <!DOCTYPE html>
                <html dir="rtl" lang="ar">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 40px 20px; text-align: center; }
                        .content { padding: 40px 30px; color: #333333; }
                        .button { display: inline-block; padding: 15px 40px; margin: 25px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none; border-radius: 50px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 إعادة تعيين كلمة المرور</h1>
                        </div>
                        <div class="content">
                            <h2>مرحباً ${name}</h2>
                            <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
                            <div style="text-align: center;">
                                <a href="${resetUrl}" class="button">إعادة تعيين كلمة المرور</a>
                            </div>
                            <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.</p>
                            <p>الرابط صالح لمدة ساعة واحدة فقط.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
};

/**
 * Send login OTP code
 * @param {string} email - User's email address
 * @param {string} name - User's name  
 * @param {string} otp - 6-digit OTP code
 */
const sendLoginOTP = async (email, name, otp) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || `"طبيبي" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'كود تسجيل الدخول - طبيبي',
            html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #dc2626; margin-bottom: 20px;">مرحباً ${name}</h2>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">
                        استخدم الكود التالي لتسجيل الدخول:
                   </p>
                    <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
                        <h1 style="color: #dc2626; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                        صالح لمدة 10 دقائق فقط.
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        إذا لم تطلب هذا الكود، يرجى تجاهل هذه الرسالة.
                    </p>
                </div>
            </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Login OTP email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending login OTP email:', error);
        throw error;
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendLoginOTP,
};
