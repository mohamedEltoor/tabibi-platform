"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { Calendar, Users, DollarSign, Activity, User, Plus, Sun, Moon, CalendarDays, CalendarRange, Clock, AlertCircle, LogOut, Wallet, Globe, CheckCircle2, XCircle, Phone, ArrowRight, MessageSquare, MoreVertical, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookingCalendar } from "@/components/BookingCalendar";
import { format, isSameDay, subDays, subWeeks, subMonths, isAfter, startOfDay, isWithinInterval, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Patient {
    _id: string;
    name: string;
    phone: string;
    type?: 'user' | 'guest';
}

interface Appointment {
    _id: string;
    date: string;
    time: string;
    status: string;
    source: 'website' | 'direct';
    patient?: Patient;
    guestDetails?: {
        name: string;
        phone: string;
    };
}

interface DoctorProfile {
    _id: string;
    user: {
        name: string;
        phone?: string;
        city?: string;
        governorate?: string;
        address?: string;
    };
    pricing?: {
        consultationFee: number;
    };
    schedule?: any;
    hasValidAccess?: boolean;
    isPaused?: boolean;
    debtBreakdown?: {
        subscription: number;
        commission: number;
        appointmentCount: number;
    };
    isProfileComplete?: boolean;
    missingFields?: string[];
    subscriptionExpiresAt?: string;
    trialExpiresAt?: string;
    isManuallyDeactivated?: boolean;
    renewalRequest?: { status: string };
    commissionPaymentRequest?: { status: string };
}

interface FinanceStats {
    thisMonth: {
        appointments: number;
        commission: number;
        unpaidCommission?: number;
    };
    lifetime: {
        totalAppointments: number;
        totalCommission: number;
    };
}

export default function DoctorDashboard() {
    const [stats, setStats] = useState({
        appointments: 0,
        online: 0,
        direct: 0,
        patients: 0,
        revenue: 0,
        pending: 0,
    });
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
    const [bookedSlots, setBookedSlots] = useState<{ date: string; time: string }[]>([]);

    // Walk-in Booking State
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: Date, time: string } | null>(null);
    const [patientName, setPatientName] = useState("");
    const [patientPhone, setPatientPhone] = useState("");
    const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
    const [bookingLoading, setBookingLoading] = useState(false);

    // Quick Fee Edit State
    const [isFeeEditOpen, setIsFeeEditOpen] = useState(false);
    const [tempFee, setTempFee] = useState("");
    const [feeSaving, setFeeSaving] = useState(false);

    // renewal/commission payment Modal state
    const [finModalType, setFinModalType] = useState<'renewal' | 'commission'>('renewal');
    const [isRenewalOpen, setIsRenewalOpen] = useState(false);
    const [finPhone, setFinPhone] = useState("");
    const [finReceipt, setFinReceipt] = useState("");
    const [finSubmitting, setFinSubmitting] = useState(false);
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.dispatchEvent(new Event("auth-change"));
        router.push("/login");
    };

    // Filter & Sort State
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortOrder, setSortOrder] = useState("desc");
    const [dateRange, setDateRange] = useState("all");
    const [customStart, setCustomStart] = useState<Date | null>(null);
    const [customEnd, setCustomEnd] = useState<Date | null>(null);

    const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);

    const getRemainingDays = () => {
        if (!doctorProfile) return { days: 0, text: 'انتهاء الصلاحية' };
        const expiry = doctorProfile.subscriptionExpiresAt || doctorProfile.trialExpiresAt;
        if (!expiry) return { days: 0, text: 'غير مفعل' };

        const remainingMs = new Date(expiry).getTime() - new Date().getTime();
        const days = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

        if (days <= 0) return { days: 0, text: 'منتهي' };
        if (days === 1) return { days: 1, text: 'يوم واحد' };
        if (days === 2) return { days: 2, text: 'يومان' };
        if (days <= 10) return { days, text: `${days} أيام` };
        return { days, text: `${days} يوم` };
    };

    const remaining = getRemainingDays();

    const fetchFinance = useCallback(async () => {
        try {
            const res = await api.get("/doctors/me/finance");
            setFinanceStats(res.data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const res = await api.get("/appointments/doctor");
            setAppointments(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchProfileAndSlots = useCallback(async () => {
        try {
            const res = await api.get("/doctors/me");
            const doctorData = res.data.doctor;
            setDoctorProfile(doctorData);

            if (doctorData?._id) {
                const slotsRes = await api.get(`/doctors/${doctorData._id}/booked-slots`);
                setBookedSlots(slotsRes.data);
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    // Persistence Logic
    useEffect(() => {
        const savedRange = localStorage.getItem("doctor_global_filter_dateRange");
        if (savedRange) setDateRange(savedRange);

        const savedStart = localStorage.getItem("doctor_global_filter_customStart");
        if (savedStart) setCustomStart(new Date(savedStart));

        const savedEnd = localStorage.getItem("doctor_global_filter_customEnd");
        if (savedEnd) setCustomEnd(new Date(savedEnd));

        fetchData();
        fetchProfileAndSlots();
        fetchFinance();
    }, [fetchData, fetchProfileAndSlots, fetchFinance]);

    const handleFinanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!finPhone || !finReceipt) {
            toast.error("يرجى إدخال رقم الهاتف وصورة الإيصال");
            return;
        }

        setFinSubmitting(true);
        try {
            if (finModalType === 'renewal') {
                await api.post("/doctors/me/renewal-request", {
                    phone: finPhone,
                    receiptImage: finReceipt
                });
                toast.success("تم إرسال طلب التجديد بنجاح");
            } else {
                const commissionPaidDebt = doctorProfile?.debtBreakdown?.commission || 0;
                if (commissionPaidDebt <= 0) {
                    toast.error("لا توجد مديونية عمولات مستحقة حالياً");
                    setFinSubmitting(false);
                    return;
                }

                await api.post("/doctors/me/commission-payment", {
                    phone: finPhone,
                    receiptImage: finReceipt,
                    amount: commissionPaidDebt
                });
                toast.success("تم إرسال طلب سداد العمولة بنجاح");
            }

            setIsRenewalOpen(false);
            setFinPhone("");
            setFinReceipt("");
            fetchProfileAndSlots(); // Refresh profile 
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.msg || "حدث خطأ أثناء إرسال الطلب");
        } finally {
            setFinSubmitting(false);
        }
    };

    // Date Calculations for Dropdown
    const now = new Date();

    // Helper to format range
    const formatDateRange = (start: Date, end?: Date) => {
        if (!end) return format(start, "dd/MM/yyyy", { locale: ar });
        return `${format(start, "dd/MM/yyyy", { locale: ar })} - ${format(end, "dd/MM/yyyy", { locale: ar })}`;
    };

    const ranges = {
        today: {
            label: "اليوم",
            date: formatDateRange(now),
            icon: Sun
        },
        yesterday: {
            label: "أمس",
            date: formatDateRange(subDays(now, 1)),
            icon: Moon
        },
        week: {
            label: "هذا الأسبوع",
            date: formatDateRange(startOfWeek(now, { weekStartsOn: 6 }), endOfWeek(now, { weekStartsOn: 6 })),
            icon: CalendarDays
        },
        month: {
            label: "هذا الشهر",
            date: formatDateRange(startOfMonth(now), endOfMonth(now)),
            icon: CalendarRange
        },
        threeMonths: {
            label: "آخر 3 شهور",
            date: formatDateRange(subMonths(now, 3), now),
            icon: Clock
        }
    };

    const checkDateRange = useCallback((dateString: string) => {
        const appDate = new Date(dateString);
        const now = new Date();

        if (dateRange === 'all') return true;
        if (dateRange === 'today') return isSameDay(appDate, now);
        if (dateRange === 'yesterday') return isSameDay(appDate, subDays(now, 1));

        if (dateRange === 'week') {
            const weekStart = startOfWeek(now, { weekStartsOn: 6 });
            const weekEnd = endOfWeek(now, { weekStartsOn: 6 });
            return isWithinInterval(appDate, { start: weekStart, end: weekEnd });
        }

        if (dateRange === 'month') {
            const monthStart = startOfMonth(now);
            const monthEnd = endOfMonth(now);
            return isWithinInterval(appDate, { start: monthStart, end: monthEnd });
        }

        if (dateRange === 'threeMonths') return isAfter(appDate, subMonths(now, 3));

        if (dateRange === 'custom' && customStart && customEnd) {
            return isWithinInterval(appDate, {
                start: startOfDay(customStart),
                end: endOfDay(customEnd)
            });
        }

        return true;
    }, [dateRange, customStart, customEnd]);

    const calculateStats = useCallback((data: Appointment[]) => {
        const filtered = data.filter((app: Appointment) => checkDateRange(app.date));
        const doctorFees = doctorProfile?.pricing?.consultationFee || 0;

        setStats({
            appointments: filtered.length,
            online: filtered.filter((a: Appointment) => a.source === 'website').length,
            direct: filtered.filter((a: Appointment) => a.source === 'direct').length,
            patients: new Set(filtered.map((a: Appointment) => a.patient?._id || a.guestDetails?.phone)).size,
            revenue: filtered.filter((a: Appointment) => a.status === 'attended').length * doctorFees,
            pending: filtered.filter((a: Appointment) => a.status === 'pending').length,
        });
    }, [checkDateRange, doctorProfile]);

    useEffect(() => {
        calculateStats(appointments);
    }, [calculateStats, appointments]);


    const handleWalkInBook = async () => {
        if (!doctorProfile || !selectedSlot || !patientName || !patientPhone) return;
        setBookingLoading(true);
        try {
            await api.post("/appointments", {
                doctorId: doctorProfile._id,
                date: format(selectedSlot.date, "yyyy-MM-dd"),
                time: selectedSlot.time,
                source: "direct",
                guestDetails: {
                    name: patientName,
                    phone: patientPhone
                }
            });

            toast.success("تم إضافة الحجز بنجاح");
            setIsBookingOpen(false);
            setPatientName("");
            setPatientPhone("");
            setSelectedSlot(null);
            fetchData();
            fetchProfileAndSlots();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || "حدث خطأ أثناء الحجز");
        } finally {
            setBookingLoading(false);
        }
    };

    const handleFeeUpdate = async () => {
        if (!tempFee || !doctorProfile) return;
        setFeeSaving(true);
        try {
            await api.put("/doctors/me", {
                ...doctorProfile,
                pricing: {
                    ...doctorProfile.pricing,
                    consultationFee: Number(tempFee)
                }
            });
            toast.success("تم تحديث سعر الكشف");
            setIsFeeEditOpen(false);
            fetchProfileAndSlots();
        } catch (err: any) {
            toast.error("فشل التحديث");
        } finally {
            setFeeSaving(false);
        }
    };

    const handleStatusUpdate = async (appointmentId: string, status: string) => {
        try {
            await api.patch(`/appointments/${appointmentId}/status`, { status });
            toast.success("تم تحديث حالة الموعد");
            fetchData();
        } catch (err: any) {
            toast.error("فشل تحديث الحالة");
            console.error(err);
        }
    };

    const filteredAppointments = appointments
        .filter((apt: Appointment) => {
            const matchesStatus = filterStatus === "all" || apt.status === filterStatus;
            const matchesDate = checkDateRange(apt.date);
            return matchesStatus && matchesDate;
        })
        .sort((a: Appointment, b: Appointment) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();

            if (dateA === dateB) {
                return sortOrder === "asc"
                    ? a.time.localeCompare(b.time)
                    : b.time.localeCompare(a.time);
            }

            return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });

    return (
        <div className="container py-4 md:py-8 space-y-6 md:space-y-8 relative">
            {/* Subscription / Access Block Overlay */}
            {doctorProfile && doctorProfile.hasValidAccess === false && (
                <div className={`fixed inset-0 z-[40] bg-[#0a0a0b]/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-500 ${isRenewalOpen ? 'backdrop-blur-xl' : ''}`}>
                    {!isRenewalOpen && (
                        <Card className="max-w-xl w-full bg-[#121214] border-red-500/20 shadow-2xl shadow-red-500/10 rounded-[2.5rem] overflow-hidden animate-in fade-in zoom-in duration-500">
                            <CardContent className="p-10 text-center space-y-6">
                                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                    <AlertCircle className="w-12 h-12 text-red-500" />
                                </div>
                                <h2 className="text-3xl font-black text-white">
                                    {doctorProfile.isPaused ? "الحساب متوقف مؤقتاً" : "تفعيل الحساب مطلوب"}
                                </h2>
                                <div className="text-gray-400 text-lg leading-relaxed">
                                    {doctorProfile.isPaused
                                        ? "نود إعلامك بأن إدارة المنصة قد قامت بإيقاف حسابك مؤقتاً. يرجى التواصل معنا للاستفسار أو إعادة التفعيل."
                                        : (
                                            <>
                                                {(doctorProfile.debtBreakdown?.subscription && doctorProfile.debtBreakdown.subscription > 0) || doctorProfile.isManuallyDeactivated ? (
                                                    <>
                                                        نعتذر، ولكن حسابك متوقف لانتهاء صلاحية الاشتراك أو لقرار إداري. يرجى سداد الاشتراك الشهري لتتمكن من استخدام المنصة والظهور للمرضى.
                                                        <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 text-right">
                                                            <div className="flex justify-between items-center text-white font-black">
                                                                <span>قيمة الاشتراك:</span>
                                                                <span>150 ج.م</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        نعتذر، ولكن حسابك متوقف لعدم سداد مديونية عمولات المواعيد المتأخرة. يرجى سداد المبلغ المطلوب لإعادة التفعيل.
                                                        <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 text-right">
                                                            <div className="flex justify-between items-center text-white font-black">
                                                                <span>مديونية العمولات:</span>
                                                                <span>{doctorProfile.debtBreakdown?.commission || 0} ج.م</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                </div>

                                <div className="pt-4 flex flex-col gap-3">
                                    {doctorProfile.isPaused ? (
                                        <Button className="w-full h-14 rounded-2xl text-lg font-black shadow-lg bg-amber-600 hover:bg-amber-700 shadow-amber-900/20">
                                            تواصل مع الدعم الفني
                                        </Button>
                                    ) : (
                                        <>
                                            {(doctorProfile.debtBreakdown?.subscription && doctorProfile.debtBreakdown.subscription > 0 && doctorProfile.renewalRequest?.status === 'pending') ||
                                                (doctorProfile.debtBreakdown?.subscription && doctorProfile.debtBreakdown.subscription <= 0 && doctorProfile.commissionPaymentRequest?.status === 'pending') ? (
                                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-500 font-bold">
                                                    قيد المراجعة: تم إرسال طلب السداد بنجاح
                                                </div>
                                            ) : (
                                                <Button
                                                    onClick={() => {
                                                        const type = ((doctorProfile.debtBreakdown?.subscription && doctorProfile.debtBreakdown.subscription > 0) || doctorProfile.isManuallyDeactivated) ? 'renewal' : 'commission';
                                                        setFinModalType(type);
                                                        setIsRenewalOpen(true);
                                                    }}
                                                    className="w-full h-14 rounded-2xl text-lg font-black shadow-lg bg-red-600 hover:bg-red-700 shadow-red-900/20"
                                                >
                                                    {((doctorProfile.debtBreakdown?.subscription && doctorProfile.debtBreakdown.subscription > 0) || doctorProfile.isManuallyDeactivated) ? "تجديد الاشتراك الآن" : "سداد العمولات والتفعيل"}
                                                </Button>
                                            )}
                                        </>
                                    )}
                                    <Button
                                        variant="ghost"
                                        onClick={handleLogout}
                                        className="w-full h-12 rounded-xl text-gray-500 font-bold hover:text-white hover:bg-white/5 active:scale-95 transition-all"
                                    >
                                        تسجيل الخروج
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Header & Main Info */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold">لوحة تحكم الطبيب</h1>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleLogout}
                        className="flex items-center gap-2 font-bold"
                    >
                        <LogOut className="h-4 w-4" />
                        خروج
                    </Button>
                </div>
            </div>

            {/* Billing Warning Alert (End of Month) */}
            {doctorProfile?.debtBreakdown && doctorProfile.debtBreakdown.commission > 0 && (new Date().getDate() <= 5) && (

                <div className="bg-red-600 border-none rounded-2xl p-6 text-white shadow-2xl shadow-red-500/20 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5 text-center md:text-right">
                            <div className="p-4 bg-white/20 rounded-full shrink-0">
                                <Wallet className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black mb-1">تنبيه: سداد إجمالي العمولات المستحقة</h3>
                                <p className="text-red-100 font-bold leading-relaxed">
                                    يرجى سداد مبلغ <span className="text-white text-lg underline font-black">{doctorProfile?.debtBreakdown?.commission || 0} ج.م</span> (إجمالي العمولات المستحقة لعدد {doctorProfile?.debtBreakdown?.appointmentCount || 0} كشوفات) خلال الـ 5 أيام الأولى من الشهر لتجنب غلق الحساب تلقائياً.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => {
                                setFinModalType('commission');
                                setIsRenewalOpen(true);
                            }}
                            className="w-full md:w-auto px-10 h-14 bg-white text-red-600 hover:bg-red-50 font-black rounded-xl shadow-lg shrink-0"
                        >
                            سداد العمولات الآن
                        </Button>
                    </div>
                </div>
            )}

            {/* Profile Completion Alert */}
            {doctorProfile && !doctorProfile.isProfileComplete && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600 shrink-0">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-amber-900 mb-1">حسابك غير ظاهر للمرضى حالياً</h3>
                            <p className="text-amber-800 text-sm leading-relaxed mb-2">
                                يجب إكمال البيانات التالية لتتمكن من الظهور في نتائج البحث واستقبال الحجوزات:
                            </p>
                            {doctorProfile.missingFields && doctorProfile.missingFields.length > 0 && (
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 list-disc list-inside text-amber-900 text-sm font-medium">
                                    {doctorProfile.missingFields.includes('phone') && <li>رقم الهاتف</li>}
                                    {doctorProfile.missingFields.includes('governorate') && <li>المحافظة</li>}
                                    {doctorProfile.missingFields.includes('city') && <li>المدينة</li>}
                                    {doctorProfile.missingFields.includes('address') && <li>العنوان التفصيلي</li>}
                                    {doctorProfile.missingFields.includes('specialty') && <li>التخصص الطبي</li>}
                                    {doctorProfile.missingFields.includes('consultationFee') && <li>سعر الكشف</li>}
                                    {doctorProfile.missingFields.includes('schedule') && <li>تفعيل الجدول الزمني</li>}
                                </ul>
                            )}
                        </div>
                    </div>
                    <Link href="/dashboard/doctor/profile" className="w-full md:w-auto">
                        <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2">
                            <User className="h-4 w-4" />
                            إكمال الملف الشخصي
                        </Button>
                    </Link>
                </div>
            )}

            {/* Global Filters & Manual Booking */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center w-full md:w-auto">
                <Select
                    value={dateRange}
                    onValueChange={(val) => {
                        setDateRange(val);
                        localStorage.setItem("doctor_global_filter_dateRange", val);
                    }}
                    dir="rtl"
                >
                    <SelectTrigger className="w-full sm:w-[240px] bg-white h-auto py-2 px-3">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2 text-right">
                                <div className="p-1.5 bg-slate-50 rounded-md text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col items-start gap-0">
                                    <span className="font-semibold text-sm">
                                        {dateRange === 'all' ? 'كل الأوقات' :
                                            dateRange === 'custom' ? 'فترة مخصصة' :
                                                ranges[dateRange as keyof typeof ranges]?.label}
                                    </span>
                                    {dateRange !== 'all' && dateRange !== 'custom' && (
                                        <span className="text-xs text-muted-foreground leading-none">
                                            {ranges[dateRange as keyof typeof ranges]?.date}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </SelectTrigger>
                    <SelectContent className="max-w-[300px]" dir="rtl">
                        <SelectItem value="all" className="focus:bg-slate-50 cursor-pointer">
                            <div className="flex items-center gap-3 py-1 text-right w-full">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                    <Activity className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="font-bold text-sm">كل الأوقات</span>
                                    <span className="text-xs text-muted-foreground">عرض كافة السجلات التاريخية</span>
                                </div>
                            </div>
                        </SelectItem>

                        <SelectItem value="today" className="focus:bg-orange-50 cursor-pointer">
                            <div className="flex items-center gap-3 py-1 text-right w-full">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <Sun className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="font-bold text-sm">{ranges.today.label}</span>
                                    <span className="text-xs text-muted-foreground">{ranges.today.date}</span>
                                </div>
                            </div>
                        </SelectItem>

                        <SelectItem value="yesterday" className="focus:bg-indigo-50 cursor-pointer">
                            <div className="flex items-center gap-3 py-1 text-right w-full">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                    <Moon className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="font-bold text-sm">{ranges.yesterday.label}</span>
                                    <span className="text-xs text-muted-foreground">{ranges.yesterday.date}</span>
                                </div>
                            </div>
                        </SelectItem>

                        <SelectItem value="week" className="focus:bg-blue-50 cursor-pointer">
                            <div className="flex items-center gap-3 py-1 text-right w-full">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <CalendarDays className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="font-bold text-sm">{ranges.week.label}</span>
                                    <span className="text-xs text-muted-foreground">{ranges.week.date}</span>
                                </div>
                            </div>
                        </SelectItem>

                        <SelectItem value="month" className="focus:bg-green-50 cursor-pointer">
                            <div className="flex items-center gap-3 py-1 text-right w-full">
                                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                    <CalendarRange className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="font-bold text-sm">{ranges.month.label}</span>
                                    <span className="text-xs text-muted-foreground">{ranges.month.date}</span>
                                </div>
                            </div>
                        </SelectItem>

                        <SelectItem value="threeMonths" className="focus:bg-purple-50 cursor-pointer">
                            <div className="flex items-center gap-3 py-1 text-right w-full">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="font-bold text-sm">{ranges.threeMonths.label}</span>
                                    <span className="text-xs text-muted-foreground">{ranges.threeMonths.date}</span>
                                </div>
                            </div>
                        </SelectItem>

                        <SelectItem value="custom" className="focus:bg-gray-100 cursor-pointer">
                            <div className="flex items-center gap-3 py-1 text-right w-full">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="font-bold text-sm">فترة مخصصة</span>
                                    <span className="text-xs text-muted-foreground">تحديد يدوي للتاريخ</span>
                                </div>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>

                {dateRange === 'custom' && (
                    <div className="flex flex-col xs:flex-row gap-2 items-stretch xs:items-center animate-in fade-in slide-in-from-top-2 w-full md:w-auto">
                        <DatePicker
                            selected={customStart}
                            onChange={(date) => {
                                setCustomStart(date);
                                if (date) localStorage.setItem("doctor_global_filter_customStart", date.toISOString());
                            }}
                            selectsStart
                            startDate={customStart || undefined}
                            endDate={customEnd || undefined}
                            placeholderText="من تاريخ"
                            dateFormat="yyyy/MM/dd"
                            className="w-full xs:w-[130px] bg-white h-10 px-3 py-2 rounded-md border border-input text-sm text-right"
                            locale={ar}
                            calendarClassName="bg-white border shadow-lg rounded-md"
                            popperClassName="z-[9999]"
                            popperPlacement="bottom-end"
                        />
                        <span className="text-muted-foreground hidden xs:inline">→</span>
                        <DatePicker
                            selected={customEnd}
                            onChange={(date) => {
                                setCustomEnd(date);
                                if (date) localStorage.setItem("doctor_global_filter_customEnd", date.toISOString());
                            }}
                            selectsEnd
                            startDate={customStart || undefined}
                            endDate={customEnd || undefined}
                            minDate={customStart || undefined}
                            placeholderText="إلى تاريخ"
                            dateFormat="yyyy/MM/dd"
                            className="w-full xs:w-[130px] bg-white h-10 px-3 py-2 rounded-md border border-input text-sm text-right"
                            locale={ar}
                            calendarClassName="bg-white border shadow-lg rounded-md"
                            popperClassName="z-[9999]"
                            popperPlacement="bottom-end"
                        />
                    </div>
                )}

                <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-green-600 hover:bg-green-700">
                            <Plus className="h-4 w-4" />
                            حجز مباشر
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                        <DialogHeader>
                            <DialogTitle>إضافة حجز جديد (مباشر)</DialogTitle>
                        </DialogHeader>

                        {!selectedSlot ? (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">اختر الموعد المناسب:</p>
                                {doctorProfile?.schedule ? (
                                    <BookingCalendar
                                        schedule={doctorProfile.schedule}
                                        bookedSlots={bookedSlots}
                                        onBookSlot={(date, time) => setSelectedSlot({ date, time })}
                                    />
                                ) : (
                                    <p>يرجى ضبط جدول المواعيد أولاً من الملف الشخصي.</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-right">
                                <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-primary">
                                            {format(selectedSlot.date, "EEEE, d MMMM", { locale: ar })}
                                        </p>
                                        <p className="text-sm text-muted-foreground">الساعة {selectedSlot.time}</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedSlot(null)}>
                                        تغيير الموعد
                                    </Button>
                                </div>

                                <div className="space-y-4 text-right">
                                    <div className="space-y-2 relative">
                                        <Label>رقم الهاتف</Label>
                                        <Input
                                            value={patientPhone}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setPatientPhone(val);
                                                if (val.length > 2) {
                                                    api.get(`/doctors/me/patients/search?query=${val}`)
                                                        .then(res => setPatientSearchResults(res.data))
                                                        .catch(console.error);
                                                } else {
                                                    setPatientSearchResults([]);
                                                }
                                            }}
                                            placeholder="01xxxxxxxxx"
                                            autoComplete="off"
                                            className="text-right"
                                        />
                                        {patientSearchResults.length > 0 && patientPhone.length > 2 && (
                                            <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 mt-1 max-h-40 overflow-y-auto">
                                                {patientSearchResults.map((p) => (
                                                    <div
                                                        key={p._id}
                                                        className="p-2 hover:bg-slate-50 cursor-pointer text-sm flex justify-between items-center"
                                                        onClick={() => {
                                                            setPatientName(p.name);
                                                            setPatientPhone(p.phone);
                                                            setPatientSearchResults([]);
                                                        }}
                                                    >
                                                        <div className="flex flex-col text-right">
                                                            <span className="font-medium text-right">{p.name}</span>
                                                            <span className="text-xs text-muted-foreground text-right">{p.type === 'user' ? 'مسجل' : 'زائر'}</span>
                                                        </div>
                                                        <span className="text-muted-foreground text-xs">{p.phone}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2 relative">
                                        <Label>اسم المريض</Label>
                                        <Input
                                            value={patientName}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setPatientName(val);
                                                if (val.length > 2) {
                                                    api.get(`/doctors/me/patients/search?query=${val}`)
                                                        .then(res => setPatientSearchResults(res.data))
                                                        .catch(console.error);
                                                } else {
                                                    setPatientSearchResults([]);
                                                }
                                            }}
                                            placeholder="الاسم ثلاثي"
                                            autoComplete="off"
                                            className="text-right"
                                        />
                                        {patientSearchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 mt-1 max-h-40 overflow-y-auto">
                                                {patientSearchResults.map((p: any) => (
                                                    <div
                                                        key={p._id}
                                                        className="p-2 hover:bg-slate-50 cursor-pointer text-sm flex justify-between items-center"
                                                        onClick={() => {
                                                            setPatientName(p.name);
                                                            setPatientPhone(p.phone);
                                                            setPatientSearchResults([]);
                                                        }}
                                                    >
                                                        <div className="flex flex-col text-right">
                                                            <span className="font-medium text-right">{p.name}</span>
                                                            <span className="text-xs text-muted-foreground text-right">{p.type === 'user' ? 'مسجل' : 'زائر'}</span>
                                                        </div>
                                                        <span className="text-muted-foreground text-xs">{p.phone}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <DialogFooter className="mt-6 gap-2">
                                    <Button variant="ghost" onClick={() => setSelectedSlot(null)}>رجوع</Button>
                                    <Button onClick={handleWalkInBook} disabled={!patientName || !patientPhone || bookingLoading}>
                                        {bookingLoading ? "جاري الحفظ..." : "تأكيد الحجز"}
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <Link href="/dashboard/doctor/profile">
                    <Button variant="outline" className="gap-2">
                        <User className="h-4 w-4" />
                        الملف الشخصي
                    </Button>
                </Link>
            </div>

            {/* Premium Stats Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <Card className="relative overflow-hidden border-none shadow-md group hover:shadow-lg transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <CardContent className="p-5 flex flex-col gap-3 relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="p-2.5 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-200">
                                <Calendar className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                            <span className="text-[10px] md:text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                                {dateRange === 'all' ? 'دائم' : ranges[dateRange as keyof typeof ranges]?.label || 'مخصص'}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-medium text-slate-500 text-right">مجموع المواعيد</p>
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-1 text-right">{stats.appointments}</h3>
                            <div className="flex gap-2 mt-2 justify-end">
                                <span className="text-[9px] md:text-[10px] text-blue-600 font-bold bg-blue-50/50 px-1.5 py-0.5 rounded">موقع: {stats.online}</span>
                                <span className="text-[9px] md:text-[10px] text-orange-600 font-bold bg-orange-50/50 px-1.5 py-0.5 rounded">مباشر: {stats.direct}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-none shadow-md group hover:shadow-lg transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <CardContent className="p-5 flex flex-col gap-3 relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200">
                                <Users className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-medium text-slate-500 text-right">المرضى المميزين</p>
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-1 text-right">{stats.patients}</h3>
                            <p className="text-[10px] text-emerald-600 mt-1 font-medium text-right">سجلات نشطة</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-none shadow-md group hover:shadow-lg transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <CardContent className="p-5 flex flex-col gap-3 relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-200">
                                <DollarSign className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                            <button
                                onClick={() => {
                                    setTempFee((doctorProfile?.pricing?.consultationFee || 0).toString());
                                    setIsFeeEditOpen(true);
                                }}
                                className="text-[10px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full hover:bg-amber-100 transition-colors border border-amber-200/50"
                            >
                                <Activity className="h-3 w-3" />
                                كشف: {doctorProfile?.pricing?.consultationFee || 0}
                            </button>
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-medium text-slate-500 text-right">الإيرادات الفعلية</p>
                            <h3 className="text-xl md:text-2xl font-black text-amber-600 mt-1 text-right">{stats.revenue.toLocaleString()} ج.م</h3>
                            <p className="text-[10px] text-slate-400 mt-1 text-right">بناءً على Attendance</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-none shadow-md group hover:shadow-lg transition-all border-r-4 border-rose-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <CardContent className="p-5 flex flex-col gap-3 relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-200">
                                <Wallet className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                                عمولة 15%
                            </span>
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-medium text-slate-500 text-right">مستحقات المنصة (هذا الشهر)</p>
                            <h3 className="text-xl md:text-2xl font-black text-rose-600 mt-1 text-right">
                                {(financeStats?.thisMonth?.unpaidCommission !== undefined) ? financeStats.thisMonth.unpaidCommission : (financeStats?.thisMonth?.commission || 0)} ج.م
                            </h3>
                            <div className="mt-2">
                                <p className="text-[10px] text-gray-400 font-bold text-right">سيتم المطالبة أول الشهر القادم</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Subscription Expiry Card */}
                <Card className={`relative overflow-hidden border-none shadow-md group hover:shadow-lg transition-all border-r-4 ${remaining.days < 3 ? 'border-red-500' : 'border-emerald-500'}`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 ${remaining.days < 3 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`} />
                    <CardContent className="p-5 flex flex-col gap-3 relative z-10 text-right">
                        <div className="flex items-center justify-between flex-row-reverse">
                            <div className={`p-2.5 text-white rounded-xl shadow-lg ${remaining.days < 3 ? 'bg-red-500 shadow-red-200' : 'bg-emerald-500 shadow-emerald-200'}`}>
                                <Clock className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                            <button
                                onClick={() => setIsRenewalOpen(true)}
                                className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all active:scale-95 shadow-sm border ${remaining.days < 3
                                    ? 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                                    : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50'
                                    }`}
                            >
                                تجديد الاشتراك
                            </button>
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-medium text-slate-500">صلاحية الحساب</p>
                            <h3 className={`text-xl md:text-2xl font-black mt-1 ${remaining.days < 3 ? 'text-red-600' : 'text-emerald-600'}`}>
                                متبقي {remaining.text}
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-1 font-bold">
                                ينتهي في: {doctorProfile?.subscriptionExpiresAt ? format(new Date(doctorProfile.subscriptionExpiresAt), "dd/MM/yyyy") : doctorProfile?.trialExpiresAt ? format(new Date(doctorProfile.trialExpiresAt), "dd/MM/yyyy") : '--'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar */}
                <Card className="md:col-span-1 h-fit">
                    <CardContent className="p-4 space-y-2">
                        <Link href="/dashboard/doctor" className="block">
                            <Button variant="ghost" className="w-full justify-start gap-2 bg-slate-100">
                                <Activity className="h-4 w-4" />
                                نظرة عامة
                            </Button>
                        </Link>
                        <Link href="/dashboard/doctor/patients" className="block">
                            <Button variant="ghost" className="w-full justify-start gap-2">
                                <Users className="h-4 w-4" />
                                ملفات المرضى (EMR)
                            </Button>
                        </Link>
                        <div className="pt-4 mt-4 border-t">
                            <Button
                                variant="destructive"
                                className="w-full justify-start gap-2"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                                تسجيل الخروج
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Appointments */}
                <Card className="md:col-span-3 border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50 pb-6 p-6 md:p-8">
                        <div>
                            <CardTitle className="text-2xl font-black text-slate-900">سجل المواعيد</CardTitle>
                            <p className="text-sm text-slate-500 font-medium mt-1">بإمكانك إدارة حالات الكشف من هنا</p>
                        </div>
                        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                            <Select value={filterStatus} onValueChange={setFilterStatus} dir="rtl">
                                <SelectTrigger className="w-full sm:w-[140px] h-11 bg-slate-50 border-slate-100 rounded-xl font-bold">
                                    <SelectValue placeholder="الحالة" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="z-[9999]" dir="rtl">
                                    <SelectItem value="all">كل الحالات</SelectItem>
                                    <SelectItem value="pending">في الانتظار</SelectItem>
                                    <SelectItem value="confirmed">تم التأكيد</SelectItem>
                                    <SelectItem value="attended">تم الكشف</SelectItem>
                                    <SelectItem value="no_show">غياب</SelectItem>
                                    <SelectItem value="cancelled">ملغي</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortOrder} onValueChange={setSortOrder} dir="rtl">
                                <SelectTrigger className="w-full sm:w-[160px] h-11 bg-slate-50 border-slate-100 rounded-xl font-bold">
                                    <SelectValue placeholder="الترتيب" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="z-[9999]" dir="rtl">
                                    <SelectItem value="desc" className="font-bold">الأحدث (تاريخ الحجز)</SelectItem>
                                    <SelectItem value="asc" className="font-bold">الأقدم (بالترتيب)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="h-10 w-10 text-red-600 animate-spin" />
                                <p className="text-muted-foreground font-medium">جاري تحميل المواعيد...</p>
                            </div>
                        ) : filteredAppointments.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {filteredAppointments.map((apt) => (
                                    <div key={apt._id} className="group p-4 md:p-6 hover:bg-slate-50/50 transition-all duration-300">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                            {/* Patient Main Info */}
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="relative">
                                                    <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm group-hover:scale-105 transition-transform">
                                                        <User className="h-7 w-7 text-slate-400" />
                                                    </div>
                                                    <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${apt.source === 'website' ? 'bg-purple-500' : 'bg-green-500'
                                                        }`}>
                                                        {apt.source === 'website' ? <Globe className="h-3 w-3 text-white" /> : <User className="h-3 w-3 text-white" />}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-black text-lg text-slate-900 line-clamp-1">{apt.patient?.name || apt.guestDetails?.name || "مريض زائر"}</h3>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${apt.status === 'attended' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                            apt.status === 'no_show' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                                apt.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                                    'bg-amber-50 text-amber-600 border border-amber-100'
                                                            }`}>
                                                            {apt.status === 'attended' ? 'تم الحضور' :
                                                                apt.status === 'no_show' ? 'لم يحضر' :
                                                                    apt.status === 'confirmed' ? 'مؤكد' : 'قيد الانتظار'}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 font-medium">
                                                        <div className="flex items-center gap-1.5">
                                                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                            <span className="font-mono">{apt.patient?.phone || apt.guestDetails?.phone || "01xxxxxxxxx"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                            <span>{new Date(apt.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                            <span>{apt.time}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions & Secondary Info */}
                                            <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto mt-2 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-none border-slate-50">
                                                <div className="flex gap-2">
                                                    {apt.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-md shadow-blue-100 transition-all active:scale-95"
                                                                onClick={() => handleStatusUpdate(apt._id, 'confirmed')}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                تأكيد
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-10 px-4 rounded-xl text-rose-600 hover:bg-rose-50 border-rose-100 hover:border-rose-200 font-bold gap-2 transition-all active:scale-95"
                                                                onClick={() => handleStatusUpdate(apt._id, 'cancelled')}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                                إلغاء
                                                            </Button>
                                                        </>
                                                    )}

                                                    {apt.status === 'confirmed' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-md shadow-emerald-100 transition-all active:scale-95"
                                                                onClick={() => handleStatusUpdate(apt._id, 'attended')}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                تم الحضور
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-10 px-4 rounded-xl text-orange-600 hover:bg-orange-50 border-orange-100 hover:border-orange-200 font-bold gap-2 transition-all active:scale-95"
                                                                onClick={() => handleStatusUpdate(apt._id, 'no_show')}
                                                            >
                                                                <Clock className="h-4 w-4" />
                                                                لم يحضر
                                                            </Button>
                                                        </>
                                                    )}

                                                    {apt.status === 'attended' && (
                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-bold text-xs">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            مكتمل
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 ml-1">
                                                    <Link href={`/dashboard/doctor/patients/${apt.patient?._id || (apt.guestDetails?.phone ? `guest_${apt.guestDetails.phone}` : '')}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                                                            title="عرض السجل الطبي"
                                                        >
                                                            <ArrowRight className="h-5 w-5 rotate-180" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200">
                                    <Clock className="h-10 w-10 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900">لا توجد مواعيد حالياً</h3>
                                <p className="text-slate-500 max-w-[200px] mt-1">المواعيد التي تطابق الفلتر المختار ستظهر هنا</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Fee Edit Dialog */}
            <Dialog open={isFeeEditOpen} onOpenChange={setIsFeeEditOpen}>
                <DialogContent className="sm:max-w-[425px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تعديل سعر الكشف</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 text-right">
                        <div className="space-y-2">
                            <Label>سعر الكشف الجديد (ج.م)</Label>
                            <Input
                                type="number"
                                value={tempFee}
                                onChange={(e) => setTempFee(e.target.value)}
                                placeholder="مثال: 300"
                                className="text-right font-bold"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="outline" onClick={() => setIsFeeEditOpen(false)}>إلغاء</Button>
                        <Button onClick={handleFeeUpdate} disabled={feeSaving}>
                            {feeSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isRenewalOpen} onOpenChange={setIsRenewalOpen}>
                <DialogContent className="bg-[#121214] border-white/10 text-white max-w-lg rounded-3xl" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-center mb-4">
                            {finModalType === 'renewal' ? 'تجديد الاشتراك' : 'سداد العمولات'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="bg-white/5 p-6 rounded-2xl space-y-4 border border-white/10">
                            <h3 className="font-bold text-red-500">طريقة التحويل:</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                {finModalType === 'renewal' ? (
                                    <>
                                        يرجى تحويل مبلغ <span className="text-white font-black underline">150 ج.م (قيمة الاشتراك الشهري)</span> إلى الرقم التالي:
                                    </>
                                ) : (
                                    <>
                                        يرجى تحويل مبلغ <span className="text-white font-black underline">{doctorProfile?.debtBreakdown?.commission || 0} ج.م (إجمالي العمولة لعدد {doctorProfile?.debtBreakdown?.appointmentCount || 0} كشوفات مستحقة)</span> إلى الرقم التالي:
                                    </>
                                )}
                                <br />
                                <span className="text-white font-mono block mt-2 text-lg">01553631120 (فودافون كاش)</span>
                            </p>
                        </div>

                        <form onSubmit={handleFinanceSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>الرقم الذي تم التحويل منه</Label>
                                <Input
                                    placeholder="01xxxxxxxxx"
                                    value={finPhone}
                                    onChange={(e) => setFinPhone(e.target.value)}
                                    className="bg-white/5 border-white/10 h-12 rounded-xl"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>صورة الإيصال (Screenshot)</Label>
                                <div className="space-y-2">
                                    <Input
                                        placeholder="ضع رابط الصورة هنا (حالياً)"
                                        value={finReceipt}
                                        onChange={(e) => setFinReceipt(e.target.value)}
                                        className="bg-white/5 border-white/10 h-12 rounded-xl"
                                        required
                                    />
                                    <p className="text-[10px] text-gray-500">ملاحظة: يمكنك رفع الصورة على أي موقع رفع ووضع الرابط هنا</p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={finSubmitting}
                                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg mt-4"
                            >
                                {finSubmitting ? "جاري الإرسال..." : "تأكيد التحويل وإرسال الطلب"}
                            </Button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
