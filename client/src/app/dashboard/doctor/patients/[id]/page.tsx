"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/axios";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, Loader2, ArrowLeft, MoreHorizontal, UserCheck, CalendarDays, History, Trash2, Edit3, ClipboardList, Info, User, Phone, Calendar, Clock, Pill, Stethoscope, ChevronRight, FileText, Upload, Image, FileIcon, X, Eye } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function PatientDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id as string;
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';

    const [profile, setProfile] = useState<any>(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add Visit State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [newVisit, setNewVisit] = useState({
        diagnosis: "",
        symptoms: "",
        medications: [{ name: "", dosage: "", duration: "" }],
        notes: "",
        visitDate: new Date().toISOString().split('T')[0],
        attachments: [] as string[]
    });
    const [uploading, setUploading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [profileRes, historyRes] = await Promise.all([
                api.get(`/doctors/me/patients/${patientId}/profile`),
                api.get(`/doctors/me/patients/${patientId}/emr`)
            ]);
            setProfile(profileRes.data);
            setHistory(historyRes.data);
        } catch (err: any) {
            console.error(err);
            toast.error("فشل تحميل بيانات المريض");
            if (err.response?.status === 404) {
                router.push("/dashboard/doctor/patients");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (patientId) fetchData();
    }, [patientId]);

    const handleAddMedication = () => {
        setNewVisit({
            ...newVisit,
            medications: [...newVisit.medications, { name: "", dosage: "", duration: "" }]
        });
    };

    const handleMedicationChange = (index: number, field: string, value: string) => {
        const updated = [...newVisit.medications];
        updated[index] = { ...updated[index], [field]: value };
        setNewVisit({ ...newVisit, medications: updated });
    };

    const handleRemoveMedication = (index: number) => {
        const updated = newVisit.medications.filter((_, i) => i !== index);
        setNewVisit({ ...newVisit, medications: updated });
    };

    const handleEditVisit = (record: any) => {
        setEditingVisitId(record._id);

        // Transform prescriptions back to form format
        const formMedications = record.prescriptions.length > 0
            ? record.prescriptions.map((p: any) => ({
                name: p.medication,
                dosage: p.dosage || "",
                duration: p.duration || ""
            }))
            : [{ name: "", dosage: "", duration: "" }];

        setNewVisit({
            diagnosis: record.diagnosis || "",
            symptoms: record.symptoms ? record.symptoms.join(', ') : "",
            medications: formMedications,
            notes: record.notes || "",
            visitDate: new Date(record.visitDate).toISOString().split('T')[0],
            attachments: record.attachments || []
        });

        setIsAddOpen(true);
    };

    const handleOpenAdd = () => {
        setEditingVisitId(null);
        setNewVisit({
            diagnosis: "",
            symptoms: "",
            medications: [{ name: "", dosage: "", duration: "" }],
            notes: "",
            visitDate: new Date().toISOString().split('T')[0],
            attachments: []
        });
        setIsAddOpen(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            const res = await api.post('/doctors/me/patients/emr/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewVisit(prev => ({
                ...prev,
                attachments: [...prev.attachments, ...res.data.urls]
            }));
            toast.success("تم رفع الملفات بنجاح");
        } catch (err) {
            console.error(err);
            toast.error("فشل رفع الملفات");
        } finally {
            setUploading(false);
        }
    };

    const removeAttachment = (index: number) => {
        setNewVisit(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const handleSubmitVisit = async () => {
        if (!newVisit.diagnosis) {
            toast.error("يرجى كتابة التشخيص");
            return;
        }

        setSubmitLoading(true);
        try {
            // Format prescriptions
            const prescriptions = newVisit.medications
                .filter(m => m.name) // Remove empty
                .map(m => ({
                    medication: m.name,
                    dosage: m.dosage,
                    duration: m.duration
                }));

            const payload = {
                diagnosis: newVisit.diagnosis,
                symptoms: newVisit.symptoms ? newVisit.symptoms.split(',').map(s => s.trim()) : [],
                prescriptions,
                notes: newVisit.notes,
                visitDate: newVisit.visitDate,
                attachments: newVisit.attachments,
                patientName: profile?.name
            };

            if (editingVisitId) {
                // Update existing
                await api.put(`/doctors/me/patients/emr/${editingVisitId}`, payload);
                toast.success("تم تحديث السجل بنجاح");
            } else {
                // Create new
                await api.post(`/doctors/me/patients/${patientId}/emr`, payload);
                toast.success("تم إضافة الزيارة بنجاح");
            }

            setIsAddOpen(false);
            setEditingVisitId(null);
            setNewVisit({
                diagnosis: "",
                symptoms: "",
                medications: [{ name: "", dosage: "", duration: "" }],
                notes: "",
                visitDate: new Date().toISOString().split('T')[0],
                attachments: []
            });
            fetchData();
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.error || err.response?.data?.msg || "فشل حفظ الزيارة";
            toast.error(errorMsg);
        } finally {
            setSubmitLoading(false);
        }
    };

    const updateGender = async (gender: string) => {
        try {
            await api.put(`/doctors/me/patients/${patientId}/profile`, { gender });
            setProfile({ ...profile, gender });
            toast.success("تم تحديث الجنس بنجاح");
        } catch (err: any) {
            console.error(err);
            toast.error("فشل تحديث الجنس");
        }
    };

    if (loading) return <div className="container py-12 text-center">جاري التحميل...</div>;
    if (!profile) return <div className="container py-12 text-center">لم يتم العثور على المريض</div>;

    return (
        <div className="container py-8 space-y-10">
            {/* Breadcrumbs & Navigation */}
            <div className="flex items-center gap-2 mb-6">
                <Link href="/dashboard/doctor/patients" className="group flex items-center gap-2 text-slate-400 hover:text-red-600 font-bold transition-all">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-red-50 transition-colors">
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                    </div>
                    قائمة المرضى
                </Link>
                <ChevronRight className="h-3 w-3 text-slate-300" />
                <span className="text-slate-900 font-black">{profile.name}</span>
            </div>

            {/* Patient Header Card */}
            <div className="relative overflow-hidden bg-white border-none shadow-xl shadow-slate-200/50 rounded-[3rem] p-8 md:p-10">
                {/* Decorative backgrounds */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-50 rounded-full -ml-16 -mb-16 opacity-30" />

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border-4 border-white shadow-xl">
                            <User className="h-12 w-12 text-slate-400" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">{profile.name}</h1>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${profile.type === 'guest' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                    {profile.type === 'guest' ? 'مريض زائر' : 'حساب مسجل'}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-3 bg-slate-50/80 px-5 py-2.5 rounded-2xl border border-slate-100/50 shadow-sm">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    <span dir="ltr" className="font-mono text-base font-bold text-slate-600 tracking-tight">{profile.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-50/80 px-5 py-2.5 rounded-2xl border border-slate-100/50 shadow-sm">
                                    <Info className="h-4 w-4 text-slate-400" />
                                    <Select value={profile.gender} onValueChange={updateGender}>
                                        <SelectTrigger className="w-auto h-auto bg-transparent border-none font-bold text-slate-600 p-0 focus:ring-0 gap-2 flex items-center">
                                            <SelectValue placeholder="تحديد الجنس" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2 min-w-[120px]">
                                            <SelectItem value="male" className="rounded-xl font-bold py-3 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">ذكر</SelectItem>
                                            <SelectItem value="female" className="rounded-xl font-bold py-3 focus:bg-red-50 focus:text-red-700 cursor-pointer">أنثى</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="h-16 px-8 rounded-2xl bg-slate-900 hover:bg-red-600 text-white font-black text-lg gap-3 shadow-xl transition-all active:scale-95"
                                    onClick={handleOpenAdd}
                                >
                                    <Plus className="h-6 w-6" />
                                    تسجيل زيارة جديدة
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl p-0">
                                <div className="p-8 md:p-10 space-y-8">
                                    <DialogHeader>
                                        <DialogTitle className="text-3xl font-black text-slate-900">
                                            {editingVisitId ? "تعديل سجل طبي" : "تسجيل حالة طبية جديدة"}
                                        </DialogTitle>
                                        <p className="text-slate-500 font-medium">أكمل التفاصيل الطبية للزيارة الحالية</p>
                                    </DialogHeader>

                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <Label className="text-sm font-black text-slate-700">تاريخ الزيارة</Label>
                                                <Input
                                                    type="date"
                                                    className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold"
                                                    value={newVisit.visitDate}
                                                    onChange={(e) => setNewVisit({ ...newVisit, visitDate: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-sm font-black text-slate-700">التشخيص (Diagnosis) *</Label>
                                                <Input
                                                    placeholder="مثال: التهاب حاد في الحلق"
                                                    className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold py-4"
                                                    value={newVisit.diagnosis}
                                                    onChange={(e) => setNewVisit({ ...newVisit, diagnosis: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm font-black text-slate-700">الأعراض (Symptoms)</Label>
                                            <Textarea
                                                placeholder="أدخل الأعراض، افصل بينها بـ (،)"
                                                className="min-h-[100px] rounded-xl border-slate-100 bg-slate-50 font-bold pt-4"
                                                value={newVisit.symptoms}
                                                onChange={(e) => setNewVisit({ ...newVisit, symptoms: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <Label className="flex items-center gap-2 text-sm font-black text-slate-900">
                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                        <Pill className="h-4 w-4 text-red-500" />
                                                    </div>
                                                    الوصفة الطبية (Rx)
                                                </Label>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={handleAddMedication}
                                                    className="rounded-xl font-black bg-white hover:bg-slate-900 hover:text-white transition-all"
                                                >
                                                    + إضافة دواء
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                {newVisit.medications.map((med, idx) => (
                                                    <div key={idx} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <Input
                                                            placeholder="اسم الدواء (Panadol)"
                                                            className="flex-1 h-12 border-none bg-slate-50/50 font-black rounded-lg"
                                                            value={med.name}
                                                            onChange={(e) => handleMedicationChange(idx, 'name', e.target.value)}
                                                        />
                                                        <Input
                                                            placeholder="الجرعة"
                                                            className="md:w-32 h-12 border-none bg-slate-50/50 font-bold rounded-lg"
                                                            value={med.dosage}
                                                            onChange={(e) => handleMedicationChange(idx, 'dosage', e.target.value)}
                                                        />
                                                        <Input
                                                            placeholder="المدة"
                                                            className="md:w-32 h-12 border-none bg-slate-50/50 font-bold rounded-lg"
                                                            value={med.duration}
                                                            onChange={(e) => handleMedicationChange(idx, 'duration', e.target.value)}
                                                        />
                                                        {idx > 0 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRemoveMedication(idx)}
                                                                className="text-red-500 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm font-black text-slate-700">ملاحظات الطبيب</Label>
                                            <Textarea
                                                placeholder="..."
                                                className="min-h-[100px] rounded-xl border-slate-100 bg-slate-50 font-bold pt-4"
                                                value={newVisit.notes}
                                                onChange={(e) => setNewVisit({ ...newVisit, notes: e.target.value })}
                                            />
                                        </div>

                                        {/* File Upload Section */}
                                        <div className="space-y-4 pt-4 border-t border-slate-50">
                                            <Label className="flex items-center gap-2 text-sm font-black text-slate-900">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                                    <Upload className="h-4 w-4 text-slate-400" />
                                                </div>
                                                المرفقات (أشعة، تحاليل، ...)
                                            </Label>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {newVisit.attachments.map((url, idx) => {
                                                    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
                                                    const fullFileUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
                                                    return (
                                                        <div key={idx} className="relative group aspect-square rounded-2xl border border-slate-100 overflow-hidden bg-slate-50">
                                                            {isImage ? (
                                                                <img src={fullFileUrl} alt="attachment" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                                                    <FileIcon className="h-8 w-8 text-slate-300" />
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">PDF</span>
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() => removeAttachment(idx)}
                                                                className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                                <label className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-red-200 hover:bg-red-50/30 transition-all cursor-pointer group">
                                                    <input
                                                        type="file"
                                                        multiple
                                                        className="hidden"
                                                        onChange={handleFileUpload}
                                                        accept="image/*,.pdf"
                                                        disabled={uploading}
                                                    />
                                                    {uploading ? (
                                                        <Loader2 className="h-6 w-6 text-red-500 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Plus className="h-6 w-6 text-slate-300 group-hover:text-red-500 transition-colors" />
                                                            <span className="text-[10px] font-bold text-slate-400 mt-2">إضافة ملف</span>
                                                        </>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setIsAddOpen(false)}
                                            className="h-14 px-8 rounded-xl font-bold text-slate-500"
                                        >
                                            إلغاء التعديل
                                        </Button>
                                        <Button
                                            onClick={handleSubmitVisit}
                                            disabled={submitLoading}
                                            className="h-14 flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-lg shadow-xl shadow-red-100 transition-all active:scale-95"
                                        >
                                            {submitLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingVisitId ? "تحديث السجل" : "حفظ الزيارة")}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Visit History Timeline */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 border-r-4 border-red-600 pr-4">
                        سجل الزيارات والحالة الصحية
                    </h2>
                    <div className="h-10 px-4 bg-slate-50 rounded-full flex items-center gap-2 border border-slate-100">
                        <History className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">إجمالي الزيارات: {history.length}</span>
                    </div>
                </div>

                {history.length === 0 ? (
                    <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 py-32 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <Stethoscope className="h-12 w-12 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">لا يوجد سجلات سابقة</h3>
                        <p className="text-slate-500 text-lg mt-2 max-w-md">لم يتم تسجيل أي زيارات طبية لهذا المريض بعد.</p>
                        <Button
                            variant="link"
                            onClick={handleOpenAdd}
                            className="text-red-600 font-black text-lg mt-4"
                        >
                            ابدأ بتسجيل أول زيارة الآن
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-12 relative before:absolute before:right-[5.75rem] md:before:right-[7.75rem] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                        {history.map((record: any, index: number) => (
                            <div key={record._id} className="relative flex flex-col md:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                                {/* Date Section */}
                                <div className="md:w-32 flex md:justify-end md:text-left shrink-0 z-10 pt-2">
                                    <div className="flex flex-col items-center md:items-end gap-1">
                                        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                                            {new Date(record.visitDate).toLocaleDateString('ar-EG', { year: 'numeric' })}
                                        </span>
                                        <span className="text-slate-900 font-black text-2xl leading-none">
                                            {new Date(record.visitDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                </div>

                                {/* Timeline dot */}
                                <div className="absolute right-[5.25rem] md:right-[7.25rem] top-4 md:top-6 h-4 w-4 rounded-full border-4 border-white bg-red-600 shadow-md z-20 group-hover:scale-125 transition-transform" />

                                {/* Record Card */}
                                <Card className="flex-1 group overflow-hidden border-none shadow-lg shadow-slate-200/40 bg-white hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 rounded-[2rem]">
                                    <CardHeader className="p-8 pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                                <ClipboardList className="h-6 w-6 text-red-500" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl font-black text-slate-900 leading-tight">{record.diagnosis}</CardTitle>
                                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">تشخيص الحالة المرضية</p>
                                            </div>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleEditVisit(record)}
                                            className="h-12 w-12 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                                        >
                                            <Edit3 className="h-5 w-5" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-8">
                                        {record.symptoms && record.symptoms.length > 0 && (
                                            <div className="space-y-3">
                                                <p className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-tighter">
                                                    <Stethoscope className="h-3.5 w-3.5" />
                                                    الأعراض المسجلة
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {record.symptoms.map((sym: string, i: number) => (
                                                        <span key={i} className="px-4 py-2 bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-100 text-sm">
                                                            {sym}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {record.prescriptions && record.prescriptions.length > 0 && (
                                            <div className="space-y-4">
                                                <p className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-tighter">
                                                    <Pill className="h-3.5 w-3.5" />
                                                    الوصفة الطبية (Rx)
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {record.prescriptions.map((rx: any, i: number) => (
                                                        <div key={i} className="flex gap-4 items-center bg-red-50/30 p-4 rounded-2xl border border-red-50/50">
                                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-red-100 shrink-0">
                                                                <Pill className="h-5 w-5 text-red-500" />
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className="font-black text-slate-900 leading-none underline decoration-red-200 underline-offset-4">{rx.medication}</p>
                                                                <div className="flex gap-2 text-xs font-bold text-slate-500">
                                                                    {rx.dosage && <span>{rx.dosage}</span>}
                                                                    {rx.duration && <span>• {rx.duration}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {record.notes && (
                                            <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 shadow-sm shadow-amber-50 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-2 h-full bg-amber-400 opacity-50" />
                                                <p className="text-xs font-black text-amber-700 uppercase mb-3 flex items-center gap-2">
                                                    <FileText className="h-3.5 w-3.5" />
                                                    توصيات وملاحظات إضافية
                                                </p>
                                                <p className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                    {record.notes}
                                                </p>
                                            </div>
                                        )}

                                        {record.attachments && record.attachments.length > 0 && (
                                            <div className="space-y-4">
                                                <p className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-tighter">
                                                    <Upload className="h-3.5 w-3.5" />
                                                    المرفقات والتقارير الطبية
                                                </p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                    {record.attachments.map((url: string, i: number) => {
                                                        const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
                                                        const fullFileUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
                                                        return (
                                                            <div key={i} className="group relative aspect-square rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 shadow-sm hover:shadow-md transition-all">
                                                                {isImage ? (
                                                                    <img src={fullFileUrl} alt="attachment" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                                ) : (
                                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                                                        <FileIcon className="h-10 w-10 text-slate-300" />
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase">التقرير PDF</span>
                                                                    </div>
                                                                )}
                                                                <a
                                                                    href={fullFileUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                                                        <Eye className="h-5 w-5 text-slate-900" />
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
                )}
            </div>
        </div>
    );
}
