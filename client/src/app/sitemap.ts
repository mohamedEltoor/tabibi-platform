import { MetadataRoute } from 'next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const EXTERNAL_URL = 'http://localhost:3000'; // Change to production URL when deployed

async function getAllDoctors() {
    try {
        const res = await fetch(`${API_BASE_URL}/doctors/all`, { cache: 'no-store' });
        if (!res.ok) return [];
        return res.json();
    } catch (err) {
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const doctors = await getAllDoctors();

    const doctorEntries: MetadataRoute.Sitemap = doctors.map((doctor: any) => ({
        url: `${EXTERNAL_URL}/doctor/${doctor._id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
    }));

    return [
        {
            url: `${EXTERNAL_URL}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${EXTERNAL_URL}/search`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${EXTERNAL_URL}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        ...doctorEntries,
    ];
}
