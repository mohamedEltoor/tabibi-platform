"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Search, LogOut, User } from "lucide-react";

export default function DashboardNav() {
    const [userRole, setUserRole] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const role = localStorage.getItem("role");
        setUserRole(role);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.dispatchEvent(new Event("auth-change"));
        router.push("/");
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-2xl text-primary">
                    <Link href="/">
                        <span>طبيبي</span>
                    </Link>
                </div>
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link href="/" className="transition-colors hover:text-primary flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        الرئيسية
                    </Link>
                    <Link href="/search" className="transition-colors hover:text-primary flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        بحث عن طبيب
                    </Link>
                    {userRole === "patient" && (
                        <Link href="/dashboard/patient" className="transition-colors hover:text-primary flex items-center gap-2">
                            <User className="h-4 w-4" />
                            لوحة التحكم
                        </Link>
                    )}
                    {userRole === "doctor" && (
                        <Link href="/dashboard/doctor" className="transition-colors hover:text-primary flex items-center gap-2">
                            <User className="h-4 w-4" />
                            لوحة التحكم
                        </Link>
                    )}
                </nav>
                <div className="flex items-center gap-4">
                    <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        تسجيل الخروج
                    </Button>
                </div>
            </div>
        </header>
    );
}
