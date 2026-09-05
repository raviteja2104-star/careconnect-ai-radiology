'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { use } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

interface Doctor {
    _id: string;
    name: string;
    type: string;
    subtype?: string;
    specialties: string[];
    locality?: string;
    city?: string;
    state?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
    rating?: number;
    reviewCount?: number;
    consultationFeeRange?: { min: number; max: number };
    careconnectVerified: boolean;
    openNow?: boolean;
    workingHours?: Array<{ day: number; open: string; close: string; is24h?: boolean }>;
    servicesOffered?: string[];
    insuranceAccepted?: string[];
    teleconsultation?: boolean;
    homeCollection?: boolean;
    photo?: string;
}

interface Slot {
    startTime: string;
    endTime: string;
    available: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [doctor, setDoctor]       = useState<Doctor | null>(null);
    const [slots, setSlots]         = useState<Slot[]>([]);
    const [loadingDoc, setLoadingDoc] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        return d.toISOString().slice(0, 10);
    });
    const [error, setError] = useState('');

    // Load doctor profile
    useEffect(() => {
        setLoadingDoc(true);
        fetch(`${API}/api/nearby/providers/${id}`)
            .then(r => r.json())
            .then(j => { setDoctor(j.provider || j); })
            .catch(() => setError('Could not load this profile. Please try again.'))
            .finally(() => setLoadingDoc(false));
    }, [id]);

    // Load availability when date changes
    useEffect(() => {
        if (!doctor) return;
        fetch(`${API}/api/nearby/providers/${id}/availability?date=${selectedDate}`)
            .then(r => r.json())
            .then(j => setSlots(j.slots || j.data?.slots || []))
            .catch(() => setSlots([]));
    }, [id, doctor, selectedDate]);

    // Generate next 7 date options
    const dateOptions = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return { iso: d.toISOString().slice(0, 10), label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) };
    });

    if (loadingDoc) return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',system-ui,sans-serif", color: '#7A95B8' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🩺</div>
                <p>Loading…</p>
            </div>
        </div>
    );

    if (error || !doctor) return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',system-ui,sans-serif", color: '#7A95B8' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                <p>{error || 'Doctor not found.'}</p>
                <Link href="/doctors" style={{ color: '#1A54A8', fontSize: 14 }}>← Back to doctors</Link>
            </div>
        </div>
    );

    const fee = doctor.consultationFeeRange;
    const feeStr = fee ? (fee.min === fee.max ? `₹${fee.min}` : `₹${fee.min}–₹${fee.max}`) : null;
    const availableSlots = slots.filter(s => s.available);

    return (
        <div style={{ minHeight: '100vh', background: '#F6F9FF', fontFamily: "'DM Sans',system-ui,sans-serif" }}>

            {/* Profile Header */}
            <div style={{ background: 'linear-gradient(135deg,#0A1F44,#1A54A8)', padding: '40px 32px' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <Link href="/doctors" style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
                        ← All Doctors
                    </Link>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {/* Avatar */}
                        <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,#0B96A0,#2AC8BE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#fff', fontWeight: 700, flexShrink: 0, border: '3px solid rgba(255,255,255,.2)' }}>
                            {doctor.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, color: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                                <h1 style={{ margin: 0, fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700 }}>{doctor.name}</h1>
                                {doctor.careconnectVerified && (
                                    <span style={{ background: 'rgba(11,150,160,.3)', border: '1px solid rgba(11,150,160,.5)', color: '#2AC8BE', fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '3px 10px' }}>✓ CareConnect Verified</span>
                                )}
                            </div>
                            <p style={{ margin: '0 0 6px', fontSize: 15, color: 'rgba(255,255,255,.75)' }}>
                                {doctor.specialties.join(' · ') || doctor.subtype || 'Healthcare Provider'}
                            </p>
                            {(doctor.locality || doctor.city) && (
                                <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(255,255,255,.55)' }}>
                                    📍 {[doctor.locality, doctor.city, doctor.state].filter(Boolean).join(', ')}
                                </p>
                            )}
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {doctor.rating != null && (
                                    <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600 }}>
                                        ⭐ {doctor.rating.toFixed(1)} {doctor.reviewCount ? `(${doctor.reviewCount} reviews)` : ''}
                                    </div>
                                )}
                                {feeStr && (
                                    <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 8, padding: '6px 12px', fontSize: 13 }}>
                                        💊 Consultation {feeStr}
                                    </div>
                                )}
                                {doctor.teleconsultation && (
                                    <div style={{ background: 'rgba(11,150,160,.2)', borderRadius: 8, padding: '6px 12px', fontSize: 13, color: '#2AC8BE' }}>
                                        📹 Video Consultation
                                    </div>
                                )}
                                {doctor.openNow && (
                                    <div style={{ background: 'rgba(22,163,74,.2)', borderRadius: 8, padding: '6px 12px', fontSize: 13, color: '#4ade80', fontWeight: 600 }}>
                                        Open Now
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>

                {/* Left — Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* About */}
                    {doctor.description && (
                        <Section title="About">
                            <p style={{ margin: 0, fontSize: 14, color: '#3D5475', lineHeight: 1.7 }}>{doctor.description}</p>
                        </Section>
                    )}

                    {/* Services */}
                    {doctor.servicesOffered && doctor.servicesOffered.length > 0 && (
                        <Section title="Services Offered">
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {doctor.servicesOffered.map(s => (
                                    <span key={s} style={{ background: '#EBF1FB', color: '#1A54A8', borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 500 }}>{s}</span>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Working hours */}
                    {doctor.workingHours && doctor.workingHours.length > 0 && (
                        <Section title="Working Hours">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {doctor.workingHours.map((h, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid #EEF3FB' }}>
                                        <span style={{ fontWeight: 600, color: '#0A1F44' }}>{DAYS[h.day]}</span>
                                        <span style={{ color: '#3D5475' }}>{h.is24h ? '24 hours' : `${h.open} – ${h.close}`}</span>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Insurance */}
                    {doctor.insuranceAccepted && doctor.insuranceAccepted.length > 0 && (
                        <Section title="Insurance Accepted">
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {doctor.insuranceAccepted.map(ins => (
                                    <span key={ins} style={{ background: '#F6F9FF', border: '1px solid #DDE6F5', color: '#3D5475', borderRadius: 8, padding: '5px 12px', fontSize: 13 }}>{ins}</span>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Contact */}
                    {(doctor.phone || doctor.email || doctor.address) && (
                        <Section title="Contact & Location">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {doctor.address && <ContactRow icon="📍" text={doctor.address} />}
                                {doctor.phone && <ContactRow icon="📞" text={doctor.phone} />}
                                {doctor.email && <ContactRow icon="✉️" text={doctor.email} />}
                                {doctor.website && <ContactRow icon="🌐" text={doctor.website} />}
                            </div>
                        </Section>
                    )}
                </div>

                {/* Right — Booking */}
                <div style={{ position: 'sticky', top: 80 }}>
                    <div style={{ background: '#fff', border: '1px solid #DDE6F5', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(10,31,68,.08)' }}>
                        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#0A1F44' }}>Book an Appointment</h2>

                        {/* Date picker */}
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#7A95B8', textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 10px' }}>Select Date</p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                            {dateOptions.map(d => (
                                <button
                                    key={d.iso}
                                    onClick={() => setSelectedDate(d.iso)}
                                    style={{
                                        padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                                        background: selectedDate === d.iso ? '#1A54A8' : '#F6F9FF',
                                        color: selectedDate === d.iso ? '#fff' : '#3D5475',
                                        transition: 'all .15s',
                                    }}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>

                        {/* Slots */}
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#7A95B8', textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 10px' }}>
                            Available Slots {availableSlots.length > 0 ? `(${availableSlots.length})` : ''}
                        </p>
                        {availableSlots.length === 0 ? (
                            <p style={{ fontSize: 13, color: '#7A95B8', textAlign: 'center', padding: '16px 0' }}>No slots available for this date.</p>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                                {availableSlots.slice(0, 12).map(s => (
                                    <Link
                                        key={s.startTime}
                                        href={`/nearby/book/${doctor._id}?date=${selectedDate}&time=${s.startTime}`}
                                        style={{
                                            padding: '7px 12px', borderRadius: 8, border: '1.5px solid #DDE6F5',
                                            fontSize: 13, fontWeight: 600, color: '#0A1F44', background: '#fff',
                                            textDecoration: 'none', transition: 'all .15s',
                                        }}
                                    >
                                        {s.startTime}
                                    </Link>
                                ))}
                            </div>
                        )}

                        <Link
                            href={`/nearby/book/${doctor._id}?date=${selectedDate}`}
                            style={{
                                display: 'block', width: '100%', padding: '13px', borderRadius: 10, textAlign: 'center',
                                background: 'linear-gradient(135deg,#1A54A8,#0B96A0)', color: '#fff',
                                fontSize: 15, fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box',
                            }}
                        >
                            Book Appointment →
                        </Link>

                        {feeStr && (
                            <p style={{ fontSize: 12, color: '#7A95B8', textAlign: 'center', margin: '12px 0 0' }}>
                                Consultation fee: {feeStr}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ background: '#fff', border: '1px solid #DDE6F5', borderRadius: 14, padding: 22, boxShadow: '0 1px 4px rgba(10,31,68,.05)' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0A1F44' }}>{title}</h2>
            {children}
        </div>
    );
}

function ContactRow({ icon, text }: { icon: string; text: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#3D5475' }}>
            <span style={{ flexShrink: 0 }}>{icon}</span>
            <span>{text}</span>
        </div>
    );
}
