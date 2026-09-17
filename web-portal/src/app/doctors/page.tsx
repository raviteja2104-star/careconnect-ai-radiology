import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicNav } from '@/components/public/PublicNav';

export const metadata: Metadata = {
    title: 'CareConnect for Doctors — Grow Your Practice',
    description: 'Join CareConnect as an individual doctor. Manage patients, run video consultations, access EMR tools, and grow your practice — no clinic or hospital required.',
};

const FEATURES = [
    {
        icon: '👤',
        title: 'Practice Independently',
        desc: 'No clinic or hospital tie-in required. Register as a solo practitioner and start seeing patients on your own terms.',
        color: '#EFF6FF', accent: '#2563EB',
    },
    {
        icon: '📋',
        title: 'Full EMR Workspace',
        desc: 'Clinical encounter notes, SOAP documentation, smart prescriptions, lab orders — all in one streamlined workspace.',
        color: '#F0FDF4', accent: '#16A34A',
    },
    {
        icon: '🎥',
        title: 'Video Consultations',
        desc: 'Built-in WebRTC telemedicine. Start video calls directly from your dashboard — no third-party apps needed.',
        color: '#F5F3FF', accent: '#7C3AED',
    },
    {
        icon: '📊',
        title: 'Patient Analytics',
        desc: 'Track OPD volumes, follow-up rates, and patient satisfaction. Know exactly how your practice is growing.',
        color: '#FFF7ED', accent: '#EA580C',
    },
    {
        icon: '🔬',
        title: 'Lab & Pharmacy Integration',
        desc: 'Send digital lab orders. Prescriptions route directly to partner pharmacies for patient convenience.',
        color: '#ECFEFF', accent: '#0891B2',
    },
    {
        icon: '📱',
        title: 'Patient Discovery',
        desc: 'Get listed in the CareConnect directory. Patients in your area find you by specialty, availability, and reviews.',
        color: '#FFF1F2', accent: '#BE123C',
    },
];

const ONBOARDING_STEPS = [
    { n: '01', title: 'Create Your Profile', desc: 'Personal info, photo, and contact details. Takes 3 minutes.' },
    { n: '02', title: 'Add Your Credentials', desc: 'Medical license, registration number, qualifications, specialties.' },
    { n: '03', title: 'Set Your Availability', desc: 'Define your schedule, consultation fee, and preferred consultation type.' },
    { n: '04', title: 'Submit for Verification', desc: 'Our team verifies your credentials and activates your profile within 1–2 days.' },
    { n: '05', title: 'Start Seeing Patients', desc: 'Your dashboard goes live. Patients can book, and you can consult.' },
];

const BENEFITS = [
    { icon: '✅', text: 'No hospital or clinic affiliation required' },
    { icon: '✅', text: 'Free to join — no setup or monthly fees during beta' },
    { icon: '✅', text: 'Full EMR: encounter notes, prescriptions, lab orders' },
    { icon: '✅', text: 'Built-in video consultation (WebRTC)' },
    { icon: '✅', text: 'AI clinical assistant with human oversight' },
    { icon: '✅', text: 'Patient directory and discovery listing' },
];

export default function DoctorsPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <PublicNav />

            {/* Hero */}
            <section style={{ background: 'linear-gradient(140deg,#0A1F44 0%,#1A54A8 50%,#0B6BA0 100%)', padding: 'clamp(60px,10vw,120px) 24px' }}>
                <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 999, padding: '6px 16px', marginBottom: 28, fontSize: 13, color: 'rgba(255,255,255,.9)', fontWeight: 600 }}>
                        🩺 Individual doctors welcome — no hospital required
                    </div>
                    <h1 style={{ color: '#fff', fontSize: 'clamp(34px,6vw,60px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.02em', margin: '0 0 20px' }}>
                        Grow your practice.<br />
                        <span style={{ color: '#5EEAD4' }}>Reach more patients.</span>
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 'clamp(16px,2vw,18px)', lineHeight: 1.65, margin: '0 0 40px', maxWidth: 580, marginLeft: 'auto', marginRight: 'auto' }}>
                        Join CareConnect as an independent practitioner. Get a full clinical workspace, patient discovery, and telemedicine — without needing a clinic or hospital behind you.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/provider/register?type=DOCTOR" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1A54A8', padding: '14px 32px', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>
                            Register as a Doctor →
                        </Link>
                        <Link href="/login/doctor" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.15)', color: '#fff', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,.3)' }}>
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Benefits checklist */}
            <section style={{ background: '#F0F7FF', padding: 'clamp(40px,5vw,60px) 24px' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14 }}>
                        {BENEFITS.map(b => (
                            <div key={b.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#fff', padding: '14px 18px', borderRadius: 12, border: '1px solid #DBEAFE', fontSize: 14, color: '#1E3A8A', fontWeight: 600 }}>
                                <span style={{ color: '#16A34A', fontSize: 16, flexShrink: 0 }}>{b.icon}</span>
                                {b.text}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features grid */}
            <section style={{ background: '#F8FAFF', padding: 'clamp(60px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 1120, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: '#111827', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                            A complete clinical toolkit
                        </h2>
                        <p style={{ fontSize: 17, color: '#6B7280', maxWidth: 540, margin: '0 auto', lineHeight: 1.65 }}>
                            Everything a modern independent doctor needs — from patient management to AI-assisted documentation.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 20 }}>
                        {FEATURES.map(f => (
                            <div key={f.title} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 24px' }}>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 18 }}>
                                    {f.icon}
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>{f.title}</h3>
                                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Onboarding steps */}
            <section style={{ background: '#fff', padding: 'clamp(60px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: '#111827', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                            From signup to live in days
                        </h2>
                        <p style={{ fontSize: 17, color: '#6B7280' }}>A simple 5-step process to get your practice on CareConnect.</p>
                    </div>
                    <div style={{ position: 'relative' }}>
                        {ONBOARDING_STEPS.map((s, i) => (
                            <div key={s.n} style={{ display: 'flex', gap: 20, marginBottom: i < ONBOARDING_STEPS.length - 1 ? 32 : 0, position: 'relative' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#1A54A8,#0B96A0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 14 }}>{s.n}</div>
                                    {i < ONBOARDING_STEPS.length - 1 && <div style={{ width: 2, height: 32, background: '#E5E7EB', marginTop: 8 }} />}
                                </div>
                                <div style={{ paddingTop: 10 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>{s.title}</h3>
                                    <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ background: 'linear-gradient(135deg,#0A1F44,#1A54A8)', padding: 'clamp(60px,8vw,100px) 24px', textAlign: 'center' }}>
                <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                    Ready to modernise your practice?
                </h2>
                <p style={{ fontSize: 18, color: 'rgba(255,255,255,.75)', margin: '0 0 36px' }}>
                    Register today. Verification takes 1–2 business days.
                </p>
                <Link href="/provider/register?type=DOCTOR" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1A54A8', padding: '16px 40px', borderRadius: 14, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 4px 24px rgba(0,0,0,.25)' }}>
                    Register as a Doctor →
                </Link>
            </section>

            <PublicFooter />
        </div>
    );
}

function PublicFooter() {
    return (
        <footer style={{ background: '#0A1F44', color: 'rgba(255,255,255,.6)', padding: '48px 24px 32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ maxWidth: 1120, margin: '0 auto' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, marginBottom: 40 }}>
                    <div style={{ flex: '1 1 220px' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Care<span style={{ color: '#0D9488' }}>Connect</span></div>
                        <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 260 }}>India's connected healthcare platform. Find, book, and manage care with confidence.</p>
                    </div>
                    <div style={{ flex: '1 1 140px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>For Providers</div>
                        {[['Doctors', '/doctors'], ['Clinics', '/clinics'], ['Hospitals', '/hospitals'], ['Labs', '/labs'], ['Pharmacies', '/pharmacies']].map(([l, h]) => (
                            <div key={l} style={{ marginBottom: 10 }}><Link href={h} style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>{l}</Link></div>
                        ))}
                    </div>
                    <div style={{ flex: '1 1 140px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Company</div>
                        {[['About', '/about'], ['Contact', '/contact'], ['Privacy Policy', '/privacy'], ['Terms', '/terms']].map(([l, h]) => (
                            <div key={l} style={{ marginBottom: 10 }}><Link href={h} style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>{l}</Link></div>
                        ))}
                    </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 24, fontSize: 12, color: 'rgba(255,255,255,.3)' }}>
                    © 2026 CareConnect. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
