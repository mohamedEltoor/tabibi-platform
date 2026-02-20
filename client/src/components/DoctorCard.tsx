import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, Calendar as CalendarIcon, Loader2, CheckCircle, ChevronLeft, CreditCard, Users } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BookingCalendar } from "./BookingCalendar";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatTime12h } from "@/lib/utils";

import NextImage from "next/image";

interface Doctor {
    _id: string;
    user: {
        name: string;
        city?: string;
        governorate?: string;
    };
    specialty: string;
    subspecialty?: string;
    profileImage?: string;
    gender: string;
    rating?: number;
    yearsOfExperience: number;
    pricing: {
        consultationFee: number;
    };
    schedule: any;
}

interface DoctorCardProps {
    doctor: Doctor;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
    const [showBooking, setShowBooking] = useState(false);
    const [bookedSlots, setBookedSlots] = useState<{ date: string; time: string }[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingDate, setBookingDate] = useState<string | null>(null);
    const [bookingTime, setBookingTime] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchBookedSlots = useCallback(async () => {
        try {
            setLoadingSlots(true);
            const res = await api.get(`/doctors/${doctor._id}/booked-slots`);
            setBookedSlots(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingSlots(false);
        }
    }, [doctor._id]);

    useEffect(() => {
        if (showBooking && doctor._id) {
            fetchBookedSlots();
        }
    }, [showBooking, doctor._id, fetchBookedSlots]);

    const handleBookSlot = (date: Date, time: string) => {
        setBookingDate(format(date, "yyyy-MM-dd"));
        setBookingTime(time);
        setShowConfirmDialog(true);
    };

    const handleConfirmBooking = async () => {
        const token = localStorage.getItem("token");

        if (!token && (!guestName || !guestPhone)) {
            toast.error("يرجى إدخال بياناتك لإتمام الحجز");
            return;
        }

        try {
            setIsSubmitting(true);
            const payload: Record<string, any> = {
                doctorId: doctor._id,
                date: bookingDate,
                time: bookingTime,
                source: "website"
            };

            if (!token) {
                payload.guestDetails = { name: guestName, phone: guestPhone };
                payload.phone = guestPhone;
            }

            await api.post("/appointments", payload);
            toast.success("تم حجز الموعد بنجاح! سنتواصل معك للتأكيد.");
            setShowConfirmDialog(false);
            setShowBooking(false);
            setBookingDate(null);
            setBookingTime(null);
            fetchBookedSlots(); // Refresh
        } catch (err: unknown) {
            let errorMsg = "فشل الحجز. حاول مرة أخرى.";
            if (typeof err === "object" && err !== null && "response" in err) {
                const axiosError = err as { response: { data?: { msg?: string } } };
                errorMsg = axiosError.response.data?.msg || errorMsg;
            }
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="group relative overflow-hidden border border-gray-100 shadow-xl shadow-gray-200/40 bg-white hover:shadow-2xl hover:shadow-red-200/20 transition-all duration-500 rounded-[2.5rem] hover:-translate-y-1">
            <div className="flex flex-col lg:flex-row min-h-[240px]">
                {/* Photo Section */}
                <div className="relative w-full lg:w-60 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden lg:rounded-r-[2rem]">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-50/40 to-white/0 z-0" />

                    {doctor.profileImage ? (
                        <div className="relative w-full h-full z-10 transition-transform duration-700 group-hover:scale-105">
                            <NextImage
                                src={doctor.profileImage}
                                alt={doctor.user?.name}
                                width={300}
                                height={300}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                    ) : (
                        <div className="text-7xl filter drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-700 transform group-hover:scale-110 z-10">
                            {doctor.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️'}
                        </div>
                    )}

                    {/* Floating verified badge */}
                    <div className="absolute bottom-4 right-4 bg-white shadow-md rounded-full p-1.5 border border-green-50 z-20 transition-transform duration-500 group-hover:scale-110 scale-100">
                        <CheckCircle className="w-5 h-5 text-green-500 fill-green-50" />
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 flex flex-col p-6 lg:p-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="text-3xl font-black text-gray-900 leading-tight group-hover:text-red-700 transition-colors">{doctor.user.name}</h3>
                                <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-black border border-amber-100 shadow-sm">
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                    <span>{doctor.rating || "4.9"}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-sm font-black border border-red-100/50">
                                    {doctor.specialty}
                                </span>
                                {doctor.yearsOfExperience > 0 && (
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-black border border-blue-100/50">
                                        {doctor.yearsOfExperience} سنة خبرة
                                    </span>
                                )}
                            </div>
                            {doctor.subspecialty && (
                                <p className="text-gray-600 font-medium text-sm mt-1">{doctor.subspecialty}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-3 bg-gradient-to-l from-gray-50 to-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm transition-all group-hover:border-red-100">
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1.5">كشف العيادة</p>
                                <p className="text-2xl font-black text-gray-900 leading-none">
                                    {doctor.pricing?.consultationFee} <span className="text-sm font-bold text-gray-400">ج.م</span>
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-50">
                                <CreditCard className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <div className="flex items-center gap-4 text-sm text-gray-700 font-bold bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50 transition-all group-hover:bg-white group-hover:border-red-50">
                            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-50 shrink-0">
                                <MapPin className="h-5 w-5 text-red-600" />
                            </div>
                            <span className="line-clamp-1">
                                {doctor.user?.city || "القاهرة"}، {doctor.user?.governorate || "مصر"}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-700 font-bold bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50 transition-all group-hover:bg-white group-hover:border-red-50">
                            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-50 shrink-0">
                                <Clock className="h-5 w-5 text-red-600" />
                            </div>
                            <span>
                                {doctor.schedule?.startTime ? formatTime12h(doctor.schedule.startTime) : "10:00 ص"} - {doctor.schedule?.endTime ? formatTime12h(doctor.schedule.endTime) : "10:00 م"}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                        <Button
                            className="flex-1 h-14 rounded-2xl text-lg font-black bg-red-600 hover:bg-red-700 shadow-xl shadow-red-100 border-none transition-all active:scale-95 gap-3"
                            onClick={() => setShowBooking(!showBooking)}
                        >
                            <CalendarIcon className="w-6 h-6" />
                            {showBooking ? "إلغاء الحجز" : "احجز الآن"}
                        </Button>
                        <Button
                            variant="outline"
                            asChild
                            className="flex-1 h-14 rounded-2xl text-lg font-black border-2 border-gray-100 hover:border-red-100 hover:bg-red-50/30 hover:text-red-700 transition-all active:scale-95 gap-3"
                            disabled={!doctor._id}
                        >
                            {doctor._id ? (
                                <Link href={`/doctor/${doctor._id}`}>
                                    عرض الملف
                                    <ChevronLeft className="w-5 h-5" />
                                </Link>
                            ) : (
                                <span>عرض التفاصيل</span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {showBooking && (
                <div className="border-t border-gray-50 p-6 bg-gradient-to-b from-gray-50/50 to-white animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="font-black text-gray-900 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                            المواعيد المتاحة
                        </h4>
                        <p className="text-xs text-gray-400 font-medium">سجل بياناتك بعد اختيار الوقت</p>
                    </div>

                    {loadingSlots ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 border-2 border-red-100 rounded-full" />
                                <div className="absolute inset-0 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">نبحث عن مواعيد شاغرة...</p>
                        </div>
                    ) : doctor.schedule ? (
                        <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                            <BookingCalendar
                                schedule={doctor.schedule}
                                bookedSlots={bookedSlots}
                                onBookSlot={handleBookSlot}
                            />
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
                            <div className="text-3xl mb-2 opacity-30">🗓️</div>
                            <p className="text-gray-500 font-medium text-sm">لا توجد مواعيد متاحة للحجز الإلكتروني حالياً.</p>
                        </div>
                    )}
                </div>
            )}

            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="sm:max-w-md border-none shadow-2xl rounded-[2rem] overflow-hidden" dir="rtl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
                    <DialogHeader className="p-4">
                        <DialogTitle className="text-right text-2xl font-black text-gray-900">تأكيد حجز الموعد</DialogTitle>
                        <DialogDescription asChild className="text-right text-base leading-relaxed mt-2">
                            <div>
                                أنت على وشك حجز موعد مع <span className="text-red-600 font-bold text-lg">د. {doctor.user.name}</span>
                                <div className="mt-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <div className="flex items-center justify-between text-gray-600 text-sm mb-2">
                                        <span>التاريخ:</span>
                                        <span className="text-gray-900 font-black">{bookingDate}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-gray-600 text-sm">
                                        <span>الوقت:</span>
                                        <span className="text-gray-900 font-black">{bookingTime ? formatTime12h(bookingTime) : ""}</span>
                                    </div>
                                </div>
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    {!localStorage.getItem("token") && (
                        <div className="space-y-5 px-4 pb-4">
                            <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                                    أنت تحجز كزائر. يرجى إدخال بياناتك بدقة لضمان تواصل العيادة معك لتأكيد الحجز.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guestName" className="mr-1 text-gray-700 font-bold">الاسم بالكامل</Label>
                                <Input
                                    id="guestName"
                                    placeholder="ادخل اسم المريض الثلاثي"
                                    className="h-12 rounded-xl border-gray-100 bg-gray-50 focus:bg-white focus:border-red-200 transition-all text-right"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="guestPhone" className="mr-1 text-gray-700 font-bold">رقم الموبايل</Label>
                                <Input
                                    id="guestPhone"
                                    placeholder="01xxxxxxxxx"
                                    className="h-12 rounded-xl border-gray-100 bg-gray-50 focus:bg-white focus:border-red-200 transition-all text-right"
                                    value={guestPhone}
                                    onChange={(e) => setGuestPhone(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-3 p-4 bg-gray-50/50">
                        <Button
                            variant="ghost"
                            onClick={() => setShowConfirmDialog(false)}
                            className="flex-1 h-12 rounded-xl font-bold hover:bg-gray-100"
                        >
                            إلغاء
                        </Button>
                        <Button
                            onClick={handleConfirmBooking}
                            disabled={isSubmitting}
                            className="flex-1 h-12 rounded-xl font-black bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100 border-none"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    جاري الحجز...
                                </div>
                            ) : "تأكيد وإتمام"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
