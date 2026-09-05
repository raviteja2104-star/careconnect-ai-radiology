'use client';
import { useState } from 'react';

type TabId = 'doctors' | 'clinics' | 'hospitals' | 'labs' | 'pharmacies' | 'orgs';

const TABS: { id: TabId; emoji: string; label: string }[] = [
    { id: 'doctors',    emoji: '🩺', label: 'Doctors'    },
    { id: 'clinics',    emoji: '🏥', label: 'Clinics'    },
    { id: 'hospitals',  emoji: '🏨', label: 'Hospitals'  },
    { id: 'labs',       emoji: '🧪', label: 'Labs'       },
    { id: 'pharmacies', emoji: '💊', label: 'Pharmacies' },
    { id: 'orgs',       emoji: '🏢', label: 'Health Orgs'},
];

function BarChart({ rows }: { rows: [string, number][] }) {
    return (
        <div className="pv-chart">
            <div className="pv-chart-label">Distribution</div>
            {rows.map(([label, pct]) => (
                <div key={label} className="pv-bar-row">
                    <div className="pv-bar-label">{label}</div>
                    <div className="pv-bar-track"><div className="pv-bar-fill" style={{ width: `${pct}%` }} /></div>
                    <div className="pv-bar-num">{pct}%</div>
                </div>
            ))}
        </div>
    );
}

const PANELS: Record<TabId, JSX.Element> = {
    doctors: (
        <div className="provider-panel active" id="panel-doctors">
            <div className="pp-content">
                <div className="pp-kicker">For independent doctors</div>
                <h3 className="pp-h3">Your digital consulting room — without the admin headache</h3>
                <p className="pp-p">Build a verified public profile, manage your appointment queue, accept video consultations, and have patient records flow directly into your workspace — from day one.</p>
                <div className="pp-features">
                    {[
                        { title: 'Verified public profile', desc: 'Searchable by speciality, condition, and location. Patients see your real qualifications and reviews.', icon: '👤' },
                        { title: 'Video & in-person bookings', desc: 'Patients book slots you define. Video calls are end-to-end encrypted, in-browser — no app download needed.', icon: '📹' },
                        { title: 'Digital prescriptions & notes', desc: 'Write SOAP notes, issue prescriptions digitally, and have them saved to the patient\'s health record automatically.', icon: '📋' },
                        { title: 'Practice analytics', desc: 'Track appointments, revenue, patient retention, and review scores — all in your dashboard.', icon: '📊' },
                    ].map(f => (
                        <div key={f.title} className="pp-feat">
                            <div className="pp-feat-icon">{f.icon}</div>
                            <div className="pp-feat-text">
                                <div className="pp-feat-title">{f.title}</div>
                                <div className="pp-feat-desc">{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <a href="#contact" className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'inline-flex' }}>Create your doctor profile</a>
            </div>
            <div className="pp-visual">
                <div className="pv-header"><span className="pv-title">Dr. Sanjay Reddy · This Week</span><span className="pv-badge">Live</span></div>
                <div className="pv-stat-row">
                    <div className="pv-stat"><div className="pv-stat-val">42</div><div className="pv-stat-lbl">Consults</div></div>
                    <div className="pv-stat"><div className="pv-stat-val" style={{ color: 'var(--teal)' }}>4.9</div><div className="pv-stat-lbl">Rating</div></div>
                    <div className="pv-stat"><div className="pv-stat-val" style={{ color: 'var(--blue)' }}>8</div><div className="pv-stat-lbl">Video</div></div>
                </div>
                <BarChart rows={[['New patient', 72], ['Follow-up', 20], ['Video consult', 8]]} />
                <div className="pv-list">
                    <div className="pv-row"><div className="pv-row-icon" style={{ background: '#EBF1FB' }}>📋</div><div className="pv-row-label">Avg wait time</div><div className="pv-row-val">12 min</div></div>
                    <div className="pv-row"><div className="pv-row-icon" style={{ background: '#E6F7F8' }}>⭐</div><div className="pv-row-label">Review response rate</div><div className="pv-row-val">100%</div></div>
                </div>
            </div>
        </div>
    ),
    clinics: (
        <div className="provider-panel active">
            <div className="pp-content">
                <div className="pp-kicker">For clinics &amp; polyclinics</div>
                <h3 className="pp-h3">One platform for every doctor, every room, every patient</h3>
                <p className="pp-p">Manage multi-doctor scheduling, front-desk check-ins, and patient records under a single clinic account. Give each doctor their own workspace while keeping operations unified.</p>
                <div className="pp-features">
                    {[
                        { title: 'Multi-doctor scheduling', desc: 'Each doctor manages their own queue while front desk has a unified view of the whole clinic.', icon: '👥' },
                        { title: 'Self-service kiosk & check-in', desc: 'Patients check themselves in via QR code or the waiting room kiosk. Queue updates in real time.', icon: '📲' },
                        { title: 'Shared EMR & lab results', desc: 'Any doctor in the clinic can access a patient\'s records with appropriate permission — no duplicated paperwork.', icon: '🛡️' },
                    ].map(f => (
                        <div key={f.title} className="pp-feat">
                            <div className="pp-feat-icon">{f.icon}</div>
                            <div className="pp-feat-text">
                                <div className="pp-feat-title">{f.title}</div>
                                <div className="pp-feat-desc">{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <a href="#contact" className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'inline-flex' }}>Register your clinic</a>
            </div>
            <div className="pp-visual">
                <div className="pv-header"><span className="pv-title">Sunrise Clinic · Today</span><span className="pv-badge">Live</span></div>
                <div className="pv-stat-row">
                    <div className="pv-stat"><div className="pv-stat-val">4</div><div className="pv-stat-lbl">Doctors</div></div>
                    <div className="pv-stat"><div className="pv-stat-val" style={{ color: 'var(--teal)' }}>86</div><div className="pv-stat-lbl">Patients</div></div>
                    <div className="pv-stat"><div className="pv-stat-val" style={{ color: 'var(--blue)' }}>3</div><div className="pv-stat-lbl">Rooms</div></div>
                </div>
                <div className="pv-list">
                    {[['🩺', 'Dr. Reddy — General', '18 pts', '#EBF1FB'], ['🫀', 'Dr. Menon — Cardio', '24 pts', '#E6F7F8'], ['🧠', 'Dr. Shah — Neuro', '14 pts', '#EEE8FD'], ['🦴', 'Dr. Iyer — Ortho', '30 pts', '#FDEDF1']].map(([icon, name, val, bg]) => (
                        <div key={name} className="pv-row">
                            <div className="pv-row-icon" style={{ background: bg as string }}>{icon}</div>
                            <div className="pv-row-label">{name}</div>
                            <div className="pv-row-val">{val}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    ),
    hospitals: (
        <div className="provider-panel active">
            <div className="pp-content">
                <div className="pp-kicker">For hospitals &amp; health systems</div>
                <h3 className="pp-h3">Enterprise-grade connectivity for complex care delivery</h3>
                <p className="pp-p">Connect your existing HMS, manage inpatient and outpatient flows, route teleradiology, co-ordinate inter-departmental referrals, and give patients a single window to your facility.</p>
                <div className="pp-features">
                    {[
                        { title: 'HMS & RIS/LIS integration', desc: 'Connect your existing hospital management system via HL7 FHIR. No rip-and-replace required.', icon: '🖥️' },
                        { title: 'Patient discovery & referrals', desc: 'Receive referrals from doctors on the network, and redirect patients to speciality departments without friction.', icon: '📞' },
                        { title: 'Bed & OT management exposure', desc: 'Surface real-time availability to patients and referrers. Reduce calls, improve bed utilisation.', icon: '📍' },
                    ].map(f => (
                        <div key={f.title} className="pp-feat">
                            <div className="pp-feat-icon">{f.icon}</div>
                            <div className="pp-feat-text">
                                <div className="pp-feat-title">{f.title}</div>
                                <div className="pp-feat-desc">{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <a href="#contact" className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'inline-flex' }}>Talk to our enterprise team</a>
            </div>
            <div className="pp-visual">
                <div className="pv-header"><span className="pv-title">Sunrise Medical Centre</span><span className="pv-badge">Live</span></div>
                <div className="pv-stat-row">
                    <div className="pv-stat"><div className="pv-stat-val">312</div><div className="pv-stat-lbl">Beds</div></div>
                    <div className="pv-stat"><div className="pv-stat-val" style={{ color: 'var(--teal)' }}>78%</div><div className="pv-stat-lbl">Occupancy</div></div>
                    <div className="pv-stat"><div className="pv-stat-val" style={{ color: 'var(--blue)' }}>24</div><div className="pv-stat-lbl">Departments</div></div>
                </div>
                <BarChart rows={[['Cardiology', 85], ['Orthopaedics', 70], ['Neurology', 60], ['General Med', 90]]} />
            </div>
        </div>
    ),
    labs: (
        <div className="provider-panel active">
            <div className="pp-content">
                <div className="pp-kicker">For diagnostic labs</div>
                <h3 className="pp-h3">More test orders. Faster reports. Zero paper.</h3>
                <p className="pp-p">Get discovered by doctors ordering tests, accept home-collection bookings, and deliver digital reports directly to patients and their doctors — all from a single lab dashboard.</p>
                <div className="pp-features">
                    {[
                        { title: 'Online test catalogue', desc: 'List your tests with prices. Patients and doctors discover and book directly from your verified profile.', icon: '🧪' },
                        { title: 'Home collection management', desc: 'Phlebotomist routing, slot management, and sample tracking — all in your lab\'s dashboard.', icon: '📍' },
                        { title: 'Digital report delivery', desc: 'Reports land in the patient\'s health record and their doctor\'s dashboard simultaneously — no WhatsApp PDFs.', icon: '📋' },
                    ].map(f => (
                        <div key={f.title} className="pp-feat">
                            <div className="pp-feat-icon">{f.icon}</div>
                            <div className="pp-feat-text">
                                <div className="pp-feat-title">{f.title}</div>
                                <div className="pp-feat-desc">{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <a href="#contact" className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'inline-flex' }}>List your lab</a>
            </div>
            <div className="pp-visual">
                <div className="pv-header"><span className="pv-title">Greenleaf Diagnostics</span><span className="pv-badge">Live</span></div>
                <div className="pv-stat-row">
                    <div className="pv-stat"><div className="pv-stat-val">148</div><div className="pv-stat-lbl">Orders/day</div></div>
                    <div className="pv-stat"><div className="pv-stat-val" style={{ color: 'var(--teal)' }}>6hr</div><div className="pv-stat-lbl">Avg TAT</div></div>
                    <div className="pv-stat"><div className="pv-stat-val" style={{ color: 'var(--blue)' }}>420</div><div className="pv-stat-lbl">Tests listed</div></div>
                </div>
                <div className="pv-list">
                    {[['🩸', 'CBC — most ordered', '38/day', '#EBF1FB'], ['🧪', 'Thyroid Profile', '22/day', '#E6F7F8'], ['💊', 'HbA1c', '19/day', '#E6F7EE'], ['☀️', 'Vitamin D', '15/day', '#FEF4E3']].map(([icon, name, val, bg]) => (
                        <div key={name} className="pv-row">
                            <div className="pv-row-icon" style={{ background: bg as string }}>{icon}</div>
                            <div className="pv-row-label">{name}</div>
                            <div className="pv-row-val">{val}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    ),
    pharmacies: (
        <div className="provider-panel active">
            <div className="pp-content">
                <div className="pp-kicker">For pharmacies</div>
                <h3 className="pp-h3">Digital prescriptions, fulfilled faster</h3>
                <p className="pp-p">Receive e-prescriptions from doctors on the network, manage orders online, and offer delivery or in-store pickup — integrated directly into the patient&apos;s care journey.</p>
                <div className="pp-features">
                    {[
                        { title: 'e-Prescription inbox', desc: 'Receive verified digital prescriptions directly. No more illegible handwriting or photo-in-WhatsApp workflows.', icon: '📋' },
                        { title: 'Medicine catalogue & stock', desc: 'List available medicines with prices. Patients can search and request pickup or delivery through the platform.', icon: '💊' },
                        { title: 'Delivery & pickup management', desc: 'Manage orders, assign delivery, and track fulfilment — all from your pharmacy dashboard.', icon: '🚚' },
                    ].map(f => (
                        <div key={f.title} className="pp-feat">
                            <div className="pp-feat-icon">{f.icon}</div>
                            <div className="pp-feat-text">
                                <div className="pp-feat-title">{f.title}</div>
                                <div className="pp-feat-desc">{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <a href="#contact" className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'inline-flex' }}>List your pharmacy</a>
            </div>
            <div className="pp-visual">
                <div className="pv-header"><span className="pv-title">MedPlus Bandra · Today</span><span className="pv-badge">Live</span></div>
                <div className="pv-stat-row">
                    <div className="pv-stat"><div className="pv-stat-val">64</div><div className="pv-stat-lbl">Orders</div></div>
                    <div className="pv-stat"><div className="pv-stat-val" style={{ color: 'var(--teal)' }}>38</div><div className="pv-stat-lbl">e-Rx</div></div>
                    <div className="pv-stat"><div className="pv-stat-val" style={{ color: 'var(--blue)' }}>26</div><div className="pv-stat-lbl">Delivery</div></div>
                </div>
                <div className="pv-list">
                    {[['✅', 'Fulfilled', '52 orders', '#dcfce7'], ['⏳', 'Pending', '9 orders', '#fef9c3'], ['🚚', 'Out for delivery', '3 orders', '#EBF1FB']].map(([icon, name, val, bg]) => (
                        <div key={name} className="pv-row">
                            <div className="pv-row-icon" style={{ background: bg as string }}>{icon}</div>
                            <div className="pv-row-label">{name}</div>
                            <div className="pv-row-val">{val}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    ),
    orgs: (
        <div className="provider-panel active">
            <div className="pp-content">
                <div className="pp-kicker">For health organisations &amp; enterprises</div>
                <h3 className="pp-h3">Employee health &amp; population care at scale</h3>
                <p className="pp-p">Corporates, insurers, and public health organisations can connect their populations to CareConnect&apos;s network — managing bulk bookings, health camps, and aggregate analytics from one dashboard.</p>
                <div className="pp-features">
                    {[
                        { title: 'Corporate health programme', desc: 'Bulk employee enrolment, annual health checkup coordination, and aggregate wellness reporting.', icon: '🏢' },
                        { title: 'Population health analytics', desc: 'Aggregate (de-identified) dashboards across your enrolled population — disease burden, utilisation, and trends.', icon: '📊' },
                        { title: 'Insurance & TPA integration', desc: 'Connect your policy framework to CareConnect\'s booking and claims pipeline for seamless cashless care.', icon: '🛡️' },
                    ].map(f => (
                        <div key={f.title} className="pp-feat">
                            <div className="pp-feat-icon">{f.icon}</div>
                            <div className="pp-feat-text">
                                <div className="pp-feat-title">{f.title}</div>
                                <div className="pp-feat-desc">{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <a href="#contact" className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'inline-flex' }}>Talk to our partnerships team</a>
            </div>
            <div className="pp-visual">
                <div className="pv-header"><span className="pv-title">TechCorp India · Q3 2025</span><span className="pv-badge">Live</span></div>
                <div className="pv-stat-row">
                    <div className="pv-stat"><div className="pv-stat-val">2.4k</div><div className="pv-stat-lbl">Employees</div></div>
                    <div className="pv-stat"><div className="pv-stat-val" style={{ color: 'var(--teal)' }}>68%</div><div className="pv-stat-lbl">Enrolled</div></div>
                    <div className="pv-stat"><div className="pv-stat-val" style={{ color: 'var(--blue)' }}>412</div><div className="pv-stat-lbl">Checkups</div></div>
                </div>
                <BarChart rows={[['Full body checkup', 68], ['Eye & dental', 45], ['Mental wellness', 31]]} />
            </div>
        </div>
    ),
};

export function ProviderTabs() {
    const [active, setActive] = useState<TabId>('doctors');
    return (
        <div>
            <div className="provider-tabs" role="tablist">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`ptab${active === tab.id ? ' active' : ''}`}
                        role="tab"
                        aria-selected={active === tab.id}
                        onClick={() => setActive(tab.id)}
                    >
                        <span className="ptab-icon">{tab.emoji}</span>
                        {tab.label}
                    </button>
                ))}
            </div>
            {PANELS[active]}
        </div>
    );
}
