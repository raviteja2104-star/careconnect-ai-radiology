'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    { name: 'Rahul Sharma',  relation: 'Myself',  apt: 'Cardiology · Dr. Mehta · Tomorrow 10 AM',  color: 'bg-blue-500'   },
    { name: 'Priya Sharma',  relation: 'Spouse',  apt: 'CBC Lab Test · Home Collection · Today',     color: 'bg-violet-500' },
    { name: 'Arun Sharma',   relation: 'Father',  apt: 'Diabetes Checkup · Thursday',               color: 'bg-teal-500'   },
    { name: 'Meera Sharma',  relation: 'Mother',  apt: 'Ophthalmology · Dr. Nair · Next Monday',    color: 'bg-rose-500'   },
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
                        <Link href="/home" className="flex items-center gap-2.5 shrink-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl"
                                style={{ background: 'linear-gradient(135deg, #2563EB, #0D9488)' }}>
                                <HeartPulse className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-[17px] font-extrabold tracking-tight text-gray-900">
                                Care<span className="text-blue-600">Connect</span>
                            </span>
                        </Link>

                        {/* Desktop nav */}
                        <nav className="hidden lg:flex items-center gap-7">
                            <a href="#services"      className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Services</a>
                            <a href="#how-it-works"  className="text-sm text-gray-600 hover:text-blue-600 transition-colors">How It Works</a>
                            <a href="#for-providers" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">For Providers</a>
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <Link href="/login"
                                className="hidden sm:inline-flex text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50">
                                Sign In
                            </Link>
                            <Link href="/login/patient"
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
                                {['#services', '#how-it-works', '#for-providers'].map((href, i) => (
                                    <a key={href} href={href}
                                        className="text-sm text-gray-700 px-3 py-2.5 rounded-lg hover:bg-gray-50"
                                        onClick={() => setMobileMenuOpen(false)}>
                                        {['Services', 'How It Works', 'For Providers'][i]}
                                    </a>
                                ))}
                            </nav>
                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                                <Link href="/login" className="flex-1 text-center rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Sign In</Link>
                                <Link href="/login/patient" className="flex-1 text-center rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Get Started</Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* ══════════════════════════════ HERO ════════════════════════════════ */}
            <section className="relative overflow-hidden" style={{
                background: 'linear-gradient(140deg, #1E3A8A 0%, #1D4ED8 35%, #0F766E 75%, #0D9488 100%)',
                minHeight: 660,
            }}>
                {/* Dot-grid texture */}
                <div className="absolute inset-0 opacity-[0.07]" style={{
                    backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
                    backgroundSize: '28px 28px',
                }} />
                {/* Decorative glow orbs */}
                <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-teal-300/15 blur-3xl pointer-events-none" />

                <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
                    {/* Badge */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }} className="flex justify-center mb-7">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
                            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                            Your connected healthcare companion
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.08 }} className="text-center">
                        <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.05]">
                            Your Healthcare,
                            <br />
                            <span style={{ color: '#5EEAD4' }}>Connected.</span>
                        </h1>
                        <p className="mt-5 text-lg text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
                            Find. Book. Manage. Care. — Everything you need for your healthcare journey, in one place.
                        </p>
                    </motion.div>

                    {/* Search card */}
                    <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.65, delay: 0.2 }}
                        className="mx-auto mt-12 max-w-4xl">
                        <div className="rounded-2xl p-5 shadow-2xl" style={{
                            background: 'rgba(255,255,255,0.11)',
                            border: '1px solid rgba(255,255,255,0.22)',
                            backdropFilter: 'blur(16px)',
                        }}>
                            {/* Category tabs */}
                            <div className="flex flex-wrap gap-2 mb-5">
                                {SEARCH_TABS.map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                            activeTab === tab.id
                                                ? 'bg-white text-blue-700 shadow-md'
                                                : 'text-white/75 hover:text-white hover:bg-white/15'
                                        }`}>
                                        <tab.icon className="h-3.5 w-3.5" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Inputs */}
                            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text" value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder={SEARCH_PLACEHOLDERS[activeTab]}
                                        className="h-12 w-full rounded-xl bg-white pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    />
                                </div>
                                <div className="relative sm:w-52">
                                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text" value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        placeholder="City, area or pincode"
                                        className="h-12 w-full rounded-xl bg-white pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    />
                                </div>
                                <button type="submit"
                                    className="h-12 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-500 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 shrink-0">
                                    <Search className="h-4 w-4" /> Search
                                </button>
                            </form>

                            {/* Quick pills */}
                            <div className="mt-3.5 flex flex-wrap gap-2 items-center">
                                <span className="text-xs text-white/50 font-medium">Popular:</span>
                                {POPULAR_SEARCHES.map(q => (
                                    <button key={q} onClick={() => {
                                        setSearchQuery(q);
                                        router.push(`/nearby/search?q=${encodeURIComponent(q)}&type=${activeTab}`);
                                    }} className="rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs text-white/80 hover:bg-white/22 hover:text-white transition-all">
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
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

            {/* ══════════════════════════ SERVICES GRID ════════════════════════════ */}
            <section id="services" className="py-24" style={{ background: '#F8FAFF' }}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                        className="mx-auto mb-14 max-w-2xl text-center">
                        <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">
                            Everything you need for your healthcare journey
                        </h2>
                        <p className="mt-4 text-base text-gray-500 leading-relaxed">
                            From finding the right specialist to booking a home lab test — CareConnect covers every step.
                        </p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
                        variants={stagger}
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {SERVICES.map(svc => (
                            <motion.div key={svc.title} variants={fadeUp}>
                                <Link href={svc.href}
                                    className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:border-gray-200">
                                    <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${svc.color}`}>
                                        <svc.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                            <h3 className="font-bold text-gray-900">{svc.title}</h3>
                                            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                                                {svc.badge}
                                            </span>
                                        </div>
                                        <p className="text-sm leading-relaxed text-gray-500">{svc.desc}</p>
                                    </div>
                                    <div className="mt-5 flex items-center gap-0.5 text-sm font-semibold text-blue-600">
                                        Explore <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
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
                        <Link href="/login/patient"
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm">
                            Start Your Healthcare Journey <ArrowRight className="h-4 w-4" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════ DOCTOR DISCOVERY ════════════════════════════ */}
            <section className="py-24" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 100%)' }}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-14 lg:flex-row lg:items-center">
                        {/* Copy */}
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                            className="lg:w-[42%] shrink-0">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                                <Stethoscope className="h-3.5 w-3.5" /> Doctor Discovery
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">
                                Find the right specialist for you
                            </h2>
                            <p className="mt-4 text-base leading-relaxed text-gray-500">
                                Search across 3,500+ verified doctors by specialty, location, consultation type and availability. Read patient reviews and book instantly.
                            </p>
                            <ul className="mt-6 space-y-3">
                                {[
                                    'Search by specialty, name or condition',
                                    'Compare doctors by experience and reviews',
                                    'Book in-clinic or online consultations',
                                    'View real-time availability and fees',
                                ].map(f => (
                                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                                        <CheckCircle className="h-5 w-5 shrink-0 text-teal-500" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/nearby/search?type=doctor"
                                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm">
                                Find a Doctor <ArrowRight className="h-4 w-4" />
                            </Link>
                        </motion.div>

                        {/* Specialty grid */}
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
                            variants={stagger} className="flex-1 grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {SPECIALTIES.map(sp => (
                                <motion.div key={sp.name} variants={fadeUp}>
                                    <Link href={`/nearby/search?type=doctor&specialty=${encodeURIComponent(sp.name)}`}
                                        className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                                        <sp.icon className={`h-6 w-6 ${sp.color}`} />
                                        <span className="text-xs font-semibold leading-tight text-gray-700">{sp.name}</span>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════ LAB BOOKING ═════════════════════════════════ */}
            <section className="bg-white py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-14 lg:flex-row-reverse lg:items-center">
                        {/* Copy */}
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                            className="lg:w-[42%] shrink-0">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                                <FlaskConical className="h-3.5 w-3.5" /> Lab Tests & Diagnostics
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">
                                Book lab tests from the comfort of home
                            </h2>
                            <p className="mt-4 text-base leading-relaxed text-gray-500">
                                Browse 2,000+ tests across 300+ diagnostic centres. Compare prices, choose home collection or centre visit, and track your reports in real time.
                            </p>
                            <ul className="mt-6 space-y-3">
                                {[
                                    'Home blood sample collection available',
                                    'Compare labs by price and patient ratings',
                                    'Track report status in real time',
                                    'Digital reports saved to your health vault',
                                ].map(f => (
                                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                                        <CheckCircle className="h-5 w-5 shrink-0 text-violet-500" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/nearby/search?type=lab"
                                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-violet-700 transition-colors shadow-sm">
                                Browse Lab Tests <ArrowRight className="h-4 w-4" />
                            </Link>
                        </motion.div>

                        {/* Category grid */}
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
                            variants={stagger} className="flex-1 grid grid-cols-2 gap-3">
                            {LAB_CATEGORIES.map(cat => (
                                <motion.div key={cat} variants={fadeUp}>
                                    <Link href={`/nearby/search?type=lab&q=${encodeURIComponent(cat)}`}
                                        className="group flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50 p-4 transition-all hover:bg-violet-100 hover:border-violet-200">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm group-hover:shadow">
                                            <FlaskConical className="h-4 w-4 text-violet-600" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800">{cat}</span>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════ HEALTH RECORDS ══════════════════════════════ */}
            <section className="py-24" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)' }}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                        className="mx-auto mb-14 max-w-2xl text-center">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                            <FileText className="h-3.5 w-3.5" /> Health Records
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">
                            Your health records, organized and secure
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-gray-500">
                            Store prescriptions, lab reports, discharge summaries and medical documents in one secure health vault. Access them anytime, share them with your care team.
                        </p>
                    </motion.div>

                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
                        variants={stagger} className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                        {[
                            {
                                icon: Sparkles, bg: 'bg-blue-100', color: 'text-blue-600',
                                badgeText: 'AI + Human Verified', badgeBg: 'bg-blue-50 text-blue-600',
                                title: 'AI-Assisted Capture',
                                desc: 'Scan or photograph paper prescriptions and reports. Our AI extracts key information — always subject to human review before being treated as verified.',
                            },
                            {
                                icon: ShieldCheck, bg: 'bg-teal-100', color: 'text-teal-600',
                                badgeText: 'End-to-End Encrypted', badgeBg: 'bg-teal-50 text-teal-600',
                                title: 'Secure & Private',
                                desc: 'Your health records are encrypted, access-controlled and shared only with your explicit consent. You decide who sees what, and for how long.',
                            },
                            {
                                icon: Users, bg: 'bg-violet-100', color: 'text-violet-600',
                                badgeText: 'Consent-Controlled', badgeBg: 'bg-violet-50 text-violet-600',
                                title: 'Share with Providers',
                                desc: 'Grant temporary, revocable access to doctors and clinicians. Every access is logged in a full audit trail — complete transparency, always.',
                            },
                        ].map(card => (
                            <motion.div key={card.title} variants={fadeUp}>
                                <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                    <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl ${card.bg}`}>
                                        <card.icon className={`h-5 w-5 ${card.color}`} />
                                    </div>
                                    <span className={`mb-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${card.badgeBg}`}>
                                        {card.badgeText}
                                    </span>
                                    <h3 className="mb-2 font-bold text-gray-900">{card.title}</h3>
                                    <p className="text-sm leading-relaxed text-gray-500">{card.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Important info callout */}
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                        className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
                        <div className="flex items-start gap-3">
                            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                            <div>
                                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-amber-700">Important</p>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    CareConnect clearly distinguishes between <strong>user-uploaded</strong>, <strong>AI-extracted</strong>, and <strong>clinician-verified</strong> information. AI-extracted data is never presented as medically verified until reviewed by a qualified healthcare professional.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════ FAMILY HEALTH ═══════════════════════════════ */}
            <section className="bg-white py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-14 lg:flex-row lg:items-center">
                        {/* Copy */}
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                            className="lg:w-[45%] shrink-0">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                                <Users className="h-3.5 w-3.5" /> Family Health
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">
                                Manage healthcare for your entire family
                            </h2>
                            <p className="mt-4 text-base leading-relaxed text-gray-500">
                                Add family members and manage their healthcare journeys from your account. Book appointments, track health records, and coordinate care for everyone you love.
                            </p>
                            <div className="mt-7 grid grid-cols-2 gap-3">
                                {['Myself', 'Parents', 'Children', 'Spouse', 'Siblings', 'Other Members'].map(m => (
                                    <div key={m}
                                        className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-200">
                                            <Users className="h-3.5 w-3.5 text-emerald-700" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800">{m}</span>
                                    </div>
                                ))}
                            </div>
                            <Link href="/family"
                                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm">
                                Manage Family Health <ArrowRight className="h-4 w-4" />
                            </Link>
                        </motion.div>

                        {/* Family dashboard preview */}
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                            className="flex-1">
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 shadow-sm">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                                        style={{ background: 'linear-gradient(135deg, #2563EB, #0D9488)' }}>
                                        <HeartPulse className="h-4.5 w-4.5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Family Dashboard</p>
                                        <p className="text-xs text-gray-400">4 members · 3 upcoming</p>
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    {FAMILY_MEMBERS.map(m => (
                                        <div key={m.name}
                                            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
                                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${m.color}`}>
                                                <span className="text-sm font-black text-white">{m.name[0]}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-gray-900">{m.name}</p>
                                                <p className="truncate text-xs text-gray-400">{m.apt}</p>
                                            </div>
                                            <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-400">
                                                {m.relation}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
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
                            <Link href="/login/patient"
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-black text-blue-700 shadow-xl hover:bg-blue-50 active:scale-[0.98] transition-all">
                                Create Free Account <ArrowRight className="h-5 w-5" />
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
