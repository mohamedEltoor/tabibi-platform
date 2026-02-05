"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DoctorCard } from "@/components/DoctorCard";
import api from "@/lib/axios";
import { Search, Filter, MapPin, Stethoscope, Users, X, Sparkles } from "lucide-react";
import { getGovernorates, getCities } from "@/lib/egyptData";
import { popularSpecialties, otherSpecialties } from "@/lib/medicalData";

export default function SearchClient() {
    const searchParams = useSearchParams();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [governorate, setGovernorate] = useState("");
    const [city, setCity] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [gender, setGender] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    const governorates = getGovernorates();
    const cities = governorate ? getCities(governorate) : [];

    useEffect(() => {
        const govParam = searchParams.get('governorate') || '';
        const cityParam = searchParams.get('city') || '';
        const specialtyParam = searchParams.get('specialty') || '';
        const nameParam = searchParams.get('name') || '';
        const genderParam = searchParams.get('gender') || '';
        const minPriceParam = searchParams.get('minPrice') || '';
        const maxPriceParam = searchParams.get('maxPrice') || '';

        setGovernorate(govParam);
        setCity(cityParam);
        setSpecialty(specialtyParam);
        setSearchTerm(nameParam);
        setGender(genderParam);
        setMinPrice(minPriceParam);
        setMaxPrice(maxPriceParam);

        searchDoctors(govParam, cityParam, specialtyParam, nameParam, genderParam, minPriceParam, maxPriceParam);
    }, [searchParams]);


    const searchDoctors = async (gov?: string, cty?: string, spec?: string, name?: string, gndr?: string, min?: string, max?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            const useGov = gov !== undefined ? (gov === "all" ? "" : gov) : (governorate === "all" ? "" : governorate);
            const useCty = cty !== undefined ? (cty === "all" ? "" : cty) : (city === "all" ? "" : city);
            const useSpec = spec !== undefined ? (spec === "all" ? "" : spec) : (specialty === "all" ? "" : specialty);
            const useName = name !== undefined ? name : searchTerm;
            const useGender = gndr !== undefined ? (gndr === "all" ? "" : gndr) : (gender === "all" ? "" : gender);
            const useMin = min !== undefined ? min : minPrice;
            const useMax = max !== undefined ? max : maxPrice;

            if (useGov) params.append('governorate', useGov);
            if (useCty) params.append('city', useCty);
            if (useSpec) params.append('specialty', useSpec);
            if (useName) params.append('name', useName);
            if (useGender) params.append('gender', useGender);
            if (useMin) params.append('minPrice', useMin);
            if (useMax) params.append('maxPrice', useMax);

            const url = params.toString() ? `/doctors/search?${params.toString()}` : '/doctors';
            const res = await api.get(url);
            setDoctors(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        // Construct URL and navigate to update search params
        const params = new URLSearchParams();
        if (governorate) params.set('governorate', governorate);
        if (city) params.set('city', city);
        if (specialty) params.set('specialty', specialty);
        if (searchTerm) params.set('name', searchTerm);
        if (gender) params.set('gender', gender);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);

        window.history.pushState({}, '', `/search?${params.toString()}`);
        searchDoctors();
    };

    const handleReset = () => {
        setSearchTerm("");
        setGovernorate("");
        setCity("");
        setSpecialty("");
        setGender("");
        setMinPrice("");
        setMaxPrice("");
        window.history.pushState({}, '', '/search');
        searchDoctors("", "", "", "", "", "", "");
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Premium Hero Header */}
            <section className="bg-white border-b pt-32 pb-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-red-50/50 skew-x-[-12deg] translate-x-20 z-0" />
                <div className="container px-4 relative z-10">
                    <div className="max-w-4xl space-y-4">
                        <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                            <Sparkles className="w-4 h-4" />
                            <span>تجارب طبية موثوقة</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                            ابحث عن <span className="text-red-600">طبيبك</span> المناسب
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                            اختر من بين مئات الأطباء المعتمدين، احجز موعدك بسهولة، وتابع حالتك الصحية مع أفضل المتخصصين في مصر.
                        </p>
                    </div>
                </div>
            </section>

            <div className="container px-4 py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar - Sticky on desktop */}
                    <aside className="w-full lg:w-80 shrink-0">
                        <div className="sticky top-28 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 font-bold text-xl text-gray-900">
                                    <Filter className="h-5 w-5 text-red-600" />
                                    <span>تصفية البحث</span>
                                </div>
                                {(searchTerm || governorate || specialty || gender || minPrice) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleReset}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 gap-1"
                                    >
                                        <X className="h-3 w-3" />
                                        مسح الكل
                                    </Button>
                                )}
                            </div>

                            <Card className="border-none shadow-xl shadow-gray-200/50 bg-white/80 backdrop-blur-sm overflow-hidden rounded-2xl">
                                <CardContent className="p-6 space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700 font-semibold mr-1">اسم الطبيب</Label>
                                        <div className="relative">
                                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                            <Input
                                                placeholder="د. محمد..."
                                                className="pr-10 rounded-xl border-gray-100 bg-gray-50 focus:bg-white transition-all"
                                                value={searchTerm}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700 font-semibold mr-1">المحافظة</Label>
                                        <Select
                                            value={governorate || "all"}
                                            onValueChange={(val) => {
                                                setGovernorate(val === "all" ? "" : val);
                                                setCity("");
                                            }}
                                        >
                                            <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50 focus:bg-white text-right" dir="rtl">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                    <SelectValue placeholder="الكل" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent dir="rtl" className="rounded-xl shadow-2xl">
                                                <SelectItem value="all">الكل</SelectItem>
                                                {governorates.map((gov) => (
                                                    <SelectItem key={gov} value={gov}>
                                                        {gov}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700 font-semibold mr-1">المدينة</Label>
                                        <Select
                                            value={city || "all"}
                                            onValueChange={(val) => setCity(val === "all" ? "" : val)}
                                            disabled={!governorate}
                                        >
                                            <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50 focus:bg-white text-right disabled:opacity-50" dir="rtl">
                                                <SelectValue placeholder="الكل" />
                                            </SelectTrigger>
                                            <SelectContent dir="rtl" className="rounded-xl shadow-2xl">
                                                <SelectItem value="all">الكل</SelectItem>
                                                {cities.map((c) => (
                                                    <SelectItem key={c} value={c}>
                                                        {c}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700 font-semibold mr-1">التخصص</Label>
                                        <Select
                                            value={specialty || "all"}
                                            onValueChange={(val) => setSpecialty(val === "all" ? "" : val)}
                                        >
                                            <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50 focus:bg-white text-right" dir="rtl">
                                                <div className="flex items-center gap-2">
                                                    <Stethoscope className="h-4 w-4 text-gray-400" />
                                                    <SelectValue placeholder="الكل" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent dir="rtl" className="rounded-xl shadow-2xl max-h-[300px]">
                                                <SelectItem value="all">الكل</SelectItem>
                                                <SelectGroup>
                                                    <SelectLabel className="text-red-600 font-bold">الأكثر شيوعاً</SelectLabel>
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
                                        <Label className="text-gray-700 font-semibold mr-1">النوع</Label>
                                        <Select
                                            value={gender || "all"}
                                            onValueChange={(val) => setGender(val === "all" ? "" : val)}
                                        >
                                            <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50 focus:bg-white text-right" dir="rtl">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-gray-400" />
                                                    <SelectValue placeholder="الكل" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent dir="rtl" className="rounded-xl shadow-2xl">
                                                <SelectItem value="all">الكل</SelectItem>
                                                <SelectItem value="male">ذكر</SelectItem>
                                                <SelectItem value="female">أنثى</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700 font-semibold mr-1">سعر الكشف</Label>
                                        <Select
                                            value={minPrice && maxPrice ? `${minPrice}-${maxPrice}` : minPrice ? `${minPrice}-` : maxPrice ? `-${maxPrice}` : "all"}
                                            onValueChange={(val) => {
                                                if (val === "all") {
                                                    setMinPrice("");
                                                    setMaxPrice("");
                                                } else if (val.includes("-")) {
                                                    const parts = val.split("-");
                                                    setMinPrice(parts[0]);
                                                    setMaxPrice(parts[1]);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50 focus:bg-white text-right" dir="rtl">
                                                <SelectValue placeholder="الكل" />
                                            </SelectTrigger>
                                            <SelectContent dir="rtl" className="rounded-xl shadow-2xl">
                                                <SelectItem value="all">الكل</SelectItem>
                                                <SelectItem value="0-100">أقل من 100 جنيه</SelectItem>
                                                <SelectItem value="100-200">100 - 200 جنيه</SelectItem>
                                                <SelectItem value="200-300">200 - 300 جنيه</SelectItem>
                                                <SelectItem value="300-500">300 - 500 جنيه</SelectItem>
                                                <SelectItem value="500-">أكثر من 500 جنيه</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button onClick={handleSearch} className="w-full h-12 rounded-xl text-lg font-bold bg-gray-900 border-none hover:bg-black transition-all shadow-lg shadow-gray-200 mt-2">
                                        تطبيق الفلاتر
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </aside>

                    {/* Results Area */}
                    <main className="flex-1 space-y-6">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {loading ? "جاري البحث عن الأطباء..." : "الأطباء المتاحون"}
                                </h2>
                                {!loading && (
                                    <p className="text-muted-foreground text-sm">
                                        تم العثور على {doctors.length} طبيب يطابق بحثك
                                    </p>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-gray-500 font-medium">نبحث لك عن أفضل الأطباء...</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {doctors.map((doctor: any) => (
                                    <DoctorCard key={doctor._id} doctor={doctor} />
                                ))}
                                {!loading && doctors.length === 0 && (
                                    <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-dashed border-gray-200">
                                        <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                                            🔍
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">عذراً، لم نجد نتائج</h3>
                                        <p className="text-gray-500 max-w-sm mx-auto mb-8 leading-relaxed">
                                            لم نجد أطباء يطابقون هذه الفلاتر حالياً. جرب تغيير المحافظة أو التخصص للحصول على نتائج أكثر.
                                        </p>
                                        <Button onClick={handleReset} variant="outline" className="rounded-full px-8">
                                            إعادة تعيين البحث
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
