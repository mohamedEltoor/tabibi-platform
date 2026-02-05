"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { getGovernorates, getCities } from "@/lib/egyptData";
import { ArrowLeft, Save, AlertCircle, Upload, User, Image as ImageIcon, MapPin as MapPinIcon } from "lucide-react";
import Link from "next/link";
import { ScheduleSettings } from "@/components/ScheduleSettings";
import dynamic from "next/dynamic";
import { compressImage } from "@/lib/utils";
import { popularSpecialties, otherSpecialties } from "@/lib/medicalData";

const MapPicker = dynamic(() => import("@/components/MapPicker").then(mod => mod.MapPicker), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center text-gray-400 font-bold">جاري تحميل الخريطة...</div>
});

export default function DoctorProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();

    // User fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [governorate, setGovernorate] = useState("");
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");

    // Doctor fields
    const [specialty, setSpecialty] = useState("");
    const [subspecialty, setSubspecialty] = useState("");
    const [title, setTitle] = useState("");
    const [gender, setGender] = useState("male");
    const [bio, setBio] = useState("");
    const [yearsOfExperience, setYearsOfExperience] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [consultationFee, setConsultationFee] = useState("");
    const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [schedule, setSchedule] = useState({
        dailySchedules: [] as any[],
        slotDuration: 30,
        waitingTime: 0
    });
    const [initialValues, setInitialValues] = useState<any>(null);

    const [isProfileComplete, setIsProfileComplete] = useState(true);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const governorates = getGovernorates();
    const cities = governorate ? getCities(governorate) : [];

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            const res = await api.get("/doctors/me", {
                headers: { "x-auth-token": token },
            });

            const userData = res.data.user;
            const doctorData = res.data.doctor;

            setName(userData.name || "");
            setEmail(userData.email || "");
            setPhone(userData.phone || "");
            setGovernorate(userData.governorate || "");
            setCity(userData.city || "");
            setAddress(userData.address || "");

            if (doctorData) {
                if (doctorData.isProfileComplete !== undefined) setIsProfileComplete(doctorData.isProfileComplete);
                if (doctorData.missingFields) setMissingFields(doctorData.missingFields);
                if (doctorData.specialty) setSpecialty(doctorData.specialty || "");
                if (doctorData.subspecialty) setSubspecialty(doctorData.subspecialty || "");
                if (doctorData.title) setTitle(doctorData.title || "");
                if (doctorData.gender) setGender(doctorData.gender || "male");
                if (doctorData.bio) setBio(doctorData.bio || "");
                if (doctorData.yearsOfExperience !== undefined) setYearsOfExperience(doctorData.yearsOfExperience?.toString() || "0");
                if (doctorData.profileImage) {
                    setProfileImage(doctorData.profileImage || "");
                }
                if (doctorData.location) setLocation(doctorData.location);
                if (doctorData.pricing?.consultationFee) setConsultationFee(doctorData.pricing.consultationFee.toString());
                if (doctorData.schedule) {
                    // Normalize dailySchedules to ensure all days are present for UI
                    const WEEK_DAYS_IDS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                    const existingSchedules = doctorData.schedule.dailySchedules || [];

                    const normalizedSchedules = WEEK_DAYS_IDS.map(dayId => {
                        const existing = existingSchedules.find((d: any) => d.day === dayId);
                        return existing || {
                            day: dayId,
                            startTime: "10:00",
                            endTime: "22:00",
                            enabled: false
                        };
                    });

                    setSchedule({
                        dailySchedules: normalizedSchedules,
                        slotDuration: doctorData.schedule.slotDuration || 30,
                        waitingTime: doctorData.schedule.waitingTime || 0
                    });
                }

                // Store initial values for differential updates
                setInitialValues({
                    name: userData.name || "",
                    phone: userData.phone || "",
                    governorate: userData.governorate || "",
                    city: userData.city || "",
                    address: userData.address || "",
                    specialty: doctorData.specialty || "",
                    subspecialty: doctorData.subspecialty || "",
                    title: doctorData.title || "",
                    gender: doctorData.gender || "male",
                    bio: doctorData.bio || "",
                    yearsOfExperience: doctorData.yearsOfExperience?.toString() || "0",
                    profileImage: doctorData.profileImage || "",
                    location: doctorData.location,
                    consultationFee: doctorData.pricing?.consultationFee?.toString() || "",
                    schedule: doctorData.schedule
                });
            }
        } catch (err: any) {
            console.error(err);
            setError("فشل في تحميل البيانات");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            const payload: any = {};

            // User fields
            if (name !== initialValues.name) payload.name = name;
            if (phone !== initialValues.phone) payload.phone = phone;
            if (governorate !== initialValues.governorate) payload.governorate = governorate;
            if (city !== initialValues.city) payload.city = city;
            if (address !== initialValues.address) payload.address = address;

            // Doctor fields
            if (specialty !== initialValues.specialty) payload.specialty = specialty;
            if (subspecialty !== initialValues.subspecialty) payload.subspecialty = subspecialty;
            if (title !== initialValues.title) payload.title = title;
            if (gender !== initialValues.gender) payload.gender = gender;
            if (bio !== initialValues.bio) payload.bio = bio;
            if (yearsOfExperience !== initialValues.yearsOfExperience) payload.yearsOfExperience = Number(yearsOfExperience);
            if (profileImage !== initialValues.profileImage) payload.profileImage = profileImage;

            if (JSON.stringify(location) !== JSON.stringify(initialValues.location)) {
                payload.location = location;
            }

            if (consultationFee !== initialValues.consultationFee) {
                payload.pricing = {
                    consultationFee: Number(consultationFee),
                    currency: 'EGP'
                };
            }

            // Schedule comparison (nested)
            const currentScheduleStr = JSON.stringify(schedule);
            const initialScheduleStr = JSON.stringify(initialValues.schedule);
            if (currentScheduleStr !== initialScheduleStr) {
                payload.schedule = schedule;
            }

            if (Object.keys(payload).length === 0) {
                setSuccess("لا توجد تغييرات للحفظ");
                setSaving(false);
                setTimeout(() => setSuccess(""), 3000);
                return;
            }

            const res = await api.put(
                "/doctors/me",
                payload,
                {
                    headers: { "x-auth-token": token },
                }
            );

            if (res.data.doctor) {
                if (res.data.doctor.isProfileComplete !== undefined) setIsProfileComplete(res.data.doctor.isProfileComplete);
                if (res.data.doctor.missingFields) setMissingFields(res.data.doctor.missingFields);

                // Update initial values after success
                setInitialValues((prev: any) => ({
                    ...prev,
                    ...payload,
                    // Ensure the strings match next time
                    yearsOfExperience: payload.yearsOfExperience?.toString() || prev.yearsOfExperience,
                    consultationFee: payload.pricing?.consultationFee?.toString() || prev.consultationFee
                }));
            }

            setSuccess("تم حفظ التغييرات بنجاح");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.response?.data?.msg || "حدث خطأ أثناء الحفظ");
        } finally {
            setSaving(false);
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // Compress and convert to Base64
                const compressed = await compressImage(file, 800, 800, 0.7);
                setProfileImage(compressed);
            } catch (err) {
                console.error("Image compression failed", err);
                setError("فشل في معالجة الصورة. يرجى تجربة صورة أخرى.");
            }
        }
    };

    if (loading) {
        return (
            <div className="container py-8">
                <p>جاري التحميل...</p>
            </div>
        );
    }

    return (
        <div className="container py-8 max-w-3xl">
            <div className="mb-6 flex items-center justify-between">
                <Link href="/dashboard/doctor">
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        العودة للوحة التحكم
                    </Button>
                </Link>
            </div>

            {/* Profile Visibility Alert */}
            {!isProfileComplete && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6 flex flex-col items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500" dir="rtl">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600 shrink-0">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-md font-bold text-amber-900 mb-1">ملفك الشخصي غير مكتمل</h3>
                            <div className="text-amber-800 text-sm leading-relaxed">
                                لن تظهر في نتائج بحث المرضى حتى تكمل البيانات التالية:
                                <ul className="list-disc list-inside mt-1 font-medium">
                                    {missingFields.includes('phone') && <li>رقم الهاتف</li>}
                                    {(missingFields.includes('governorate') || missingFields.includes('city') || missingFields.includes('address')) && <li>معلومات الموقع (المحافظة والمدينة والعنوان)</li>}
                                    {missingFields.includes('specialty') && <li>التخصص الطبي</li>}
                                    {missingFields.includes('consultationFee') && <li>سعر الكشف</li>}
                                    {missingFields.includes('schedule') && <li>تفعيل يوم واحد على الأقل في الجدول الزمني</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">الملف الشخصي</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">المعلومات الشخصية</h3>

                            <div className="space-y-2">
                                <Label htmlFor="name">الاسم الكامل</Label>
                                <Input
                                    id="name"
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
                                    value={email}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">
                                    لا يمكن تغيير البريد الإلكتروني
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">رقم الهاتف</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Profile Image Section */}
                            <div className="space-y-4 pt-4">
                                <Label>الصورة الشخصية</Label>
                                <div className="flex items-center gap-6">
                                    <div className="relative w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 group">
                                        {profileImage ? (
                                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-10 h-10 text-gray-400" />
                                        )}
                                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                            <Upload className="w-6 h-6 text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                        </label>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            ارفع صورة شخصية مهنية لتحسين ثقة المرضى في ملفك.
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => document.getElementById('profile-upload')?.click()}
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                            اختر صورة
                                            <input
                                                id="profile-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Map Location Section */}
                            <div className="space-y-4 pt-6 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <MapPinIcon className="h-5 w-5 text-red-500" />
                                    <Label className="text-lg font-bold">موقع العيادة على الخريطة</Label>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    حدد موقع عيادتك بدقة على الخريطة ليسهل على المرضى الوصول إليك.
                                </p>
                                <MapPicker value={location} onChange={setLocation} />
                            </div>
                        </div>

                        {/* Location Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">معلومات الموقع</h3>

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
                                <Label htmlFor="address">العنوان التفصيلي</Label>
                                <Input
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Professional Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">المعلومات المهنية</h3>

                            <div className="space-y-2">
                                <Label htmlFor="specialty">التخصص</Label>
                                <Select
                                    value={specialty}
                                    onValueChange={setSpecialty}
                                >
                                    <SelectTrigger id="specialty" className="text-right" dir="rtl">
                                        <SelectValue placeholder="اختر التخصص" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        <SelectGroup>
                                            <SelectLabel className="text-red-600 font-bold">التخصصات الأكثر شيوعاً</SelectLabel>
                                            {popularSpecialties.map(spec => (
                                                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                            ))}
                                        </SelectGroup>
                                        <SelectGroup>
                                            <SelectLabel>تخصصات أخرى</SelectLabel>
                                            {otherSpecialties.map(spec => (
                                                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">اللقب العلمي</Label>
                                <Select
                                    value={title}
                                    onValueChange={setTitle}
                                >
                                    <SelectTrigger id="title" className="text-right" dir="rtl">
                                        <SelectValue placeholder="اختر اللقب" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        <SelectItem value="أستاذ">أستاذ (Professor)</SelectItem>
                                        <SelectItem value="استشاري">استشاري (Consultant)</SelectItem>
                                        <SelectItem value="أخصائي">أخصائي (Specialist)</SelectItem>
                                        <SelectItem value="ممارس عام">ممارس عام (General Practitioner)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender">الجنس</Label>
                                <Select
                                    value={gender}
                                    onValueChange={setGender}
                                >
                                    <SelectTrigger id="gender" className="text-right" dir="rtl">
                                        <SelectValue placeholder="اختر الجنس" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        <SelectItem value="male">ذكر</SelectItem>
                                        <SelectItem value="female">أنثى</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subspecialty">التخصص الفرعي (اختياري)</Label>
                                <Input
                                    id="subspecialty"
                                    value={subspecialty}
                                    onChange={(e) => setSubspecialty(e.target.value)}
                                    placeholder="مثال: أمراض القلب التداخلية، جراحة العمود الفقري..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="consultationFee">سعر الكشف (ج.م)</Label>
                                <Input
                                    id="consultationFee"
                                    type="number"
                                    value={consultationFee}
                                    onChange={(e) => setConsultationFee(e.target.value)}
                                    placeholder="مثال: 200"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="experience">سنوات الخبرة</Label>
                                <Input
                                    id="experience"
                                    type="number"
                                    value={yearsOfExperience}
                                    onChange={(e) => setYearsOfExperience(e.target.value)}
                                    placeholder="مثال: 10"
                                    required
                                />
                            </div>

                            {/* Schedule Settings */}
                            <ScheduleSettings schedule={schedule} onChange={setSchedule} />


                            <div className="space-y-2">
                                <Label htmlFor="bio">نبذة عنك</Label>
                                <textarea
                                    id="bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="اكتب نبذة مختصرة عن خبراتك ومؤهلاتك"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">
                                {success}
                            </div>
                        )}

                        <Button type="submit" className="w-full gap-2" disabled={saving}>
                            <Save className="h-4 w-4" />
                            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
