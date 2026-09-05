'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

interface Provider {
    _id: string;
    name: string;
    type: string;
    subtype?: string;
    specialties: string[];
    locality?: string;
    city?: string;
    address?: string;
    rating?: number;
    reviewCount?: number;
    consultationFeeRange?: { min: number; max: number };
    careconnectVerified: boolean;
    openNow?: boolean;
    photo?: string;
    profileImage?: string;
    resultType?: string;
}

const SPECIALTIES = [
    'All', 'General Physician', 'Cardiologist', 'Dermatologist', 'Gynaecologist',
    'Orthopaedic', 'Paediatrician', 'Psychiatrist', 'Neurologist', 'Ophthalmologist',
    'ENT', 'Dentist', 'Urologist', 'Gastroenterologist', 'Radiologist',
];

export default function DoctorsPage() {
    const [query, setQuery]           = useState('');
    const [specialty, setSpecialty]   = useState('All');
    const [city, setCity]             = useState('');
    const [results, setResults]       = useState<Provider[]>([]);
    const [loading, setLoading]       = useState(false);
    const [searched, setSearched]     = useState(false);

    const search = useCallback(async () => {
        setLoading(true);
        setSearched(true);
        try {
            const params = new URLSearchParams({ type: 'doctor', limit: '24' });
            if (query.trim())              params.set('q', query.trim());
            if (specialty !== 'All')       params.set('specialty', specialty);
            if (city.trim())               params.set('city', city.trim());
            const res  = await fetch(`${API}/api/search?${params}`);
            const json = await res.json();
            setResults((json.data?.results ?? []).filter((r: Provider) => r.type === 'DOCTOR' || r.resultType === 'provider'));
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [query, specialty, city]);

    // Initial load — top doctors
    useEffect(() => { search(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); search(); };

    return (
        <div style={{ minHeight: '100vh', background: '#F6F9FF', fontFamily: "'DM Sans',system-ui,sans-serif" }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#1A54A8,#0B96A0)', padding: '48px 32px 36px' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>CareConnect</p>
                    <h1 style={{ color: '#fff', fontSize: 'clamp(26px,4vw,40px)', fontWeight: 700, letterSpacing: '-.02em', margin: '0 0 32px' }}>
                        Find a Doctor
                    </h1>

                    {/* Search bar */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="Search by name, specialty or condition…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            style={{ flex: '2 1 260px', padding: '12px 18px', borderRadius: 999, border: 'none', fontSize: 15, outline: 'none', boxShadow: '0 2px 12px rgba(0,0,0,.12)' }}
                        />
                        <input
                            type="text"
                            placeholder="City"
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            style={{ flex: '1 1 120px', padding: '12px 18px', borderRadius: 999, border: 'none', fontSize: 15, outline: 'none', boxShadow: '0 2px 12px rgba(0,0,0,.12)' }}
                        />
                        <button type="submit" style={{ padding: '12px 28px', borderRadius: 999, background: '#fff', color: '#1A54A8', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', flexShrink: 0 }}>
                            Search
                        </button>
                    </form>
                </div>
            </div>

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px' }}>

                {/* Specialty filter chips */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
                    {SPECIALTIES.map(s => (
                        <button
                            key={s}
                            onClick={() => { setSpecialty(s); search(); }}
                            style={{
                                padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                                background: specialty === s ? '#1A54A8' : '#fff',
                                color: specialty === s ? '#fff' : '#3D5475',
                                boxShadow: '0 1px 4px rgba(10,31,68,.08)',
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Results */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#7A95B8' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                        <p>Searching…</p>
                    </div>
                )}

                {!loading && searched && results.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#7A95B8' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🩺</div>
                        <p style={{ fontSize: 16, fontWeight: 600, color: '#3D5475' }}>No doctors found</p>
                        <p style={{ fontSize: 14 }}>Try a different name, specialty or city.</p>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <>
                        <p style={{ fontSize: 14, color: '#7A95B8', marginBottom: 20 }}>
                            {results.length} doctor{results.length !== 1 ? 's' : ''} found
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20 }}>
                            {results.map(doc => (
                                <DoctorCard key={doc._id} doc={doc} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function DoctorCard({ doc }: { doc: Provider }) {
    const fee = doc.consultationFeeRange;
    const feeStr = fee ? (fee.min === fee.max ? `₹${fee.min}` : `₹${fee.min}–₹${fee.max}`) : null;

    return (
        <div style={{ background: '#fff', border: '1px solid #DDE6F5', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(10,31,68,.06)', transition: 'all .2s', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#1A54A8,#0B96A0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, color: '#fff', fontWeight: 700 }}>
                    {doc.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0A1F44', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.name}
                        </h3>
                        {doc.careconnectVerified && (
                            <span style={{ background: '#E6F7F8', color: '#0B96A0', fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '2px 7px', flexShrink: 0 }}>✓ Verified</span>
                        )}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#3D5475' }}>{doc.specialties.slice(0, 2).join(' · ') || doc.subtype || 'General Practice'}</p>
                    {(doc.locality || doc.city) && (
                        <p style={{ margin: '3px 0 0', fontSize: 12, color: '#7A95B8' }}>📍 {[doc.locality, doc.city].filter(Boolean).join(', ')}</p>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {doc.rating != null && (
                    <div style={{ background: '#F6F9FF', border: '1px solid #DDE6F5', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#0A1F44', display: 'flex', alignItems: 'center', gap: 4 }}>
                        ⭐ <strong>{doc.rating.toFixed(1)}</strong>
                        {doc.reviewCount ? <span style={{ color: '#7A95B8' }}>({doc.reviewCount})</span> : null}
                    </div>
                )}
                {feeStr && (
                    <div style={{ background: '#F6F9FF', border: '1px solid #DDE6F5', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#0A1F44' }}>
                        💊 {feeStr}
                    </div>
                )}
                {doc.openNow && (
                    <div style={{ background: '#DCFCE7', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                        Open now
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                <Link
                    href={`/doctors/${doc._id}`}
                    style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: 8, border: '1.5px solid #1A54A8', color: '#1A54A8', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all .15s' }}
                >
                    View Profile
                </Link>
                <Link
                    href={`/nearby/book/${doc._id}`}
                    style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: 8, background: 'linear-gradient(135deg,#1A54A8,#0B96A0)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
                >
                    Book Now
                </Link>
            </div>
        </div>
    );
}
