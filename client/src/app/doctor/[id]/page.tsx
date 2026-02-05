import type { Metadata, ResolvingMetadata } from 'next';
import DoctorProfileClient from './DoctorProfileClient';
import api from '@/lib/axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function getDoctor(id: string) {
    try {
        const res = await fetch(`${API_BASE_URL}/doctors/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (err) {
        return null;
    }
}

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params;
    const doctor = await getDoctor(id);

    if (!doctor || !doctor.user) {
        return {
            title: 'دكتور غير موجود | طبيبي',
        };
    }

    const title = `دكتور ${doctor.user.name} - ${doctor.specialty} في ${doctor.user.city || doctor.user.governorate} | طبيبي`;
    const description = `احجز موعدك الآن مع دكتور ${doctor.user.name}، متخصص في ${doctor.specialty} بمدينة ${doctor.user.city}. ${doctor.bio?.substring(0, 100)}...`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: doctor.profileImage ? [doctor.profileImage] : [],
        },
    };
}

export default async function Page({ params }: Props) {
    const { id } = await params;
    const doctor = await getDoctor(id);

    return <DoctorProfileClient initialDoctor={doctor} />;
}
