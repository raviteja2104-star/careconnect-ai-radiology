import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicNav } from '@/components/public/PublicNav';

export const metadata: Metadata = {
    title: 'Join CareConnect — Choose Your Role',
    description: 'Join CareConnect as a patient, doctor, clinic, hospital, lab, or pharmacy. Select your role to get started.',
};

const ROLES = [
    {
        id: 'patient',
        icon: '🙋',
        title: "I'm a Patient",
        desc: 'Find doctors, book appointments, manage health records, and consult online.',
        cta: 'Create Patient Account',
        href: '/login/patient',
        color: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', btn: 'linear-gradient(135deg,#2563EB,#1D4ED8)' },
    },
    {
        id: 'doctor',
        icon: '🩺',
        title: "I'm a Doctor",
        desc: 'Join as an independent practitioner. Manage patients, consult online, and grow your practice.',
        cta: 'Register as Doctor',
        href: '/provider/register?type=DOCTOR',
        color: { bg: '#F0F9FF', border: '#BAE6FD', text: '#0369A1', btn: 'linear-gradient(135deg,#0284C7,#0369A1)' },
    },
    {
        id: 'clinic',
        icon: '🏥',
        title: 'I represent a Clinic',
        desc: 'Multi-doctor management, reception tools, shared EMR, and patient discovery.',
        cta: 'Register Your Clinic',
        href: '/provider/register?type=CLINIC',
        color: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', btn: 'linear-gradient(135deg,#16A34A,#15803D)' },
    },
    {
        id: 'hospital',
        icon: '🏨',
        title: 'I represent a Hospital',
        desc: 'Full hospital operations: EMR, LIS, PIS, nursing, ICU, bed management, analytics.',
        cta: 'Register Your Hospital',
        href: '/provider/register?type=HOSPITAL',
        color: { bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9', btn: 'linear-gradient(135deg,#7C3AED,#6D28D9)' },
    },
    {
        id: 'lab',
        icon: '🔬',
        title: 'I represent a Laboratory',
        desc: 'Online bookings, home collection, digital reports, and EMR integration.',
        cta: 'Register Your Lab',
        href: '/provider/register?type=LAB',
        color: { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C', btn: 'linear-gradient(135deg,#EA580C,#C2410C)' },
    },
    {
        id: 'pharmacy',
        icon: '💊',
        title: 'I represent a Pharmacy',
        desc: 'Accept digital prescriptions, manage home delivery, and connect to clinic workflows.',
        cta: 'Register Your Pharmacy',
        href: '/provider/register?type=PHARMACY',
        color: { bg: '#F0FDF4', border: '#A7F3D0', text: '#065F46', btn: 'linear-gradient(135deg,#059669,#065F46)' },
    },
];

export default function JoinPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFF', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <PublicNav />

            {/* Header */}
            <section style={{ background: 'linear-gradient(135deg,#0A1F44,#1A54A8)', padding: 'clamp(48px,8vw,72px) 24px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 999, padding: '6px 16px', marginBottom: 20, fontSize: 13, color: 'rgba(255,255,255,.9)', fontWeight: 600 }}>
                    ✦ Free to join
                </div>
                <h1 style={{ color: '#fff', fontSize: 'clamp(30px,5vw,52px)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                    Join CareConnect
                </h1>
                <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 17, margin: 0 }}>
                    Select your role to get started with the right experience.
                </p>
            </section>

            {/* Role grid */}
            <section style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(40px,6vw,72px) 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))', gap: 20 }}>
                    {ROLES.map(role => (
                        <div key={role.id} style={{
                            background: '#fff', border: `1.5px solid ${role.color.border}`,
                            borderRadius: 20, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 0,
                            boxShadow: '0 2px 12px rgba(10,31,68,.05)',
                        }}>
                            <div style={{ fontSize: 36, marginBottom: 14 }}>{role.icon}</div>
                            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>{role.title}</h2>
                            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65, margin: '0 0 24px', flex: 1 }}>{role.desc}</p>
                            <Link href={role.href} style={{
                                display: 'block', textAlign: 'center',
                                padding: '12px 20px', borderRadius: 12,
                                background: role.color.btn, color: '#fff',
                                fontWeight: 700, fontSize: 14, textDecoration: 'none',
                                boxShadow: '0 2px 10px rgba(0,0,0,.15)',
                                transition: 'opacity .15s',
                            }}>
                                {role.cta} →
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Note for reception/nurses */}
                <div style={{ marginTop: 40, padding: '20px 24px', background: '#FFF9EC', border: '1px solid #FCD34D', borderRadius: 14, textAlign: 'center', fontSize: 13, color: '#92400E' }}>
                    <strong>Reception staff and nurses</strong> are invited by their clinic or hospital administrator — they don't register independently. If you're a staff member, ask your clinic admin to invite you.
                </div>
            </section>

            {/* Login option */}
            <section style={{ textAlign: 'center', paddingBottom: 60 }}>
                <p style={{ fontSize: 14, color: '#6B7280' }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'none' }}>Sign In →</Link>
                </p>
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
