'use client';
export const dynamic = 'force-dynamic';


import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function GoogleCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

    useEffect(() => {
        const token = searchParams.get('token');
        const role = searchParams.get('role');
        const error = searchParams.get('error');
        const isNewUser = searchParams.get('isNewUser') === 'true';
        const hasAppointments = searchParams.get('hasAppointments') === 'true';

        if (error) {
            Promise.resolve().then(() => setStatus('error'));
            setTimeout(() => {
                router.push('/login?error=google_auth_failed');
            }, 2000);
            return;
        }

        if (token && role) {
            localStorage.setItem('token', token);
            localStorage.setItem('role', role);

            window.dispatchEvent(new Event("auth-change"));
            Promise.resolve().then(() => setStatus('success'));

            setTimeout(() => {
                if (role === 'doctor') {
                    router.push('/dashboard/doctor');
                } else if (role === 'admin') {
                    router.push('/dashboard/admin');
                } else if (role === 'patient') {
                    if (isNewUser) {
                        router.push('/search');
                    } else if (hasAppointments) {
                        router.push('/dashboard/patient');
                    } else {
                        router.push('/');
                    }
                } else {
                    router.push('/');
                }
            }, 1500);
        } else {
            Promise.resolve().then(() => setStatus('error'));
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-100" dir="rtl">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                {status === 'processing' && (
                    <>
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-6"></div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">جارٍ تسجيل الدخول...</h2>
                        <p className="text-gray-600">يرجى الانتظار لحظة</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">تم تسجيل الدخول بنجاح!</h2>
                        <p className="text-gray-600">جارٍ التحويل إلى لوحة التحكم...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">حدث خطأ</h2>
                        <p className="text-gray-600">فشل تسجيل الدخول بواسطة Google</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default function GoogleCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-100">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
            </div>
        }>
            <GoogleCallbackContent />
        </Suspense>
    );
}
