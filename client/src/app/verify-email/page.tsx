"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { toast } from "sonner";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        const emailParam = searchParams.get("email");
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams]);

    const handleVerify = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !code) {
            toast.error("يرجى إدخال البريد الإلكتروني والكود");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post<{ msg?: string }>("/auth/verify-email", { email, code });
            toast.success(res.data.msg || "تم تفعيل الحساب بنجاح");

            // Redirect based on role or to login
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (err: any) {
            toast.error(err.response?.data?.msg || "الكود غير صحيح أو انتهت صلاحيته");
        } finally {
            setLoading(false);
        }
    }, [email, code, router]);

    const handleResend = useCallback(async () => {
        if (!email) {
            toast.error("يرجى إدخال البريد الإلكتروني أولاً");
            return;
        }

        setResending(true);
        try {
            await api.post("/auth/resend-verification", { email });
            toast.success("تم إعادة إرسال كود التفعيل");
        } catch (err: any) {
            toast.error(err.response?.data?.msg || "حدث خطأ أثناء إعادة الإرسال");
        } finally {
            setResending(false);
        }
    }, [email]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">تفعيل الحساب</CardTitle>
                    <CardDescription>أدخل كود التفعيل المكون من 6 أرقام المرسل إلى بريدك الإلكتروني</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleVerify} className="space-y-4 text-right">
                        <div className="space-y-2">
                            <Label htmlFor="email">البريد الإلكتروني</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                readOnly={!!searchParams.get("email")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">كود التفعيل</Label>
                            <Input
                                id="code"
                                placeholder="123456"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                maxLength={6}
                                className="text-center text-2xl tracking-[10px] font-bold"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "جاري التفعيل..." : "تفعيل الحساب"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 justify-center">
                    <p className="text-sm text-muted-foreground">
                        لم يصلك الكود؟{" "}
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="text-primary hover:underline font-medium disabled:opacity-50"
                        >
                            {resending ? "جاري الإرسال..." : "إعادة إرسال الكود"}
                        </button>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
