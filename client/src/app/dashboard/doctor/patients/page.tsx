"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Search, User, Phone, Mail, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";
import { Plus, Loader2, ArrowLeft, MoreHorizontal, UserCheck, CalendarDays, History } from "lucide-react";

interface Patient {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    gender?: 'male' | 'female';
    createdAt: string;
}

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchPatients = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/doctors/me/patients");
            setPatients(res.data);
            setFilteredPatients(res.data);
        } catch (err) {
            console.error(err);
            toast.error("فشل تحميل قائمة المرضى");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredPatients(patients);
            return;
        }
        const term = searchTerm.toLowerCase();
        const results = patients.filter((p) =>
            p.name.toLowerCase().includes(term) ||
            p.phone?.includes(term) ||
            p.email?.toLowerCase().includes(term)
        );
        setFilteredPatients(results);
    }, [searchTerm, patients]);

    return (
        <div className="container py-8 space-y-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2 text-right">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">سجل المرضى (EMR)</h1>
                    <p className="text-slate-500 font-medium">إدارة ومراجعة السجلات الطبية لجميع المرضى المسجلين</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={fetchPatients}
                        variant="outline"
                        size="lg"
                        className="rounded-2xl border-slate-200 hover:bg-slate-50 font-bold px-6"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                        تحديث القائمة
                    </Button>
                </div>
            </div>

            {/* Search & Stats Section */}
            <div className="relative group">
                <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                </div>
                <Input
                    placeholder="ابحث عن اسم مريض، رقم هاتف، أو بريد إلكتروني..."
                    className="h-16 pr-12 pl-6 rounded-[1.5rem] border-none shadow-xl shadow-slate-200/50 bg-white text-lg font-medium focus-visible:ring-2 focus-visible:ring-red-100 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-red-50 rounded-full" />
                        <div className="absolute inset-0 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-slate-500 font-bold text-lg">جاري تحميل البيانات...</p>
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 py-32 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <User className="h-12 w-12 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">لا يوجد مرضى حالياً</h3>
                    <p className="text-slate-500 text-lg mt-2 max-w-md">
                        {searchTerm ? "لا توجد نتائج تطابق بحثك. جرب كلمات بحث أخرى." : "قائمة المرضى فارغة. ستظهر الأسماء هنا تلقائياً بمجرد إتمام أول حجز."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-8">
                    {filteredPatients.map((patient) => (
                        <Card key={patient._id} className="group relative overflow-hidden border-none shadow-lg shadow-slate-200/40 bg-white hover:shadow-2xl hover:shadow-red-200/20 transition-all duration-500 rounded-[2.5rem] hover:-translate-y-2">
                            {/* Decorative element */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />

                            <CardContent className="p-8 space-y-6 relative z-10 text-right">
                                <div className="flex items-start justify-between">
                                    <div className="h-16 w-16 rounded-[1.25rem] bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border border-slate-200 shadow-sm group-hover:from-red-50 group-hover:to-white group-hover:border-red-100 transition-all duration-500">
                                        <User className="h-8 w-8 text-slate-400 group-hover:text-red-500 transition-colors" />
                                    </div>
                                    <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-full border border-emerald-100">
                                        <UserCheck className="h-4 w-4" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 group-hover:text-red-700 transition-colors uppercase tracking-tight">
                                        {patient.name}
                                    </h3>
                                    <div className="flex items-center justify-end gap-2 text-slate-400">
                                        {patient.gender && (
                                            <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                                                {patient.gender === 'male' ? 'ذكر' : 'أنثى'}
                                            </span>
                                        )}
                                        {!patient.gender && (
                                            <span className="text-[10px] font-bold bg-amber-50 px-2 py-0.5 rounded text-amber-600 border border-amber-100 italic">
                                                لم يحدد الجنس
                                            </span>
                                        )}
                                        <span className="text-xs font-medium">مريض مسجل</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 border-t border-slate-50 pt-6">
                                    <div className="flex items-center justify-end gap-3 text-sm text-slate-600 font-bold p-3 bg-slate-50/50 rounded-2xl group-hover:bg-white group-hover:shadow-sm transition-all">
                                        <span dir="ltr">{patient.phone}</span>
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                                            <Phone className="h-4 w-4 text-red-500" />
                                        </div>
                                    </div>

                                    {patient.email && (
                                        <div className="flex items-center justify-end gap-3 text-sm text-slate-600 font-bold p-3 bg-slate-50/50 rounded-2xl group-hover:bg-white group-hover:shadow-sm transition-all overflow-hidden text-ellipsis">
                                            <span className="truncate">{patient.email}</span>
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                                                <Mail className="h-4 w-4 text-red-500" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <Link href={`/dashboard/doctor/patients/${patient._id}`} className="block">
                                        <Button className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-red-600 text-white font-black text-lg shadow-xl shadow-slate-200 group-hover:shadow-red-200 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 group/btn">
                                            <FileText className="h-5 w-5" />
                                            فتح الملف الطبي
                                            <ArrowLeft className="h-5 w-5 group-hover/btn:-translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
