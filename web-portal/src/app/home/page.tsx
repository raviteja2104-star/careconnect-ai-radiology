'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from '@/components/providers/SessionProvider';
import { motion } from 'framer-motion';
import {
    Stethoscope, FlaskConical, Building2, Pill, Activity, Microscope,
    Video, Shield, ArrowRight, Calendar, FileText, Users,
    ShieldCheck, Clock, BadgeCheck, BarChart3, Globe, Menu, X,
    Heart, ChevronDown, CheckCircle, Zap, Lock, Database,
} from 'lucide-react';

/* ── animation helpers ──────────────────────────────────────────────────── */
const fadeUp = {
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

/* ── nav data ────────────────────────────────────────────────────────────── */
type DropdownId = 'platform' | 'healthcare' | 'patients' | 'resources' | null;

const NAV_PLATFORM = [
    { label: 'EMR',                  icon: FileText,   href: '/doctors',   desc: 'Electronic medical records for modern practice' },
    { label: 'Clinic Management',    icon: Building2,  href: '/clinics',   desc: 'End-to-end clinic operations platform' },
    { label: 'Hospital Management',  icon: Building2,  href: '/hospitals', desc: 'Enterprise hospital workflow suite' },
    { label: 'Patient Care',         icon: Heart,      href: '/patients',  desc: 'Connected patient experience platform' },
    { label: 'Laboratory',           icon: FlaskConical, href: '/labs',    desc: 'LIS for diagnostic labs and pathology' },
    { label: 'Pharmacy',             icon: Pill,       href: '/pharmacies', desc: 'Prescription-to-dispensing management' },
    { label: 'Telemedicine',         icon: Video,      href: '/doctors',   desc: 'Secure video consultation platform' },
    { label: 'Analytics',            icon: BarChart3,  href: '/join',      desc: 'Real-time healthcare intelligence' },
];

const NAV_HEALTHCARE = [
    { label: 'Doctors',     icon: '🩺', href: '/doctors',    desc: 'EMR, appointments, prescription tools' },
    { label: 'Clinics',     icon: '🏥', href: '/clinics',    desc: 'Multi-doctor clinic management' },
    { label: 'Hospitals',   icon: '🏨', href: '/hospitals',  desc: 'Enterprise hospital operations' },
    { label: 'Labs',        icon: '🔬', href: '/labs',       desc: 'Diagnostic lab workflow & LIS' },
    { label: 'Pharmacies',  icon: '💊', href: '/pharmacies', desc: 'Dispensing and inventory management' },
];

const NAV_PATIENTS = [
    { label: 'Find Doctors',       icon: '🩺', href: '/patients',   desc: 'Search and book appointments' },
    { label: 'Book Appointments',  icon: '📅', href: '/patients',   desc: 'Schedule with verified providers' },
    { label: 'Health Records',     icon: '📁', href: '/patients',   desc: 'Your complete medical history' },
    { label: 'Lab Reports',        icon: '🔬', href: '/patients',   desc: 'View and download digital reports' },
];

const NAV_RESOURCES = [
    { label: 'Blog',         href: '/about',   icon: '✍️' },
    { label: 'Help Center',  href: '/contact', icon: '❓' },
    { label: 'FAQs',         href: '/contact', icon: '💬' },
    { label: 'Contact',      href: '/contact', icon: '📞' },
];

/* ── audience shortcuts ─────────────────────────────────────────────────── */
const PROVIDER_SHORTCUTS = [
    { label: 'Doctor',    href: '/provider/register?type=DOCTOR',  icon: '🩺' },
    { label: 'Clinic',    href: '/provider/register?type=CLINIC',  icon: '🏥' },
    { label: 'Hospital',  href: '/provider/register?type=HOSPITAL', icon: '🏨' },
    { label: 'Lab',       href: '/provider/register?type=LAB',     icon: '🔬' },
    { label: 'Pharmacy',  href: '/provider/register?type=PHARMACY', icon: '💊' },
];

/* ── journey steps ──────────────────────────────────────────────────────── */
const JOURNEY = [
    { label: 'Appointment',   icon: '📅', color: '#2563EB' },
    { label: 'Consultation',  icon: '🩺', color: '#0F766E' },
    { label: 'Prescription',  icon: '📋', color: '#7C3AED' },
    { label: 'Lab Test',      icon: '🔬', color: '#0369A1' },
    { label: 'Lab Report',    icon: '📊', color: '#059669' },
    { label: 'Radiology',     icon: '🫁', color: '#B45309' },
    { label: 'Medication',    icon: '💊', color: '#DC2626' },
    { label: 'Follow-up',     icon: '🔄', color: '#2563EB' },
];

/* ── component ───────────────────────────────────────────────────────────── */
export default function HomePage() {
    const { isAuthenticated } = useSession();
    // Marketing page — all CTAs route to public pages regardless of auth state.
    // Protected-route redirects (/nearby) must never appear here.
    const dashboardHref = isAuthenticated ? '/dashboard' : '/login';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<DropdownId>(null);
    const navRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggleDropdown = (id: DropdownId) =>
        setOpenDropdown(prev => (prev === id ? null : id));

    return (
        <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>

            {/* ══════════ KEYFRAMES ══════════ */}
            <style>{`
                @keyframes cc-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-13px)}}
                @keyframes cc-float2{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
                @keyframes cc-ecg{from{stroke-dashoffset:700}to{stroke-dashoffset:0}}
                @keyframes cc-blink{0%,100%{opacity:1}50%{opacity:.2}}
                @keyframes cc-pulse{0%,100%{box-shadow:0 0 0 0 rgba(94,234,212,.45)}65%{box-shadow:0 0 0 12px rgba(94,234,212,0)}}
                @keyframes cc-spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
                @keyframes cc-dash{0%{stroke-dashoffset:300}100%{stroke-dashoffset:0}}
                @keyframes cc-nav-pulse{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.35)}60%{box-shadow:0 0 0 8px rgba(37,99,235,0)}}
                @media(max-width:1023px){.cc-hero-vis{display:none!important}}
                @media(max-width:768px){.cc-hide-mobile{display:none!important}}
                .cc-nav-link{font-size:13px;font-weight:600;color:#374151;padding:8px 12px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:4px;white-space:nowrap;background:none;border:none;transition:color .15s,background .15s;}
                .cc-nav-link:hover{color:#1D4ED8;background:#EFF6FF;}
                .cc-provider-card:hover{background:#F0F9FF!important;border-color:#BFDBFE!important;}
            `}</style>

            {/* ══════════ NAVBAR ══════════ */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(12px)', borderBottom: '1px solid #E8EEF8',
                boxShadow: '0 1px 4px rgba(10,31,68,.05)',
            }}>
                <div ref={navRef} style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', height: 64, gap: 8 }}>

                        {/* Logo */}
                        <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0, marginRight: 16 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#1D4ED8 0%,#0D9488 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(37,99,235,.3)', animation: 'cc-nav-pulse 2.8s ease-out infinite', flexShrink: 0 }}>
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                                    <polyline points="1,12 5,12 7,7 9,17 11,12 13,12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                    <path d="M13,12 C14,9.5 18,8 19.5,10 C21,12 20,15 17,17.5 L14,20" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                                </svg>
                            </div>
                            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.025em', color: '#0A1F44' }}>
                                Care<span style={{ background: 'linear-gradient(90deg,#1D4ED8,#0D9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Connect</span>
                            </span>
                        </Link>

                        {/* Desktop nav */}
                        <nav className="cc-hide-mobile" style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 2 }}>

                            {/* Platform */}
                            <div style={{ position: 'relative' }}>
                                <button className="cc-nav-link" onClick={() => toggleDropdown('platform')}>
                                    Platform <ChevronDown style={{ width: 14, height: 14, transition: 'transform .2s', transform: openDropdown === 'platform' ? 'rotate(180deg)' : 'none' }} />
                                </button>
                                {openDropdown === 'platform' && (
                                    <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: 0, background: '#fff', border: '1px solid #E8EEF8', borderRadius: 16, boxShadow: '0 12px 48px rgba(10,31,68,.14)', padding: 8, width: 320, zIndex: 200 }}>
                                        {NAV_PLATFORM.map(item => (
                                            <Link key={item.href + item.label} href={item.href}
                                                onClick={() => setOpenDropdown(null)}
                                                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px', borderRadius: 10, textDecoration: 'none', transition: 'background .15s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#F0F4FF')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <item.icon style={{ width: 14, height: 14, color: '#1D4ED8' }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{item.label}</div>
                                                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{item.desc}</div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* For Healthcare */}
                            <div style={{ position: 'relative' }}>
                                <button className="cc-nav-link" onClick={() => toggleDropdown('healthcare')}>
                                    For Healthcare <ChevronDown style={{ width: 14, height: 14, transition: 'transform .2s', transform: openDropdown === 'healthcare' ? 'rotate(180deg)' : 'none' }} />
                                </button>
                                {openDropdown === 'healthcare' && (
                                    <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: 0, background: '#fff', border: '1px solid #E8EEF8', borderRadius: 16, boxShadow: '0 12px 48px rgba(10,31,68,.14)', padding: 8, width: 270, zIndex: 200 }}>
                                        {NAV_HEALTHCARE.map(item => (
                                            <Link key={item.href + item.label} href={item.href}
                                                onClick={() => setOpenDropdown(null)}
                                                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', transition: 'background .15s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#F0F4FF')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.2 }}>{item.icon}</span>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{item.label}</div>
                                                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{item.desc}</div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* For Patients */}
                            <div style={{ position: 'relative' }}>
                                <button className="cc-nav-link" onClick={() => toggleDropdown('patients')}>
                                    For Patients <ChevronDown style={{ width: 14, height: 14, transition: 'transform .2s', transform: openDropdown === 'patients' ? 'rotate(180deg)' : 'none' }} />
                                </button>
                                {openDropdown === 'patients' && (
                                    <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: 0, background: '#fff', border: '1px solid #E8EEF8', borderRadius: 16, boxShadow: '0 12px 48px rgba(10,31,68,.14)', padding: 8, width: 260, zIndex: 200 }}>
                                        {NAV_PATIENTS.map(item => (
                                            <Link key={item.href + item.label} href={item.href}
                                                onClick={() => setOpenDropdown(null)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', transition: 'background .15s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#F0F4FF')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{item.label}</div>
                                                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{item.desc}</div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Resources */}
                            <div style={{ position: 'relative' }}>
                                <button className="cc-nav-link" onClick={() => toggleDropdown('resources')}>
                                    Resources <ChevronDown style={{ width: 14, height: 14, transition: 'transform .2s', transform: openDropdown === 'resources' ? 'rotate(180deg)' : 'none' }} />
                                </button>
                                {openDropdown === 'resources' && (
                                    <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: 0, background: '#fff', border: '1px solid #E8EEF8', borderRadius: 16, boxShadow: '0 12px 48px rgba(10,31,68,.14)', padding: 8, width: 200, zIndex: 200 }}>
                                        {NAV_RESOURCES.map(item => (
                                            <Link key={item.href + item.label} href={item.href}
                                                onClick={() => setOpenDropdown(null)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', transition: 'background .15s' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#F0F4FF')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <span style={{ fontSize: 16 }}>{item.icon}</span>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Link href="/about" className="cc-nav-link" style={{ textDecoration: 'none', fontSize: 13, fontWeight: 600, color: '#374151', padding: '8px 12px', borderRadius: 8 }}>About</Link>
                        </nav>

                        {/* Right CTAs */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
                            <Link href={dashboardHref} className="cc-hide-mobile" style={{ fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none', padding: '8px 14px', borderRadius: 8 }}>
                                {isAuthenticated ? 'Dashboard' : 'Sign In'}
                            </Link>
                            <Link href="/join" style={{ fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none', padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#2563EB,#0D9488)', boxShadow: '0 2px 8px rgba(37,99,235,.35)' }}>
                                Get Started
                            </Link>
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', borderRadius: 8, color: '#374151', display: 'none' }}
                                className="cc-mobile-hamburger" aria-label="Menu">
                                {mobileMenuOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile menu */}
                    {mobileMenuOpen && (
                        <div style={{ borderTop: '1px solid #E8EEF8', padding: '12px 0 20px', background: '#fff' }}>
                            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
                                {[
                                    { href: '/patients',   label: 'For Patients' },
                                    { href: '/doctors',    label: 'For Doctors' },
                                    { href: '/clinics',    label: 'For Clinics' },
                                    { href: '/hospitals',  label: 'For Hospitals' },
                                    { href: '/labs',       label: 'For Labs' },
                                    { href: '/pharmacies', label: 'For Pharmacies' },
                                    { href: '/about',      label: 'About' },
                                    { href: '/contact',    label: 'Contact' },
                                ].map(l => (
                                    <Link key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)}
                                        style={{ fontSize: 14, color: '#374151', fontWeight: 600, padding: '10px 0', textDecoration: 'none', borderBottom: '1px solid #F3F4F6', display: 'block' }}>
                                        {l.label}
                                    </Link>
                                ))}
                            </nav>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <Link href={dashboardHref} style={{ flex: 1, textAlign: 'center', padding: '11px 0', borderRadius: 10, border: '1.5px solid #E5E7EB', color: '#374151', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>{isAuthenticated ? 'Dashboard' : 'Sign In'}</Link>
                                <Link href="/join" style={{ flex: 1, textAlign: 'center', padding: '11px 0', borderRadius: 10, background: 'linear-gradient(135deg,#2563EB,#0D9488)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Get Started</Link>
                            </div>
                        </div>
                    )}
                </div>
                <style>{`
                    @media(max-width:768px){.cc-mobile-hamburger{display:flex!important}}
                `}</style>
            </header>

            {/* ══════════ HERO ══════════ */}
            <section style={{
                background: 'linear-gradient(140deg,#0A1F44 0%,#1E3A8A 40%,#1D4ED8 70%,#0F766E 100%)',
                padding: 'clamp(72px,10vw,100px) 0 0',
                overflow: 'hidden', position: 'relative',
            }}>
                {/* subtle grid overlay */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.04) 1px, transparent 0)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative' }}>

                    {/* top badge */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: 28 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 999, padding: '6px 16px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.9)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            ✦ The Connected Healthcare Platform
                        </span>
                    </motion.div>

                    {/* headline */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }} style={{ textAlign: 'center', marginBottom: 20 }}>
                        <h1 style={{ fontSize: 'clamp(40px,7vw,80px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0 }}>
                            Healthcare, Connected.<br />
                            <span style={{ background: 'linear-gradient(90deg,#5EEAD4,#A5F3FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Care, Simplified.</span>
                        </h1>
                    </motion.div>

                    <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.16 }}
                        style={{ textAlign: 'center', fontSize: 'clamp(16px,2.2vw,20px)', color: 'rgba(255,255,255,.75)', maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.6 }}>
                        One platform connecting patients, doctors, clinics, hospitals, labs and pharmacies.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.22 }}
                        style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                        <Link href="/join" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1D4ED8', padding: '14px 32px', borderRadius: 14, fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 24px rgba(0,0,0,.25)' }}>
                            Get Started <ArrowRight style={{ width: 16, height: 16 }} />
                        </Link>
                        <a href="#ecosystem" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.12)', color: '#fff', padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,.25)', cursor: 'pointer' }}>
                            Explore CareConnect
                        </a>
                    </motion.div>

                    {/* Trust line */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                        style={{ textAlign: 'center', marginBottom: 48, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                        {['Verified Providers', 'Secure & Private', 'Connected Records'].map((t, i) => (
                            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>
                                <CheckCircle style={{ width: 13, height: 13, color: '#4ADE80' }} /> {t}
                                {i < 2 && <span style={{ color: 'rgba(255,255,255,.25)', marginLeft: 4 }}>·</span>}
                            </span>
                        ))}
                    </motion.div>

                    {/* Provider shortcuts */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        style={{ textAlign: 'center', marginBottom: 16 }}>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 10, fontWeight: 600 }}>Healthcare professional? Start here:</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {PROVIDER_SHORTCUTS.map(s => (
                                <Link key={s.label} href={s.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 10, padding: '8px 14px', textDecoration: 'none', color: '#fff', fontSize: 13, fontWeight: 700, transition: 'background .15s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.18)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.1)')}>
                                    <span>{s.icon}</span> {s.label}
                                </Link>
                            ))}
                        </div>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', marginTop: 12 }}>
                            Looking for healthcare?{' '}
                            <Link href="/patients" style={{ color: '#5EEAD4', fontWeight: 700, textDecoration: 'none' }}>Find a Doctor →</Link>
                        </p>
                    </motion.div>

                    {/* Hero visual — ecosystem hub */}
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
                        className="cc-hero-vis" style={{ position: 'relative', height: 280, marginTop: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <HeroEcosystem />
                    </motion.div>
                </div>
            </section>

            {/* ══════════ TRUST STRIP ══════════ */}
            <section style={{ background: '#F8FAFF', borderBottom: '1px solid #E8EEF8', padding: '20px 24px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                        Built for modern healthcare teams
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(16px,3vw,40px)', flexWrap: 'wrap' }}>
                        {[
                            { icon: '🔐', label: 'Secure healthcare workflows' },
                            { icon: '👥', label: 'Role-based access' },
                            { icon: '📋', label: 'Connected patient records' },
                            { icon: '💻', label: 'Digital clinical workflows' },
                            { icon: '⚡', label: 'Scalable provider infrastructure' },
                        ].map(t => (
                            <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: '#4B5563' }}>
                                <span style={{ fontSize: 16 }}>{t.icon}</span> {t.label}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════ ECOSYSTEM ══════════ */}
            <section id="ecosystem" style={{ background: '#fff', padding: 'clamp(64px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 64 }}>
                        <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#0A1F44', letterSpacing: '-0.025em', margin: '0 0 16px' }}>
                            Healthcare works better when<br />everything is connected.
                        </h2>
                        <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
                            CareConnect is the connection layer between every healthcare stakeholder — one platform, every workflow.
                        </p>
                    </motion.div>

                    {/* Connection diagram */}
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                        <EcosystemDiagram />
                    </motion.div>
                </div>
            </section>

            {/* ══════════ DOCTOR SECTION ══════════ */}
            <section style={{ background: '#F8FAFF', padding: 'clamp(64px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64, flexWrap: 'wrap' }}>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ flex: '1 1 380px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EFF6FF', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#1D4ED8', marginBottom: 20 }}>
                            🩺 For Doctors
                        </div>
                        <h2 style={{ fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 900, color: '#0A1F44', letterSpacing: '-0.025em', margin: '0 0 16px', lineHeight: 1.15 }}>
                            Everything a doctor needs to deliver better care.
                        </h2>
                        <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, marginBottom: 28 }}>
                            From patient intake to consultation, prescription, diagnostics and follow-up — CareConnect brings the clinical workflow into one workspace.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
                            {[
                                { icon: '📋', title: 'Digital EMR',              desc: 'Longitudinal patient records and clinical history' },
                                { icon: '🖊️', title: 'Consultation Workspace',   desc: 'Structured notes, diagnosis and treatment plans' },
                                { icon: '💊', title: 'Smart Prescription',       desc: 'Create and manage digital prescriptions' },
                                { icon: '📅', title: 'Appointment Management',   desc: 'Manage availability, queues and schedules' },
                                { icon: '🔬', title: 'Diagnostics',              desc: 'Order and access lab and radiology results' },
                                { icon: '📈', title: 'Patient Timeline',         desc: 'Full healthcare journey in one view' },
                            ].map(f => (
                                <div key={f.title} style={{ background: '#fff', border: '1px solid #E8EEF8', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(10,31,68,.04)' }}>
                                    <div style={{ fontSize: 18, marginBottom: 6 }}>{f.icon}</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 3 }}>{f.title}</div>
                                    <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5 }}>{f.desc}</div>
                                </div>
                            ))}
                        </div>
                        <Link href="/doctors" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 3px 12px rgba(37,99,235,.35)' }}>
                            Explore CareConnect for Doctors <ArrowRight style={{ width: 15, height: 15 }} />
                        </Link>
                    </motion.div>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ flex: '0 0 440px' }}>
                        <DoctorDashboardMockup />
                    </motion.div>
                </div>
            </section>

            {/* ══════════ CLINIC SECTION ══════════ */}
            <section style={{ background: '#fff', padding: 'clamp(64px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64, flexWrap: 'wrap-reverse' }}>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ flex: '0 0 440px' }}>
                        <ClinicWorkflowMockup />
                    </motion.div>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ flex: '1 1 380px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F0FDF4', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#15803D', marginBottom: 20 }}>
                            🏥 For Clinics
                        </div>
                        <h2 style={{ fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 900, color: '#0A1F44', letterSpacing: '-0.025em', margin: '0 0 16px', lineHeight: 1.15 }}>
                            Run your clinic from one connected workspace.
                        </h2>
                        <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, marginBottom: 28 }}>
                            From patient registration through consultation, prescription and follow-up — manage every step of your clinic workflow in one place.
                        </p>
                        <div style={{ marginBottom: 28 }}>
                            {[
                                'Patient registration and reception',
                                'Appointment scheduling and queue management',
                                'Multi-doctor schedules and EMR',
                                'Digital prescriptions and diagnostics',
                                'Staff management and reports',
                                'Analytics and performance insights',
                            ].map(item => (
                                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                    <CheckCircle style={{ width: 16, height: 16, color: '#16A34A', flexShrink: 0 }} />
                                    <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{item}</span>
                                </div>
                            ))}
                        </div>
                        <Link href="/provider/register?type=CLINIC" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#16A34A,#15803D)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 3px 12px rgba(21,128,61,.3)' }}>
                            Register Your Clinic <ArrowRight style={{ width: 15, height: 15 }} />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ══════════ HOSPITAL SECTION ══════════ */}
            <section style={{ background: '#F5F3FF', padding: 'clamp(64px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EDE9FE', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#6D28D9', marginBottom: 20 }}>
                            🏨 For Hospitals
                        </div>
                        <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 900, color: '#0A1F44', letterSpacing: '-0.025em', margin: '0 0 16px' }}>
                            Connect every department.<br />Coordinate every step of care.
                        </h2>
                        <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
                            From OPD to ICU, radiology to pharmacy — CareConnect connects your entire hospital in one coordinated platform.
                        </p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 48 }}>
                        {[
                            { icon: '🏥', label: 'OPD Management',    desc: 'Outpatient department workflows' },
                            { icon: '🛏️', label: 'IPD & Bed Management', desc: 'Inpatient admissions and wards' },
                            { icon: '🚨', label: 'Emergency Care',    desc: 'Emergency triage and rapid response' },
                            { icon: '👩‍⚕️', label: 'Nursing Module',   desc: 'Nursing notes and care plans' },
                            { icon: '🔬', label: 'Diagnostics',       desc: 'Lab and radiology integration' },
                            { icon: '💊', label: 'Pharmacy',          desc: 'Hospital pharmacy management' },
                            { icon: '📊', label: 'Analytics',         desc: 'Hospital performance dashboards' },
                            { icon: '📋', label: 'Discharge & ADT',   desc: 'Admission, discharge, transfer' },
                        ].map(item => (
                            <motion.div key={item.label} variants={fadeUp}
                                style={{ background: '#fff', border: '1.5px solid #DDD6FE', borderRadius: 16, padding: '20px 18px', boxShadow: '0 2px 8px rgba(109,40,217,.07)' }}>
                                <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{item.label}</div>
                                <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{item.desc}</div>
                            </motion.div>
                        ))}
                    </motion.div>

                    <div style={{ textAlign: 'center' }}>
                        <Link href="/provider/register?type=HOSPITAL" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', padding: '13px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 3px 12px rgba(109,40,217,.3)' }}>
                            Register Your Hospital <ArrowRight style={{ width: 15, height: 15 }} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ══════════ PATIENT SECTION ══════════ */}
            <section style={{ background: '#fff', padding: 'clamp(64px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64, flexWrap: 'wrap' }}>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ flex: '1 1 380px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EFF6FF', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#0369A1', marginBottom: 20 }}>
                            🙋 For Patients
                        </div>
                        <h2 style={{ fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 900, color: '#0A1F44', letterSpacing: '-0.025em', margin: '0 0 16px', lineHeight: 1.15 }}>
                            Your healthcare journey, in one place.
                        </h2>
                        <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, marginBottom: 28 }}>
                            Find doctors, book appointments, view prescriptions and lab reports — your complete health record is always with you.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
                            {[
                                '🔍 Find doctors by specialty',
                                '📅 Book appointments online',
                                '📋 Digital prescriptions',
                                '🔬 View lab reports',
                                '📁 Manage health records',
                                '📞 Online consultation',
                                '🏥 Discover hospitals & clinics',
                                '🔄 Follow-up care reminders',
                            ].map(f => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', fontWeight: 500 }}>
                                    {f}
                                </div>
                            ))}
                        </div>
                        <Link href="/patients" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#0284C7,#0369A1)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 3px 12px rgba(3,105,161,.3)' }}>
                            Find Healthcare <ArrowRight style={{ width: 15, height: 15 }} />
                        </Link>
                    </motion.div>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ flex: '0 0 400px' }}>
                        <PatientAppMockup />
                    </motion.div>
                </div>
            </section>

            {/* ══════════ LAB + PHARMACY ══════════ */}
            <section style={{ background: '#F8FAFF', padding: 'clamp(64px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 900, color: '#0A1F44', letterSpacing: '-0.025em', margin: '0 0 16px' }}>
                            Connecting labs and pharmacies<br />to the care workflow.
                        </h2>
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(480px,1fr))', gap: 24 }}>

                        {/* Lab */}
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                            style={{ background: '#fff', border: '1.5px solid #FED7AA', borderRadius: 24, padding: 32, boxShadow: '0 4px 20px rgba(234,88,12,.06)' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF7ED', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#C2410C', marginBottom: 20 }}>
                                🔬 For Laboratories
                            </div>
                            <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0A1F44', margin: '0 0 12px', lineHeight: 1.2 }}>
                                From diagnostic order to verified report.
                            </h3>
                            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
                                Manage your entire lab workflow — from doctor-ordered tests through sample collection, processing, verification and digital report delivery.
                            </p>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                                {['Test catalog', 'Worklist', 'Sample tracking', 'Results entry', 'Verification', 'Digital reports', 'Doctor access', 'Patient access'].map(t => (
                                    <span key={t} style={{ background: '#FFF7ED', color: '#C2410C', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{t}</span>
                                ))}
                            </div>
                            <Link href="/provider/register?type=LAB" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#EA580C,#C2410C)', color: '#fff', padding: '11px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                                Register Your Lab <ArrowRight style={{ width: 14, height: 14 }} />
                            </Link>
                        </motion.div>

                        {/* Pharmacy */}
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                            style={{ background: '#fff', border: '1.5px solid #A7F3D0', borderRadius: 24, padding: 32, boxShadow: '0 4px 20px rgba(5,150,105,.06)' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F0FDF4', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#065F46', marginBottom: 20 }}>
                                💊 For Pharmacies
                            </div>
                            <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0A1F44', margin: '0 0 12px', lineHeight: 1.2 }}>
                                Connect prescriptions to medication.
                            </h3>
                            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
                                Accept digital prescriptions, manage inventory, track dispensing and connect to clinic and hospital workflows seamlessly.
                            </p>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                                {['Digital Rx', 'Medicine catalog', 'Inventory', 'Dispensing', 'Stock alerts', 'Medication history'].map(t => (
                                    <span key={t} style={{ background: '#F0FDF4', color: '#065F46', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{t}</span>
                                ))}
                            </div>
                            <Link href="/provider/register?type=PHARMACY" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#059669,#065F46)', color: '#fff', padding: '11px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                                Register Your Pharmacy <ArrowRight style={{ width: 14, height: 14 }} />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ══════════ PATIENT JOURNEY ══════════ */}
            <section style={{ background: 'linear-gradient(140deg,#0A1F44 0%,#1E3A8A 60%,#1D4ED8 100%)', padding: 'clamp(64px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', margin: '0 0 16px' }}>
                            One patient. One connected<br />healthcare journey.
                        </h2>
                        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.65)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
                            The same patient record flows through every authorized step — seamlessly connecting every part of care.
                        </p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                        <JourneyTimeline />
                    </motion.div>
                </div>
            </section>

            {/* ══════════ HOW IT WORKS ══════════ */}
            <section style={{ background: '#fff', padding: 'clamp(64px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2 style={{ fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 900, color: '#0A1F44', letterSpacing: '-0.025em', margin: '0 0 12px' }}>
                            How CareConnect works
                        </h2>
                        <p style={{ fontSize: 15, color: '#6B7280', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>Three steps to get started on CareConnect.</p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 32, maxWidth: 900, margin: '0 auto 48px' }}>
                        {[
                            { step: '01', icon: '👤', title: 'Choose your healthcare role', desc: 'Doctor, clinic, hospital, lab, pharmacy or patient — select the right experience for you.' },
                            { step: '02', icon: '⚙️', title: 'Set up your workspace', desc: 'Create your account, complete your profile or organisation setup, and configure your workflows.' },
                            { step: '03', icon: '🔗', title: 'Start connected care', desc: 'Manage your healthcare workflows through CareConnect and connect with every stakeholder in one platform.' },
                        ].map(item => (
                            <motion.div key={item.step} variants={fadeUp} style={{ textAlign: 'center', padding: '32px 24px', background: '#F8FAFF', border: '1px solid #E8EEF8', borderRadius: 20 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.12em', marginBottom: 14, textTransform: 'uppercase' }}>{item.step}</div>
                                <div style={{ fontSize: 40, marginBottom: 16 }}>{item.icon}</div>
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 10px' }}>{item.title}</h3>
                                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                    <div style={{ textAlign: 'center' }}>
                        <Link href="/join" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#2563EB,#0D9488)', color: '#fff', padding: '13px 32px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 3px 16px rgba(37,99,235,.35)' }}>
                            Get Started <ArrowRight style={{ width: 16, height: 16 }} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ══════════ SECURITY ══════════ */}
            <section style={{ background: '#F8FAFF', padding: 'clamp(64px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 900, color: '#0A1F44', letterSpacing: '-0.025em', margin: '0 0 16px' }}>
                            Healthcare data deserves<br />serious protection.
                        </h2>
                        <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
                            CareConnect is built with security and privacy as a first principle — not an afterthought.
                        </p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16, marginBottom: 48 }}>
                        {[
                            { icon: Users,      color: '#1D4ED8', bg: '#EFF6FF', title: 'Role-Based Access',        desc: 'Every user role has carefully scoped permissions. Doctors see their patients; staff see their clinic; nothing bleeds across.' },
                            { icon: ShieldCheck, color: '#0369A1', bg: '#F0F9FF', title: 'Authentication',           desc: 'Secure authentication with session management and access controls at every API endpoint.' },
                            { icon: Lock,       color: '#7C3AED', bg: '#F5F3FF', title: 'Organisation Isolation',   desc: 'Each clinic, hospital and lab is completely isolated — one organisation cannot access another\'s data.' },
                            { icon: FileText,   color: '#0F766E', bg: '#F0FDFA', title: 'Controlled File Access',   desc: 'Medical documents and health records are access-controlled and never publicly accessible.' },
                            { icon: Database,   color: '#B45309', bg: '#FFFBEB', title: 'Audit Logging',            desc: 'Every sensitive action is logged with a traceable audit trail for accountability and compliance review.' },
                            { icon: Shield,     color: '#DC2626', bg: '#FEF2F2', title: 'Encrypted Connections',    desc: 'All data in transit is encrypted. No patient data travels unprotected.' },
                            { icon: Globe,      color: '#059669', bg: '#F0FDF4', title: 'Privacy-First Design',     desc: 'Your health data is yours. Access is always consent-driven and transparently controlled.' },
                            { icon: Zap,        color: '#6D28D9', bg: '#F5F3FF', title: 'Secure API Architecture',  desc: 'APIs are authenticated, rate-limited and scoped — no endpoint is publicly exploitable.' },
                        ].map(item => (
                            <motion.div key={item.title} variants={fadeUp}
                                style={{ background: '#fff', border: '1px solid #E8EEF8', borderRadius: 16, padding: '22px 20px', boxShadow: '0 2px 8px rgba(10,31,68,.04)' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                                    <item.icon style={{ width: 18, height: 18, color: item.color }} />
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{item.title}</div>
                                <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{item.desc}</div>
                            </motion.div>
                        ))}
                    </motion.div>

                    <div style={{ textAlign: 'center' }}>
                        <Link href="/about" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1.5px solid #1D4ED8', color: '#1D4ED8', padding: '11px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', background: 'transparent', transition: 'all .15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                            Learn About Our Security <ArrowRight style={{ width: 14, height: 14 }} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ══════════ AUDIENCE CTA ══════════ */}
            <section style={{ background: '#0A1F44', padding: 'clamp(64px,8vw,100px) 24px' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', margin: '0 0 16px' }}>
                            Ready to connect your<br />healthcare workflow?
                        </h2>
                        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
                            Choose the experience that's right for you. Get started in minutes.
                        </p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
                        {[
                            { icon: '🩺', title: "I'm a Doctor",          desc: 'Create your professional profile and start managing patients digitally.', cta: 'Join as Doctor',       href: '/provider/register?type=DOCTOR',  color: '#2563EB', bg: 'rgba(37,99,235,.12)', border: 'rgba(37,99,235,.25)' },
                            { icon: '🏥', title: 'I run a Clinic',         desc: 'Manage your clinic from one connected platform.', cta: 'Register Clinic',      href: '/provider/register?type=CLINIC',  color: '#16A34A', bg: 'rgba(22,163,74,.12)',  border: 'rgba(22,163,74,.25)' },
                            { icon: '🏨', title: 'I represent a Hospital', desc: 'Connect your hospital operations end-to-end.', cta: 'Register Hospital',    href: '/provider/register?type=HOSPITAL', color: '#7C3AED', bg: 'rgba(124,58,237,.12)', border: 'rgba(124,58,237,.25)' },
                            { icon: '🔬', title: 'I run a Lab',            desc: 'Digitize your diagnostic workflow and reports.', cta: 'Register Lab',         href: '/provider/register?type=LAB',     color: '#EA580C', bg: 'rgba(234,88,12,.12)',  border: 'rgba(234,88,12,.25)' },
                            { icon: '💊', title: 'I run a Pharmacy',       desc: 'Connect prescriptions and dispensing to the care workflow.', cta: 'Register Pharmacy',    href: '/provider/register?type=PHARMACY', color: '#059669', bg: 'rgba(5,150,105,.12)',  border: 'rgba(5,150,105,.25)' },
                            { icon: '🙋', title: "I'm a Patient",          desc: 'Find doctors, book appointments and manage your healthcare.', cta: 'Find Healthcare',      href: '/patients',                        color: '#0284C7', bg: 'rgba(2,132,199,.12)',  border: 'rgba(2,132,199,.25)' },
                        ].map(card => (
                            <motion.div key={card.title} variants={fadeUp}
                                style={{ background: card.bg, border: `1.5px solid ${card.border}`, borderRadius: 20, padding: '24px 20px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>{card.icon}</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{card.title}</div>
                                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{card.desc}</div>
                                <Link href={card.href} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: card.color, color: '#fff', padding: '10px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                                    {card.cta} →
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ══════════ FOOTER ══════════ */}
            <footer style={{ background: '#060D1F', color: 'rgba(255,255,255,.5)', padding: '56px 24px 32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, marginBottom: 48 }}>
                        {/* Brand */}
                        <div style={{ flex: '1 1 240px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#1D4ED8,#0D9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                                        <polyline points="1,12 5,12 7,7 9,17 11,12 13,12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                        <path d="M13,12 C14,9.5 18,8 19.5,10 C21,12 20,15 17,17.5 L14,20" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                                    </svg>
                                </div>
                                <span style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                                    Care<span style={{ color: '#0D9488' }}>Connect</span>
                                </span>
                            </div>
                            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,.4)', maxWidth: 260 }}>
                                The connected healthcare platform — linking patients, doctors, clinics, hospitals, labs and pharmacies.
                            </p>
                        </div>

                        {/* Platform */}
                        <div style={{ flex: '1 1 140px' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Platform</div>
                            {[['EMR', '/doctors'], ['Clinic Management', '/clinics'], ['Hospital Management', '/hospitals'], ['Laboratory', '/labs'], ['Pharmacy', '/pharmacies'], ['Patient Care', '/patients']].map(([l, h]) => (
                                <div key={l} style={{ marginBottom: 9 }}><Link href={h} style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', textDecoration: 'none', transition: 'color .15s' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.5)')}>{l}</Link></div>
                            ))}
                        </div>

                        {/* Healthcare Professionals */}
                        <div style={{ flex: '1 1 140px' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Healthcare Professionals</div>
                            {[['Doctors', '/doctors'], ['Clinics', '/clinics'], ['Hospitals', '/hospitals'], ['Labs', '/labs'], ['Pharmacies', '/pharmacies']].map(([l, h]) => (
                                <div key={l} style={{ marginBottom: 9 }}><Link href={h} style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', textDecoration: 'none', transition: 'color .15s' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.5)')}>{l}</Link></div>
                            ))}
                        </div>

                        {/* Resources */}
                        <div style={{ flex: '1 1 140px' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Resources</div>
                            {[['Help Center', '/contact'], ['FAQs', '/contact'], ['Contact Us', '/contact']].map(([l, h]) => (
                                <div key={l} style={{ marginBottom: 9 }}><Link href={h} style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>{l}</Link></div>
                            ))}
                        </div>

                        {/* Company */}
                        <div style={{ flex: '1 1 140px' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Company</div>
                            {[['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([l, h]) => (
                                <div key={l} style={{ marginBottom: 9 }}><Link href={h} style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>{l}</Link></div>
                            ))}
                            <div style={{ marginTop: 20 }}>
                                <Link href="/join" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#2563EB,#0D9488)', color: '#fff', padding: '9px 16px', borderRadius: 9, fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>
                                    Get Started →
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 24, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.25)' }}>© 2026 CareConnect. All rights reserved.</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.2)', maxWidth: 520, lineHeight: 1.6 }}>
                            CareConnect is a healthcare platform. Information on this platform does not constitute medical advice. Always consult a qualified healthcare professional.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════ */

function HeroEcosystem() {
    const nodes = [
        { label: 'Patients',   icon: '🙋', x: '50%',  y: '0',   color: '#3B82F6' },
        { label: 'Doctors',    icon: '🩺', x: '90%',  y: '25%', color: '#0D9488' },
        { label: 'Clinics',    icon: '🏥', x: '88%',  y: '72%', color: '#16A34A' },
        { label: 'Hospitals',  icon: '🏨', x: '50%',  y: '95%', color: '#7C3AED' },
        { label: 'Labs',       icon: '🔬', x: '12%',  y: '72%', color: '#EA580C' },
        { label: 'Pharmacies', icon: '💊', x: '10%',  y: '25%', color: '#059669' },
    ];

    return (
        <div style={{ width: '100%', maxWidth: 680, margin: '0 auto', position: 'relative', height: 260 }}>
            {/* Connection lines SVG */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }} viewBox="0 0 680 260">
                {nodes.map((n, i) => {
                    const cx = parseFloat(n.x) / 100 * 680;
                    const cy = parseFloat(n.y) / 100 * 260;
                    return (
                        <line key={i} x1={340} y1={130} x2={cx} y2={cy}
                            stroke={`${n.color}55`} strokeWidth="1.5"
                            strokeDasharray="6 4"
                            style={{ animation: `cc-dash 1.${i}s ease-out forwards` }}
                        />
                    );
                })}
                {/* Center hub */}
                <circle cx={340} cy={130} r={48} fill="url(#hubGrad)" opacity={0.95} />
                <defs>
                    <radialGradient id="hubGrad" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="#1D4ED8" />
                        <stop offset="100%" stopColor="#0D9488" />
                    </radialGradient>
                </defs>
            </svg>

            {/* Center label */}
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', zIndex: 2 }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" style={{ margin: '0 auto 4px', display: 'block' }}>
                    <polyline points="1,12 5,12 7,7 9,17 11,12 13,12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <path d="M13,12 C14,9.5 18,8 19.5,10 C21,12 20,15 17,17.5 L14,20" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>CareConnect</span>
            </div>

            {/* Satellite nodes */}
            {nodes.map((n) => (
                <div key={n.label} style={{
                    position: 'absolute',
                    left: n.x, top: n.y,
                    transform: 'translate(-50%,-50%)',
                    textAlign: 'center', zIndex: 3,
                }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${n.color}22`, border: `1.5px solid ${n.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 4px', backdropFilter: 'blur(8px)' }}>
                        {n.icon}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>{n.label}</div>
                </div>
            ))}
        </div>
    );
}

function EcosystemDiagram() {
    const nodes = [
        { label: 'Patients',   icon: '🙋', x: 50,  y: 0,   color: '#2563EB', desc: 'Find care, book appointments, manage records' },
        { label: 'Doctors',    icon: '🩺', x: 90,  y: 28,  color: '#0D9488', desc: 'EMR, consultations, prescriptions' },
        { label: 'Clinics',    icon: '🏥', x: 88,  y: 74,  color: '#16A34A', desc: 'Full clinic operations platform' },
        { label: 'Hospitals',  icon: '🏨', x: 50,  y: 95,  color: '#7C3AED', desc: 'Enterprise hospital management' },
        { label: 'Labs',       icon: '🔬', x: 12,  y: 74,  color: '#EA580C', desc: 'Diagnostic workflow and reports' },
        { label: 'Pharmacies', icon: '💊', x: 10,  y: 28,  color: '#059669', desc: 'Prescription and dispensing' },
    ];

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: 700, margin: '0 auto', height: 500 }}>
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }} viewBox="0 0 700 500">
                <defs>
                    <radialGradient id="centerGrad" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#0D9488" />
                    </radialGradient>
                    <filter id="shadow">
                        <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15" />
                    </filter>
                </defs>
                {nodes.map((n, i) => {
                    const cx = n.x / 100 * 700;
                    const cy = n.y / 100 * 500;
                    return (
                        <line key={i} x1={350} y1={250} x2={cx} y2={cy}
                            stroke={n.color} strokeWidth="1.5" strokeOpacity="0.3"
                            strokeDasharray="8 5" />
                    );
                })}
                <circle cx={350} cy={250} r={64} fill="url(#centerGrad)" filter="url(#shadow)" />
            </svg>

            {/* Center hub */}
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', zIndex: 4 }}>
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" style={{ margin: '0 auto 6px', display: 'block' }}>
                    <polyline points="1,12 5,12 7,7 9,17 11,12 13,12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <path d="M13,12 C14,9.5 18,8 19.5,10 C21,12 20,15 17,17.5 L14,20" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block' }}>CareConnect</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>Connected Platform</span>
            </div>

            {/* Satellite nodes */}
            {nodes.map(n => (
                <div key={n.label} style={{
                    position: 'absolute',
                    left: `${n.x}%`, top: `${n.y}%`,
                    transform: 'translate(-50%,-50%)',
                    textAlign: 'center', zIndex: 5,
                }}>
                    <div style={{ width: 64, height: 64, borderRadius: 18, background: '#fff', border: `2px solid ${n.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 8px', boxShadow: `0 4px 20px ${n.color}20` }}>
                        {n.icon}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 2 }}>{n.label}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', maxWidth: 120, lineHeight: 1.4 }}>{n.desc}</div>
                </div>
            ))}
        </div>
    );
}

function DoctorDashboardMockup() {
    return (
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(10,31,68,.12)', border: '1px solid #E8EEF8', overflow: 'hidden' }}>
            {/* Browser chrome */}
            <div style={{ background: '#F8FAFF', borderBottom: '1px solid #E8EEF8', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FC5F57' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2DC840' }} />
                <div style={{ flex: 1, background: '#E8EEF8', borderRadius: 6, height: 22, marginLeft: 8, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>careconnect.care/doctor/workspace</span>
                </div>
            </div>

            {/* App layout */}
            <div style={{ display: 'flex', height: 340 }}>
                {/* Sidebar */}
                <div style={{ width: 52, background: '#0A1F44', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0', gap: 14 }}>
                    {['🏠', '📋', '📅', '🔬', '💊', '📊'].map((icon, i) => (
                        <div key={i} style={{ width: 34, height: 34, borderRadius: 9, background: i === 1 ? 'rgba(37,99,235,.6)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                            {icon}
                        </div>
                    ))}
                </div>

                {/* Patient list */}
                <div style={{ width: 150, borderRight: '1px solid #E8EEF8', padding: '12px 0', overflow: 'hidden' }}>
                    <div style={{ padding: '0 10px 8px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Today's Queue</div>
                    {[
                        { name: 'Rajan M.', time: '9:00', type: 'Follow-up', active: false },
                        { name: 'Priya S.', time: '10:00', type: 'New', active: true },
                        { name: 'Anwar K.', time: '11:00', type: 'Consult', active: false },
                        { name: 'Meena R.', time: '2:30', type: 'Review', active: false },
                    ].map((p, i) => (
                        <div key={i} style={{ padding: '8px 10px', background: p.active ? '#EFF6FF' : 'transparent', borderLeft: p.active ? '3px solid #2563EB' : '3px solid transparent' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{p.name}</div>
                            <div style={{ fontSize: 10, color: '#9CA3AF' }}>{p.time} · {p.type}</div>
                        </div>
                    ))}
                </div>

                {/* Main content */}
                <div style={{ flex: 1, padding: '14px 16px', overflow: 'hidden' }}>
                    {/* Patient header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #F3F4F6' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#0D9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>P</div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Priya Sharma</div>
                            <div style={{ fontSize: 10, color: '#6B7280' }}>32F · Hypertension · Last visit: 3 months ago</div>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                            <div style={{ background: '#EFF6FF', color: '#2563EB', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>History</div>
                            <div style={{ background: '#F0FDF4', color: '#16A34A', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>Vitals</div>
                        </div>
                    </div>

                    {/* Consultation notes */}
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Chief Complaint</div>
                        <div style={{ fontSize: 12, color: '#374151', background: '#F8FAFF', borderRadius: 8, padding: '8px 10px', lineHeight: 1.6 }}>
                            Persistent headache for 3 days, mild fatigue, no fever.
                        </div>
                    </div>

                    {/* Vitals grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                        {[
                            { l: 'BP', v: '138/88', u: 'mmHg', c: '#DC2626' },
                            { l: 'HR', v: '76', u: 'bpm', c: '#2563EB' },
                            { l: 'SpO₂', v: '98%', u: '', c: '#059669' },
                            { l: 'Temp', v: '98.4', u: '°F', c: '#B45309' },
                        ].map(v => (
                            <div key={v.l} style={{ background: '#F8FAFF', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                                <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>{v.l}</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: v.c }}>{v.v}</div>
                                <div style={{ fontSize: 8, color: '#9CA3AF' }}>{v.u}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ClinicWorkflowMockup() {
    const steps = [
        { label: 'Registration', done: true },
        { label: 'Appointment', done: true },
        { label: 'Reception', done: true },
        { label: 'Queue', active: true },
        { label: 'Consultation', done: false },
        { label: 'Prescription', done: false },
        { label: 'Follow-up', done: false },
    ];

    return (
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(10,31,68,.10)', border: '1px solid #E8EEF8', padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 20 }}>Clinic Workflow — Today</div>

            {/* Progress */}
            <div style={{ marginBottom: 24 }}>
                {steps.map((s, i) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{
                            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                            background: s.done ? '#16A34A' : (s.active ? '#2563EB' : '#F3F4F6'),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, color: s.done || s.active ? '#fff' : '#9CA3AF', fontWeight: 700,
                        }}>{s.done ? '✓' : i + 1}</div>
                        {i < steps.length - 1 && (
                            <div style={{ position: 'absolute', left: 12, marginTop: 24, width: 2, height: 10, background: s.done ? '#16A34A' : '#F3F4F6' }} />
                        )}
                        <span style={{ fontSize: 13, fontWeight: s.active ? 700 : 500, color: s.done ? '#374151' : (s.active ? '#2563EB' : '#9CA3AF') }}>
                            {s.label}
                        </span>
                        {s.active && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#fff', background: '#2563EB', padding: '2px 8px', borderRadius: 6 }}>Active</span>}
                    </div>
                ))}
            </div>

            {/* Queue stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                    { n: '12', l: 'Booked',    c: '#EFF6FF', t: '#2563EB' },
                    { n: '4',  l: 'Waiting',   c: '#FFF7ED', t: '#C2410C' },
                    { n: '7',  l: 'Completed', c: '#F0FDF4', t: '#16A34A' },
                ].map(s => (
                    <div key={s.l} style={{ background: s.c, borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: s.t }}>{s.n}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', marginTop: 2 }}>{s.l}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PatientAppMockup() {
    return (
        <div style={{ width: 260, margin: '0 auto', background: '#111827', borderRadius: 36, padding: '12px 8px', boxShadow: '0 32px 80px rgba(0,0,0,.3)' }}>
            <div style={{ background: '#fff', borderRadius: 28, overflow: 'hidden', height: 520 }}>
                {/* Status bar */}
                <div style={{ background: '#0A1F44', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
                    <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>9:41</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <span style={{ fontSize: 10, color: '#fff' }}>●●● WiFi</span>
                    </div>
                </div>

                {/* App header */}
                <div style={{ background: 'linear-gradient(135deg,#1D4ED8,#0D9488)', padding: '16px 16px 24px' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginBottom: 4 }}>Good morning</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Ravi Kumar</div>
                    <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13 }}>🔍</span>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>Find doctors, labs, hospitals...</span>
                    </div>
                </div>

                {/* Upcoming */}
                <div style={{ padding: '14px 14px 0', marginTop: -10 }}>
                    <div style={{ background: '#fff', borderRadius: 14, padding: '12px', boxShadow: '0 4px 20px rgba(10,31,68,.12)', marginBottom: 14 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Upcoming Appointment</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🩺</div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>Dr. Anand Kumar</div>
                                <div style={{ fontSize: 10, color: '#6B7280' }}>Cardiologist · Tomorrow 11:30 AM</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                        {[
                            { icon: '📋', label: 'My Records',   bg: '#EFF6FF' },
                            { icon: '🔬', label: 'Lab Reports',  bg: '#F0FDF4' },
                            { icon: '💊', label: 'Prescriptions', bg: '#FFF7ED' },
                            { icon: '📅', label: 'Appointments', bg: '#F5F3FF' },
                        ].map(a => (
                            <div key={a.label} style={{ background: a.bg, borderRadius: 12, padding: '12px 10px', display: 'flex', alignItems: 'center', gap: 7 }}>
                                <span style={{ fontSize: 16 }}>{a.icon}</span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{a.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Lab result */}
                    <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18 }}>✅</span>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>CBC Report Ready</div>
                            <div style={{ fontSize: 10, color: '#6B7280' }}>All values within normal range</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function JourneyTimeline() {
    return (
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 720, padding: '8px 0' }}>
                {JOURNEY.map((step, i) => (
                    <React.Fragment key={step.label}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', minWidth: 80 }}>
                            <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${step.color}22`, border: `2px solid ${step.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 10 }}>
                                {step.icon}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'center' }}>{step.label}</div>
                        </div>
                        {i < JOURNEY.length - 1 && (
                            <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg,${step.color}50,${JOURNEY[i + 1].color}50)`, minWidth: 20, marginBottom: 22 }} />
                        )}
                    </React.Fragment>
                ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,.4)', marginTop: 16, fontStyle: 'italic' }}>
                One record. Every step. Authorized access across the entire care journey.
            </p>
        </div>
    );
}
