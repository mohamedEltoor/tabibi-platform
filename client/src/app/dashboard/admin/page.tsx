"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import {
    Users,
    Activity,
    ShieldCheck,
    LayoutDashboard,
    Settings,
    LogOut,
    Search,
    UserPlus,
    Stethoscope,
    CheckCircle2,
    XCircle,
    Bell,
    ExternalLink,
    Filter,
    Pause,
    Trash2,
    X,
    TrendingUp,
    Wallet,
    History,
    CreditCard,
    User
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getGovernorates, getCities } from "@/lib/egyptData";
import { popularSpecialties, otherSpecialties } from "@/lib/medicalData";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCallback } from "react";

interface UserInfo {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    createdAt: string;
}

interface Doctor {
    _id: string;
    user: {
        name: string;
        email: string;
        phone: string;
        city?: string;
        governorate?: string;
    };
    specialty: string;
    isProfileComplete: boolean;
    isPaused: boolean;
    isManuallyDeactivated: boolean;
    trialExpiresAt?: string;
    subscriptionExpiresAt?: string;
    pricing?: {
        consultationFee: number;
    };
    renewalRequest?: {
        status: string;
        phone: string;
        receiptImage: string;
    };
    commissionPaymentRequest?: {
        status: string;
        phone: string;
        receiptImage: string;
        amount: number;
    };
    createdAt: string;
}

interface Subscription {
    _id: string;
    startDate: string;
    endDate: string;
    paymentPhone: string;
}

interface SummaryData {
    doctor: Doctor;
    totalAppointments: number;
    totalRevenue: number;
    pendingCommission: number;
    stats: {
        thisMonth: {
            website: number;
            direct: number;
            commission: number;
        };
        lifetime: {
            total: number;
            website: number;
            direct: number;
            commission: number;
        };
    };
    subscriptions: Subscription[];
    patientDetails?: any;
}

interface AdminStats {
    totalDoctors: number;
    activeDoctors: number;
    pendingRequests: number;
    totalUsers: number;
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [governorate, setGovernorate] = useState("");
    const [city, setCity] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [gender, setGender] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Admin Stats state
    const [adminStats, setAdminStats] = useState<AdminStats>({
        totalDoctors: 0,
        activeDoctors: 0,
        pendingRequests: 0,
        totalUsers: 0
    });

    // Summary state
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const pendingCountRef = useRef(0);

    const governorates = getGovernorates();
    const cities = governorate ? getCities(governorate) : [];

    const playNotificationSound = useCallback(() => {
        try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.play();
        } catch (_e) {
            console.warn("Sound blocked by browser");
        }
    }, []);

    const fetchStats = useCallback(async (isPoll = false) => {
        try {
            const res = await api.get("/admin/stats");
            const newStats = res.data;

            // Notification sound logic
            if (isPoll && newStats.pendingRequests > pendingCountRef.current) {
                playNotificationSound();
                toast.info(`طلب مالي جديد! (إجمالي الطلبات: ${newStats.pendingRequests})`);
            }

            pendingCountRef.current = newStats.pendingRequests;
            setAdminStats(newStats);
        } catch (err) {
            console.error(err);
        }
    }, [playNotificationSound]);

    const fetchData = useCallback(async (filters: Record<string, string | undefined> = {}) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            // Use provided filters or current state
            const useGov = filters.governorate !== undefined ? filters.governorate : governorate;
            const useCty = filters.city !== undefined ? filters.city : city;
            const useSpec = filters.specialty !== undefined ? filters.specialty : specialty;
            const useName = filters.searchTerm !== undefined ? (filters.searchTerm as string) : searchTerm;
            const useGender = filters.gender !== undefined ? filters.gender : gender;
            const useMin = filters.minPrice !== undefined ? filters.minPrice : minPrice;
            const useMax = filters.maxPrice !== undefined ? filters.maxPrice : maxPrice;
            const useStatus = filters.statusFilter !== undefined ? filters.statusFilter : statusFilter;

            if (useGov && useGov !== "all") params.append('governorate', useGov as string);
            if (useCty && useCty !== "all") params.append('city', useCty as string);
            if (useSpec && useSpec !== "all") params.append('specialty', useSpec as string);
            if (useName) params.append('name', useName as string);
            if (useGender && useGender !== "all") params.append('gender', useGender as string);
            if (useMin) params.append('minPrice', useMin as string);
            if (useMax) params.append('maxPrice', useMax as string);
            if (useStatus && useStatus !== "all") params.append('status', useStatus as string);

            const url = `/admin/doctors?${params.toString()}`;
            const res = await api.get(url);
            setDoctors(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [governorate, city, specialty, searchTerm, gender, minPrice, maxPrice, statusFilter]);

    useEffect(() => {
        fetchData();
        fetchStats();

        // Polling for stats and notifications every 30 seconds
        const interval = setInterval(() => {
            fetchStats(true);
        }, 30000);

        // Fetch users once
        const fetchUsers = async () => {
            try {
                const res = await api.get("/admin/users");
                setUsers(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchUsers();

        return () => clearInterval(interval);
    }, [fetchData, fetchStats]);


    const handleReset = useCallback(() => {
        setSearchTerm("");
        setGovernorate("");
        setCity("");
        setSpecialty("");
        setGender("");
        setMinPrice("");
        setMaxPrice("");
        fetchData({
            searchTerm: "",
            governorate: "",
            city: "",
            specialty: "",
            gender: "",
            minPrice: "",
            maxPrice: ""
        });
    }, [fetchData]);

    const handleActivateSubscription = useCallback(async (id: string) => {
        try {
            await api.put(`/admin/doctors/${id}/activate-subscription`);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    }, [fetchData]);

    const handleDeactivate = useCallback(async (id: string) => {
        try {
            await api.put(`/admin/doctors/${id}/deactivate`);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    }, [fetchData]);

    const handleTogglePause = useCallback(async (id: string) => {
        try {
            await api.put(`/admin/doctors/${id}/toggle-pause`);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    }, [fetchData]);

    const fetchSummary = useCallback(async (id: string) => {
        setSummaryLoading(true);
        setSummaryOpen(true);
        try {
            const res = await api.get(`/admin/doctors/${id}/summary`);
            setSummaryData(res.data);
        } catch (err) {
            console.error(err);
            toast.error("خطأ في تحميل بيانات الطبيب");
        } finally {
            setSummaryLoading(false);
        }
    }, []);

    const handleApproveRenewal = useCallback(async (id: string) => {
        try {
            await api.put(`/admin/doctors/${id}/approve-renewal`);
            toast.success("تم الموافقة على التجديد");
            fetchData();
            fetchStats();
            if (summaryData?.doctor?._id === id) {
                fetchSummary(id); // Refresh modal if open
            }
        } catch (err) {
            console.error(err);
            toast.error("حدث خطأ أثناء الموافقة");
        }
    }, [fetchData, fetchStats, summaryData, fetchSummary]);

    const handleApproveCommission = useCallback(async (id: string) => {
        try {
            await api.put(`/admin/doctors/${id}/approve-commission`);
            toast.success("تم الموافقة على سداد العمولات بنجاح");
            fetchData();
            fetchStats();
            if (summaryData?.doctor?._id === id) {
                fetchSummary(id); // Refresh modal if open
            }
        } catch (err) {
            console.error(err);
            toast.error("حدث خطأ أثناء الموافقة على العمولات");
        }
    }, [fetchData, fetchStats, summaryData, fetchSummary]);

    const handleDeleteDoctor = useCallback(async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا الطبيب وحسابه نهائياً؟")) return;
        try {
            await api.delete(`/admin/doctors/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    }, [fetchData]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.dispatchEvent(new Event("auth-change"));
        window.location.href = "/login";
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white flex overflow-hidden" dir="rtl">
            {/* Sidebar */}
            <aside className="w-80 bg-[#121214] border-l border-white/5 flex flex-col hidden lg:flex">
                <div className="p-8 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">إدارة طبيبي</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Admin Control Center</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-2">
                    <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-white/5 text-white font-bold transition-all border border-white/5 hover:border-white/10">
                        <LayoutDashboard className="w-5 h-5 text-red-500" />
                        نظرة عامة
                    </button>
                    <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-400 font-bold transition-all hover:bg-white/5 hover:text-white">
                        <Users className="w-5 h-5" />
                        المستخدمين
                    </button>
                    <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-400 font-bold transition-all hover:bg-white/5 hover:text-white">
                        <Stethoscope className="w-5 h-5" />
                        الأطباء
                    </button>
                    <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-400 font-bold transition-all hover:bg-white/5 hover:text-white">
                        <Activity className="w-5 h-5" />
                        الإحصائيات
                    </button>
                    <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-gray-400 font-bold transition-all hover:bg-white/5 hover:text-white">
                        <Settings className="w-5 h-5" />
                        الإعدادات
                    </button>
                </nav>

                <div className="p-6 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-400 font-bold transition-all hover:bg-red-500/10"
                    >
                        <LogOut className="w-5 h-5" />
                        تسجيل الخروج
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/5 px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-black">لوحة التحكم</h1>
                            <div className="h-6 w-px bg-white/10 mx-2" />
                            <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 font-bold hover:text-white transition-colors">
                                <ExternalLink className="w-4 h-4" />
                                عرض الموقع
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Button variant="ghost" size="icon" className="rounded-xl bg-white/5 hover:bg-white/10 text-gray-400">
                                    <Bell className="w-5 h-5" />
                                </Button>
                                {adminStats.pendingRequests > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-red-600 rounded-full text-[10px] font-black ring-2 ring-[#0a0a0b]">
                                        {adminStats.pendingRequests}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 p-1.5 pr-4 rounded-xl border border-white/10">
                                <span className="text-xs font-black text-gray-300">المدير العام</span>
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center font-black">M</div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="bg-[#121214] border-white/5 rounded-[2rem] overflow-hidden group hover:border-red-500/30 transition-all duration-500">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform duration-500">
                                        <Users className="h-7 w-7" />
                                    </div>
                                    <Badge variant="outline" className="bg-blue-500/5 text-blue-500 border-blue-500/20 rounded-full font-bold">+12%</Badge>
                                </div>
                                <p className="text-sm text-gray-400 font-bold mb-1">إجمالي المستخدمين</p>
                                <h3 className="text-4xl font-black text-white">{users.length}</h3>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#121214] border-white/5 rounded-[2rem] overflow-hidden group hover:border-green-500/30 transition-all duration-500">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-4 bg-green-500/10 rounded-2xl text-green-500 group-hover:scale-110 transition-transform duration-500">
                                        <Stethoscope className="h-7 w-7" />
                                    </div>
                                    <Badge variant="outline" className="bg-green-500/5 text-green-500 border-green-500/20 rounded-full font-bold">+5%</Badge>
                                </div>
                                <p className="text-sm text-gray-400 font-bold mb-1">الأطباء المفعلين</p>
                                <h3 className="text-4xl font-black text-white">{doctors.filter(d => d.isProfileComplete).length}</h3>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#121214] border-white/5 rounded-[2rem] overflow-hidden group hover:border-purple-500/30 transition-all duration-500">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-500 group-hover:scale-110 transition-transform duration-500">
                                        <Wallet className="h-7 w-7" />
                                    </div>
                                    <Badge variant="outline" className="bg-purple-500/5 text-purple-500 border-purple-500/20 rounded-full font-bold">تجديد</Badge>
                                </div>
                                <p className="text-sm text-gray-400 font-bold mb-1">طلبات مالية</p>
                                <h3 className="text-4xl font-black text-white">{adminStats.pendingRequests}</h3>
                            </CardContent>
                        </Card>

                        <Card className="bg-red-600 rounded-[2rem] border-none overflow-hidden group relative">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                            <CardContent className="p-8 relative z-10 text-white">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-4 bg-white/20 rounded-2xl text-white">
                                        <ShieldCheck className="h-7 w-7" />
                                    </div>
                                </div>
                                <p className="text-sm text-red-100 font-bold mb-1">النمو الشهري</p>
                                <h3 className="text-4xl font-black uppercase">Rapid</h3>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table Section */}
                    <div className="grid grid-cols-1 gap-8">
                        <Card className="bg-[#121214] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <CardHeader className="p-8 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between bg-white/[0.02] gap-4">
                                <div>
                                    <CardTitle className="text-xl font-black mb-1">إدارة الأطباء</CardTitle>
                                    <p className="text-xs text-gray-500 font-bold">مراجعة وتفعيل الحسابات الجديدة</p>
                                </div>
                                <Button className="bg-red-600 hover:bg-red-700 rounded-xl font-black gap-2">
                                    <UserPlus className="w-4 h-4" />
                                    إضافة طبيب
                                </Button>
                            </CardHeader>

                            <CardContent className="p-0">
                                {/* Filters Sub-header */}
                                <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Filter className="w-4 h-4 text-red-500" />
                                        <h3 className="text-sm font-black text-gray-300">تصفية البحث</h3>
                                        {(searchTerm || governorate || specialty || gender || minPrice) && (
                                            <button
                                                onClick={handleReset}
                                                className="mr-auto text-xs text-red-500 font-bold hover:underline flex items-center gap-1"
                                            >
                                                <X className="w-3 h-3" />
                                                مسح الفلاتر
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-gray-500 font-black uppercase tracking-wider mr-1">اسم الطبيب</Label>
                                            <div className="relative">
                                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <Input
                                                    placeholder="بحث بالاسم..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="bg-white/5 border-white/10 rounded-xl pr-10 h-11 text-sm focus:border-red-500 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-gray-500 font-black uppercase tracking-wider mr-1">المحافظة</Label>
                                            <Select value={governorate || "all"} onValueChange={(val) => { setGovernorate(val === "all" ? "" : val); setCity(""); }}>
                                                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11 text-sm focus:ring-red-500/20 text-white" dir="rtl">
                                                    <SelectValue placeholder="الكل" />
                                                </SelectTrigger>
                                                <SelectContent dir="rtl" className="bg-[#121214] border-white/10 text-white">
                                                    <SelectItem value="all">الكل</SelectItem>
                                                    {governorates.map(gov => <SelectItem key={gov} value={gov}>{gov}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-gray-500 font-black uppercase tracking-wider mr-1">المدينة</Label>
                                            <Select value={city || "all"} onValueChange={(val) => setCity(val === "all" ? "" : val)} disabled={!governorate}>
                                                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11 text-sm disabled:opacity-30 text-white" dir="rtl">
                                                    <SelectValue placeholder="الكل" />
                                                </SelectTrigger>
                                                <SelectContent dir="rtl" className="bg-[#121214] border-white/10 text-white">
                                                    <SelectItem value="all">الكل</SelectItem>
                                                    {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-gray-500 font-black uppercase tracking-wider mr-1">التخصص</Label>
                                            <Select value={specialty || "all"} onValueChange={(val) => setSpecialty(val === "all" ? "" : val)}>
                                                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11 text-sm text-white" dir="rtl">
                                                    <SelectValue placeholder="الكل" />
                                                </SelectTrigger>
                                                <SelectContent dir="rtl" className="bg-[#121214] border-white/10 text-white max-h-[300px]">
                                                    <SelectItem value="all">الكل</SelectItem>
                                                    <SelectGroup>
                                                        <SelectLabel className="text-red-500 font-black">شائع</SelectLabel>
                                                        {popularSpecialties.map(spec => (
                                                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                    <SelectGroup>
                                                        <SelectLabel className="text-gray-500">أخرى</SelectLabel>
                                                        {otherSpecialties.map(spec => (
                                                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-gray-500 font-black uppercase tracking-wider mr-1">النوع</Label>
                                            <Select value={gender || "all"} onValueChange={(val) => setGender(val === "all" ? "" : val)}>
                                                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11 text-sm text-white" dir="rtl">
                                                    <SelectValue placeholder="الكل" />
                                                </SelectTrigger>
                                                <SelectContent dir="rtl" className="bg-[#121214] border-white/10 text-white">
                                                    <SelectItem value="all">الكل</SelectItem>
                                                    <SelectItem value="male">ذكر</SelectItem>
                                                    <SelectItem value="female">أنثى</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-gray-500 font-black uppercase tracking-wider mr-1">سعر الكشف</Label>
                                            <Select
                                                value={minPrice && maxPrice ? `${minPrice}-${maxPrice}` : minPrice ? `${minPrice}-` : maxPrice ? `-${maxPrice}` : "all"}
                                                onValueChange={(val) => {
                                                    if (val === "all") { setMinPrice(""); setMaxPrice(""); }
                                                    else if (val.includes("-")) {
                                                        const parts = val.split("-");
                                                        setMinPrice(parts[0]);
                                                        setMaxPrice(parts[1]);
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11 text-sm text-white" dir="rtl">
                                                    <SelectValue placeholder="الكل" />
                                                </SelectTrigger>
                                                <SelectContent dir="rtl" className="bg-[#121214] border-white/10 text-white">
                                                    <SelectItem value="all">الكل</SelectItem>
                                                    <SelectItem value="0-100">أقل من 100</SelectItem>
                                                    <SelectItem value="100-300">100 - 300</SelectItem>
                                                    <SelectItem value="300-500">300 - 500</SelectItem>
                                                    <SelectItem value="500-">أكثر من 500</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] text-gray-500 font-black uppercase tracking-wider mr-1">حالة الحساب</Label>
                                            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
                                                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11 text-sm text-white" dir="rtl">
                                                    <SelectValue placeholder="الكل" />
                                                </SelectTrigger>
                                                <SelectContent dir="rtl" className="bg-[#121214] border-white/10 text-white">
                                                    <SelectItem value="all">الكل</SelectItem>
                                                    <SelectItem value="active">اشتراك مفعل</SelectItem>
                                                    <SelectItem value="pending_requests">طلبات معلقة (مالية)</SelectItem>
                                                    <SelectItem value="overdue">متأخر عن السداد</SelectItem>
                                                    <SelectItem value="expired">اشتراك منتهي</SelectItem>
                                                    <SelectItem value="paused">إيقاف مؤقت</SelectItem>
                                                    <SelectItem value="deactivated">تم تعطيله</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <Button
                                            onClick={() => fetchData()}
                                            className="bg-white hover:bg-gray-100 text-black rounded-xl font-black px-8 h-11 transition-all shadow-lg shadow-white/5 active:scale-95"
                                        >
                                            تطبيق الفلاتر
                                        </Button>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="p-20 text-center space-y-4">
                                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                                        <p className="text-gray-400 font-bold">جاري تحميل البيانات...</p>
                                    </div>
                                ) : doctors.length > 0 ? (
                                    <div className="overflow-x-auto text-right" dir="rtl">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/5 text-gray-500 text-xs font-black uppercase tracking-widest bg-white/[0.01]">
                                                    <th className="px-8 py-6">الطبيب</th>
                                                    <th className="px-8 py-6">التخصص</th>
                                                    <th className="px-8 py-6">الحالة</th>
                                                    <th className="px-8 py-6 text-left">الإجراءات</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {doctors.map((doc) => (
                                                    <tr key={doc._id} className="hover:bg-white/[0.02] transition-colors group">
                                                        <td className="px-8 py-6">
                                                            <div
                                                                className="flex items-center gap-4 cursor-pointer hover:bg-white/5 p-2 rounded-2xl transition-all group/name scale-hover active:scale-95"
                                                                onClick={() => fetchSummary(doc._id)}
                                                            >
                                                                <div className="relative">
                                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center font-black text-lg group-hover/name:border-red-500/50 transition-colors">
                                                                        {doc.user?.name?.charAt(0)}
                                                                    </div>
                                                                    {doc.renewalRequest?.status === 'pending' && (
                                                                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-[#121214]"></span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-white group-hover/name:text-red-500 transition-colors uppercase italic">{doc.user?.name}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-xs text-gray-500 font-bold">{doc.user?.email}</p>
                                                                        {(doc.renewalRequest?.status === 'pending' || doc.commissionPaymentRequest?.status === 'pending') && (
                                                                            <Badge className="bg-amber-500/10 text-amber-500 border-none text-[10px] font-black h-5 px-1.5 animate-pulse">طلب معلق</Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <Badge variant="outline" className="bg-red-500/5 text-red-500 border-red-500/20 rounded-lg px-3 py-1 font-bold">
                                                                {doc.specialty}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            {doc.isManuallyDeactivated ? (
                                                                <div className="flex items-center gap-2 text-red-500 text-sm font-black">
                                                                    <XCircle className="w-4 h-4" />
                                                                    معطل يدوياً
                                                                </div>
                                                            ) : doc.isPaused ? (
                                                                <div className="flex items-center gap-2 text-amber-500 text-sm font-black">
                                                                    <Pause className="w-4 h-4" />
                                                                    موقوف مؤقتاً
                                                                </div>
                                                            ) : (() => {
                                                                const now = new Date();
                                                                const trialExp = doc.trialExpiresAt ? new Date(doc.trialExpiresAt) : null;
                                                                const subExp = doc.subscriptionExpiresAt ? new Date(doc.subscriptionExpiresAt) : null;

                                                                if (subExp && now < subExp) {
                                                                    return (
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-2 text-green-500 text-sm font-black">
                                                                                <CheckCircle2 className="w-4 h-4" />
                                                                                اشتراك مفعل
                                                                            </div>
                                                                            <p className="text-[10px] text-gray-500 font-bold">ينتهي: {subExp.toLocaleDateString('ar-EG')}</p>
                                                                        </div>
                                                                    );
                                                                }

                                                                if (trialExp && now < trialExp) {
                                                                    return (
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-2 text-blue-500 text-sm font-black">
                                                                                <Activity className="w-4 h-4 animate-pulse" />
                                                                                فترة تجريبية
                                                                            </div>
                                                                            <p className="text-[10px] text-gray-500 font-bold">تنتهي: {trialExp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <div className="flex items-center gap-2 text-gray-500 text-sm font-black">
                                                                        <XCircle className="w-4 h-4" />
                                                                        منتهي الصلاحية
                                                                    </div>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center justify-end gap-3">
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-green-600 hover:bg-green-700 rounded-xl font-black h-10 px-4 whitespace-nowrap"
                                                                    onClick={() => handleActivateSubscription(doc._id)}
                                                                >
                                                                    تفعيل شهر
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className={`h-10 px-4 rounded-xl font-black text-xs whitespace-nowrap ${doc.isPaused ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                                                    onClick={() => handleTogglePause(doc._id)}
                                                                >
                                                                    {doc.isPaused ? "استئناف" : "إيقاف مؤقت"}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-10 px-4 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-500 font-black text-xs whitespace-nowrap"
                                                                    onClick={() => handleDeactivate(doc._id)}
                                                                    disabled={doc.isManuallyDeactivated}
                                                                >
                                                                    تعطيل
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-10 w-10 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50/50"
                                                                    onClick={() => handleDeleteDoctor(doc._id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-20 text-center">
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Search className="w-10 h-10 text-gray-500" />
                                        </div>
                                        <h3 className="text-xl font-black mb-2">لا يوجد أطباء</h3>
                                        <p className="text-gray-500 font-bold">لم يقم أي طبيب بإنشاء ملف شخصي بعد.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Doctor Summary Modal */}
            <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
                <DialogContent className="bg-[#121214] border-white/10 text-white max-w-4xl rounded-[2.5rem] p-0 overflow-hidden" dir="rtl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>تفاصيل الطبيب</DialogTitle>
                    </DialogHeader>
                    {summaryLoading ? (
                        <div className="p-20 text-center space-y-4">
                            <Activity className="w-10 h-10 text-red-500 animate-spin mx-auto" />
                            <p className="font-black text-gray-500">جاري تحميل البيانات...</p>
                        </div>
                    ) : summaryData && (
                        <div className="flex flex-col h-[85vh]">
                            <div className="p-10 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center">
                                            <User className="w-12 h-12 text-red-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-4xl font-black italic uppercase tracking-tight">{summaryData.doctor.user.name}</h2>
                                            <div className="flex items-center gap-3">
                                                <Badge className="bg-red-600 text-white rounded-full px-4">{summaryData.doctor.specialty}</Badge>
                                                <span className="text-gray-500 font-bold text-sm tracking-widest">{summaryData.doctor.user.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs text-gray-500 font-black uppercase mb-1">تاريخ التسجيل</p>
                                        <p className="font-black text-lg">{new Date(summaryData.doctor.createdAt).toLocaleDateString('en-GB')}</p>
                                    </div>
                                </div>

                                {summaryData.doctor.renewalRequest?.status === 'pending' && (
                                    <div className="bg-blue-600/10 border border-blue-600/20 p-6 rounded-3xl flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-600/20 rounded-2xl text-blue-500">
                                                <CreditCard className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-blue-500">طلب تجديد اشتراك (150 ج.م)</h4>
                                                <p className="text-sm text-gray-500 font-bold">المحول منه: {summaryData.doctor.renewalRequest.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                onClick={() => summaryData.doctor.renewalRequest?.receiptImage && window.open(summaryData.doctor.renewalRequest.receiptImage, '_blank')}
                                                variant="outline"
                                                className="bg-white/5 border-white/10 text-white rounded-xl font-bold"
                                            >
                                                عرض الإيصال
                                            </Button>
                                            <Button
                                                onClick={() => handleApproveRenewal(summaryData.doctor._id)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black px-8"
                                            >
                                                تفعيل وتجديد
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {summaryData.doctor.commissionPaymentRequest?.status === 'pending' && (
                                    <div className="bg-emerald-600/10 border border-emerald-600/20 p-6 rounded-3xl flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-emerald-600/20 rounded-2xl text-emerald-500">
                                                <Wallet className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-emerald-500">طلب سداد عمولة ({summaryData.doctor.commissionPaymentRequest.amount} ج.م)</h4>
                                                <p className="text-sm text-gray-500 font-bold">المحول منه: {summaryData.doctor.commissionPaymentRequest.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                onClick={() => summaryData.doctor.commissionPaymentRequest?.receiptImage && window.open(summaryData.doctor.commissionPaymentRequest.receiptImage, '_blank')}
                                                variant="outline"
                                                className="bg-white/5 border-white/10 text-white rounded-xl font-bold"
                                            >
                                                عرض الإيصال
                                            </Button>
                                            <Button
                                                onClick={() => handleApproveCommission(summaryData.doctor._id)}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black px-8"
                                            >
                                                تأكيد السداد
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 grid grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <TrendingUp className="w-5 h-5 text-red-500" />
                                            <h3 className="font-black text-xl">إحصائيات الحجوزات</h3>
                                        </div>

                                        {/* This Month Stats */}
                                        <div className="space-y-4">
                                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">هذا الشهر</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1">الموقع / العيادة</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl font-black text-red-500">{summaryData.stats.thisMonth.website}</span>
                                                        <span className="text-gray-700">/</span>
                                                        <span className="text-xl font-black text-blue-500">{summaryData.stats.thisMonth.direct}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-red-600/10 p-4 rounded-3xl border border-red-600/20">
                                                    <p className="text-[10px] text-red-500 font-black uppercase mb-1">عمولة الموقع (15%)</p>
                                                    <p className="text-xl font-black text-red-500">{summaryData.stats.thisMonth.commission} ج.م</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Lifetime Stats */}
                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">الإجمالي العام (منذ الاشتراك)</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1">إجمالي الحجوزات</p>
                                                    <p className="text-xl font-black text-white">{summaryData.stats.lifetime.total} حجز</p>
                                                </div>
                                                <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1">إجمالي العمولة المستحقة</p>
                                                    <p className="text-xl font-black text-white">{summaryData.stats.lifetime.commission} ج.م</p>
                                                </div>
                                                <div className="bg-white/5 p-4 rounded-3xl border border-white/5 col-span-2 flex justify-between items-center">
                                                    <div className="flex gap-4">
                                                        <div>
                                                            <span className="text-[10px] text-gray-500 block">الموقع</span>
                                                            <span className="font-black text-red-500">{summaryData.stats.lifetime.website}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-gray-500 block">العيادة</span>
                                                            <span className="font-black text-blue-500">{summaryData.stats.lifetime.direct}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] text-gray-500 block">سعر الكشف</span>
                                                        <span className="font-black">{summaryData.doctor.pricing?.consultationFee || 0} ج.م</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <History className="w-5 h-5 text-blue-500" />
                                        <h3 className="font-black text-xl">سجل الاشتراكات</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {summaryData.subscriptions.length === 0 ? (
                                            <p className="text-gray-500 font-bold p-8 bg-white/5 rounded-3xl text-center">لا يوجد سجل مدفوعات سابق</p>
                                        ) : summaryData.subscriptions.map((sub: Subscription) => (
                                            <div key={sub._id} className="bg-white/5 p-5 rounded-3xl border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <p className="font-black text-sm">{new Date(sub.startDate).toLocaleDateString('en-GB')} - {new Date(sub.endDate).toLocaleDateString('en-GB')}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">المحفظة: {sub.paymentPhone}</p>
                                                </div>
                                                <Badge className="bg-green-600/10 text-green-500 border-none rounded-lg px-3 py-1 font-bold">تم الدفع</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
