import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicNav } from '@/components/public/PublicNav';

export const metadata: Metadata = {
    title: 'CareConnect for Hospitals — Enterprise Healthcare Management',
    description: 'Full hospital operations on one platform: EMR, LIS, pharmacy, nursing station, ICU, ADT, bed management, and real-time analytics.',
};

const FEATURES = [
    { icon: '🏥', title: 'Full EMR & Clinical Workspace', desc: 'SOAP notes, smart prescriptions, lab orders, and care plans — unified across every department and doctor.' },
    { icon: '🛏️', title: 'Bed & ADT Management', desc: 'Real-time bed occupancy, admission/discharge/transfer workflows, and capacity heatmaps for every ward.' },
    { icon: '👩‍⚕️', title: 'Nursing Station', desc: 'Vital sign recording, medication administration, nursing notes, and shift handover — all at the nurse\'s fingertips.' },
    { icon: '🔬', title: 'Laboratory Information System', desc: 'Sample tracking, result reporting, reference ranges, and doctor notifications — end-to-end LIS built in.' },
    { icon: '💊', title: 'Pharmacy Information System', desc: 'Prescription verification, dispensing workflows, inventory management, and patient counselling logs.' },
    { icon: '🚨', title: 'Emergency & ICU', desc: 'SOS workflows, emergency patient registration, ICU monitoring dashboards, and EMS dispatch coordination.' },
    { icon: '📊', title: 'Real-Time Analytics', desc: 'Live operational heatmaps, OT utilisation, department load, SLO tracking, and executive dashboards.' },
    { icon: '🔒', title: 'RBAC & Audit Trails', desc: 'Role-based access control with permission-level granularity. Every action hash-chained in an immutable audit log.' },
];

export default function HospitalsPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
            <PublicNav />

            {/* Hero */}
            <section style={{ background: 'linear-gradient(140deg,#1E1B4B 0%,#312E81 40%,#1A54A8 80%,#0B96A0 100%)', padding: 'clamp(60px,10vw,120px) 24px' }}>
                <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 999, padding: '6px 16px', marginBottom: 28, fontSize: 13, color: 'rgba(255,255,255,.9)', fontWeight: 600 }}>
                        🏨 Enterprise hospital operations platform
                    </div>
                    <h1 style={{ color: '#fff', fontSize: 'clamp(34px,6vw,60px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.02em', margin: '0 0 20px' }}>
                        Every department.<br />
                        <span style={{ color: '#93C5FD' }}>One connected system.</span>
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 'clamp(16px,2vw,18px)', lineHeight: 1.65, margin: '0 0 40px', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
                        CareConnect brings together your entire hospital — OPD, IPD, OT, ICU, emergency, lab, pharmacy, and nursing — on one platform with real-time data across every department.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/provider/register?type=HOSPITAL" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#312E81', padding: '14px 32px', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>
                            Get Started →
                        </Link>
                        <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.15)', color: '#fff', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,.3)' }}>
                            Request a Demo
                        </Link>
                    </div>
                </div>
            </section>

            {/* Module grid */}
            <section style={{ background: '#F8FAFF', padding: 'clamp(60px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 1120, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: '#111827', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                            Every module. Out of the box.
                        </h2>
                        <p style={{ fontSize: 17, color: '#6B7280', maxWidth: 540, margin: '0 auto', lineHeight: 1.65 }}>
                            No custom integrations needed. Every department is connected from day one.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 20 }}>
                        {FEATURES.map(f => (
                            <div key={f.title} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px 22px' }}>
                                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>{f.title}</h3>
                                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Staff note */}
            <section style={{ background: '#fff', padding: 'clamp(40px,5vw,60px) 24px' }}>
                <div style={{ maxWidth: 760, margin: '0 auto', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 20, padding: '36px 40px' }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>🔑</div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1E3A8A', margin: '0 0 10px' }}>Staff Onboarding via Hospital Admin</h3>
                    <p style={{ fontSize: 15, color: '#1D4ED8', lineHeight: 1.7, margin: 0 }}>
                        Reception, nursing, lab, pharmacy, and emergency staff are onboarded by your Hospital Admin — not through a public registration page. This keeps your staff directory secure and under your control. Each role gets precisely the access they need, nothing more.
                    </p>
                </div>
            </section>

            {/* CTA */}
            <section style={{ background: 'linear-gradient(135deg,#1E1B4B,#1A54A8)', padding: 'clamp(60px,8vw,100px) 24px', textAlign: 'center' }}>
                <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                    Ready to connect your hospital?
                </h2>
                <p style={{ fontSize: 18, color: 'rgba(255,255,255,.75)', margin: '0 0 36px' }}>Start with a registration. Our enterprise team will guide you through setup.</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/provider/register?type=HOSPITAL" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1E1B4B', padding: '16px 40px', borderRadius: 14, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 4px 24px rgba(0,0,0,.25)' }}>
                        Register Your Hospital →
                    </Link>
                    <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.15)', color: '#fff', padding: '16px 32px', borderRadius: 14, fontWeight: 700, fontSize: 16, textDecoration: 'none', border: '1px solid rgba(255,255,255,.3)' }}>
                        Talk to Us
                    </Link>
                </div>
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
