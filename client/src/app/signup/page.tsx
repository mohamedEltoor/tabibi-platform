"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import api from "@/lib/axios";
import { useRouter, useSearchParams } from "next/navigation";
import { getGovernorates, getCities } from "@/lib/egyptData";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useCallback } from "react";

interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    governorate?: string;
    city?: string;
    address?: string;
    specialty?: string;
    subspecialty?: string;
}

export default function SignupPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("patient");
    const [phone, setPhone] = useState("");

    useEffect(() => {
        const roleParam = searchParams.get("role");
        if (roleParam === "doctor" || roleParam === "patient") {
            setRole(roleParam);
        }
    }, [searchParams]);
    const [governorate, setGovernorate] = useState("");
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [subspecialty, setSubspecialty] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");


    const governorates = getGovernorates();
    const cities = governorate ? getCities(governorate) : [];

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const payload: RegisterPayload = { name, email, password, role };

            // Add doctor-specific fields if role is doctor
            if (role === "doctor") {
                if (!phone || !governorate || !city || !address || !specialty) {
                    setError("جميع الحقول مطلوبة للأطباء (ما عدا التخصص الفرعي)");
                    setLoading(false);
                    return;
                }
                payload.phone = phone;
                payload.governorate = governorate;
                payload.city = city;
                payload.address = address;
                payload.specialty = specialty;
                if (subspecialty) payload.subspecialty = subspecialty;
            }

            const res = await api.post<{ message: string }>("/auth/register", payload);

            // Store role for navbar preview
            localStorage.setItem("role", role);

            setSuccessMessage(res.data.message || "تم التسجيل بنجاح! يرجى التحقق من بريدك الإلكتروني");

            // Redirect to verification page
            setTimeout(() => {
                router.push(`/verify-email?email=${encodeURIComponent(email)}`);
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.msg || "حدث خطأ ما");
        } finally {
            setLoading(false);
        }
    }, [name, email, password, role, phone, governorate, city, address, specialty, subspecialty, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
                    <CardDescription>أدخل بياناتك لإنشاء حساب جديد</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">الاسم الكامل</Label>
                            <Input
                                id="name"
                                placeholder="الاسم"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>نوع الحساب</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="patient"
                                        checked={role === "patient"}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="accent-primary"
                                    />
                                    <span>مريض</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="doctor"
                                        checked={role === "doctor"}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="accent-primary"
                                    />
                                    <span>طبيب</span>
                                </label>
                            </div>
                        </div>

                        {/* Doctor-specific fields */}
                        {role === "doctor" && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="specialty">التخصص الطبي *</Label>
                                    <Select
                                        value={specialty}
                                        onValueChange={setSpecialty}
                                    >
                                        <SelectTrigger id="specialty" className="text-right" dir="rtl">
                                            <SelectValue placeholder="اختر التخصص" />
                                        </SelectTrigger>
                                        <SelectContent dir="rtl">
                                            <SelectGroup>
                                                <SelectLabel>التخصصات الأكثر شيوعاً</SelectLabel>
                                                <SelectItem value="باطنة">باطنة</SelectItem>
                                                <SelectItem value="أطفال">أطفال</SelectItem>
                                                <SelectItem value="نساء وتوليد">نساء وتوليد</SelectItem>
                                                <SelectItem value="عظام">عظام</SelectItem>
                                                <SelectItem value="قلب وأوعية دموية">قلب وأوعية دموية</SelectItem>
                                                <SelectItem value="جلدية">جلدية</SelectItem>
                                                <SelectItem value="أنف وأذن وحنجرة">أنف وأذن وحنجرة</SelectItem>
                                                <SelectItem value="عيون">عيون</SelectItem>
                                                <SelectItem value="أسنان">أسنان</SelectItem>
                                                <SelectItem value="نفسية">نفسية</SelectItem>
                                            </SelectGroup>
                                            <SelectGroup>
                                                <SelectLabel>تخصصات أخرى</SelectLabel>
                                                <SelectItem value="جراحة عامة">جراحة عامة</SelectItem>
                                                <SelectItem value="مسالك بولية">مسالك بولية</SelectItem>
                                                <SelectItem value="كلى">كلى</SelectItem>
                                                <SelectItem value="كبد">كبد</SelectItem>
                                                <SelectItem value="صدر">صدر</SelectItem>
                                                <SelectItem value="أعصاب">أعصاب</SelectItem>
                                                <SelectItem value="روماتيزم">روماتيزم</SelectItem>
                                                <SelectItem value="تغذية">تغذية</SelectItem>
                                                <SelectItem value="علاج طبيعي">علاج طبيعي</SelectItem>
                                                <SelectItem value="تخسيس">تخسيس</SelectItem>
                                                <SelectItem value="عام">عام</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subspecialty">التخصص الفرعي (اختياري)</Label>
                                    <Input
                                        id="subspecialty"
                                        placeholder="مثال: أمراض القلب التداخلية، جراحة العمود الفقري..."
                                        value={subspecialty}
                                        onChange={(e) => setSubspecialty(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">رقم الهاتف</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="01xxxxxxxxx"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required={role === "doctor"}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="governorate">المحافظة</Label>
                                    <Select
                                        value={governorate}
                                        onValueChange={(val) => {
                                            setGovernorate(val);
                                            setCity("");
                                        }}
                                    >
                                        <SelectTrigger id="governorate" className="text-right" dir="rtl">
                                            <SelectValue placeholder="اختر المحافظة" />
                                        </SelectTrigger>
                                        <SelectContent dir="rtl">
                                            {governorates.map((gov) => (
                                                <SelectItem key={gov} value={gov}>
                                                    {gov}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">المدينة</Label>
                                    <Select
                                        value={city}
                                        onValueChange={setCity}
                                        disabled={!governorate}
                                    >
                                        <SelectTrigger id="city" className="text-right" dir="rtl">
                                            <SelectValue placeholder="اختر المدينة" />
                                        </SelectTrigger>
                                        <SelectContent dir="rtl">
                                            {cities.map((c) => (
                                                <SelectItem key={c} value={c}>
                                                    {c}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">العنوان</Label>
                                    <Input
                                        id="address"
                                        placeholder="العنوان التفصيلي"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        required={role === "doctor"}
                                    />
                                </div>
                            </>
                        )}

                        {error && <p className="text-sm text-destructive">{error}</p>}
                        {successMessage && <p className="text-sm text-green-600 font-medium">{successMessage}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "جاري التحميل..." : "إنشاء حساب"}
                        </Button>

                        {/* OR Divider */}
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-300"></span>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">أو</span>
                            </div>
                        </div>

                        {/* Google Sign-In */}
                        <GoogleSignInButton mode="signup" role={role} />
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        لديك حساب بالفعل؟{" "}
                        <Link href="/login" className="text-primary hover:underline">
                            تسجيل الدخول
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
