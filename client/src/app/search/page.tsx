import type { Metadata } from 'next';
import SearchClient from './SearchClient';
import { Suspense } from 'react';

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
    { searchParams }: Props
): Promise<Metadata> {
    const sParams = await searchParams;
    const specialty = sParams.specialty as string;
    const city = sParams.city as string;
    const governorate = sParams.governorate as string;

    let title = 'ابحث عن أفضل الأطباء في مصر | طبيبي';
    let description = 'ابحث واحجز موعدك مع أفضل الأطباء في كافة التخصصات والمحافظات المصرية بسهولة وأمان.';

    if (specialty && (city || governorate)) {
        title = `أفضل أطباء ${specialty} في ${city || governorate} | طبيبي`;
        description = `تصفح قائمة بأفضل أطباء ${specialty} في ${city || governorate}. شاهد التقييمات، أسعار الكشف، واحجز موعدك أونلاين فوراً.`;
    } else if (specialty) {
        title = `أفضل أطباء ${specialty} في مصر | طبيبي`;
        description = `دليل شامل لأفضل أطباء ${specialty} في مصر. ابحث حسب المدينة أو المحافظة واحجز موعدك الآن.`;
    } else if (city || governorate) {
        title = `أفضل أطباء في ${city || governorate} | طبيبي`;
        description = `ابحث عن أفضل الأطباء في كافة التخصصات بمدينة ${city || governorate}. حجز فوري وسهل.`;
    }

    return {
        title,
        description,
    };
}

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>}>
            <SearchClient />
        </Suspense>
    );
}
