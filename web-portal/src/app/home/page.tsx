'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/providers/SessionProvider';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HeartPulse, Search, MapPin, Stethoscope, FlaskConical, Building2,
    Pill, Activity, Microscope, Ambulance, Video, Shield, ArrowRight,
    ChevronRight, CheckCircle, Users, FileText, Calendar, Sparkles,
    Star, Heart, Brain, Eye, Baby, Bone, Zap, Menu, X, Globe,
    ShieldCheck, Clock, BadgeCheck, BarChart3, Home as HomeIcon,
} from 'lucide-react';

/* ─── types ──────────────────────────────────────────────────────────── */
type SearchCategory = 'doctor' | 'lab' | 'hospital' | 'checkup' | 'pharmacy' | 'diagnostics';

/* ─── data ───────────────────────────────────────────────────────────── */
const SEARCH_TABS: { id: SearchCategory; label: string; icon: React.ElementType }[] = [
    { id: 'doctor',      label: 'Find a Doctor',    icon: Stethoscope  },
    { id: 'lab',         label: 'Lab Tests',         icon: FlaskConical },
    { id: 'hospital',    label: 'Hospitals',         icon: Building2    },
    { id: 'checkup',     label: 'Health Checkup',    icon: Activity     },
    { id: 'pharmacy',    label: 'Pharmacy',          icon: Pill         },
    { id: 'diagnostics', label: 'Diagnostics',       icon: Microscope   },
];

const SEARCH_PLACEHOLDERS: Record<SearchCategory, string> = {
    doctor:      'Search by doctor name, specialty or condition',
    lab:         'Search by test name, package or health concern',
    hospital:    'Search by hospital name, specialty or location',
    checkup:     'Search by package name or health concern',
    pharmacy:    'Search by pharmacy name or medication',
    diagnostics: 'Search by investigation name or centre',
};

const POPULAR_SEARCHES = ['Cardiologist', 'Full body checkup', 'CBC test', 'Dentist', 'Diabetologist'];

const SERVICES = [
    {
        icon: Stethoscope, title: 'Doctors',
        desc: 'Find specialists by specialty, location, experience, availability and consultation type.',
        color: 'bg-blue-50 text-blue-600', badge: '3,500+ Doctors',
        href: '/nearby/search?type=doctor',
    },
    {
        icon: FlaskConical, title: 'Lab Tests',
        desc: 'Search and book diagnostic tests, health packages and preventive checkups.',
        color: 'bg-violet-50 text-violet-600', badge: '2,000+ Tests',
        href: '/nearby/search?type=lab',
    },
    {
        icon: Building2, title: 'Hospitals',
        desc: 'Discover hospitals, specialties, departments and available services near you.',
        color: 'bg-teal-50 text-teal-600', badge: '500+ Hospitals',
        href: '/nearby/search?type=hospital',
    },
    {
        icon: Pill, title: 'Pharmacies',
        desc: 'Find pharmacies and healthcare products and services in your area.',
        color: 'bg-emerald-50 text-emerald-600', badge: '1,200+ Listed',
        href: '/nearby/search?type=pharmacy',
    },
    {
        icon: Activity, title: 'Health Checkups',
        desc: 'Discover preventive health packages and wellness checkups tailored to your needs.',
        color: 'bg-amber-50 text-amber-600', badge: '150+ Packages',
        href: '/nearby/search?type=lab&category=checkup',
    },
    {
        icon: Microscope, title: 'Diagnostics',
        desc: 'Find diagnostic centres and available investigations near you.',
        color: 'bg-rose-50 text-rose-600', badge: '300+ Centres',
        href: '/nearby/search?type=diagnostic',
    },
    {
        icon: Ambulance, title: 'Emergency Care',
        desc: 'Pathways to urgent and emergency healthcare services when you need them most.',
        color: 'bg-red-50 text-red-600', badge: '24/7 Available',
        href: '/emergency',
    },
    {
        icon: Video, title: 'Online Consultation',
        desc: 'Connect with healthcare professionals for virtual consultations from anywhere.',
        color: 'bg-indigo-50 text-indigo-600', badge: 'Consult Now',
        href: '/telemedicine',
    },
];

const SPECIALTIES = [
    { name: 'Cardiology',       icon: Heart,       color: 'text-rose-500'    },
    { name: 'Neurology',        icon: Brain,       color: 'text-violet-500'  },
    { name: 'Orthopedics',      icon: Bone,        color: 'text-amber-500'   },
    { name: 'Pediatrics',       icon: Baby,        color: 'text-blue-500'    },
    { name: 'Ophthalmology',    icon: Eye,         color: 'text-teal-500'    },
    { name: 'Dermatology',      icon: Sparkles,    color: 'text-pink-500'    },
    { name: 'ENT',              icon: Activity,    color: 'text-orange-500'  },
    { name: 'Gynecology',       icon: Heart,       color: 'text-rose-400'    },
    { name: 'General Medicine', icon: Stethoscope, color: 'text-blue-600'    },
    { name: 'Dentistry',        icon: ShieldCheck, color: 'text-cyan-500'    },
    { name: 'Psychiatry',       icon: Brain,       color: 'text-purple-500'  },
    { name: 'Oncology',         icon: Zap,         color: 'text-emerald-600' },
];

const LAB_CATEGORIES = [
    'Blood Tests', 'Diabetes Panel', 'Thyroid Function', 'Liver Function',
    'Kidney Function', 'Vitamins & Minerals', 'Hormonal Tests', 'Cardiac Risk',
    'Infectious Disease', 'Full Body Checkup',
];

const HOW_IT_WORKS = [
    { step: '01', icon: Search,   title: 'Search',  desc: 'Find the healthcare service you need — doctor, lab test, hospital, or pharmacy.' },
    { step: '02', icon: Star,     title: 'Compare', desc: 'Compare providers by rating, location, price, availability and patient reviews.' },
    { step: '03', icon: Calendar, title: 'Book',    desc: 'Select your date, time and preferred location. Confirm instantly.' },
    { step: '04', icon: FileText, title: 'Manage',  desc: 'Track appointments, results and health records — all in one place.' },
];

const STATS = [
    { value: '3,500+', label: 'Verified Doctors'   },
    { value: '500+',   label: 'Hospitals & Clinics' },
    { value: '2,000+', label: 'Lab Tests'           },
    { value: '50,000+',label: 'Patients Served'     },
];

const FAMILY_MEMBERS = [
    { name: 'You',           relation: 'Myself',  apt: 'Cardiology · Upcoming appointment',        color: 'bg-blue-500'   },
    { name: 'Spouse',        relation: 'Spouse',  apt: 'CBC Lab Test · Home Collection',            color: 'bg-violet-500' },
    { name: 'Father',        relation: 'Father',  apt: 'Diabetes Follow-up · This Week',           color: 'bg-teal-500'   },
    { name: 'Mother',        relation: 'Mother',  apt: 'Ophthalmology Consult · Next Week',        color: 'bg-rose-500'   },
];

/* ─── animation helpers ──────────────────────────────────────────────── */
const fadeUp = {
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
    visible: { transition: { staggerChildren: 0.07 } },
};

/* ─── component ──────────────────────────────────────────────────────── */
export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated } = useSession();
    const ctaHref  = isAuthenticated ? '/nearby' : '/login';
    const joinHref = isAuthenticated ? '/nearby' : '/join';
    const [activeTab, setActiveTab]       = useState<SearchCategory>('doctor');
    const [searchQuery, setSearchQuery]   = useState('');
    const [location, setLocation]         = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const p = new URLSearchParams();
        if (searchQuery) p.set('q', searchQuery);
        if (location)    p.set('location', location);
        p.set('type', activeTab);
        router.push(`/nearby/search?${p.toString()}`);
    };

    return (
        <div className="min-h-screen bg-white antialiased">

            {/* ══════════════════════════════ NAVBAR ══════════════════════════════ */}
            <header className="sticky top-0 z-50 bg-white/96 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between gap-4">

                        {/* Logo */}
                        <Link href="/home" className="flex items-center gap-2.5 shrink-0" style={{ textDecoration: 'none' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#1D4ED8 0%,#0D9488 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(37,99,235,.3)', flexShrink: 0 }}>
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
                        <nav className="hidden lg:flex items-center gap-7">
                            <Link href="/patients"   className="text-sm text-gray-600 hover:text-blue-600 transition-colors">For Patients</Link>
                            <a href="#for-providers" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">For Providers</a>
                            <Link href="/about"      className="text-sm text-gray-600 hover:text-blue-600 transition-colors">About</Link>
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <Link href={ctaHref}
                                className="hidden sm:inline-flex text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50">
                                {isAuthenticated ? 'My Health' : 'Sign In'}
                            </Link>
                            <Link href={joinHref}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all">
                                Get Started <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            <button className="lg:hidden p-1.5 text-gray-500 rounded-lg hover:bg-gray-100"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
                                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden overflow-hidden border-t border-gray-100 bg-white px-4 py-4">
                            <nav className="flex flex-col gap-1 mb-4">
                                {[
                                    ['/patients', 'For Patients'],
                                    ['#for-providers', 'For Providers'],
                                    ['/doctors', 'Doctors'],
                                    ['/clinics', 'Clinics'],
                                    ['/hospitals', 'Hospitals'],
                                    ['/labs', 'Labs'],
                                    ['/pharmacies', 'Pharmacies'],
                                    ['/about', 'About'],
                                ].map(([href, label]) => (
                                    <Link key={href} href={href}
                                        className="text-sm text-gray-700 px-3 py-2.5 rounded-lg hover:bg-gray-50 block"
                                        onClick={() => setMobileMenuOpen(false)}>
                                        {label}
                                    </Link>
                                ))}
                            </nav>
                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                                <Link href={ctaHref} className="flex-1 text-center rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">{isAuthenticated ? 'My Health' : 'Sign In'}</Link>
                                <Link href={joinHref} className="flex-1 text-center rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Get Started</Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* ══════════════════════════════ HERO ════════════════════════════════ */}
            <style>{`
                @keyframes cc-hp-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-13px)}}
                @keyframes cc-hp-float2{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
                @keyframes cc-hp-ecg{from{stroke-dashoffset:700}to{stroke-dashoffset:0}}
                @keyframes cc-hp-blink{0%,100%{opacity:1}50%{opacity:.2}}
                @keyframes cc-hp-pulse{0%,100%{box-shadow:0 0 0 0 rgba(94,234,212,.45)}65%{box-shadow:0 0 0 12px rgba(94,234,212,0)}}
                @media(max-width:1023px){.cc-hp-vis{display:none!important}}
            `}</style>
            <section className="relative overflow-hidden" style={{
                background: 'linear-gradient(140deg, #1E3A8A 0%, #1D4ED8 35%, #0F766E 75%, #0D9488 100%)',
            }}>
                <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">

                    {/* ── 2-column top ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 48, marginBottom: 48, flexWrap: 'wrap' }}>

                        {/* Left: text + CTAs */}
                        <div style={{ flex: '1 1 400px' }}>
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}>
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm mb-7">
                                    <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                                    Your connected healthcare companion
                                </div>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.08 }}>
                                <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl leading-[1.05] mb-5">
                                    Your Healthcare,<br />
                                    <span style={{ color: '#5EEAD4' }}>Connected.</span>
                                </h1>
                                <p className="text-lg text-blue-100/85 leading-relaxed mb-8 max-w-lg">
                                    Find doctors, book lab tests, manage health records, and consult virtually — one platform for your entire healthcare journey.
                                </p>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <Link href={joinHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1D4ED8', padding: '14px 28px', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>
                                        Get Started Free →
                                    </Link>
                                    <Link href="/join" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.14)', color: '#fff', padding: '14px 24px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,.28)' }}>
                                        For Healthcare Providers
                                    </Link>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right: animated healthcare card */}
                        <div className="cc-hp-vis" style={{ flex: '0 0 420px', position: 'relative', height: 380 }}>

                            {/* Appointment confirmation card */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(255,255,255,.11)', backdropFilter: 'blur(24px)', borderRadius: 24, padding: '22px 22px 18px', border: '1px solid rgba(255,255,255,.22)', boxShadow: '0 20px 60px rgba(0,0,0,.28)', animation: 'cc-hp-float 5s ease-in-out infinite' }}>

                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#4ADE80,#0D9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, animation: 'cc-hp-pulse 2.8s ease-out infinite' }}>✓</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#4ADE80', fontWeight: 700, fontSize: 13 }}>Booking Confirmed</div>
                                        <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 11 }}>CareConnect · Ref #CC-20847</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', animation: 'cc-hp-blink 1.6s ease-in-out infinite' }} />
                                        <span style={{ fontSize: 10, color: '#4ADE80', fontWeight: 700 }}>LIVE</span>
                                    </div>
                                </div>

                                {/* Doctor card */}
                                <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#1D4ED8,#5EEAD4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🩺</div>
                                        <div>
                                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Dr. Anand Kumar</div>
                                            <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 12 }}>Cardiologist · AIIMS</div>
                                        </div>
                                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                            <div style={{ color: '#5EEAD4', fontWeight: 700, fontSize: 13 }}>Tomorrow</div>
                                            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 11 }}>11:30 AM</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mini ECG */}
                                <div style={{ background: 'rgba(0,0,0,.22)', borderRadius: 12, padding: '8px 12px', marginBottom: 14 }}>
                                    <svg viewBox="0 0 340 36" width="100%" height="36">
                                        <polyline
                                            points="0,18 25,18 32,5 38,31 44,8 50,18 75,18 82,5 88,31 94,8 100,18 125,18 132,5 138,31 144,8 150,18 175,18 182,5 188,31 194,8 200,18 225,18 232,5 238,31 244,8 250,18 340,18"
                                            stroke="#5EEAD4" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
                                            strokeDasharray="700"
                                            style={{ animation: 'cc-hp-ecg 2.2s linear infinite' }}
                                        />
                                    </svg>
                                </div>

                                {/* Quick stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                    {[
                                        { lbl: 'Heart Rate', val: '72 bpm', e: '❤️' },
                                        { lbl: 'SpO₂', val: '98%', e: '💨' },
                                        { lbl: 'BP', val: '120/80', e: '🩸' },
                                    ].map(v => (
                                        <div key={v.lbl} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 10, padding: '8px 10px' }}>
                                            <div style={{ fontSize: 14, marginBottom: 3 }}>{v.e}</div>
                                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>{v.val}</div>
                                            <div style={{ color: 'rgba(255,255,255,.38)', fontSize: 9 }}>{v.lbl}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Lab results floating card */}
                            <div style={{ position: 'absolute', bottom: 60, left: -14, background: 'rgba(74,222,128,.14)', backdropFilter: 'blur(16px)', borderRadius: 14, padding: '12px 16px', border: '1px solid rgba(74,222,128,.3)', boxShadow: '0 8px 32px rgba(0,0,0,.2)', animation: 'cc-hp-float2 3.8s ease-in-out .8s infinite' }}>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Lab Results</div>
                                <div style={{ color: '#4ADE80', fontWeight: 800, fontSize: 14 }}>✓ All Normal</div>
                                <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 11, marginTop: 2 }}>CBC · Lipid · HbA1c</div>
                            </div>

                            {/* Records floating chip */}
                            <div style={{ position: 'absolute', bottom: 8, right: -10, background: 'rgba(255,255,255,.13)', backdropFilter: 'blur(16px)', borderRadius: 14, padding: '12px 16px', border: '1px solid rgba(255,255,255,.22)', boxShadow: '0 8px 32px rgba(0,0,0,.2)', animation: 'cc-hp-float 4.2s ease-in-out .4s infinite' }}>
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Health Records</div>
                                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>📁 12 Documents</div>
                                <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 11, marginTop: 2 }}>Encrypted & Secure</div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* ══════════════════════════════ STATS ════════════════════════════════ */}
            <section className="bg-white border-b border-gray-100">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:divide-x lg:divide-gray-100 lg:gap-0">
                        {STATS.map((s, i) => (
                            <motion.div key={s.label}
                                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
                                className="text-center lg:px-8">
                                <div className="text-2xl font-black text-blue-600 sm:text-3xl">{s.value}</div>
                                <div className="mt-1 text-xs font-medium uppercase tracking-widest text-gray-400">{s.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>


            {/* ══════════════════════════ HOW IT WORKS ═════════════════════════════ */}
            <section id="how-it-works" className="bg-white py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                        className="mx-auto mb-16 max-w-xl text-center">
                        <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">
                            Book healthcare in 4 simple steps
                        </h2>
                        <p className="mt-4 text-base text-gray-500">From search to confirmation — get the care you need, faster.</p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                        variants={stagger}
                        className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                        {HOW_IT_WORKS.map((step, i) => (
                            <motion.div key={step.step} variants={fadeUp} className="text-center">
                                <div className="relative mx-auto mb-6 inline-flex">
                                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center shadow-lg"
                                        style={{ background: 'linear-gradient(135deg, #2563EB, #0D9488)' }}>
                                        <step.icon className="h-8 w-8 text-white" />
                                    </div>
                                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-blue-600 text-[11px] font-black text-blue-600 shadow-sm">
                                        {i + 1}
                                    </span>
                                </div>
                                <h3 className="mb-2 text-lg font-bold text-gray-900">{step.title}</h3>
                                <p className="text-sm leading-relaxed text-gray-500">{step.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                        className="mt-14 text-center">
                        <Link href={ctaHref}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm">
                            Start Your Healthcare Journey <ArrowRight className="h-4 w-4" />
                        </Link>
                    </motion.div>
                </div>
            </section>





            {/* ══════════════════════ PROVIDER ECOSYSTEM ═══════════════════════════ */}
            <section id="for-providers" className="py-24"
                style={{ background: 'linear-gradient(140deg, #0F172A 0%, #1E293B 100%)' }}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                        className="mx-auto mb-14 max-w-3xl text-center">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-bold text-teal-300">
                            <Globe className="h-3.5 w-3.5" /> Powered by a Connected Healthcare Ecosystem
                        </div>
                        <h2 className="text-3xl font-black text-white sm:text-4xl">
                            Healthcare providers powering the platform
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-gray-400">
                            CareConnect connects consumers with a verified network of healthcare providers. Join the ecosystem to reach more patients and grow your practice.
                        </p>
                    </motion.div>

                    {/* Provider type icons */}
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
                        variants={stagger}
                        className="mb-12 grid grid-cols-3 gap-4 sm:grid-cols-6">
                        {[
                            { label: 'Doctors',     icon: Stethoscope },
                            { label: 'Hospitals',   icon: Building2   },
                            { label: 'Clinics',     icon: HomeIcon    },
                            { label: 'Labs',        icon: FlaskConical },
                            { label: 'Diagnostics', icon: Microscope  },
                            { label: 'Pharmacies',  icon: Pill        },
                        ].map(p => (
                            <motion.div key={p.label} variants={fadeUp}>
                                <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/6 p-5 text-center hover:bg-white/10 transition-colors">
                                    <p.icon className="h-7 w-7 text-teal-400" />
                                    <span className="text-sm font-semibold text-gray-300">{p.label}</span>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Provider feature cards */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-12">
                        {[
                            { icon: Calendar,   title: 'Appointment Management',   desc: 'Smart scheduling, real-time availability management and intelligent patient queue.' },
                            { icon: BarChart3,  title: 'Analytics & Insights',     desc: 'Track performance, patient satisfaction and growth metrics in one dashboard.' },
                            { icon: Sparkles,   title: 'AI-Powered Tools',         desc: 'Intelligent documentation, billing assistance and clinical decision support.' },
                        ].map(f => (
                            <motion.div key={f.title}
                                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                                <div className="h-full rounded-2xl border border-white/10 bg-white/6 p-6">
                                    <f.icon className="mb-4 h-6 w-6 text-teal-400" />
                                    <h3 className="mb-2 font-bold text-white">{f.title}</h3>
                                    <p className="text-sm leading-relaxed text-gray-400">{f.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                        className="text-center">
                        <Link href="/login/doctor"
                            className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-7 py-3.5 text-sm font-bold text-white hover:bg-teal-400 active:scale-[0.98] transition-all shadow-sm">
                            Join as a Provider <ArrowRight className="h-4 w-4" />
                        </Link>
                        <p className="mt-3 text-xs text-gray-600">
                            For hospitals and diagnostic centres, contact our partnerships team
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ══════════════════════════ TRUST ════════════════════════════════════ */}
            <section className="bg-white py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                        className="mx-auto mb-14 max-w-2xl text-center">
                        <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">
                            Healthcare decisions deserve trusted information
                        </h2>
                        <p className="mt-4 text-base text-gray-500">
                            We believe in transparency, human oversight and responsible AI.
                        </p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
                        variants={stagger}
                        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { icon: BadgeCheck, bg: 'bg-blue-50',   color: 'text-blue-600',   title: 'Verified Providers',    desc: 'Every healthcare provider on CareConnect is verified before listing.' },
                            { icon: ShieldCheck, bg: 'bg-teal-50',  color: 'text-teal-600',   title: 'Human Oversight',       desc: 'AI assists — humans verify. No AI output is treated as medical fact without expert review.' },
                            { icon: Shield,      bg: 'bg-violet-50', color: 'text-violet-600', title: 'Privacy-First Design',  desc: 'Your health data is yours. Encrypted, access-controlled and always consent-driven.' },
                            { icon: Clock,       bg: 'bg-amber-50',  color: 'text-amber-600',  title: 'Transparent Sources',   desc: 'We show you the source and verification status of every piece of information we display.' },
                        ].map(item => (
                            <motion.div key={item.title} variants={fadeUp}>
                                <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                    <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${item.bg}`}>
                                        <item.icon className={`h-5 w-5 ${item.color}`} />
                                    </div>
                                    <h3 className="mb-2 font-bold text-gray-900">{item.title}</h3>
                                    <p className="text-sm leading-relaxed text-gray-500">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ══════════════════════════ FINAL CTA ════════════════════════════════ */}
            <section className="py-28" style={{ background: 'linear-gradient(140deg, #1D4ED8 0%, #0F766E 60%, #0D9488 100%)' }}>
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                        <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                            Start your healthcare journey today
                        </h2>
                        <p className="mt-5 text-lg leading-relaxed text-blue-100/90 max-w-xl mx-auto">
                            Join thousands of patients who find, book and manage their complete healthcare journey on CareConnect.
                        </p>
                        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                            <Link href={ctaHref}
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-black text-blue-700 shadow-xl hover:bg-blue-50 active:scale-[0.98] transition-all">
                                {isAuthenticated ? 'Find Healthcare' : 'Create Free Account'} <ArrowRight className="h-5 w-5" />
                            </Link>
                            <Link href="/nearby"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/12 px-8 py-4 text-base font-bold text-white backdrop-blur-sm hover:bg-white/22 transition-all">
                                <Search className="h-5 w-5" /> Search Healthcare
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ══════════════════════════ FOOTER ═══════════════════════════════════ */}
            <footer className="bg-gray-950 py-16 text-gray-400">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-5">
                        {/* Brand */}
                        <div className="col-span-2 sm:col-span-4 lg:col-span-1">
                            <div className="mb-3 flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                                    style={{ background: 'linear-gradient(135deg, #3B82F6, #14B8A6)' }}>
                                    <HeartPulse className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-[15px] font-extrabold text-white">CareConnect</span>
                            </div>
                            <p className="text-sm leading-relaxed text-gray-500">
                                Your connected healthcare companion. Find, book and manage your entire healthcare journey in one place.
                            </p>
                        </div>

                        <div>
                            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">For Patients</p>
                            <ul className="space-y-2.5 text-sm">
                                {['Find a Doctor', 'Book Lab Tests', 'Hospitals', 'Health Checkups', 'Online Consultation', 'Emergency Care'].map(l => (
                                    <li key={l}><Link href="/nearby" className="hover:text-white transition-colors">{l}</Link></li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">For Providers</p>
                            <ul className="space-y-2.5 text-sm">
                                {['Doctor Sign In', 'Hospital Portal', 'Lab Portal', 'Provider Dashboard', 'Analytics'].map(l => (
                                    <li key={l}><Link href="/login" className="hover:text-white transition-colors">{l}</Link></li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Resources</p>
                            <ul className="space-y-2.5 text-sm">
                                {['Help Centre', 'Patient Guide', 'Provider Guide', 'Contact Us'].map(l => (
                                    <li key={l}><Link href="/support" className="hover:text-white transition-colors">{l}</Link></li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-gray-800 pt-8 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-gray-600">© {new Date().getFullYear()} CareConnect. All rights reserved.</p>
                        <p className="max-w-md text-xs leading-relaxed text-gray-700 sm:text-right">
                            CareConnect is a healthcare discovery and management platform. Information on this platform does not constitute medical advice. Always consult a qualified healthcare professional.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
