import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicNav } from '@/components/public/PublicNav';

export const metadata: Metadata = {
    title: 'CareConnect for Clinics — Streamline Your Practice',
    description: 'Run a smarter multi-specialty clinic with CareConnect. Manage multiple doctors, patient queues, reception, labs, and billing — all in one platform.',
};

const FEATURES = [
    { icon: '👥', title: 'Multi-Doctor Management', desc: 'Add all your doctors, manage their schedules, track individual OPD loads, and route patients to the right specialist.', color: '#EFF6FF' },
    { icon: '🖥️', title: 'Reception & Front-Desk Tools', desc: 'Patient check-in, walk-in registration, queue display boards, and appointment management — all on one screen.', color: '#F0FDF4' },
    { icon: '📋', title: 'Shared EMR', desc: 'Clinical encounter notes, prescriptions, and medical histories are shared across all doctors in your clinic — securely.', color: '#F5F3FF' },
    { icon: '🔬', title: 'Lab & Diagnostics Integration', desc: 'Send lab orders, track sample status, and deliver results digitally to patients. Works with external and in-house labs.', color: '#FFF7ED' },
    { icon: '💊', title: 'Pharmacy Linkage', desc: 'Prescriptions route to your in-house pharmacy or a nearby partner. Reduce patient steps, improve adherence.', color: '#ECFEFF' },
    { icon: '📈', title: 'Clinic Analytics', desc: 'Daily OPD counts, revenue trends, doctor utilisation, and patient satisfaction — all in a real-time dashboard.', color: '#FFF1F2' },
];

export default function ClinicsPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
            <PublicNav />

            {/* Hero */}
            <section style={{ background: 'linear-gradient(140deg,#134E4A 0%,#0F766E 50%,#0891B2 100%)', padding: 'clamp(60px,10vw,120px) 24px' }}>
                <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 999, padding: '6px 16px', marginBottom: 28, fontSize: 13, color: 'rgba(255,255,255,.9)', fontWeight: 600 }}>
                        🏥 Built for independent & multi-specialty clinics
                    </div>
                    <h1 style={{ color: '#fff', fontSize: 'clamp(34px,6vw,60px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.02em', margin: '0 0 20px' }}>
                        Streamline your clinic.<br />
                        <span style={{ color: '#FCD34D' }}>See more patients.</span>
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 'clamp(16px,2vw,18px)', lineHeight: 1.65, margin: '0 0 40px', maxWidth: 580, marginLeft: 'auto', marginRight: 'auto' }}>
                        From reception to consultation, lab to pharmacy — CareConnect gives your clinic a complete digital backbone without replacing what works.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/provider/register?type=CLINIC" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#0F766E', padding: '14px 32px', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>
                            Register Your Clinic →
                        </Link>
                        <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.15)', color: '#fff', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,.3)' }}>
                            Talk to Sales
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{ background: '#F8FAFF', padding: 'clamp(60px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 1120, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: '#111827', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                            Run your entire clinic from one platform
                        </h2>
                        <p style={{ fontSize: 17, color: '#6B7280', maxWidth: 540, margin: '0 auto', lineHeight: 1.65 }}>
                            Reception, doctors, labs, and pharmacy — all connected, all in sync.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 20 }}>
                        {FEATURES.map(f => (
                            <div key={f.title} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 24px' }}>
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 18 }}>{f.icon}</div>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>{f.title}</h3>
                                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Reception & Nursing note */}
            <section style={{ background: '#fff', padding: 'clamp(40px,5vw,60px) 24px' }}>
                <div style={{ maxWidth: 760, margin: '0 auto', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 20, padding: '36px 40px' }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>💡</div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#14532D', margin: '0 0 10px' }}>Reception &amp; Nurse Accounts Included</h3>
                    <p style={{ fontSize: 15, color: '#166534', lineHeight: 1.7, margin: 0 }}>
                        When your clinic joins CareConnect, your reception staff and nurses get invited directly through the platform — no separate public registration. They access queue management, patient check-in, and nursing station tools within your clinic's workspace.
                    </p>
                </div>
            </section>

            {/* CTA */}
            <section style={{ background: 'linear-gradient(135deg,#134E4A,#0891B2)', padding: 'clamp(60px,8vw,100px) 24px', textAlign: 'center' }}>
                <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                    Ready to modernise your clinic?
                </h2>
                <p style={{ fontSize: 18, color: 'rgba(255,255,255,.75)', margin: '0 0 36px' }}>Registration takes 5 minutes. Our team reviews and activates in 1–2 days.</p>
                <Link href="/provider/register?type=CLINIC" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#0F766E', padding: '16px 40px', borderRadius: 14, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 4px 24px rgba(0,0,0,.25)' }}>
                    Register Your Clinic →
                </Link>
            </section>

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
                        <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 260 }}>India's connected healthcare platform.</p>
                    </div>
                    <div style={{ flex: '1 1 140px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>For Providers</div>
                        {[['Doctors', '/doctors'], ['Clinics', '/clinics'], ['Hospitals', '/hospitals'], ['Labs', '/labs'], ['Pharmacies', '/pharmacies']].map(([l, h]) => (
                            <div key={l} style={{ marginBottom: 10 }}><Link href={h} style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}>{l}</Link></div>
                        ))}
                    </div>
                    <div style={{ flex: '1 1 140px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Company</div>
                        {[['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy']].map(([l, h]) => (
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
