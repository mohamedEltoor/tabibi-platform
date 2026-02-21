import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import ClientLayout from "@/components/ClientLayout";

const cairo = Cairo({ subsets: ["arabic", "latin"] });

export const metadata: Metadata = {
    title: "Tabibi - Doctor Booking Platform",
    description: "Book your doctor appointment online easily.",
    icons: {
        icon: "/favicon.svg",
    },
    verification: {
        google: "ImQfUYH6ju8BcJg56URJaxdMtvz7z_WwwtsoWT36mkY",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ar" dir="rtl">
            <body className={cn(cairo.className, "min-h-screen bg-background antialiased")}>
                <ClientLayout>
                    {children}
                </ClientLayout>
            </body>
        </html>
    );
}
