import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
    title: "طبيبي - ابحث واحجز مع أفضل الأطباء في مصر",
    description: "منصة طبيبي تتيح لك البحث عن أفضل الأطباء في كافة التخصصات (أسنان، باطنة، أطفال، عظام) والحجز أونلاين في ثوانٍ. ابحث حسب التخصص والموقع.",
    keywords: ["طبيب", "حجز دكتور", "دليل الأطباء", "مصر", "طبيبي", "حجز موعد"],
    openGraph: {
        title: "طبيبي - ابحث واحجز مع أفضل الأطباء في مصر",
        description: "منصة طبيبي تتيح لك البحث عن أفضل الأطباء والحجز أونلاين بسهولة.",
        type: 'website',
    }
};

export default function Page() {
    return <HomeClient />;
}
