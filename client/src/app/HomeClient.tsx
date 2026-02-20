"use client";

import { Button } from "@/components/ui/button";
import {
    Calendar,
    MapPin,
    Star,
    Stethoscope,
    Baby,
    Bone,
    Heart,
    Eye,
    Brain,
    Users,
    Apple,
    Activity,
    Sparkles as SparklesIcon,
    Dna,
    Smile
} from "lucide-react";
import DoctorSearchBox from "@/components/DoctorSearchBox";
import Link from "next/link";

export default function HomeClient() {
    const specialties = [
        { name: "أسنان", icon: Smile },
        { name: "باطنة", icon: Stethoscope },
        { name: "أطفال", icon: Baby },
        { name: "عظام", icon: Bone },
        { name: "جلدية", icon: SparklesIcon },
        { name: "نساء وتوليد", icon: Dna },
        { name: "قلب", icon: Heart },
        { name: "عيون", icon: Eye },
        { name: "مخ وأعصاب", icon: Brain },
        { name: "نفسي", icon: Users },
        { name: "تغذية", icon: Apple },
        { name: "علاج طبيعي", icon: Activity }
    ];

    return (
        <main className="flex min-h-screen flex-col">
            {/* Hero Section */}
            <section className="relative py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
                <div className="container relative z-10 flex flex-col items-center text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight lg:text-7xl mb-6 text-gray-900">
                        احجز موعدك مع <span className="text-primary">أفضل الأطباء</span>
                    </h1>
                    <p className="max-w-[700px] text-lg text-gray-600 mb-8">
                        ابحث عن طبيب، احجز موعدك، وتابع حالتك الصحية بسهولة وأمان.
                    </p>

                    {/* Advanced Search Box */}
                    <DoctorSearchBox showFilters={false} />
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-muted/50">
                <div className="container">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center text-center p-6">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <MapPin className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">بحث سهل وسريع</h3>
                            <p className="text-muted-foreground">ابحث عن الأطباء حسب التخصص، الموقع، والتقييمات.</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Calendar className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">حجز فوري</h3>
                            <p className="text-muted-foreground">اختر الموعد المناسب لك واحجز بضغطة زر.</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-6">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Star className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">تقييمات موثوقة</h3>
                            <p className="text-muted-foreground">اطلع على تقييمات المرضى الحقيقية قبل الحجز.</p>
                        </div>
                    </div>
                </div>
            </section>
            {/* Popular Specialties Section for SEO */}
            <section className="py-20 bg-white">
                <div className="container">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">تخصصات طبية شائعة</h2>
                        <p className="text-gray-500">اختر التخصص الذي تبحث عنه وابدأ الحجز</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {specialties.map((spec) => (
                            <Link
                                key={spec.name}
                                href={`/search?specialty=${encodeURIComponent(spec.name)}`}
                                className="flex flex-col items-center p-8 rounded-[2rem] bg-gray-50 hover:bg-red-50 hover:text-red-700 transition-all border border-transparent hover:border-red-100 group shadow-sm hover:shadow-xl hover:shadow-red-200/20"
                            >
                                <div className="p-4 bg-white rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-sm border border-gray-100 group-hover:border-red-100">
                                    <spec.icon className="w-8 h-8 text-red-600" />
                                </div>
                                <span className="font-black text-sm text-gray-900 group-hover:text-red-700">{spec.name}</span>
                            </Link>
                        ))}
                    </div>
                    <div className="mt-12 text-center">
                        <Button asChild variant="outline" className="rounded-full px-8 h-12 font-bold border-2">
                            <Link href="/search">عرض كافة التخصصات</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    );
}
