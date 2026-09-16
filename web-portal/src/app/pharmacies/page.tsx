import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicNav } from '@/components/public/PublicNav';

export const metadata: Metadata = {
    title: 'CareConnect for Pharmacies — Go Digital',
    description: 'List your pharmacy on CareConnect. Accept digital prescriptions, manage home delivery, and integrate with clinic and hospital workflows.',
};

const FEATURES = [
    { icon: '📱', title: 'Digital Prescription Intake', desc: 'Receive prescriptions electronically from CareConnect doctors. No more manual reads or lost paper scripts.' },
    { icon: '🏠', title: 'Home Delivery Management', desc: 'Enable home delivery, assign delivery agents, and track order status. Patients see live delivery updates.' },
    { icon: '📦', title: 'Inventory Tracking', desc: 'Track stock levels by medication. Set reorder alerts and manage your medicine catalog from your dashboard.' },
    { icon: '💊', title: 'Dispensing Workflow', desc: 'Pharmacist verification queue, dispensing records, and patient counselling logs — all auditable.' },
    { icon: '🔗', title: 'Clinic & Hospital Integration', desc: 'Doctors at partner clinics and hospitals route prescriptions directly to your pharmacy. No extra steps.' },
    { icon: '⏰', title: '24/7 Listing', desc: 'Mark your pharmacy as 24/7, emergency, or online-only. Patients filter and find you based on their needs.' },
];

export default function PharmaciesPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
            <PublicNav />

            {/* Hero */}
            <section style={{ background: 'linear-gradient(140deg,#064E3B 0%,#065F46 40%,#059669 80%,#0D9488 100%)', padding: 'clamp(60px,10vw,120px) 24px' }}>
                <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 999, padding: '6px 16px', marginBottom: 28, fontSize: 13, color: 'rgba(255,255,255,.9)', fontWeight: 600 }}>
                        💊 Retail & online pharmacy platform
                    </div>
                    <h1 style={{ color: '#fff', fontSize: 'clamp(34px,6vw,60px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.02em', margin: '0 0 20px' }}>
                        Connect your pharmacy<br />
                        <span style={{ color: '#6EE7B7' }}>to digital healthcare.</span>
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 'clamp(16px,2vw,18px)', lineHeight: 1.65, margin: '0 0 40px', maxWidth: 580, marginLeft: 'auto', marginRight: 'auto' }}>
                        Accept digital prescriptions, manage home delivery, and become the go-to pharmacy for thousands of CareConnect patients in your area.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/provider/register?type=PHARMACY" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#065F46', padding: '14px 32px', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>
                            Register Your Pharmacy →
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
                            Everything your pharmacy needs
                        </h2>
                        <p style={{ fontSize: 17, color: '#6B7280', maxWidth: 540, margin: '0 auto', lineHeight: 1.65 }}>
                            From prescription intake to doorstep delivery — fully digital.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 20 }}>
                        {FEATURES.map(f => (
                            <div key={f.title} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px 24px' }}>
                                <div style={{ fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>{f.title}</h3>
                                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ background: 'linear-gradient(135deg,#064E3B,#059669)', padding: 'clamp(60px,8vw,100px) 24px', textAlign: 'center' }}>
                <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                    Bring your pharmacy online today
                </h2>
                <p style={{ fontSize: 18, color: 'rgba(255,255,255,.75)', margin: '0 0 36px' }}>Registration is free. Verification takes 1–2 business days.</p>
                <Link href="/provider/register?type=PHARMACY" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#065F46', padding: '16px 40px', borderRadius: 14, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 4px 24px rgba(0,0,0,.25)' }}>
                    Register Your Pharmacy →
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
