"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import Footer from "@/components/Footer";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/verify-email" ||
        pathname?.startsWith("/auth/google/callback");

    // Hide navbar and footer on dashboard pages
    const isDashboard = pathname?.startsWith("/dashboard");

    return (
        <>
            {!isAuthPage && !isDashboard && <Navbar />}
            <main className="min-h-screen">
                {children}
            </main>
            {!isAuthPage && !isDashboard && <Footer />}
            <Toaster richColors position="top-center" />
        </>
    );
}
