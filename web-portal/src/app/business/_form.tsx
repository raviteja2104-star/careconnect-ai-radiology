'use client';
import { useState, FormEvent } from 'react';

type State = 'idle' | 'loading' | 'success' | 'error';

export function ContactForm() {
    const [state, setState] = useState<State>('idle');
    const [error, setError] = useState('');

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setState('loading');
        setError('');

        const fd = new FormData(e.currentTarget);
        const payload = {
            name:         fd.get('name')         as string,
            phone:        fd.get('phone')        as string,
            email:        fd.get('email')        as string,
            providerType: fd.get('providerType') as string,
            city:         fd.get('city')         as string,
            message:      fd.get('message')      as string,
        };

        try {
            const res = await fetch('/api/provider-enquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.message ?? 'Something went wrong. Please try again.');
                setState('error');
            } else {
                setState('success');
            }
        } catch {
            setError('Network error. Please check your connection and try again.');
            setState('error');
        }
    }

    if (state === 'success') {
        return (
            <div className="form">
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                    <div className="form-title">Request received!</div>
                    <p className="form-sub" style={{ marginTop: 8 }}>
                        Our provider team will reach out to you within one business day.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="form-title">Join the CareConnect network</div>
            <div className="form-sub">We&apos;ll reach out within one business day.</div>

            {state === 'error' && (
                <div style={{
                    background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
                    padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 14,
                }}>
                    {error}
                </div>
            )}

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label" htmlFor="f-name">Full name</label>
                    <input className="form-input" type="text" id="f-name" name="name"
                        placeholder="Dr. Ravi Kumar" autoComplete="name" required />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="f-phone">Phone number</label>
                    <input className="form-input" type="tel" id="f-phone" name="phone"
                        placeholder="+91 98765 43210" autoComplete="tel" />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="f-email">Work email</label>
                <input className="form-input" type="email" id="f-email" name="email"
                    placeholder="doctor@clinic.in" autoComplete="email" required />
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="f-type">Provider type</label>
                <select className="form-select" id="f-type" name="providerType" required defaultValue="">
                    <option value="" disabled>Select your provider type…</option>
                    <option>Independent Doctor</option>
                    <option>Clinic / Polyclinic</option>
                    <option>Hospital</option>
                    <option>Diagnostic Lab</option>
                    <option>Pharmacy</option>
                    <option>Health Organisation / Corporate</option>
                </select>
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="f-city">City</label>
                <input className="form-input" type="text" id="f-city" name="city"
                    placeholder="Mumbai" autoComplete="address-level2" />
            </div>

            <div className="form-group">
                <label className="form-label" htmlFor="f-note">
                    Anything specific you&apos;d like to discuss?{' '}
                    <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span>
                </label>
                <textarea className="form-textarea" id="f-note" name="message"
                    placeholder="e.g. I run a 3-doctor clinic and want to manage multi-doctor scheduling…" />
            </div>

            <button className="form-submit" type="submit" disabled={state === 'loading'}>
                {state === 'loading' ? 'Sending…' : 'Request a callback →'}
            </button>

            <p className="form-note">
                By submitting you agree to our{' '}
                <a href="/privacy" style={{ color: 'var(--teal)' }}>Privacy Policy</a>.
                Your data is used only to respond to your enquiry.
            </p>
        </form>
    );
}
