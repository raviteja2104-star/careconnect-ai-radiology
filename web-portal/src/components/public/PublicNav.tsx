'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const PROVIDER_LINKS = [
    { href: '/doctors',    label: 'For Doctors',    icon: '🩺', desc: 'Join as an independent practitioner' },
    { href: '/clinics',    label: 'For Clinics',    icon: '🏥', desc: 'Multi-specialty clinic management' },
    { href: '/hospitals',  label: 'For Hospitals',  icon: '🏨', desc: 'Enterprise hospital operations' },
    { href: '/labs',       label: 'For Labs',       icon: '🔬', desc: 'Diagnostic lab & pathology' },
    { href: '/pharmacies', label: 'For Pharmacies', icon: '💊', desc: 'Retail & online pharmacy' },
];

export function PublicNav() {
    const [menuOpen, setMenuOpen]         = useState(false);
    const [providersOpen, setProvidersOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setProvidersOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <>
        <style>{`
            @keyframes cc-nav-pulse{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.35)}60%{box-shadow:0 0 0 8px rgba(37,99,235,0)}}
        `}</style>
        <header style={{
            position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(12px)', borderBottom: '1px solid #E8EEF8',
            boxShadow: '0 1px 4px rgba(10,31,68,.05)',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>

                {/* Logo */}
                <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#1D4ED8 0%,#0D9488 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'cc-nav-pulse 2.8s ease-out infinite', boxShadow: '0 2px 10px rgba(37,99,235,.3)' }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                            {/* Heartbeat pulse line */}
                            <polyline points="1,12 5,12 7,7 9,17 11,12 13,12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            {/* Heart right side */}
                            <path d="M13,12 C14,9.5 18,8 19.5,10 C21,12 20,15 17,17.5 L14,20" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                        </svg>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.025em', color: '#0A1F44', fontFamily: 'Inter, system-ui, sans-serif' }}>
                        Care<span style={{ background: 'linear-gradient(90deg,#1D4ED8,#0D9488)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Connect</span>
                    </span>
                </Link>

                {/* Desktop nav */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, fontFamily: 'Inter, system-ui, sans-serif' }} className="public-nav-desktop">
                    <Link href="/patients" style={navLink()}>For Patients</Link>

                    {/* Providers dropdown */}
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setProvidersOpen(v => !v)}
                            style={{ ...navLink(), background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                            For Providers
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginTop: 1, transition: 'transform .2s', transform: providersOpen ? 'rotate(180deg)' : 'none' }}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                        {providersOpen && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)',
                                background: '#fff', border: '1px solid #E8EEF8', borderRadius: 16,
                                boxShadow: '0 8px 40px rgba(10,31,68,.13)', padding: 8, width: 260, zIndex: 100,
                            }}>
                                {PROVIDER_LINKS.map(l => (
                                    <Link key={l.href} href={l.href}
                                        onClick={() => setProvidersOpen(false)}
                                        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', transition: 'background .15s' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#F0F4FF')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.2 }}>{l.icon}</span>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{l.label}</div>
                                            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{l.desc}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link href="/about" style={navLink()}>About</Link>
                    <Link href="/contact" style={navLink()}>Contact</Link>
                </nav>

                {/* CTAs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none', padding: '8px 14px', borderRadius: 8, transition: 'background .15s', fontFamily: 'Inter, system-ui, sans-serif' }}
                        className="public-nav-signin">
                        Sign In
                    </Link>
                    <Link href="/join" style={{
                        fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none',
                        padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#2563EB,#0D9488)',
                        boxShadow: '0 2px 8px rgba(37,99,235,.35)', transition: 'opacity .15s',
                        fontFamily: 'Inter, system-ui, sans-serif',
                    }}>
                        Get Started
                    </Link>

                    {/* Hamburger */}
                    <button onClick={() => setMenuOpen(v => !v)} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', borderRadius: 8, color: '#374151', display: 'none' }} className="public-nav-hamburger" aria-label="Menu">
                        {menuOpen
                            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                        }
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div style={{ borderTop: '1px solid #E8EEF8', background: '#fff', padding: '12px 24px 20px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
                        {[
                            { href: '/patients', label: 'For Patients' },
                            ...PROVIDER_LINKS.map(l => ({ href: l.href, label: l.label })),
                            { href: '/about', label: 'About' },
                            { href: '/contact', label: 'Contact' },
                        ].map(l => (
                            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                                style={{ fontSize: 14, color: '#374151', fontWeight: 600, padding: '10px 0', textDecoration: 'none', borderBottom: '1px solid #F3F4F6', display: 'block' }}>
                                {l.label}
                            </Link>
                        ))}
                    </nav>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Link href="/login" style={{ flex: 1, textAlign: 'center', padding: '11px 0', borderRadius: 10, border: '1.5px solid #E5E7EB', color: '#374151', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
                        <Link href="/join" style={{ flex: 1, textAlign: 'center', padding: '11px 0', borderRadius: 10, background: 'linear-gradient(135deg,#2563EB,#0D9488)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Get Started</Link>
                    </div>
                </div>
            )}

            <style>{`
                @media (max-width: 768px) {
                    .public-nav-desktop { display: none !important; }
                    .public-nav-signin { display: none !important; }
                    .public-nav-hamburger { display: flex !important; }
                }
            `}</style>
        </header>
        </>
    );
}

function navLink(): React.CSSProperties {
    return {
        fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none',
        padding: '8px 12px', borderRadius: 8, transition: 'color .15s, background .15s',
        whiteSpace: 'nowrap',
    };
}
