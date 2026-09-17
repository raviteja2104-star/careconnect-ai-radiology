import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicNav } from '@/components/public/PublicNav';

export const metadata: Metadata = {
    title: 'CareConnect for Patients — Your Health, Managed',
    description: 'Find doctors, book lab tests, manage your health records, and connect with the right care — all from one platform designed for you.',
};

const FEATURES = [
    {
        icon: '🔍',
        title: 'Find the Right Doctor',
        desc: 'Search 3,500+ verified doctors by specialty, location, availability, and consultation type. Read reviews and book instantly.',
        color: '#EFF6FF',
        accent: '#2563EB',
    },
    {
        icon: '📅',
        title: 'Book Appointments Online',
        desc: 'Schedule in-clinic visits, home visits, or video consultations in seconds. Get confirmation and reminders instantly.',
        color: '#F0FDF4',
        accent: '#16A34A',
    },
    {
        icon: '🔬',
        title: 'Lab Tests at Your Doorstep',
        desc: 'Order 2,000+ lab tests from certified labs. Choose home collection or walk-in. Get digital reports within hours.',
        color: '#F5F3FF',
        accent: '#7C3AED',
    },
    {
        icon: '📁',
        title: 'Secure Health Records',
        desc: 'Store prescriptions, lab reports, and discharge summaries in one place. AI helps you extract and organise documents.',
        color: '#FFF7ED',
        accent: '#EA580C',
    },
    {
        icon: '👨‍👩‍👧',
        title: 'Manage Your Whole Family',
        desc: 'Add family members and manage their health under one account. Book appointments and track records for everyone.',
        color: '#FFF1F2',
        accent: '#BE123C',
    },
    {
        icon: '🤖',
        title: 'AI Health Assistant',
        desc: 'Ask health questions, get symptom guidance, and understand your test results with our AI companion — always with human oversight.',
        color: '#ECFEFF',
        accent: '#0891B2',
    },
];

const HOW_IT_WORKS = [
    { step: '01', title: 'Create Your Account', desc: 'Sign up free in under 2 minutes. No credit card required.' },
    { step: '02', title: 'Find Care Near You', desc: 'Search doctors, labs, pharmacies, and clinics by location or specialty.' },
    { step: '03', title: 'Book & Consult', desc: 'Book an appointment or video consultation. Add to your calendar.' },
    { step: '04', title: 'Manage Your Health', desc: 'Track records, medications, and follow-ups — all in one place.' },
];

const STATS = [
    { value: '3,500+', label: 'Verified Doctors' },
    { value: '500+',   label: 'Hospitals & Clinics' },
    { value: '2,000+', label: 'Lab Tests' },
    { value: '50,000+', label: 'Patients Served' },
];

export default function PatientsPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <PublicNav />

            {/* Hero */}
            <style>{`
                @keyframes cc-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
                @keyframes cc-float2{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
                @keyframes cc-ecg{from{stroke-dashoffset:900}to{stroke-dashoffset:0}}
                @keyframes cc-blink{0%,100%{opacity:1}50%{opacity:.25}}
                @keyframes cc-pulse{0%,100%{box-shadow:0 0 0 0 rgba(94,234,212,.5)}70%{box-shadow:0 0 0 14px rgba(94,234,212,0)}}
                @media(max-width:768px){.cc-hero-vis{display:none!important}}
            `}</style>
            <section style={{ background: 'linear-gradient(140deg,#1E3A8A 0%,#1D4ED8 40%,#0F766E 80%,#0D9488 100%)', padding: 'clamp(60px,8vw,100px) 24px', overflow: 'hidden' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>

                    {/* Left: text */}
                    <div style={{ flex: '1 1 380px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 999, padding: '6px 16px', marginBottom: 28, fontSize: 13, color: 'rgba(255,255,255,.9)', fontWeight: 600 }}>
                            ✦ Built for patients, not systems
                        </div>
                        <h1 style={{ color: '#fff', fontSize: 'clamp(36px,5vw,58px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 20px' }}>
                            Your healthcare,<br />
                            <span style={{ color: '#5EEAD4' }}>simplified.</span>
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 'clamp(16px,2vw,18px)', lineHeight: 1.65, margin: '0 0 40px', maxWidth: 480 }}>
                            Find doctors, book lab tests, manage health records, and consult virtually — all from one platform built around you.
                        </p>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <Link href="/login/patient" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1D4ED8', padding: '14px 32px', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>
                                Create Free Account →
                            </Link>
                            <Link href="/nearby/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.15)', color: '#fff', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,.3)' }}>
                                Find Doctors Near Me
                            </Link>
                        </div>
                    </div>

                    {/* Right: animated health dashboard */}
                    <div className="cc-hero-vis" style={{ flex: '0 0 420px', position: 'relative', height: 420 }}>

                        {/* Main card */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(24px)', borderRadius: 24, padding: '24px 24px 20px', border: '1px solid rgba(255,255,255,.2)', boxShadow: '0 20px 60px rgba(0,0,0,.3)', animation: 'cc-float 5s ease-in-out infinite' }}>

                            {/* Patient header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#5EEAD4,#2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, animation: 'cc-pulse 2.5s ease-in-out infinite' }}>👤</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Priya Sharma</div>
                                    <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>Patient · CC-2024-0847</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', animation: 'cc-blink 1.8s ease-in-out infinite' }} />
                                    <span style={{ fontSize: 11, color: '#4ADE80', fontWeight: 700 }}>LIVE</span>
                                </div>
                            </div>

                            {/* ECG monitor */}
                            <div style={{ background: 'rgba(0,0,0,.28)', borderRadius: 14, padding: '10px 14px', marginBottom: 18 }}>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>ECG Monitor</div>
                                <svg viewBox="0 0 380 48" width="100%" height="48">
                                    <polyline
                                        points="0,24 28,24 36,7 43,41 50,10 57,24 85,24 93,7 100,41 107,10 114,24 142,24 150,7 157,41 164,10 171,24 199,24 207,7 214,41 221,10 228,24 256,24 264,7 271,41 278,10 285,24 380,24"
                                        stroke="#5EEAD4" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
                                        strokeDasharray="900"
                                        style={{ animation: 'cc-ecg 2.4s linear infinite' }}
                                    />
                                </svg>
                            </div>

                            {/* Vitals */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                {([
                                    { emoji: '❤️', val: '72 bpm',  lbl: 'Heart Rate' },
                                    { emoji: '🩸', val: '120/80',  lbl: 'Blood Pressure' },
                                    { emoji: '💨', val: '98%',     lbl: 'SpO₂' },
                                ] as { emoji: string; val: string; lbl: string }[]).map(v => (
                                    <div key={v.lbl} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '10px 10px 8px' }}>
                                        <div style={{ fontSize: 18, marginBottom: 5 }}>{v.emoji}</div>
                                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{v.val}</div>
                                        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 10, marginTop: 3 }}>{v.lbl}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Appointment floating card */}
                        <div style={{ position: 'absolute', bottom: 72, left: -16, background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(16px)', borderRadius: 16, padding: '12px 16px', border: '1px solid rgba(255,255,255,.25)', boxShadow: '0 8px 32px rgba(0,0,0,.2)', animation: 'cc-float2 4s ease-in-out 1s infinite' }}>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.55)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Next Appointment</div>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Dr. Anand Kumar</div>
                            <div style={{ color: '#5EEAD4', fontSize: 13, marginTop: 2 }}>Tomorrow · 10:30 AM</div>
                        </div>

                        {/* Lab result floating card */}
                        <div style={{ position: 'absolute', bottom: 8, right: -8, background: 'rgba(74,222,128,.14)', backdropFilter: 'blur(16px)', borderRadius: 16, padding: '12px 16px', border: '1px solid rgba(74,222,128,.3)', boxShadow: '0 8px 32px rgba(0,0,0,.2)', animation: 'cc-float 3.5s ease-in-out .5s infinite' }}>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.55)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Lab Results</div>
                            <div style={{ color: '#4ADE80', fontWeight: 700, fontSize: 15 }}>✓ All Normal</div>
                            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, marginTop: 2 }}>CBC · Lipid · HbA1c</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', padding: '36px 24px' }}>
                <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 24 }}>
                    {STATS.map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 900, color: '#2563EB' }}>{s.value}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section style={{ background: '#F8FAFF', padding: 'clamp(60px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 1120, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: '#111827', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                            Everything you need for your health journey
                        </h2>
                        <p style={{ fontSize: 17, color: '#6B7280', maxWidth: 540, margin: '0 auto', lineHeight: 1.65 }}>
                            From finding a specialist to managing your family's health — CareConnect has you covered.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 20 }}>
                        {FEATURES.map(f => (
                            <div key={f.title} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 24px', transition: 'box-shadow .2s', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
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

            {/* How it works */}
            <section style={{ background: '#fff', padding: 'clamp(60px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 960, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: '#111827', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                            Get started in 4 steps
                        </h2>
                        <p style={{ fontSize: 17, color: '#6B7280' }}>Simple, fast, and free to join.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 32 }}>
                        {HOW_IT_WORKS.map(step => (
                            <div key={step.step} style={{ textAlign: 'center' }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 18, fontWeight: 900, color: '#2563EB', fontVariantNumeric: 'tabular-nums' }}>
                                    {step.step}
                                </div>
                                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>{step.title}</h3>
                                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ background: 'linear-gradient(135deg,#1E3A8A,#0D9488)', padding: 'clamp(60px,8vw,100px) 24px', textAlign: 'center' }}>
                <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                    Take control of your health today
                </h2>
                <p style={{ fontSize: 18, color: 'rgba(255,255,255,.8)', margin: '0 0 36px' }}>Free to join. No credit card required.</p>
                <Link href="/login/patient" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1D4ED8', padding: '16px 40px', borderRadius: 14, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 4px 24px rgba(0,0,0,.25)' }}>
                    Create Your Free Account →
                </Link>
            </section>

            {/* Footer */}
            <PublicFooter />
        </div>
    );
}

function PublicFooter() {
    return (
        <footer style={{ background: '#0A1F44', color: 'rgba(255,255,255,.6)', padding: '48px 24px 32px', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
            <div style={{ maxWidth: 1120, margin: '0 auto' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, marginBottom: 40 }}>
                    <div style={{ flex: '1 1 220px' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Care<span style={{ color: '#0D9488' }}>Connect</span></div>
                        <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 260 }}>India's connected healthcare platform. Find, book, and manage care with confidence.</p>
                    </div>
                    <div style={{ flex: '1 1 140px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>For Patients</div>
                        {['Find Doctors', 'Book Lab Tests', 'Health Records', 'Telemedicine', 'Nearby Pharmacies'].map(l => (
                            <div key={l} style={{ marginBottom: 10 }}><Link href="/nearby/search" style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>{l}</Link></div>
                        ))}
                    </div>
                    <div style={{ flex: '1 1 140px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>For Providers</div>
                        {[['Doctors', '/doctors'], ['Clinics', '/clinics'], ['Hospitals', '/hospitals'], ['Labs', '/labs'], ['Pharmacies', '/pharmacies']].map(([l, h]) => (
                            <div key={l} style={{ marginBottom: 10 }}><Link href={h} style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>{l}</Link></div>
                        ))}
                    </div>
                    <div style={{ flex: '1 1 140px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Company</div>
                        {[['About', '/about'], ['Contact', '/contact'], ['Privacy Policy', '/privacy'], ['Terms of Service', '/terms']].map(([l, h]) => (
                            <div key={l} style={{ marginBottom: 10 }}><Link href={h} style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>{l}</Link></div>
                        ))}
                    </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 24, fontSize: 12, color: 'rgba(255,255,255,.3)' }}>
                    © 2026 CareConnect. All rights reserved. Health information provided is for informational purposes only and is not a substitute for professional medical advice.
                </div>
            </div>
        </footer>
    );
}
