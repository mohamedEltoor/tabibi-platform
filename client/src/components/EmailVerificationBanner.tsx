'use client';

import React, { useState } from 'react';
import axios from 'axios';

interface EmailVerificationBannerProps {
    userEmail: string;
    onResend?: () => void;
}

export default function EmailVerificationBanner({
    userEmail,
    onResend
}: EmailVerificationBannerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isDismissed, setIsDismissed] = useState(false);

    const handleResendEmail = async () => {
        setIsLoading(true);
        setMessage('');

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const response = await axios.post(`${API_URL}/api/auth/resend-verification`, {
                email: userEmail
            });

            setMessage(response.data.msg || 'تم إرسال رسالة التحقق بنجاح');
            if (onResend) onResend();
        } catch (error: any) {
            setMessage(error.response?.data?.msg || 'حدث خطأ أثناء إرسال الرسالة');
        } finally {
            setIsLoading(false);
        }
    };

    if (isDismissed) return null;

    return (
        <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 mb-6 rounded-lg shadow-sm" dir="rtl">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-sm font-bold text-yellow-800">
                            يجب التحقق من البريد الإلكتروني
                        </h3>
                    </div>

                    <p className="text-sm text-yellow-700 mb-3">
                        لاستخدام جميع ميزات المنصة، يرجى التحقق من بريدك الإلكتروني.
                        لقد أرسلنا رسالة تحقق إلى <strong>{userEmail}</strong>
                    </p>

                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={handleResendEmail}
                            disabled={isLoading}
                            className="text-sm font-medium text-yellow-800 hover:text-yellow-900 
                                     underline disabled:opacity-50 disabled:cursor-not-allowed
                                     transition-colors"
                        >
                            {isLoading ? 'جارٍ الإرسال...' : 'إعادة إرسال رسالة التحقق'}
                        </button>

                        {message && (
                            <span className="text-sm text-yellow-700">
                                {message}
                            </span>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => setIsDismissed(true)}
                    className="text-yellow-600 hover:text-yellow-800 transition-colors mr-2"
                    aria-label="إغلاق"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
