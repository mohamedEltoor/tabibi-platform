"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // TODO: Implement forgot password API call
            // For now, just simulate success
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSuccess(true);
        } catch (err: any) {
            setError("حدث خطأ ما. يرجى المحاولة مرة أخرى.");
        } finally {
            setLoading(false);
        }
    }, []);

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <CardTitle className="text-2xl">تم إرسال البريد الإلكتروني</CardTitle>
                        <CardDescription className="text-base">
                            تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                            يرجى التحقق من بريدك الإلكتروني واتباع التعليمات لإعادة تعيين كلمة المرور.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Button asChild className="w-full">
                            <Link href="/login">
                                العودة إلى تسجيل الدخول
                                <ArrowRight className="mr-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">نسيت كلمة المرور؟</CardTitle>
                    <CardDescription>
                        أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link href="/login" className="text-sm text-primary hover:underline flex items-center gap-1">
                        <ArrowRight className="h-4 w-4" />
                        العودة إلى تسجيل الدخول
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
