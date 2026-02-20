"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import { MapPin as MapPinIcon, Clock, Calendar as CalendarIcon, Home, CheckCircle2, Award, ShieldCheck, GraduationCap, Info, Wallet, ChevronLeft, Stethoscope, Star } from "lucide-react";
import { BookingCalendar } from "@/components/BookingCalendar";
import { format, isToday, isTomorrow } from "date-fns";
import { ar } from "date-fns/locale";
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getFirstAvailableSlot } from "@/lib/scheduleUtils";
import { toast } from "sonner";
import { formatTime12h } from "@/lib/utils";
import dynamic from "next/dynamic";
import NextImage from "next/image";

interface DoctorUser {
    name: string;
    city: string;
    governorate: string;
    address: string;
    phone: string;
}

interface Doctor {
    user: DoctorUser;
    specialty: string;
    subspecialty?: string;
    bio: string;
    profileImage?: string;
    gender: string;
    rating?: number;
    yearsOfExperience?: number;
    pricing: {
        consultationFee: number;
    };
    schedule: any; // Keeping any for complex schedule for now or could define ScheduleConfig
    location?: {
        lat: number;
        lng: number;
    };
}

const MapView = dynamic(() => import("@/components/MapPicker").then(mod => {
    return function MapDisplay({ value }: { value: { lat: number, lng: number } }) {
        return (
            <div className="h-full w-full relative">
                <mod.MapPicker value={value} onChange={() => { }} />
                <div className="absolute inset-0 z-[1001] bg-transparent cursor-default" />
            </div>
        );
    }
}), { ssr: false });

export default function DoctorProfileClient({ initialDoctor }: { initialDoctor: Doctor }) {
    const { id } = useParams();
    const [doctor] = useState<Doctor>(initialDoctor);
    const [bookedSlots, setBookedSlots] = useState<{ date: string, time: string }[]>([]);
    const [bookingDate, setBookingDate] = useState("");
    const [bookingTime, setBookingTime] = useState("");
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showGuestForm, setShowGuestForm] = useState(false);
    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [confirmPhone, setConfirmPhone] = useState("");

    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const router = useRouter();

    const fetchBookedSlots = useCallback(async () => {
        try {
            const res = await api.get(`/doctors/${id}/booked-slots`);
            setBookedSlots(res.data);
        } catch (err) {
            console.error(err);
        }
    }, [id]);

    useEffect(() => {
        if (id && id !== "undefined") {
            Promise.resolve().then(() => fetchBookedSlots());
        }
    }, [id, fetchBookedSlots]);

    const handleBookClick = async () => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const userRes = await api.get("/auth/me");
                if (userRes.data.phone) {
                    submitBooking(userRes.data.phone);
                } else {
                    setShowGuestForm(true);
                }
            } catch (err) {
                console.error(err);
                toast.error("حدث خطأ. يرجى المحاولة مرة أخرى.");
            }
        } else {
            setShowGuestForm(true);
        }
    };

    const submitBooking = async (phone: string, guestDetails?: { name: string, phone: string }) => {
        try {
            const payload: Record<string, any> = {
                doctorId: id,
                date: bookingDate,
                time: bookingTime,
                source: "website",
            };

            if (guestDetails) {
                payload.guestDetails = guestDetails;
            } else {
                payload.phone = phone;
            }

            await api.post("/appointments", payload);

            setIsDrawerOpen(false);
            setShowGuestForm(false);
            toast.success("تم حجز الموعد بنجاح! سيتم التواصل معك للتأكيد.");

            if (!guestDetails) {
                router.push("/dashboard/patient");
            } else {
                setGuestName("");
                setGuestPhone("");
                setConfirmPhone("");
                setBookingDate("");
                setBookingTime("");
                fetchBookedSlots();
            }
        } catch (err: unknown) {
            console.error(err);
            let errorMsg = "فشل الحجز. يرجى المحاولة مرة أخرى.";
            if (typeof err === "object" && err !== null && "response" in err) {
                const axiosError = err as { response: { data?: { msg?: string } } };
                errorMsg = axiosError.response.data?.msg || errorMsg;
            }
            toast.error(errorMsg);
        }
    };

    const handleGuestSubmit = () => {
        const token = localStorage.getItem("token");
        const phoneRegex = /^01[0125][0-9]{8}$/;

        if (token) {
            if (!guestPhone) {
                toast.error("يرجى إدخال رقم الموبايل");
                return;
            }
            if (!phoneRegex.test(guestPhone)) {
                toast.error("يرجى إدخال رقم موبايل مصري صحيح");
                return;
            }
            submitBooking(guestPhone);
        } else {
            if (!guestName || !guestPhone || !confirmPhone) {
                toast.error("يرجى ملء جميع البيانات");
                return;
            }
            if (!phoneRegex.test(guestPhone)) {
                toast.error("يرجى إدخال رقم موبايل مصري صحيح");
                return;
            }
            if (guestPhone !== confirmPhone) {
                toast.error("رقم الهاتف غير متطابق");
                return;
            }
            submitBooking(guestPhone, { name: guestName, phone: guestPhone });
        }
    };

    const handleSlotSelect = (date: Date, time: string) => {
        const formattedDate = format(date, "yyyy-MM-dd");
        setBookingDate(formattedDate);
        setBookingTime(time);
    };

    const renderFirstAvailableSlot = () => {
        if (!doctor?.schedule) return null;
        const firstSlot = getFirstAvailableSlot(doctor.schedule);
        if (!firstSlot) return (
            <div className="flex items-center gap-2 text-red-500 font-bold bg-red-50 px-4 py-2 rounded-xl border border-red-100 w-fit mt-4">
                <Clock className="w-4 h-4" />
                <span>لا توجد مواعيد متاحة حالياً</span>
            </div>
        );

        const dateLabel = isToday(firstSlot.date) ? 'اليوم' : isTomorrow(firstSlot.date) ? 'غداً' : format(firstSlot.date, "EEEE, d MMMM", { locale: ar });
        return (
            <div className="flex items-center gap-2 text-green-700 font-bold bg-green-50 px-4 py-2 rounded-xl border border-green-100 w-fit mt-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <CheckCircle2 className="h-4 w-4" />
                <span>أقرب موعد: {dateLabel} الساعة {firstSlot.time}</span>
            </div>
        );
    };

    if (!doctor || !doctor.user) return null;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">
            {/* Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Physician",
                        "name": doctor.user.name,
                        "image": doctor.profileImage || "",
                        "medicalSpecialty": doctor.specialty,
                        "address": {
                            "@type": "PostalAddress",
                            "addressLocality": doctor.user.city,
                            "addressRegion": doctor.user.governorate,
                            "streetAddress": doctor.user.address
                        },
                        "description": doctor.bio,
                        "telephone": doctor.user.phone,
                        "priceRange": doctor.pricing?.consultationFee ? `${doctor.pricing.consultationFee} EGP` : ""
                    })
                }}
            />

            {/* Premium Header/Hero */}
            <section className="bg-white border-b pt-32 pb-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/4 h-full bg-red-50/30 skew-x-[-15deg] translate-x-12 z-0" />
                <div className="container px-4 relative z-10">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
                        <div className="relative group">
                            <div className="w-48 h-48 rounded-[2.5rem] bg-white p-2 shadow-2xl relative overflow-hidden">
                                <div className="w-full h-full rounded-[2rem] bg-gray-50 flex items-center justify-center text-7xl overflow-hidden">
                                    {doctor.profileImage ? (
                                        <NextImage src={doctor.profileImage} alt={doctor.user.name} width={200} height={200} className="w-full h-full object-cover" />
                                    ) : (
                                        doctor.gender === 'female' ? "👩‍⚕️" : "👨‍⚕️"
                                    )}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-2xl shadow-lg border-2 border-white">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">{doctor.user.name}</h1>
                                <div className="inline-flex items-center gap-1.5 bg-yellow-400/10 text-yellow-700 px-3 py-1 rounded-full text-sm font-black border border-yellow-200">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span>{doctor.rating || "جديد"}</span>
                                </div>
                            </div>

                            <p className="text-2xl text-red-600 font-bold flex items-center gap-2">
                                <Stethoscope className="w-6 h-6" />
                                {doctor.specialty}
                            </p>

                            <div className="flex flex-wrap gap-4 pt-2">
                                {doctor.user?.city && (
                                    <div className="flex items-center gap-2 text-gray-500 font-medium">
                                        <MapPinIcon className="w-4 h-4 text-red-400" />
                                        <span>{doctor.user.city}، {doctor.user.governorate}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-500 font-medium">
                                    <Award className="w-4 h-4 text-red-400" />
                                    <span>{doctor.yearsOfExperience || 0} سنوات خبرة</span>
                                </div>
                            </div>

                            {renderFirstAvailableSlot()}
                        </div>
                    </div>
                </div>
            </section>

            <div className="container px-4 py-12 relative">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 overflow-visible">
                    {/* Left Column: Info Sections */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center gap-2">
                                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-1">
                                    <Wallet className="w-6 h-6 text-red-500" />
                                </div>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">سعر الكشف</span>
                                <span className="text-xl font-black text-gray-900">{doctor.pricing?.consultationFee} <small className="text-xs font-normal">ج.م</small></span>
                            </div>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center gap-2">
                                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-1">
                                    <Clock className="w-6 h-6 text-red-500" />
                                </div>
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">مدة الكشف</span>
                                <span className="text-xl font-black text-gray-900">{doctor.schedule?.slotDuration || 30} <small className="text-xs font-normal">دقيقة</small></span>
                            </div>
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-row items-center gap-4">
                                <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-red-600">
                                    <Award className="w-6 h-6" />
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">سنوات الخبرة</p>
                                    <p className="text-xl font-bold text-gray-900">{doctor.yearsOfExperience || 0} سنة</p>
                                </div>
                            </div>
                        </div>

                        {/* Bio Section */}
                        <section className="space-y-4">
                            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                <span className="w-2 h-8 bg-red-600 rounded-full" />
                                عن الدكتور
                            </h3>
                            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                                <CardContent className="p-8 leading-relaxed text-gray-600 font-medium whitespace-pre-wrap">
                                    {doctor.bio || "لا توجد نبذة تعريفية متاحة حالياً لهذا الطبيب."}
                                </CardContent>
                            </Card>
                        </section>

                        {/* Qualifications / Specialty Details */}
                        <section className="space-y-4">
                            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                <span className="w-2 h-8 bg-red-600 rounded-full" />
                                التخصص والخدمات
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <Card className="border-none shadow-sm rounded-3xl">
                                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shrink-0">
                                            <GraduationCap className="w-5 h-5 text-white" />
                                        </div>
                                        <CardTitle className="text-lg font-black pt-2">التخصص الرئيسي</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-6 text-gray-600 font-bold">
                                        {doctor.specialty}
                                    </CardContent>
                                </Card>
                                <Card className="border-none shadow-sm rounded-3xl">
                                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shrink-0">
                                            <Info className="w-5 h-5 text-white" />
                                        </div>
                                        <CardTitle className="text-lg font-black pt-2">التخصص الفرعي</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-6 text-gray-600 font-bold">
                                        {doctor.subspecialty || "لا يوجد تخصص فرعي مسجل"}
                                    </CardContent>
                                </Card>
                                <Card className="border-none shadow-sm rounded-3xl p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                                            <Clock className="w-4 h-4 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold mb-0.5">ساعات العمل</p>
                                            <p className="text-sm font-black text-gray-900">
                                                {doctor.schedule?.startTime ? formatTime12h(doctor.schedule.startTime) : "10:00 ص"} - {doctor.schedule?.endTime ? formatTime12h(doctor.schedule.endTime) : "10:00 م"}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </section>

                        {/* Clinic Location */}
                        <section className="space-y-4">
                            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                <span className="w-2 h-8 bg-red-600 rounded-full" />
                                الموقع والعيادات
                            </h3>
                            <Card className="border-none shadow-sm rounded-3xl overflow-hidden group">
                                <div className="p-8 flex flex-col sm:flex-row gap-6 items-start">
                                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center shrink-0 border border-red-100 group-hover:scale-110 transition-transform duration-500">
                                        <Home className="w-7 h-7 text-red-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-black text-gray-900">عيادة د. {doctor.user.name.split(' ').pop()}</h4>
                                        <p className="text-gray-500 font-medium leading-relaxed max-w-md">
                                            {doctor.user.address ? `${doctor.user.address}، ${doctor.user.city}، ${doctor.user.governorate}` : "الموقع مسجل لدى إدارة المنصة"}
                                        </p>
                                        <Button
                                            variant="link"
                                            className="p-0 text-red-600 font-black h-auto"
                                            onClick={() => {
                                                if (doctor.location?.lat && doctor.location?.lng) {
                                                    window.open(`https://www.google.com/maps?q=${doctor.location.lat},${doctor.location.lng}`, '_blank');
                                                } else {
                                                    toast.info("لم يتم تحديد الإحداثيات الدقيقة على الخريطة بعد.");
                                                }
                                            }}
                                        >
                                            عرض الموقع على الخريطة
                                            <ChevronLeft className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="h-64 bg-gray-50 w-full border-t border-gray-50 relative overflow-hidden">
                                    {doctor.location?.lat && doctor.location?.lng ? (
                                        <MapView value={doctor.location} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                            <MapPinIcon className="w-10 h-10 opacity-20" />
                                            <p className="font-bold text-sm">لم يقم الطبيب بتحديد الموقع على الخريطة</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </section>
                    </div>

                    {/* Right Column: Booking Sidebar */}
                    <div className="relative">
                        <Card className="lg:sticky lg:top-32 border-none shadow-2xl shadow-gray-200/50 rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-sm">
                            <div className="bg-gray-900 p-6 text-white text-center">
                                <h3 className="text-xl font-black">احجز موعدك الآن</h3>
                                <p className="text-gray-400 text-xs mt-1 font-bold tracking-widest uppercase">تأكيد فوري للحجز</p>
                            </div>

                            <CardContent className="p-6 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                                        <span className="font-bold text-gray-600">سعر الكشف</span>
                                        <span className="text-xl font-black text-red-600">{doctor.pricing?.consultationFee} ج.م</span>
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        <Label className="text-gray-900 font-black text-lg block text-right mr-1">المواعيد المتاحة</Label>
                                        {doctor.schedule ? (
                                            <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white p-2">
                                                <BookingCalendar
                                                    schedule={doctor.schedule}
                                                    bookedSlots={bookedSlots}
                                                    onBookSlot={handleSlotSelect}
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                                <p className="text-gray-400 font-bold text-sm">لم يتم تحديد المواعيد بعد</p>
                                            </div>
                                        )}

                                        {bookingDate && bookingTime && (
                                            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center animate-in zoom-in duration-300">
                                                <p className="text-xs text-red-500 font-bold uppercase tracking-widest mb-1">الموعد المختار</p>
                                                <p className="text-red-600 font-black text-base italic">
                                                    {bookingDate} <br /> الساعة {bookingTime}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-14 rounded-2xl text-lg font-black bg-red-600 hover:bg-red-700 shadow-xl shadow-red-100 border-none transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                                    onClick={handleBookClick}
                                    disabled={!bookingDate || !bookingTime}
                                >
                                    إتمام الحجز
                                </Button>
                            </CardContent>

                            <div className="px-6 pb-8">
                                <p className="text-center text-[10px] text-gray-400 leading-relaxed max-w-[200px] mx-auto font-medium">
                                    بالضغط على إتمام الحجز فأنت توافق على شروط وأحكام استخدام المنصة.
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Phone/Guest Booking Dialog */}
            <Dialog open={showGuestForm} onOpenChange={setShowGuestForm}>
                <DialogContent className="sm:max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden" dir="rtl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
                    <DialogHeader className="p-4">
                        <DialogTitle className="text-right text-2xl font-black text-gray-900">بيانات تأكيد الحجز</DialogTitle>
                        <DialogDescription className="text-right text-base leading-relaxed mt-2 font-medium">
                            {localStorage.getItem("token")
                                ? "نحتاج فقط لرقم موبايلك لنتمكن من إرسال تفاصيل الموعد."
                                : "بما أنك زائر، نحتاج لبعض البيانات البسيطة لضمان جدية الحجز وتسهيل التواصل."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 px-4 pb-4">
                        {!localStorage.getItem("token") && (
                            <div className="space-y-2">
                                <Label htmlFor="name" className="mr-1 text-gray-700 font-bold">الاسم الثلاثي</Label>
                                <Input
                                    id="name"
                                    placeholder="اسم المريض بالكامل"
                                    className="h-12 rounded-xl border-gray-100 bg-gray-50 focus:bg-white focus:border-red-200 transition-all text-right"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="mr-1 text-gray-700 font-bold">رقم الموبايل</Label>
                            <Input
                                id="phone"
                                placeholder="01xxxxxxxxx"
                                className="h-12 rounded-xl border-gray-100 bg-gray-50 focus:bg-white focus:border-red-200 transition-all text-right"
                                value={guestPhone}
                                onChange={(e) => setGuestPhone(e.target.value)}
                            />
                        </div>
                        {!localStorage.getItem("token") && (
                            <div className="space-y-2">
                                <Label htmlFor="confirmPhone" className="mr-1 text-gray-700 font-bold">تأكيد رقم الموبايل</Label>
                                <Input
                                    id="confirmPhone"
                                    placeholder="أعد كتابة الرقم للتأكيد"
                                    className="h-12 rounded-xl border-gray-100 bg-gray-50 focus:bg-white focus:border-red-200 transition-all text-right"
                                    value={confirmPhone}
                                    onChange={(e) => setConfirmPhone(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-3 p-4 bg-gray-50/50">
                        <Button variant="ghost" onClick={() => setShowGuestForm(false)} className="flex-1 h-12 rounded-xl font-bold">
                            إلغاء
                        </Button>
                        <Button onClick={handleGuestSubmit} className="flex-1 h-12 rounded-xl font-black bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100 border-none">
                            تأكيد وحجز الموعد
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Mobile Bottom Action Bar */}
            {!isDesktop && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] z-50 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="flex flex-col pr-2">
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">سعر الكشف</span>
                        <span className="font-black text-xl text-red-600">{doctor.pricing?.consultationFee} <small className="text-[10px] font-normal text-gray-400">ج.م</small></span>
                    </div>

                    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                        <DrawerTrigger asChild>
                            <Button className="flex-1 h-14 text-lg font-black rounded-2xl bg-red-600 hover:bg-red-700 shadow-xl shadow-red-100 border-none transform active:scale-95 transition-all">
                                احجز موعدك
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className="max-h-[85vh] border-none rounded-t-[3rem] overflow-hidden">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4" />
                            <DrawerHeader className="pb-2">
                                <DrawerTitle className="text-2xl font-black">اختر وقت الكشف</DrawerTitle>
                                <DrawerDescription className="font-medium text-gray-500">
                                    يرجى اختيار اليوم والموعد المناسب لك بعناية.
                                </DrawerDescription>
                            </DrawerHeader>
                            <div className="p-6 overflow-y-auto">
                                {doctor.schedule ? (
                                    <div className="p-2 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                                        <BookingCalendar
                                            schedule={doctor.schedule}
                                            bookedSlots={bookedSlots}
                                            onBookSlot={(date: Date, time: string) => {
                                                handleSlotSelect(date, time);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-gray-400 font-bold">لا توجد مواعيد متاحة حالياً</p>
                                    </div>
                                )}

                                {bookingDate && bookingTime && (
                                    <div className="space-y-4 animate-in zoom-in duration-300">
                                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center">
                                            <p className="text-red-600 font-black text-lg">
                                                {bookingDate} | الساعة {bookingTime}
                                            </p>
                                        </div>
                                        <Button className="w-full h-14 text-xl font-black rounded-2xl bg-red-600 hover:bg-red-700 shadow-xl shadow-red-100 border-none" onClick={handleBookClick}>
                                            تأكيد الموعد المختار
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </DrawerContent>
                    </Drawer>
                </div>
            )}
        </div>
    );
}
