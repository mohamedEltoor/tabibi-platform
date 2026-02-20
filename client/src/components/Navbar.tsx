"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Search, Home, Info, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        Promise.resolve().then(() => setMounted(true));
        const checkAuth = () => {
            const token = localStorage.getItem("token");
            const role = localStorage.getItem("role");
            Promise.resolve().then(() => setIsLoggedIn(!!token));
            Promise.resolve().then(() => setUserRole(role));
        };

        Promise.resolve().then(() => checkAuth());

        // Listen for storage changes (for tab sync)
        window.addEventListener("storage", checkAuth);
        // Listen for custom auth changes (for same-tab sync)
        window.addEventListener("auth-change", checkAuth);

        return () => {
            window.removeEventListener("storage", checkAuth);
            window.removeEventListener("auth-change", checkAuth);
        };
    }, []);

    // Don't show Navbar on dashboard pages
    if (pathname.startsWith("/dashboard")) {
        return null;
    }

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setIsLoggedIn(false);
        setUserRole(null);

        // Trigger navbar update for other components
        window.dispatchEvent(new Event("auth-change"));

        router.push("/login");
    };

    const navLinks = [
        { name: "الرئيسية", href: "/", icon: Home },
        { name: "ابحث عن طبيب", href: "/search", icon: Search },
        { name: "عن المنصة", href: "/about", icon: Info },
        { name: "اتصل بنا", href: "/contact", icon: Phone },
    ];

    const getDashboardLink = () => {
        if (userRole === "doctor") return "/dashboard/doctor";
        if (userRole === "admin") return "/dashboard/admin";
        return "/dashboard/patient";
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b shadow-sm py-3 text-gray-900 transition-all duration-300">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-red-600 p-2 rounded-lg">
                            <span className="text-white font-bold text-xl">T</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">طبيبي</span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "font-semibold transition-colors hover:text-red-600",
                                    pathname === link.href ? "text-red-600" : "text-gray-700"
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Auth Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        {isLoggedIn ? (
                            <>
                                <Link href={getDashboardLink()}>
                                    <Button variant="ghost" className="text-gray-800 hover:bg-gray-100 font-bold">
                                        <User className="h-4 w-4 ml-2" />
                                        لوحة التحكم
                                    </Button>
                                </Link>
                                <Button onClick={handleLogout} variant="destructive" size="sm" className="font-bold">
                                    <LogOut className="h-4 w-4 ml-2" />
                                    خروج
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" className="text-gray-800 hover:bg-gray-100 font-bold">
                                        دخول
                                    </Button>
                                </Link>
                                <Link href="/signup">
                                    <Button className="bg-red-600 hover:bg-red-700 text-white font-bold">
                                        إنشاء حساب
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="h-6 w-6 text-gray-900" /> : <Menu className="h-6 w-6 text-gray-900" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay - Portal to body */}
            {mounted && createPortal(
                <div
                    className={cn(
                        "fixed inset-0 !bg-white z-[9999] transition-transform duration-300 md:hidden",
                        isOpen ? "translate-x-0" : "translate-x-full"
                    )}
                    style={{ backgroundColor: "white" }}
                >
                    <div className="flex flex-col h-full p-6 pt-6">
                        {/* Close button inside overlay */}
                        <div className="flex justify-start mb-8">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-8 w-8 text-gray-900" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-6 mb-auto">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center gap-4 text-xl font-semibold text-gray-800 hover:text-red-600"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <link.icon className="h-6 w-6 text-red-600" />
                                    {link.name}
                                </Link>
                            ))}

                            {isLoggedIn && (
                                <Link
                                    href={getDashboardLink()}
                                    className="flex items-center gap-4 text-xl font-semibold text-gray-800 hover:text-red-600"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <User className="h-6 w-6 text-red-600" />
                                    لوحة التحكم
                                </Link>
                            )}
                        </div>

                        <div className="flex flex-col gap-4 mt-8">
                            {isLoggedIn ? (
                                <Button onClick={handleLogout} variant="destructive" className="w-full text-lg py-6">
                                    <LogOut className="h-5 w-5 ml-2" />
                                    تسجيل الخروج
                                </Button>
                            ) : (
                                <>
                                    <Link href="/login" onClick={() => setIsOpen(false)}>
                                        <Button variant="outline" className="w-full text-lg py-6">
                                            تسجيل الدخول
                                        </Button>
                                    </Link>
                                    <Link href="/signup" onClick={() => setIsOpen(false)}>
                                        <Button className="w-full text-lg py-6 bg-red-600 hover:bg-red-700">
                                            إنشاء حساب جديد
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </nav>
    );
}
