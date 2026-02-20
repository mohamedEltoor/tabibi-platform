"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Shield, Award, Stethoscope, CheckCircle2 } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-red-50/50 skew-x-12 translate-x-1/2" />
                <div className="container relative z-10 px-4">
                    <div className="max-w-3xl mx-auto text-center space-y-6">
                        <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                            <Heart className="w-4 h-4 fill-current" />
                            <span>رعايتك هي أولويتنا</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
                            نغير مفهوم <span className="text-red-600">الرعاية الصحية</span> في مصر
                        </h1>
                        <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                            طبيبي هي المنصة الرائدة لحجز الأطباء وإدارة الرعاية الصحية. نجمع بين أفضل الأطباء وأحدث التقنيات لتقديم تجربة طبية سلسة وموثوقة لكل مريض.
                        </p>
                    </div>
                </div>
            </section>



            {/* Vision & Mission */}
            <section className="py-24 bg-gray-50">
                <div className="container px-4">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold text-gray-900">مهمتنا ورؤيتنا</h2>
                                <p className="text-gray-600 text-lg leading-relaxed">
                                    نسعى لبناء جسر من الثقة بين المريض والطبيب من خلال توفير معلومات دقيقة، حجز سهل، وخدمة عملاء متميزة.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6 flex gap-4">
                                        <div className="bg-red-100 p-3 rounded-xl h-fit">
                                            <Shield className="w-8 h-8 text-red-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl mb-2">الجودة والأمان</h3>
                                            <p className="text-gray-600">نتأكد من هوية ومؤهلات كل طبيب ينضم لمنصتنا لضمان حصولك على رعاية آمنة.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6 flex gap-4">
                                        <div className="bg-blue-100 p-3 rounded-xl h-fit">
                                            <Award className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl mb-2">التميز الطبي</h3>
                                            <p className="text-gray-600">نضم نخبة من أفضل الاستشاريين والأخصائيين في مختلف المجالات الطبية.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-4 bg-red-600/5 rounded-3xl -z-10 transform rotate-3" />
                            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6">
                                <h3 className="text-2xl font-bold mb-6">لماذا يختارنا المرضى؟</h3>
                                <div className="space-y-4">
                                    {[
                                        "حجز فوري ومؤكد بدون انتظار",
                                        "تقييمات حقيقية من مرضى سابقين",
                                        "طرق دفع متنوعة وآمنة",
                                        "تذكير بالمواعيد ومتابعة دورية",
                                        "ملف طبي إلكتروني شامل لكل مريض"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                            <span className="text-gray-700 font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                                <Button className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white font-bold h-12 text-lg">
                                    اعرف المزيد
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Join Us CTA */}
            <section className="py-24 bg-white">
                <div className="container px-4">
                    <div className="bg-red-600 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

                        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                            <Stethoscope className="w-16 h-16 mx-auto text-white/90" />
                            <h2 className="text-3xl md:text-5xl font-bold">هل أنت طبيب؟</h2>
                            <p className="text-red-100 text-xl leading-relaxed">
                                انضم إلى شبكة أطبائنا المتميزة وابدأ في تقديم خدماتك لآلاف المرضى وتوسيع عيادتك الرقمية اليوم.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                <Link href="/signup?role=doctor">
                                    <Button size="lg" className="bg-white text-red-600 hover:bg-red-50 font-bold min-w-[200px] h-14 text-lg">
                                        انضم كطبيب
                                    </Button>
                                </Link>
                                <Link href="/contact">
                                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-bold min-w-[200px] h-14 text-lg bg-transparent">
                                        تواصل معنا
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
