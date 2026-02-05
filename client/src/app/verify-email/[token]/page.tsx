'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

export default function VerifyEmailPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const response = await axios.get(`${API_URL}/api/auth/verify-email/${token}`);

                setStatus('success');
                setMessage(response.data.msg || 'تم التحقق من بريدك الإلكتروني بنجاح');

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/login?verified=true');
                }, 3000);
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.msg || 'فشل التحقق من البريد الإلكتروني');
            }
        };

        if (token) {
            verifyEmail();
        }
    }, [token, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-100 p-4" dir="rtl">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                {status === 'loading' && (
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-6"></div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">جارٍ التحقق...</h2>
                        <p className="text-gray-600">يرجى الانتظار لحظة</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">✓ تم التحقق بنجاح!</h2>
                        <p className="text-gray-600 mb-4">{message}</p>
                        <p className="text-sm text-gray-500">سيتم تحويلك إلى صفحة تسجيل الدخول...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">فشل التحقق</h2>
                        <p className="text-gray-600 mb-6">{message}</p>

                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg
                                         hover:bg-purple-700 transition-colors font-medium"
                            >
                                الذهاب إلى تسجيل الدخول
                            </button>
                            <button
                                onClick={() => router.push('/register')}
                                className="w-full px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg
                                         hover:bg-purple-50 transition-colors font-medium"
                            >
                                إعادة التسجيل
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
