"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Phone, Mail, MapPin, Heart } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-50 border-t pt-16 pb-8 text-gray-600">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="bg-red-600 p-2 rounded-lg">
                                <span className="text-white font-bold text-xl">T</span>
                            </div>
                            <span className="text-2xl font-bold text-gray-900">طبيبي</span>
                        </Link>
                        <p className="text-sm leading-relaxed">
                            منصة طبية شاملة تهدف إلى تسهيل حجز المواعيد مع أفضل الأطباء في مصر. نسعى لتقديم رعاية صحية أفضل للجميع.
                        </p>
                        <div className="flex gap-4 pt-4">
                            <a href="#" className="bg-white p-2 rounded-full shadow-sm hover:text-red-600 hover:shadow-md transition-all">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="#" className="bg-white p-2 rounded-full shadow-sm hover:text-red-600 hover:shadow-md transition-all">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="bg-white p-2 rounded-full shadow-sm hover:text-red-600 hover:shadow-md transition-all">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="bg-white p-2 rounded-full shadow-sm hover:text-red-600 hover:shadow-md transition-all">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-6">روابط سريعة</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/search" className="hover:text-red-600 transition-colors flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 bg-red-400 rounded-full"></span>
                                    ابحث عن طبيب
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="hover:text-red-600 transition-colors flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 bg-red-400 rounded-full"></span>
                                    من نحن
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-red-600 transition-colors flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 bg-red-400 rounded-full"></span>
                                    اتصل بنا
                                </Link>
                            </li>
                            <li>
                                <Link href="/signup?role=doctor" className="hover:text-red-600 transition-colors flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 bg-red-400 rounded-full"></span>
                                    انضم كطبيب
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-6">خدماتنا</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="#" className="hover:text-red-600 transition-colors flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 bg-red-400 rounded-full"></span>
                                    كشف عيادة
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-red-600 transition-colors flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 bg-red-400 rounded-full"></span>
                                    استشارة هاتفية
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-red-600 transition-colors flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 bg-red-400 rounded-full"></span>
                                    زيارة منزلية
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-red-600 transition-colors flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 bg-red-400 rounded-full"></span>
                                    رعاية للمسنين
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-6">تواصل معنا</h3>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3">
                                <a
                                    href="https://wa.me/201553631120"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 hover:text-green-600 transition-colors"
                                >
                                    <div className="bg-green-100 p-2 rounded-lg">
                                        <Phone className="h-5 w-5 text-green-600 shrink-0" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400">تواصل عبر واتساب</span>
                                        <span dir="ltr" className="font-bold">+20 155 363 1120</span>
                                    </div>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between text-sm">
                    <p className="mb-4 md:mb-0">
                        &copy; {currentYear} منصة طبيبي. جميع الحقوق محفوظة.
                    </p>
                    <div className="flex items-center gap-1 text-gray-500">
                        <span>صنع بـ</span>
                        <Heart className="h-4 w-4 text-red-600 fill-red-600" />
                        <span>في مصر</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
