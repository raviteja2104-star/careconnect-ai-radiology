import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'CareConnect — Healthcare Operating System',
    description: "Find doctors, book appointments, access health records, and consult online. India's most comprehensive digital health platform.",
    openGraph: {
        title: 'CareConnect — Healthcare Operating System',
        description: 'Find doctors, book appointments, access health records, and consult online.',
        url: 'https://www.careconnect.care',
        siteName: 'CareConnect',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'CareConnect — Healthcare Operating System',
        description: 'Find doctors, book appointments, access health records, and consult online.',
    },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
