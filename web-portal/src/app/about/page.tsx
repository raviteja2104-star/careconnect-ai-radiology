import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicNav } from '@/components/public/PublicNav';

export const metadata: Metadata = {
    title: 'About CareConnect — India\'s Connected Healthcare Platform',
    description: 'CareConnect is built to connect patients, doctors, clinics, hospitals, labs, and pharmacies on one trusted platform. Learn about our mission, values, and team.',
};

const VALUES = [
    { icon: '🔒', title: 'Privacy-First', desc: 'Health data is yours. We never sell it, never share it without consent, and never use it for advertising.' },
    { icon: '✅', title: 'Verified Providers', desc: 'Every doctor and provider on CareConnect is verified by our team before going live. We don\'t list unverified entities.' },
    { icon: '🤝', title: 'Human Oversight', desc: 'Our AI tools assist — they never decide. Every clinical suggestion surfaces as guidance, not a prescription.' },
    { icon: '🌐', title: 'Universal Access', desc: 'Healthcare should be accessible regardless of location. We\'re building for Tier 1, 2, and 3 cities alike.' },
];

const STATS = [
    { value: '3,500+', label: 'Verified Doctors' },
    { value: '500+', label: 'Hospitals & Clinics' },
    { value: '2,000+', label: 'Lab Tests Available' },
    { value: '50,000+', label: 'Patients Served' },
];

export default function AboutPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <PublicNav />

            {/* Hero */}
            <section style={{ background: 'linear-gradient(140deg,#0A1F44 0%,#1A54A8 60%,#0B96A0 100%)', padding: 'clamp(60px,10vw,100px) 24px', textAlign: 'center' }}>
                <div style={{ maxWidth: 700, margin: '0 auto' }}>
                    <div style={{ fontSize: 'clamp(36px,6vw,56px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
                        Built to connect<br /><span style={{ color: '#5EEAD4' }}>India's healthcare.</span>
                    </div>
                    <p style={{ fontSize: 'clamp(16px,2vw,18px)', color: 'rgba(255,255,255,.8)', lineHeight: 1.65, margin: 0, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
                        CareConnect is a healthcare platform that connects patients with doctors, clinics, hospitals, labs, and pharmacies — on one transparent, trusted system.
                    </p>
                </div>
            </section>

            {/* Mission */}
            <section style={{ background: '#fff', padding: 'clamp(60px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 760, margin: '0 auto' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Our Mission</div>
                    <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: '#111827', margin: '0 0 24px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                        Healthcare that works for everyone — patients, doctors, and providers.
                    </h2>
                    <p style={{ fontSize: 17, color: '#4B5563', lineHeight: 1.75, margin: '0 0 20px' }}>
                        India has some of the world's best doctors and healthcare infrastructure — but finding, accessing, and managing care is still fragmented, opaque, and often inaccessible. Patients struggle to find the right specialist. Doctors manage patients across paper, WhatsApp, and spreadsheets. Clinics run on disconnected software.
                    </p>
                    <p style={{ fontSize: 17, color: '#4B5563', lineHeight: 1.75, margin: 0 }}>
                        CareConnect exists to change that. We're building a single, connected platform where the entire healthcare journey — from finding a doctor to managing long-term records — is simple, transparent, and trustworthy.
                    </p>
                </div>
            </section>

            {/* Stats */}
            <section style={{ background: '#F8FAFF', padding: 'clamp(40px,5vw,60px) 24px' }}>
                <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 32, textAlign: 'center' }}>
                    {STATS.map(s => (
                        <div key={s.label}>
                            <div style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 900, color: '#2563EB', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                            <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 600, marginTop: 6 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Values */}
            <section style={{ background: '#fff', padding: 'clamp(60px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 960, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 52 }}>
                        <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: '#111827', margin: '0 0 12px', letterSpacing: '-0.02em' }}>What we stand for</h2>
                        <p style={{ fontSize: 17, color: '#6B7280' }}>The principles that guide every product decision we make.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 24 }}>
                        {VALUES.map(v => (
                            <div key={v.title} style={{ padding: '28px 24px', border: '1px solid #E5E7EB', borderRadius: 16, background: '#FAFBFF' }}>
                                <div style={{ fontSize: 32, marginBottom: 14 }}>{v.icon}</div>
                                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>{v.title}</h3>
                                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65, margin: 0 }}>{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI disclosure */}
            <section style={{ background: '#FFFBEB', padding: 'clamp(40px,5vw,60px) 24px' }}>
                <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>🤖</div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#92400E', margin: '0 0 12px' }}>Our AI Policy</h3>
                    <p style={{ fontSize: 15, color: '#78350F', lineHeight: 1.7 }}>
                        CareConnect uses AI to help — not to replace. Our AI assistant surfaces health information and helps organise documents. It never diagnoses or prescribes. Every clinical insight is reviewed with human oversight, and patients can always speak to a real doctor. We follow a strict transparency-first approach to AI in healthcare.
                    </p>
                </div>
            </section>

            {/* CTA */}
            <section style={{ background: 'linear-gradient(135deg,#0A1F44,#1A54A8)', padding: 'clamp(60px,8vw,100px) 24px', textAlign: 'center' }}>
                <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                    Join the CareConnect network
                </h2>
                <p style={{ fontSize: 17, color: 'rgba(255,255,255,.75)', margin: '0 0 36px' }}>Whether you're a patient or a provider, there's a place for you here.</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/join" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1A54A8', padding: '14px 32px', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.25)' }}>
                        Get Started →
                    </Link>
                    <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.15)', color: '#fff', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,.3)' }}>
                        Contact Us
                    </Link>
                </div>
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
                        <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 260 }}>India's connected healthcare platform.</p>
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
