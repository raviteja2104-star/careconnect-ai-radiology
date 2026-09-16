'use client';
import { useState } from 'react';
import Link from 'next/link';
import { PublicNav } from '@/components/public/PublicNav';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

const PROVIDER_TYPES = [
    { value: 'DOCTOR',    label: 'Individual Doctor' },
    { value: 'CLINIC',    label: 'Clinic' },
    { value: 'HOSPITAL',  label: 'Hospital' },
    { value: 'LAB',       label: 'Diagnostic Lab' },
    { value: 'PHARMACY',  label: 'Pharmacy' },
    { value: 'OTHER',     label: 'Other / Patient' },
];

interface FormState {
    name: string; phone: string; email: string; providerType: string; city: string; message: string;
}

export default function ContactPage() {
    const [form, setForm]         = useState<FormState>({ name: '', phone: '', email: '', providerType: '', city: '', message: '' });
    const [loading, setLoading]   = useState(false);
    const [success, setSuccess]   = useState(false);
    const [error, setError]       = useState('');

    const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) { setError('Name, email, and message are required.'); return; }
        setError(''); setLoading(true);
        try {
            const res = await fetch(`${API}/api/provider-enquiry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const j = await res.json();
            if (!j.success) throw new Error(j.message ?? 'Failed to send');
            setSuccess(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to send. Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
            <PublicNav />

            {/* Header */}
            <section style={{ background: 'linear-gradient(135deg,#0A1F44,#1A54A8)', padding: 'clamp(48px,8vw,80px) 24px', textAlign: 'center' }}>
                <h1 style={{ color: '#fff', fontSize: 'clamp(30px,5vw,48px)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>Get in touch</h1>
                <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 17, margin: 0 }}>Questions, partnership enquiries, or feedback — we'd love to hear from you.</p>
            </section>

            {/* Main */}
            <section style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(40px,6vw,80px) 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 48 }}>

                {/* Contact info */}
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 24px' }}>Contact Information</h2>

                    {[
                        { icon: '📧', label: 'Email', value: 'hello@careconnect.care', href: 'mailto:hello@careconnect.care' },
                        { icon: '📞', label: 'Phone', value: '+91 40 1234 5678', href: 'tel:+914012345678' },
                        { icon: '📍', label: 'Office', value: 'Hyderabad, Telangana, India', href: null },
                    ].map(c => (
                        <div key={c.label} style={{ display: 'flex', gap: 14, marginBottom: 24, alignItems: 'flex-start' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{c.icon}</div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{c.label}</div>
                                {c.href
                                    ? <a href={c.href} style={{ fontSize: 15, fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}>{c.value}</a>
                                    : <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{c.value}</div>
                                }
                            </div>
                        </div>
                    ))}

                    <div style={{ marginTop: 32, padding: '20px 22px', background: '#F0F4FF', border: '1px solid #DBEAFE', borderRadius: 14 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1D4ED8', marginBottom: 6 }}>Provider Registration</div>
                        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, margin: '0 0 12px' }}>
                            Want to join as a provider? Skip the form and register directly to get started faster.
                        </p>
                        <Link href="/join" style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            Join CareConnect →
                        </Link>
                    </div>
                </div>

                {/* Contact form */}
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 24px' }}>Send us a message</h2>

                    {success ? (
                        <div style={{ textAlign: 'center', padding: '48px 32px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 16 }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#14532D', margin: '0 0 8px' }}>Message sent!</h3>
                            <p style={{ fontSize: 14, color: '#166534', margin: 0 }}>We'll get back to you within 1–2 business days.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {error && (
                                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#DC2626' }}>{error}</div>
                            )}
                            <FormField label="Your Name *" value={form.name} onChange={v => set('name', v)} placeholder="Full name" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <FormField label="Email *" type="email" value={form.email} onChange={v => set('email', v)} placeholder="you@example.com" />
                                <FormField label="Phone" value={form.phone} onChange={v => set('phone', v)} placeholder="+91 98765 43210" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={labelStyle}>I represent</label>
                                    <select value={form.providerType} onChange={e => set('providerType', e.target.value)} style={inputStyle}>
                                        <option value="">Select type</option>
                                        {PROVIDER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <FormField label="City" value={form.city} onChange={v => set('city', v)} placeholder="Mumbai" />
                            </div>
                            <div>
                                <label style={labelStyle}>Message *</label>
                                <textarea
                                    rows={4} value={form.message}
                                    onChange={e => set('message', e.target.value)}
                                    placeholder="How can we help you?"
                                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                                />
                            </div>
                            <button type="submit" disabled={loading} style={{
                                padding: '13px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#1A54A8,#0B96A0)',
                                color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1, fontFamily: 'inherit',
                            }}>
                                {loading ? 'Sending…' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', background: '#fff' };

function FormField({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    return (
        <div>
            <label style={labelStyle}>{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
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
