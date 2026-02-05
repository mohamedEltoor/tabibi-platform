"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/axios";
import {
    Calendar,
    Clock,
    FileText,
    User,
    ChevronRight,
    ClipboardList,
    Pill,
    Upload,
    Eye,
    FileIcon,
    ShieldCheck,
    Activity,
    Settings,
    History,
    AlertCircle,
    Loader2
} from "lucide-react";
import DashboardNav from "@/components/DashboardNav";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PatientDashboard() {
    const [activeTab, setActiveTab] = useState("appointments");
    const [appointments, setAppointments] = useState([]);
    const [history, setHistory] = useState([]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';

    useEffect(() => {
        fetchAllData();
    }, []);

    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [aptRes, histRes, userRes] = await Promise.all([
                api.get("/appointments/me"),
                api.get("/patients/me/history"),
                api.get("/auth/me")
            ]);
            setAppointments(aptRes.data);
            setHistory(histRes.data);
            setUser(userRes.data);

            try {
                const profRes = await api.get("/patients/me");
                setProfile(profRes.data);
            } catch (profErr: any) {
                if (profErr.response?.status === 404) {
                    console.log("No profile found - this is likely a new user.");
                    setProfile({}); // Set empty profile for new users
                } else {
                    throw profErr;
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("فشل في تحميل البيانات");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdateLoading(true);
        try {
            const res = await api.put("/patients/me", profile);
            setProfile(res.data);
            toast.success("تم تحديث الملف الشخصي بنجاح");
        } catch (err) {
            console.error(err);
            toast.error("فشل في تحديث الملف الشخصي");
        } finally {
            setUpdateLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 text-red-600 animate-spin" />
                <p className="text-slate-500 font-bold">جاري تحميل بياناتك...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            <DashboardNav />

            <div className="container py-10 max-w-6xl">
                {/* Modern Header Section */}
                <div className="relative mb-12 bg-white rounded-[3rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-red-50/50 rounded-full -mr-48 -mt-48 transition-transform group-hover:scale-110 duration-700" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-50 rounded-full -ml-32 -mb-32 transition-transform group-hover:scale-110 duration-700" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="relative">
                            <div className="h-24 w-24 md:h-32 md:w-32 rounded-[2.5rem] bg-gradient-to-br from-red-50 to-white flex items-center justify-center border-4 border-white shadow-2xl overflow-hidden">
                                <User className="h-12 w-12 md:h-16 md:w-16 text-red-600/20" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-green-500 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                        </div>

                        <div className="text-center md:text-right flex-1">
                            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight italic uppercase">أهلاً بك، {profile?.name || user?.name || 'أيها المريض'}</h1>
                            <p className="text-slate-500 text-lg font-bold flex items-center justify-center md:justify-start gap-2">
                                <Activity className="h-5 w-5 text-red-500" />
                                تتبع حالتك الصحية ومواعيدك بسهولة
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <Card className="bg-white/50 backdrop-blur-sm border-slate-100 rounded-3xl p-4 md:p-6 text-center min-w-[120px]">
                                <p className="text-xs font-black text-slate-400 uppercase mb-1">المواعيد</p>
                                <p className="text-2xl font-black text-slate-900">{appointments.length}</p>
                            </Card>
                            <Card className="bg-red-600 rounded-3xl p-4 md:p-6 text-center min-w-[120px] shadow-lg shadow-red-100">
                                <p className="text-xs font-black text-red-100 uppercase mb-1">فصيلة الدم</p>
                                <p className="text-2xl font-black text-white">{profile?.bloodType || 'غير محدد'}</p>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="appointments" className="space-y-10" onValueChange={setActiveTab}>
                    <div className="flex justify-center md:justify-start">
                        <TabsList className="bg-white p-1.5 h-auto rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30">
                            <TabsTrigger value="appointments" className="rounded-full px-8 py-3 font-black text-sm data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all gap-2">
                                <Calendar className="h-4 w-4" />
                                مواعيدي
                            </TabsTrigger>
                            <TabsTrigger value="history" className="rounded-full px-8 py-3 font-black text-sm data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all gap-2">
                                <History className="h-4 w-4" />
                                السجل الطبي
                            </TabsTrigger>
                            <TabsTrigger value="profile" className="rounded-full px-8 py-3 font-black text-sm data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all gap-2">
                                <User className="h-4 w-4" />
                                الملف الشخصي
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="appointments" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                    المواعيد المحجوزة
                                    <span className="text-sm font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{appointments.length}</span>
                                </h2>

                                {appointments.length > 0 ? (
                                    <div className="grid gap-6">
                                        {appointments.map((apt: any) => (
                                            <Card key={apt._id} className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-[2rem] group">
                                                <div className="p-1 px-8 bg-slate-50 group-hover:bg-red-50/50 transition-colors">
                                                    <div className="flex justify-between items-center py-4 border-b border-slate-100/50">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                                                                <User className="h-6 w-6 text-red-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-black text-slate-900 text-lg">د. {apt.doctor?.user?.name || 'طبيبي'}</h3>
                                                                <p className="text-sm font-bold text-red-600/80">{apt.doctor?.specialty || 'تخصص عام'}</p>
                                                            </div>
                                                        </div>
                                                        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                            apt.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {apt.status === 'confirmed' ? 'موعد مؤكد' :
                                                                apt.status === 'pending' ? 'قيد الانتظار' : 'ملغي'}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                                                                <Calendar className="h-5 w-5 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">التاريخ</p>
                                                                <p className="font-bold text-slate-700">{new Date(apt.date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                                                                <Clock className="h-5 w-5 text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">الوقت</p>
                                                                <p className="font-bold text-slate-700 underline decoration-red-200 underline-offset-4">{apt.time}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 py-24 flex flex-col items-center justify-center text-center px-6">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                            <Calendar className="h-10 w-10 text-slate-300" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900">لا يوجد مواعيد حالية</h3>
                                        <p className="text-slate-500 font-bold mt-2">يمكنك حجز موعد جديد مع طبيبك في أي وقت.</p>
                                        <Button
                                            onClick={() => router.push('/search')}
                                            className="mt-6 rounded-2xl bg-slate-900 hover:bg-red-600 px-8 py-6 h-auto font-black transition-all active:scale-95"
                                        >
                                            حجز موعد الآن
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-2xl font-black text-slate-900">نصائح صحية</h2>
                                <Card className="bg-gradient-to-br from-red-600 to-red-700 border-none rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-red-100">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                                    <AlertCircle className="h-10 w-10 text-red-200/50 mb-4" />
                                    <h3 className="text-xl font-black mb-2">تذكير هام!</h3>
                                    <p className="font-bold text-red-50 leading-relaxed mb-6">
                                        تأكد من شرب 8 أكواب ماء يومياً وممارسة الرياضة لمدة 30 دقيقة للحفاظ على صحتك.
                                    </p>
                                    <Button className="w-full rounded-xl bg-white text-red-600 hover:bg-red-50 font-black h-12">اقرأ المزيد</Button>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                السجل الطبي الكامل
                                <span className="text-sm font-bold bg-red-50 text-red-600 px-3 py-1 rounded-full">{history.length} زيارة</span>
                            </h2>
                        </div>

                        {history.length > 0 ? (
                            <div className="space-y-12 relative before:absolute before:right-[-1.5rem] md:before:right-[-2.5rem] before:top-4 before:bottom-4 before:w-1 before:bg-slate-100 pr-6 md:pr-10">
                                {history.map((record: any, idx) => (
                                    <div key={record._id} className="relative group">
                                        {/* Timeline dot */}
                                        <div className="absolute -right-[1.85rem] md:-right-[2.85rem] top-8 md:top-10 h-5 w-5 rounded-full border-4 border-white bg-red-600 shadow-xl z-20 transition-transform group-hover:scale-125 duration-300" />

                                        <Card className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white">
                                            <div className="p-8 border-b border-slate-50 flex flex-wrap gap-4 items-center justify-between bg-slate-50/30">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md border border-slate-100">
                                                        <ClipboardList className="h-7 w-7 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{record.diagnosis}</h3>
                                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">بواسطة: د. {record.doctor?.user?.name}</p>
                                                    </div>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-black text-slate-400 uppercase">{new Date(record.visitDate).getFullYear()}</p>
                                                    <p className="text-xl font-black text-slate-900">{new Date(record.visitDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</p>
                                                </div>
                                            </div>

                                            <CardContent className="p-8 space-y-10">
                                                {/* Prescriptions */}
                                                {record.prescriptions?.length > 0 && (
                                                    <div className="space-y-4">
                                                        <p className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                                            <Pill className="h-4 w-4" />
                                                            الأدوية الموصوفة
                                                        </p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {record.prescriptions.map((rx: any, i: number) => (
                                                                <div key={i} className="flex items-center gap-4 bg-red-50/20 p-5 rounded-3xl border border-red-50/50">
                                                                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-red-100">
                                                                        <Pill className="h-6 w-6 text-red-500" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-black text-slate-900 underline decoration-red-200 underline-offset-4">{rx.medication}</p>
                                                                        <p className="text-xs font-bold text-slate-500 mt-0.5">{rx.dosage} • {rx.duration}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Doctor's Notes */}
                                                {record.notes && (
                                                    <div className="bg-amber-50/30 p-8 rounded-[2rem] border border-amber-100/50 relative overflow-hidden group/note">
                                                        <div className="absolute top-0 left-0 w-2 h-full bg-amber-400 opacity-20 transition-opacity group-hover/note:opacity-50" />
                                                        <p className="flex items-center gap-2 text-xs font-black text-amber-700 uppercase mb-4">
                                                            <FileText className="h-4 w-4" />
                                                            توصيات الطبيب
                                                        </p>
                                                        <p className="text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">{record.notes}</p>
                                                    </div>
                                                )}

                                                {/* Attachments */}
                                                {record.attachments?.length > 0 && (
                                                    <div className="space-y-6">
                                                        <p className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                                            <Upload className="h-4 w-4" />
                                                            ملفات الأشعة والتحاليل
                                                        </p>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                                            {record.attachments.map((url: string, i: number) => {
                                                                const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
                                                                const fullFileUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
                                                                return (
                                                                    <div key={i} className="group relative aspect-square rounded-[2rem] border-2 border-slate-100 overflow-hidden bg-slate-50 shadow-sm hover:shadow-xl transition-all duration-300">
                                                                        {isImage ? (
                                                                            <img src={fullFileUrl} alt="attachment" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                                                                <FileIcon className="h-10 w-10 text-slate-300" />
                                                                                <span className="text-[10px] font-black text-slate-400 uppercase">PDF</span>
                                                                            </div>
                                                                        )}
                                                                        <a
                                                                            href={fullFileUrl}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                                                                <Eye className="h-6 w-6 text-slate-900" />
                                                                            </div>
                                                                        </a>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-[4rem] border border-dashed border-slate-200 py-40 flex flex-col items-center justify-center text-center px-6">
                                <div className="w-24 h-24 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center mb-6 shadow-inner">
                                    <ClipboardList className="h-12 w-12 text-slate-300" />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900">سجلك الطبي فارغ</h3>
                                <p className="text-slate-500 text-lg font-bold mt-2 max-w-sm">
                                    بعد زيارتك للطبيب، ستظهر جميع الفحوصات والتشخيصات هنا فوراً وتلقائياً.
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden">
                            <div className="bg-slate-900 p-12 text-white relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
                                <div className="relative z-10">
                                    <h2 className="text-3xl font-black tracking-tight mb-2">إدارة ملفك الصحي</h2>
                                    <p className="text-slate-400 font-bold">هذه المعلومات تساعد الأطباء على تقديم رعاية أفضل لك.</p>
                                </div>
                            </div>

                            <CardContent className="p-12">
                                <form onSubmit={handleUpdateProfile} className="space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                <User className="h-4 w-4 text-red-500" />
                                                الجنس
                                            </Label>
                                            <Select
                                                value={profile?.gender}
                                                onValueChange={(val) => setProfile({ ...profile, gender: val })}
                                            >
                                                <SelectTrigger className="h-16 rounded-2xl border-slate-100 bg-slate-50 font-bold px-6 focus:ring-red-500 text-lg">
                                                    <SelectValue placeholder="اختر الجنس" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                                    <SelectItem value="male" className="font-bold py-3">ذكر</SelectItem>
                                                    <SelectItem value="female" className="font-bold py-3">أنثى</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-red-500" />
                                                فصيلة الدم
                                            </Label>
                                            <Select
                                                value={profile?.bloodType}
                                                onValueChange={(val) => setProfile({ ...profile, bloodType: val })}
                                            >
                                                <SelectTrigger className="h-16 rounded-2xl border-slate-100 bg-slate-50 font-bold px-6 focus:ring-red-500 text-lg">
                                                    <SelectValue placeholder="اختر الفصيلة" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                                                        <SelectItem key={type} value={type} className="font-bold py-3">{type}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-red-500" />
                                                تاريخ الميلاد
                                            </Label>
                                            <Input
                                                type="date"
                                                className="h-16 rounded-2xl border-slate-100 bg-slate-50 font-bold px-6 focus:ring-red-500 text-lg"
                                                value={profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : ''}
                                                onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 text-red-500" />
                                                جهة اتصال للطوارئ
                                            </Label>
                                            <Input
                                                placeholder="الاسم والرقم..."
                                                className="h-16 rounded-2xl border-slate-100 bg-slate-50 font-bold px-6 focus:ring-red-500 text-lg"
                                                value={profile?.emergencyContact || ''}
                                                onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-6">
                                        <Label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                            هل تعاني من أي حساسية؟
                                        </Label>
                                        <Input
                                            placeholder="اذكر أنواع الحساسية إن وجدت..."
                                            className="h-16 rounded-2xl border-slate-100 bg-slate-50 font-bold px-6 focus:ring-red-500 text-lg"
                                            value={profile?.allergies || ''}
                                            onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                                        />
                                    </div>

                                    <div className="pt-10 flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={updateLoading}
                                            className="h-16 px-12 rounded-[2rem] bg-red-600 hover:bg-red-700 text-white font-black text-xl shadow-xl shadow-red-100 transition-all active:scale-95 gap-3"
                                        >
                                            {updateLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Settings className="h-6 w-6" />}
                                            حفظ التغييرات
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
