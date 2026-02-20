"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import api from "@/lib/axios";
import { useRouter, useSearchParams } from "next/navigation";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface AuthResponseData {
    token: string;
    role: string;
    isEmailVerified: boolean;
    isNewUser?: boolean;
    hasAppointments?: boolean;
    msg?: string;
    msgEn?: string;
    useGoogleAuth?: boolean;
}

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [otpEmail, setOtpEmail] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check for Google auth errors or success messages
    useEffect(() => {
        const googleError = searchParams.get('error');
        const verified = searchParams.get('verified');

        if (googleError === 'google_auth_failed') {
            setError('فشل تسجيل الدخول بواسطة Google');
        } else if (verified === 'true') {
            setError('');
        }
    }, [searchParams]);

    const handleRedirect = useCallback((data: AuthResponseData) => {
        const role = data.role;
        const isNewUser = data.isNewUser;
        const hasAppointments = data.hasAppointments;

        if (role === "doctor") {
            router.push("/dashboard/doctor");
        } else if (role === "admin") {
            router.push("/dashboard/admin");
        } else if (role === "patient") {
            if (isNewUser) {
                router.push("/search");
            } else if (hasAppointments) {
                router.push("/dashboard/patient");
            } else {
                router.push("/");
            }
        } else {
            router.push("/");
        }
    }, [router]);

    const handlePasswordLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await api.post<AuthResponseData>("/auth/login", { email, password });
            const data = res.data;
            localStorage.setItem("token", data.token);

            if (data.isEmailVerified !== undefined) {
                localStorage.setItem("isEmailVerified", data.isEmailVerified.toString());
            }

            if (data.role) {
                localStorage.setItem("role", data.role);
            }

            // Trigger navbar update
            window.dispatchEvent(new Event("auth-change"));

            handleRedirect(data);
        } catch (err: any) {
            const errorMsg = err.response?.data?.msg || "حدث خطأ ما";
            const isEmailVerified = err.response?.data?.isEmailVerified;

            if (isEmailVerified === false) {
                setError(errorMsg);
                // Redirect after a short delay so user can read the message
                setTimeout(() => {
                    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
                }, 2500);
                return;
            }

            const useGoogleAuth = err.response?.data?.useGoogleAuth;
            if (useGoogleAuth) {
                setError(errorMsg + " - " + (err.response?.data?.msgEn || ""));
            } else {
                setError(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    }, [email, password, handleRedirect, router]);

    const handleRequestOTP = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await api.post<{ msg: string }>("/auth/request-otp", { email: otpEmail });
            toast.success(res.data.msg || "تم إرسال كود التحقق إلى بريدك الإلكتروني");
            setOtpSent(true);
        } catch (err: any) {
            const errorMsg = err.response?.data?.msg || "حدث خطأ ما";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [otpEmail]);

    const handleVerifyOTP = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await api.post<AuthResponseData>("/auth/verify-otp", { email: otpEmail, otp });
            const data = res.data;
            localStorage.setItem("token", data.token);

            if (data.isEmailVerified !== undefined) {
                localStorage.setItem("isEmailVerified", data.isEmailVerified.toString());
            }

            if (data.role) {
                localStorage.setItem("role", data.role);
            }

            // Trigger navbar update
            window.dispatchEvent(new Event("auth-change"));

            toast.success("تم تسجيل الدخول بنجاح!");
            handleRedirect(data);
        } catch (err: any) {
            const errorMsg = err.response?.data?.msg || "حدث خطأ ما";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [otpEmail, otp, handleRedirect]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
                    <CardDescription>اختر طريقة تسجيل الدخول المفضلة لديك</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="password" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="password">كلمة المرور</TabsTrigger>
                            <TabsTrigger value="otp">كود البريد</TabsTrigger>
                        </TabsList>

                        {/* Password Login Tab */}
                        <TabsContent value="password">
                            <form onSubmit={handlePasswordLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">البريد الإلكتروني</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">كلمة المرور</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                {error && (
                                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                                        {error}
                                    </div>
                                )}
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* OTP Login Tab */}
                        <TabsContent value="otp">
                            {!otpSent ? (
                                <form onSubmit={handleRequestOTP} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="otpEmail">البريد الإلكتروني</Label>
                                        <Input
                                            id="otpEmail"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={otpEmail}
                                            onChange={(e) => setOtpEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    {error && (
                                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                                            {error}
                                        </div>
                                    )}
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? "جاري الإرسال..." : "إرسال الكود"}
                                    </Button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyOTP} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="otp">كود التحقق</Label>
                                        <Input
                                            id="otp"
                                            type="text"
                                            placeholder="123456"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            maxLength={6}
                                            required
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            تم إرسال الكود إلى {otpEmail}
                                        </p>
                                    </div>
                                    {error && (
                                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                                            {error}
                                        </div>
                                    )}
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? "جاري التحقق..." : "تحقق وتسجيل الدخول"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full"
                                        onClick={() => {
                                            setOtpSent(false);
                                            setOtp("");
                                            setError("");
                                        }}
                                    >
                                        إرسال كود جديد
                                    </Button>
                                </form>
                            )}
                        </TabsContent>
                    </Tabs>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-muted-foreground">أو</span>
                        </div>
                    </div>

                    <GoogleSignInButton />
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <p className="text-sm text-muted-foreground">
                        لا تملك حساباً؟{" "}
                        <Link href="/signup" className="text-primary hover:underline">
                            سجل الآن
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
