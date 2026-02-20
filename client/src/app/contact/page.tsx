"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Clock, ArrowLeft, ShieldCheck, HeadphonesIcon } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
    const whatsappNumber = "201553631120"; // Actual number added
    const whatsappUrl = `https://wa.me/${whatsappNumber}`;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header Section */}
            <section className="bg-white border-b py-20 pt-32">
                <div className="container px-4">
                    <div className="max-w-3xl mx-auto text-center space-y-4">
                        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-2">
                            <MessageCircle className="w-4 h-4 fill-current" />
                            <span>دعم فني سريع</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">تواصل معنا الآن</h1>
                        <p className="text-xl text-gray-600 leading-relaxed">
                            نحن هنا لمساعدتك في أي استفسار. تواصل معنا مباشرة عبر واتساب وسوف نقوم بالرد عليك في أسرع وقت.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Contact Section */}
            <section className="py-16 flex-grow">
                <div className="container px-4">
                    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
                        {/* WhatsApp Card */}
                        <Card className="border-none shadow-2xl bg-white overflow-hidden group">
                            <div className="h-2 bg-green-500" />
                            <CardContent className="p-10 space-y-8 text-center md:text-right">
                                <div className="bg-green-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto md:mr-0 group-hover:scale-110 transition-transform duration-300">
                                    <MessageCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-bold text-gray-900">المساعدة الفورية عبر واتساب</h2>
                                    <p className="text-gray-600 text-lg">
                                        اضغط على الزر أدناه لبدء محادثة مباشرة مع فريق الدعم الفني الخاص بنا. متواجدون لخدمتكم يومياً.
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                        <Button className="w-full h-16 text-xl bg-green-600 hover:bg-green-700 text-white font-bold gap-3 rounded-2xl shadow-lg shadow-green-200 transition-all hover:-translate-y-1">
                                            <MessageCircle className="w-6 h-6" />
                                            ابدأ المحادثة الآن
                                        </Button>
                                    </a>
                                </div>
                                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>رد خلال أقل من ساعة</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>آمن وخصوصي بالكامل</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Info */}
                        <div className="space-y-8">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-gray-900">لماذا تتواصل معنا؟</h3>

                                <div className="grid gap-6">
                                    {[
                                        {
                                            title: "مشاكل في الحجز",
                                            desc: "إذا واجهت أي صعوبة في حجز موعد مع طبيبك المفضل.",
                                            icon: Clock
                                        },
                                        {
                                            title: "الاستفسارات العامة",
                                            desc: "أي سؤال حول كيفية عمل المنصة أو الخدمات المتاحة.",
                                            icon: HeadphonesIcon
                                        },
                                        {
                                            title: "حسابات الأطباء",
                                            desc: "للمساعدة في إعداد حساب الطبيب أو تفعيل العيادة.",
                                            icon: ShieldCheck
                                        }
                                    ].map((feature, i) => (
                                        <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-100">
                                            <div className="bg-red-50 p-3 rounded-lg h-fit">
                                                <feature.icon className="w-6 h-6 text-red-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-gray-900">{feature.title}</h4>
                                                <p className="text-gray-600">{feature.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-8">
                                <Link href="/">
                                    <Button variant="ghost" className="gap-2 group text-gray-600">
                                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:translate-x-[-4px]" />
                                        العودة للرئيسية
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Support Stats or Values */}
            <section className="bg-white py-12 border-t">
                <div className="container px-4">
                    <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 grayscale border-none">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8" />
                            <span className="font-semibold">دعم فني موثوق</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MessageCircle className="w-8 h-8" />
                            <span className="font-semibold">تواصل مباشر</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8" />
                            <span className="font-semibold">استجابة سريعة</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
