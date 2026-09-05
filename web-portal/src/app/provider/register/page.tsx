'use client';
import { useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

type ProviderType = 'DOCTOR' | 'CLINIC' | 'HOSPITAL' | 'LAB' | 'PHARMACY' | 'ORGANISATION';

interface RegState {
    // Step 1
    providerType: ProviderType | '';
    // Step 2
    name: string;
    contactName: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    pincode: string;
    website: string;
    // Step 3
    specialties: string[];
    description: string;
    services: string[];
    // Step 4 (review & submit)
}

const PROVIDER_TYPES: Array<{ value: ProviderType; label: string; icon: string; desc: string }> = [
    { value: 'DOCTOR',       label: 'Individual Doctor',   icon: '🩺', desc: 'Practitioner or specialist' },
    { value: 'CLINIC',       label: 'Clinic',              icon: '🏥', desc: 'Multi-specialty or single' },
    { value: 'HOSPITAL',     label: 'Hospital',            icon: '🏨', desc: 'Inpatient & outpatient facility' },
    { value: 'LAB',          label: 'Diagnostic Lab',      icon: '🔬', desc: 'Pathology, imaging & diagnostics' },
    { value: 'PHARMACY',     label: 'Pharmacy',            icon: '💊', desc: 'Retail or online pharmacy' },
    { value: 'ORGANISATION', label: 'Health Organisation', icon: '🏢', desc: 'NGO, insurance or health network' },
];

const SPECIALTY_OPTIONS = [
    'General Physician','Cardiologist','Dermatologist','Gynaecologist','Orthopaedic',
    'Paediatrician','Psychiatrist','Neurologist','Ophthalmologist','ENT','Dentist',
    'Urologist','Gastroenterologist','Radiologist','Oncologist','Endocrinologist',
    'Pulmonologist','Rheumatologist','Nephrologist','General Surgery',
];

const STEP_LABELS = ['Provider Type', 'Basic Info', 'Services', 'Review & Submit'];

const INDIA_STATES = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
    'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
    'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
    'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
    'West Bengal','Delhi','Jammu & Kashmir','Ladakh',
];

export default function ProviderRegisterPage() {
    const [step, setStep]       = useState(1);
    const [form, setForm]       = useState<RegState>({
        providerType: '', name: '', contactName: '', email: '', phone: '',
        city: '', state: '', pincode: '', website: '', specialties: [],
        description: '', services: [],
    });
    const [regId, setRegId]     = useState('');
    const [token, setToken]     = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');
    const [submitted, setSubmitted] = useState(false);

    const set = (k: keyof RegState, v: RegState[keyof RegState]) =>
        setForm(f => ({ ...f, [k]: v }));

    const toggleSpecialty = (s: string) =>
        set('specialties', form.specialties.includes(s)
            ? form.specialties.filter(x => x !== s)
            : [...form.specialties, s]);

    const toggleService = (s: string) =>
        set('services', form.services.includes(s)
            ? form.services.filter(x => x !== s)
            : [...form.services, s]);

    // Step 1 → 2: just validate selection, no backend call yet (no real data to send)
    const handleStep1 = () => {
        if (!form.providerType) { setError('Please select a provider type.'); return; }
        setError('');
        setStep(2);
    };

    // Step 2 → 3: create draft with real data, then save
    const handleStep2 = async () => {
        if (!form.name || !form.contactName || !form.email || !form.phone) {
            setError('Name, contact name, email and phone are required.'); return;
        }
        setError(''); setLoading(true);
        try {
            if (!regId) {
                // First time reaching step 2 — create the draft with real data
                const res = await fetch(`${API}/api/provider/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ providerType: form.providerType, name: form.name, contactName: form.contactName, email: form.email, phone: form.phone, city: form.city, state: form.state, pincode: form.pincode, website: form.website, step: 2 }),
                });
                const j = await res.json();
                if (!j.success) throw new Error(j.message);
                setRegId(j.data.id);
                setToken(j.data.token);
            } else {
                // Resuming — update existing draft
                const res = await fetch(`${API}/api/provider/register/${regId}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, step: 2, name: form.name, contactName: form.contactName, email: form.email, phone: form.phone, city: form.city, state: form.state, pincode: form.pincode, website: form.website }),
                });
                const j = await res.json();
                if (!j.success) throw new Error(j.message);
            }
            setStep(3);
        } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to save. Please try again.'); }
        finally { setLoading(false); }
    };

    // Step 3 → 4: save services info
    const handleStep3 = async () => {
        setError(''); setLoading(true);
        try {
            if (regId) {
                const res = await fetch(`${API}/api/provider/register/${regId}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, step: 3, specialties: form.specialties, description: form.description, services: form.services }),
                });
                const j = await res.json();
                if (!j.success) throw new Error(j.message);
            }
            setStep(4);
        } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to save.'); }
        finally { setLoading(false); }
    };

    // Step 4: final submit
    const handleSubmit = async () => {
        if (!regId || !token) { setError('Registration session expired. Please start again.'); return; }
        setError(''); setLoading(true);
        try {
            const res = await fetch(`${API}/api/provider/register/${regId}/submit`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            const j = await res.json();
            if (!j.success) throw new Error(j.message);
            setSubmitted(true);
        } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to submit. Please try again.'); }
        finally { setLoading(false); }
    };

    if (submitted) return <SuccessScreen email={form.email} providerType={form.providerType as ProviderType} name={form.name} />;

    return (
        <div style={{ minHeight: '100vh', background: '#F6F9FF', fontFamily: "'DM Sans',system-ui,sans-serif" }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#0A1F44,#1A54A8)', padding: '32px', textAlign: 'center' }}>
                <Link href="/business" style={{ display: 'inline-block', marginBottom: 16, color: 'rgba(255,255,255,.6)', fontSize: 13, textDecoration: 'none' }}>← CareConnect for Providers</Link>
                <h1 style={{ color: '#fff', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, margin: '0 0 8px' }}>Join CareConnect</h1>
                <p style={{ color: 'rgba(255,255,255,.7)', margin: 0, fontSize: 15 }}>Register your practice and start reaching patients</p>
            </div>

            {/* Progress */}
            <div style={{ background: '#fff', borderBottom: '1px solid #DDE6F5', padding: '16px 32px' }}>
                <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 0 }}>
                    {STEP_LABELS.map((label, i) => {
                        const n = i + 1;
                        const done = step > n;
                        const active = step === n;
                        return (
                            <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_LABELS.length - 1 ? 1 : 'none' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: done ? '#16a34a' : active ? '#1A54A8' : '#EEF3FB', color: done || active ? '#fff' : '#7A95B8' }}>
                                        {done ? '✓' : n}
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: active ? '#1A54A8' : done ? '#16a34a' : '#7A95B8', whiteSpace: 'nowrap' }}>{label}</span>
                                </div>
                                {i < STEP_LABELS.length - 1 && (
                                    <div style={{ flex: 1, height: 2, background: done ? '#16a34a' : '#EEF3FB', margin: '0 8px', marginBottom: 20 }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 24px 60px' }}>
                <div style={{ background: '#fff', border: '1px solid #DDE6F5', borderRadius: 18, padding: 36, boxShadow: '0 4px 24px rgba(10,31,68,.07)' }}>

                    {error && (
                        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 14, color: '#DC2626' }}>
                            {error}
                        </div>
                    )}

                    {/* Step 1: Provider Type */}
                    {step === 1 && (
                        <>
                            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#0A1F44' }}>What describes you best?</h2>
                            <p style={{ margin: '0 0 28px', fontSize: 14, color: '#7A95B8' }}>Select the type of healthcare provider you are</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 14, marginBottom: 32 }}>
                                {PROVIDER_TYPES.map(pt => (
                                    <button
                                        key={pt.value}
                                        onClick={() => set('providerType', pt.value)}
                                        style={{
                                            padding: '18px 16px', borderRadius: 14, border: `2px solid ${form.providerType === pt.value ? '#1A54A8' : '#DDE6F5'}`,
                                            background: form.providerType === pt.value ? '#EBF1FB' : '#fff',
                                            cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                                        }}
                                    >
                                        <div style={{ fontSize: 28, marginBottom: 8 }}>{pt.icon}</div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0A1F44', marginBottom: 4 }}>{pt.label}</div>
                                        <div style={{ fontSize: 12, color: '#7A95B8' }}>{pt.desc}</div>
                                    </button>
                                ))}
                            </div>
                            <Btn label="Continue →" onClick={handleStep1} loading={loading} />
                        </>
                    )}

                    {/* Step 2: Basic Info */}
                    {step === 2 && (
                        <>
                            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#0A1F44' }}>Basic information</h2>
                            <p style={{ margin: '0 0 28px', fontSize: 14, color: '#7A95B8' }}>Tell us about your practice</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <Field label="Practice / Clinic Name *" placeholder="e.g. Dr. Sharma's Cardiology" value={form.name} onChange={v => set('name', v)} />
                                <Field label="Your Name (Contact Person) *" placeholder="Full name" value={form.contactName} onChange={v => set('contactName', v)} />
                                <Row>
                                    <Field label="Email *" type="email" placeholder="you@example.com" value={form.email} onChange={v => set('email', v)} />
                                    <Field label="Phone *" placeholder="+91 98765 43210" value={form.phone} onChange={v => set('phone', v)} />
                                </Row>
                                <Row>
                                    <Field label="City" placeholder="Mumbai" value={form.city} onChange={v => set('city', v)} />
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3D5475', marginBottom: 6 }}>State</label>
                                        <select
                                            value={form.state}
                                            onChange={e => set('state', e.target.value)}
                                            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #DDE6F5', fontSize: 14, color: '#0A1F44', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                                        >
                                            <option value="">Select state</option>
                                            {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <Field label="Pincode" placeholder="400001" value={form.pincode} onChange={v => set('pincode', v)} />
                                </Row>
                                <Field label="Website (optional)" placeholder="https://yourwebsite.com" value={form.website} onChange={v => set('website', v)} />
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                                <button onClick={() => setStep(1)} style={{ padding: '12px 24px', borderRadius: 10, border: '1.5px solid #DDE6F5', background: '#fff', color: '#3D5475', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
                                <Btn label="Save & Continue →" onClick={handleStep2} loading={loading} />
                            </div>
                        </>
                    )}

                    {/* Step 3: Services */}
                    {step === 3 && (
                        <>
                            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#0A1F44' }}>Services & specialties</h2>
                            <p style={{ margin: '0 0 28px', fontSize: 14, color: '#7A95B8' }}>Help patients find the right care</p>

                            {(form.providerType === 'DOCTOR' || form.providerType === 'CLINIC' || form.providerType === 'HOSPITAL') && (
                                <>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#3D5475', marginBottom: 10 }}>Specialties (select all that apply)</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                                        {SPECIALTY_OPTIONS.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => toggleSpecialty(s)}
                                                style={{ padding: '7px 14px', borderRadius: 999, border: `1.5px solid ${form.specialties.includes(s) ? '#1A54A8' : '#DDE6F5'}`, background: form.specialties.includes(s) ? '#EBF1FB' : '#fff', color: form.specialties.includes(s) ? '#1A54A8' : '#3D5475', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .12s' }}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            <p style={{ fontSize: 13, fontWeight: 600, color: '#3D5475', marginBottom: 10 }}>Services offered</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                                {['OPD Consultation','Home Visit','Video Consultation','Lab Tests','X-Ray','Ultrasound','ECG','Physiotherapy','Vaccination','Health Checkup','Pharmacy Delivery','Emergency Care'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => toggleService(s)}
                                        style={{ padding: '7px 14px', borderRadius: 999, border: `1.5px solid ${form.services.includes(s) ? '#0B96A0' : '#DDE6F5'}`, background: form.services.includes(s) ? '#E6F7F8' : '#fff', color: form.services.includes(s) ? '#0B96A0' : '#3D5475', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .12s' }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3D5475', marginBottom: 6 }}>Brief description</label>
                                <textarea
                                    rows={4}
                                    placeholder="Describe your practice, years of experience, notable expertise…"
                                    value={form.description}
                                    onChange={e => set('description', e.target.value)}
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #DDE6F5', fontSize: 14, color: '#0A1F44', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => setStep(2)} style={{ padding: '12px 24px', borderRadius: 10, border: '1.5px solid #DDE6F5', background: '#fff', color: '#3D5475', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
                                <Btn label="Review & Submit →" onClick={handleStep3} loading={loading} />
                            </div>
                        </>
                    )}

                    {/* Step 4: Review & Submit */}
                    {step === 4 && (
                        <>
                            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#0A1F44' }}>Review your details</h2>
                            <p style={{ margin: '0 0 28px', fontSize: 14, color: '#7A95B8' }}>Please confirm everything looks correct before submitting</p>

                            <ReviewSection title="Provider Type">
                                <ReviewRow label="Type" value={PROVIDER_TYPES.find(p => p.value === form.providerType)?.label ?? form.providerType} />
                            </ReviewSection>

                            <ReviewSection title="Basic Information">
                                <ReviewRow label="Practice Name" value={form.name} />
                                <ReviewRow label="Contact Person" value={form.contactName} />
                                <ReviewRow label="Email" value={form.email} />
                                <ReviewRow label="Phone" value={form.phone} />
                                {form.city && <ReviewRow label="City" value={`${form.city}${form.state ? `, ${form.state}` : ''}${form.pincode ? ' — ' + form.pincode : ''}`} />}
                                {form.website && <ReviewRow label="Website" value={form.website} />}
                            </ReviewSection>

                            {(form.specialties.length > 0 || form.services.length > 0 || form.description) && (
                                <ReviewSection title="Services & Specialties">
                                    {form.specialties.length > 0 && <ReviewRow label="Specialties" value={form.specialties.join(', ')} />}
                                    {form.services.length > 0 && <ReviewRow label="Services" value={form.services.join(', ')} />}
                                    {form.description && <ReviewRow label="Description" value={form.description} />}
                                </ReviewSection>
                            )}

                            <div style={{ background: '#FFF9EC', border: '1px solid #FCD34D', borderRadius: 12, padding: '14px 18px', marginBottom: 28, fontSize: 13, color: '#92400E' }}>
                                By submitting, you confirm that all information is accurate. Our verification team will review your registration and contact you within 1–2 business days.
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => setStep(3)} style={{ padding: '12px 24px', borderRadius: 10, border: '1.5px solid #DDE6F5', background: '#fff', color: '#3D5475', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Edit</button>
                                <Btn label={loading ? 'Submitting…' : 'Submit for Review ✓'} onClick={handleSubmit} loading={loading} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function Field({ label, placeholder, value, onChange, type = 'text' }: { label: string; placeholder?: string; value: string; onChange: (v: string) => void; type?: string }) {
    return (
        <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3D5475', marginBottom: 6 }}>{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #DDE6F5', fontSize: 14, color: '#0A1F44', outline: 'none', boxSizing: 'border-box' }}
            />
        </div>
    );
}

function Row({ children }: { children: React.ReactNode }) {
    return <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{children}</div>;
}

function Btn({ label, onClick, loading }: { label: string; onClick: () => void; loading: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            style={{ flex: 1, padding: '13px 28px', borderRadius: 10, background: 'linear-gradient(135deg,#1A54A8,#0B96A0)', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1 }}
        >
            {loading ? 'Please wait…' : label}
        </button>
    );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 20, border: '1px solid #DDE6F5', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: '#F6F9FF', padding: '10px 16px', fontWeight: 700, fontSize: 13, color: '#1A54A8', borderBottom: '1px solid #DDE6F5' }}>{title}</div>
            <div style={{ padding: '4px 0' }}>{children}</div>
        </div>
    );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', gap: 12, padding: '10px 16px', borderBottom: '1px solid #F6F9FF', fontSize: 14 }}>
            <span style={{ color: '#7A95B8', fontWeight: 600, flexShrink: 0, width: 130 }}>{label}</span>
            <span style={{ color: '#0A1F44', wordBreak: 'break-word' }}>{value || '—'}</span>
        </div>
    );
}

function SuccessScreen({ email, name, providerType }: { email: string; name: string; providerType: ProviderType }) {
    const type = PROVIDER_TYPES.find(p => p.value === providerType);
    return (
        <div style={{ minHeight: '100vh', background: '#F6F9FF', fontFamily: "'DM Sans',system-ui,sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ background: '#fff', border: '1px solid #DDE6F5', borderRadius: 20, padding: '56px 48px', maxWidth: 520, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(10,31,68,.09)' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#0B96A0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 24px' }}>✓</div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0A1F44', margin: '0 0 12px' }}>Registration Submitted!</h1>
                <p style={{ fontSize: 15, color: '#3D5475', margin: '0 0 8px' }}>
                    <strong>{name}</strong> {type ? `(${type.label})` : ''} is now under review.
                </p>
                <p style={{ fontSize: 14, color: '#7A95B8', margin: '0 0 32px' }}>
                    A confirmation email has been sent to <strong>{email}</strong>.<br />
                    Our verification team will contact you within 1–2 business days.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/home" style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#1A54A8,#0B96A0)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Go to Home</Link>
                    <Link href="/business" style={{ padding: '12px 24px', borderRadius: 10, border: '1.5px solid #DDE6F5', color: '#3D5475', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>← Provider Hub</Link>
                </div>
            </div>
        </div>
    );
}
