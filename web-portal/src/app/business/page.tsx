import Link from 'next/link';
import { Metadata } from 'next';
import { ProviderTabs } from './_tabs';
import { ContactForm }  from './_form';
import { PageReveal }   from './_reveal';

export const metadata: Metadata = {
    title: 'CareConnect for Providers — Join the Network',
    description: 'Reach more patients and run a better practice. Doctors, clinics, hospitals, labs, pharmacies, and health organisations — all on one connected platform.',
};

// ── CC Logo ─────────────────────────────────────────────────────────────────
function CCLogo({ p = 'nav', size = 36 }: { p?: string; size?: number }) {
    return (
        <svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" fill="none" width={size} height={size}>
            <defs>
                <linearGradient id={`${p}B`} x1="5" y1="40" x2="50" y2="40" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0A1F44" /><stop offset="100%" stopColor="#1A54A8" />
                </linearGradient>
                <linearGradient id={`${p}T`} x1="50" y1="40" x2="95" y2="40" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0B96A0" /><stop offset="100%" stopColor="#2AC8BE" />
                </linearGradient>
                <linearGradient id={`${p}Br`} x1="42" y1="0" x2="58" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1A54A8" /><stop offset="100%" stopColor="#0B96A0" />
                </linearGradient>
            </defs>
            <path d="M 42.3 30 A 20 20 0 1 1 42.3 50" stroke={`url(#${p}B)`} strokeWidth="7.5" strokeLinecap="round" />
            <path d="M 57.7 50 A 20 20 0 1 0 57.7 30" stroke={`url(#${p}T)`} strokeWidth="7.5" strokeLinecap="round" />
            <line x1="42.3" y1="30" x2="57.7" y2="30" stroke={`url(#${p}Br)`} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="42.3" y1="50" x2="57.7" y2="50" stroke={`url(#${p}Br)`} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

// ── Inline SVG icon helper ───────────────────────────────────────────────────
function Ico({ d, w = 18, h = 18, stroke = 'currentColor', sw = '2', ...rest }: {
    d?: string; w?: number; h?: number; stroke?: string; sw?: string;
    polyline?: string; rect?: [number, number, number, number, number?];
    circle?: [number, number, number];
    path2?: string;
}) {
    return (
        <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
            {d && <path d={d} />}
            {rest.path2 && <path d={rest.path2} />}
            {rest.polyline && <polyline points={rest.polyline} />}
            {rest.rect && <rect x={rest.rect[0]} y={rest.rect[1]} width={rest.rect[2]} height={rest.rect[3]} rx={rest.rect[4]} />}
            {rest.circle && <circle cx={rest.circle[0]} cy={rest.circle[1]} r={rest.circle[2]} />}
        </svg>
    );
}

export default function BusinessPage() {
    return (
        <>
            {/* ── Page-scoped styles ── */}
            <style>{PAGE_CSS}</style>

            <PageReveal />

            {/* ── NAV ── */}
            <nav className="biz-nav" role="navigation" aria-label="Main">
                <Link href="/" className="biz-nav-logo" aria-label="CareConnect home">
                    <CCLogo p="nav" size={36} />
                    <div className="biz-wm"><span className="biz-c">Care</span><span className="biz-cc">Connect</span></div>
                </Link>
                <span className="biz-nav-badge">For Providers</span>
                <nav className="biz-nav-links" aria-label="Provider sections">
                    <a href="#" className="active">Overview</a>
                    <a href="#providers">Who it&apos;s for</a>
                    <a href="#ai">AI Tools</a>
                    <a href="#integrations">Integrations</a>
                    <a href="#security">Security</a>
                    <a href="#contact">Get started</a>
                </nav>
                <div className="biz-nav-actions">
                    <Link href="/home" className="biz-btn biz-btn-ghost">For Patients</Link>
                    <a href="#contact" className="biz-btn biz-btn-primary">
                        Join the network
                        <Ico d="M5 12h14M12 5l7 7-7 7" w={14} h={14} sw="2.5" />
                    </a>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="biz-hero" aria-labelledby="biz-h1">
                <div className="biz-hero-grid-bg" aria-hidden="true" />
                <div className="biz-hero-inner">
                    <div className="biz-hero-content reveal">
                        <div className="biz-hero-eyebrow">
                            <span className="biz-hero-dot" />
                            CareConnect Provider Network
                        </div>
                        <h1 className="biz-hero-h1" id="biz-h1">
                            Reach more patients.<br />
                            <span className="biz-accent">Run better care.</span>
                        </h1>
                        <p className="biz-hero-sub">
                            Join India&apos;s connected health network. Get discovered by patients near you, streamline your workflows, and connect your practice to labs, hospitals, and pharmacies — all in one platform built for how healthcare actually works.
                        </p>
                        <div className="biz-hero-btns">
                            <a href="#contact" className="biz-btn biz-btn-primary" style={{ fontSize: 15, padding: '12px 26px' }}>
                                Join the network free
                                <Ico d="M5 12h14M12 5l7 7-7 7" w={14} h={14} sw="2.5" />
                            </a>
                            <a href="#providers" className="biz-btn biz-btn-outline" style={{ fontSize: 15, padding: '12px 26px' }}>See how it works</a>
                        </div>
                        <div className="biz-hero-trust">
                            {['Free to list your profile', 'No lock-in or long-term contracts', 'Setup in under 30 minutes'].map(t => (
                                <span key={t} className="biz-trust-item">
                                    <Ico polyline="20 6 9 17 4 12" w={13} h={13} stroke="var(--teal)" />
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Dashboard mockup */}
                    <div className="biz-dashboard reveal" style={{ transitionDelay: '.15s' }} aria-label="Provider dashboard preview" role="img">
                        <div className="biz-dash-bar">
                            <div className="biz-dash-dot" style={{ background: '#ff5f57' }} />
                            <div className="biz-dash-dot" style={{ background: '#febc2e' }} />
                            <div className="biz-dash-dot" style={{ background: '#28c840' }} />
                            <div className="biz-dash-title">CareConnect — Provider Dashboard</div>
                        </div>
                        <div className="biz-dash-body">
                            <div className="biz-dash-sidebar">
                                <div className="biz-dash-logo-sm">
                                    <CCLogo p="ds" size={22} /><span>Provider</span>
                                </div>
                                {[['Dashboard', true], ['Queue', false], ['Appointments', false], ['Records', false], ['Analytics', false]].map(([label, active]) => (
                                    <div key={label as string} className={`biz-dash-nav-item${active ? ' active' : ''}`}>{label as string}</div>
                                ))}
                            </div>
                            <div className="biz-dash-main">
                                <div className="biz-dash-welcome">Good morning, Dr. Reddy <span>· Tuesday, 2 Sep 2025</span></div>
                                <div className="biz-dash-metrics">
                                    {[['24', "Today's Queue", '↑ 3 vs yesterday', 'up'], ['₹18.4k', 'This Week', '↑ 12%', 'up'], ['4.9', 'Avg Rating', '98% positive', 'up']].map(([val, lbl, chg, dir]) => (
                                        <div key={lbl} className="biz-dash-metric">
                                            <div className="dm-val">{val}</div>
                                            <div className="dm-lbl">{lbl}</div>
                                            <div className={`dm-chg dm-${dir}`}>{chg}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="biz-dash-queue">
                                    <div className="dq-head"><span className="dq-title">Live Queue</span><span className="dq-badge">6 waiting</span></div>
                                    {[['Meera Pillai', 'Consult', 'In Room', 'st-c'], ['Arun Sharma', 'Follow-up', 'Waiting', 'st-w'], ['Neha Joshi', 'New Patient', 'Waiting', 'st-w'], ['Vijay Kumar', 'Lab Review', 'Booked', 'st-p']].map(([name, type, status, cls], i) => (
                                        <div key={name} className="dq-row">
                                            <div className="dq-num">{i + 1}</div>
                                            <div className="dq-name">{name}</div>
                                            <div className="dq-type">{type}</div>
                                            <div className={`dq-status ${cls}`}>{status}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── VALUE STATS ── */}
            <div className="biz-value-section" aria-label="Network reach">
                <div className="biz-value-inner">
                    <p className="biz-eyebrow reveal">Why join the network</p>
                    <h2 className="biz-heading reveal">Numbers that matter<br />to your practice</h2>
                    <div className="biz-value-grid">
                        {[
                            { num: '50k', sup: '+', label: 'Active patients on the network', desc: 'Patients actively searching for providers in your area — reach them for free.', bg: '#EBF1FB', ic: '#1A54A8' },
                            { num: '3x', sup: ' more', label: 'Appointments vs offline-only', desc: 'Providers on CareConnect report 3× more bookings within 60 days of joining.', bg: '#E6F7F8', ic: '#0B96A0' },
                            { num: '40%', sup: ' less', label: 'No-shows with digital reminders', desc: 'Automated patient reminders and confirmations cut no-show rates significantly.', bg: '#E6F7EE', ic: '#1A8C50' },
                            { num: '30', sup: ' min', label: 'Average setup time', desc: 'Go live in under 30 minutes. No long onboarding, no dedicated IT required.', bg: '#FEF4E3', ic: '#B46E0E' },
                        ].map((c, i) => (
                            <div key={c.label} className="biz-value-card reveal" style={{ transitionDelay: `${i * 0.05}s` }}>
                                <div className="biz-value-icon" style={{ background: c.bg }}>
                                    <Ico d="M17 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" path2="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={c.ic} sw="1.8" w={22} h={22} />
                                </div>
                                <div className="biz-value-num">{c.num}<span>{c.sup}</span></div>
                                <div className="biz-value-label">{c.label}</div>
                                <div className="biz-value-desc">{c.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── PROVIDER TYPES (client component) ── */}
            <section className="biz-provider-section" id="providers" aria-labelledby="providers-heading">
                <p className="biz-eyebrow reveal">Built for every type of provider</p>
                <h2 className="biz-heading reveal" id="providers-heading">Whatever you do,<br />CareConnect fits around you</h2>
                <p className="biz-sub reveal">Not a one-size-fits-all tool. Each provider type gets tools matched to how they actually work.</p>
                <ProviderTabs />
            </section>

            {/* ── AI TOOLS ── */}
            <div className="biz-value-section" id="ai" style={{ padding: '88px 32px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <p className="biz-eyebrow reveal">AI-assisted care tools</p>
                    <h2 className="biz-heading reveal">Tools that make your work lighter,<br />not your judgement optional</h2>
                    <p className="biz-sub reveal">Every AI feature is a decision-support layer — it surfaces information, reduces admin, and flags patterns. Clinical decisions remain yours.</p>
                    <div className="biz-ai-grid">
                        {[
                            { title: 'Clinical Notes Assistant', sub: 'Draft SOAP notes from consultation context. You review, edit, and sign — nothing publishes without you.', grad: 'linear-gradient(135deg,#1A54A8,#0B96A0)', features: ['Structured SOAP note drafting', 'Extracts key symptoms & history automatically', 'Suggests relevant ICD-10 codes for review', 'Doctor reviews and approves before saving'] },
                            { title: 'Smart Schedule Optimiser', sub: 'Suggests optimal slot distribution based on your historical booking patterns and no-show rates.', grad: 'linear-gradient(135deg,#6B3ECC,#1A54A8)', features: ['Reduces gaps between appointments', 'Predicts high no-show risk slots', 'Auto-sends reminders at optimal times', 'You set the final schedule — AI only suggests'] },
                            { title: 'Lab Result Triage', sub: 'Flags abnormal results across your patient list so you notice what needs attention first.', grad: 'linear-gradient(135deg,#0B96A0,#1A8C50)', features: ['Highlights out-of-range values automatically', 'Groups results by urgency for your review', 'Links to patient history for context', 'Flags only — diagnosis and action are yours'] },
                        ].map((c, i) => (
                            <div key={c.title} className="biz-ai-card reveal" style={{ transitionDelay: `${i * 0.05}s` }}>
                                <div className="biz-ai-card-head" style={{ background: c.grad }}>
                                    <div className="biz-ai-card-title">{c.title}</div>
                                    <div className="biz-ai-card-sub">{c.sub}</div>
                                </div>
                                <div className="biz-ai-card-body">
                                    {c.features.map(f => <div key={f} className="biz-ai-feature">{f}</div>)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="biz-ai-disclaimer reveal">
                        <Ico d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" path2="M12 8v4M12 16h.01" stroke="var(--teal)" sw="2" w={16} h={16} />
                        <span>CareConnect AI tools assist licensed clinicians with administrative and decision-support tasks. They do not independently diagnose, prescribe, or make clinical decisions. All AI-generated suggestions require clinician review and approval before any action is taken or recorded.</span>
                    </div>
                </div>
            </div>

            {/* ── INTEGRATIONS ── */}
            <div className="biz-int-section" id="integrations">
                <div className="biz-int-inner">
                    <p className="biz-eyebrow reveal">Works with what you already use</p>
                    <h2 className="biz-heading reveal">Plug in, don&apos;t rip out</h2>
                    <p className="biz-sub reveal">CareConnect connects to your existing systems via open standards. Bring your HMS, LIS, or RIS — we integrate around your workflow.</p>
                    <div className="biz-int-grid">
                        {[
                            ['🏥', 'HL7 FHIR R4', 'Standard'], ['🇮🇳', 'ABDM / ABHA', 'National HIE'],
                            ['🔬', 'LIS Connect', 'Lab Systems'], ['🖥️', 'HMS Bridge', 'Hospital Systems'],
                            ['📡', 'DICOM / PACS', 'Radiology'], ['💳', 'Payment Gateway', 'Payments'],
                            ['📲', 'WhatsApp / SMS', 'Messaging'], ['🧾', 'GST / e-Invoice', 'Billing'],
                            ['🔑', 'SSO / SAML', 'Auth'], ['🤖', 'Custom API', 'Webhooks'],
                        ].map(([icon, name, type], i) => (
                            <div key={name} className="biz-int-card reveal" style={{ transitionDelay: `${i * 0.04}s` }}>
                                <div className="biz-int-icon">{icon}</div>
                                <div className="biz-int-name">{name}</div>
                                <div className="biz-int-type">{type}</div>
                                <div className="biz-int-status">Available</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── SECURITY ── */}
            <section className="biz-sec-section" id="security" aria-labelledby="sec-heading">
                <div className="biz-sec-grid">
                    <div className="reveal">
                        <p className="biz-eyebrow">Trust architecture</p>
                        <h2 className="biz-heading" id="sec-heading">Built to the standard<br />healthcare data demands</h2>
                        <p className="biz-sub" style={{ marginBottom: 0 }}>Patient data on CareConnect is encrypted at rest and in transit. Access is role-based, audit-logged, and consent-driven. You own your clinical data — we are its custodian, not its owner.</p>
                    </div>
                    <div className="biz-sec-pillars reveal" style={{ transitionDelay: '.12s' }}>
                        {[
                            { title: 'End-to-end encryption', desc: 'AES-256-GCM at rest, TLS 1.3 in transit. Individual file-level envelope encryption for health documents.', bg: '#EBF1FB' },
                            { title: 'Role-based access control', desc: 'Doctors see only their patients. Lab techs see only their orders. No data bleeds across roles or organisations.', bg: '#E6F7F8' },
                            { title: 'Immutable audit trail', desc: 'Every read, write, and share is hash-chained and tamper-evident. Compliance-ready logs from day one.', bg: '#E6F7EE' },
                            { title: 'Patient consent controls', desc: 'Patients grant and revoke data access at any time. No record is shared without explicit patient consent.', bg: '#FEF4E3' },
                        ].map(p => (
                            <div key={p.title} className="biz-sec-pillar">
                                <div className="biz-sec-pillar-icon" style={{ background: p.bg }}>🔒</div>
                                <div>
                                    <div className="biz-sec-pillar-title">{p.title}</div>
                                    <div className="biz-sec-pillar-desc">{p.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ONBOARDING STEPS ── */}
            <div className="biz-onboard-section">
                <div className="biz-onboard-inner">
                    <div className="biz-onboard-kicker reveal">Getting started</div>
                    <h2 className="biz-onboard-h2 reveal">Live in 30 minutes,<br />not 30 days</h2>
                    <p className="biz-onboard-sub reveal">No lengthy sales cycles. No IT project. Create your profile, get verified, and start accepting patients — today.</p>
                    <div className="biz-steps">
                        {[
                            ['📝', '01', 'Create your profile', 'Register with your medical credentials, speciality, and clinic address. Takes under 10 minutes.'],
                            ['✅', '02', 'Get verified', 'We verify your MCI/NMC registration and clinic details. Usually done within 24 hours.'],
                            ['⚙️', '03', 'Set your schedule', 'Define your availability, consultation fees, and in-person vs video slots. Full control, always.'],
                            ['🚀', '04', 'Go live', 'Your profile is listed. Patients nearby can find and book you. Manage everything from your dashboard.'],
                        ].map(([icon, num, title, desc], i) => (
                            <div key={num} className="biz-step reveal" style={{ transitionDelay: `${i * 0.05}s` }}>
                                <div className="biz-step-circle">{icon}</div>
                                <div className="biz-step-num">Step {num}</div>
                                <div className="biz-step-title">{title}</div>
                                <div className="biz-step-desc">{desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── CONTACT ── */}
            <section className="biz-contact-section" id="contact" aria-labelledby="contact-heading">
                <div className="biz-contact-grid">
                    <div className="biz-contact-content reveal">
                        <p className="biz-eyebrow">Let&apos;s get you started</p>
                        <h2 className="biz-contact-h2" id="contact-heading">Join the network today</h2>
                        <p className="biz-contact-p">Fill in the form and our provider team will reach out within one business day. No commitment required — listing your profile is free.</p>
                        <div className="biz-contact-ways">
                            {[
                                { icon: '📞', label: 'Call our provider team', val: '1800-XXX-XXXX (Mon–Sat, 9 AM–6 PM)', bg: '#EBF1FB' },
                                { icon: '✉️', label: 'Email us', val: 'providers@careconnect.in', bg: '#E6F7F8' },
                                { icon: '💬', label: 'Chat with us', val: 'Live chat available on this page', bg: '#E6F7EE' },
                            ].map(w => (
                                <div key={w.label} className="biz-contact-way">
                                    <div className="biz-contact-way-icon" style={{ background: w.bg }}>{w.icon}</div>
                                    <div>
                                        <div className="biz-contact-way-label">{w.label}</div>
                                        <div className="biz-contact-way-val">{w.val}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="reveal" style={{ transitionDelay: '.12s' }}>
                        <ContactForm />
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="biz-footer" aria-label="Site footer">
                <div className="biz-footer-inner">
                    <div>
                        <div className="biz-footer-logo">
                            <CCLogo p="ft" size={32} />
                            <div className="biz-fl-wm"><span className="biz-c">Care</span><span className="biz-cc">Connect</span></div>
                        </div>
                        <p className="biz-footer-tagline">The provider network connecting India&apos;s healthcare ecosystem — doctors, hospitals, labs, and pharmacies on one platform.</p>
                    </div>
                    {[
                        { title: 'Provider Tools', links: ['Doctor Profile', 'Clinic Management', 'Lab Dashboard', 'Pharmacy Portal', 'Enterprise'] },
                        { title: 'Resources', links: ['Getting Started', 'API Documentation', 'Integration Guides', 'Webinars', 'Provider Blog'] },
                        { title: 'Support', links: ['Help Centre', 'Contact Provider Team', 'System Status', 'Report an Issue'] },
                        { title: 'Company', links: ['For Patients', 'About CareConnect', 'Careers', 'Privacy Policy', 'Terms of Service'] },
                    ].map(col => (
                        <div key={col.title}>
                            <div className="biz-footer-col-title">{col.title}</div>
                            <div className="biz-footer-links">
                                {col.links.map(l => <a key={l} href="#">{l}</a>)}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="biz-footer-bottom">
                    <p className="biz-footer-copy">© 2025 CareConnect Health Technologies Pvt. Ltd. · All rights reserved.</p>
                    <div className="biz-footer-legal">
                        <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Accessibility</a>
                    </div>
                </div>
            </footer>
        </>
    );
}

// ── Page CSS (scoped via biz- prefix; .reveal/.visible are intentionally global) ──
const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');

:root {
  --blue:#1A54A8;--blue-dk:#0F3A7A;--blue-lt:#E8F0FB;
  --teal:#0B96A0;--teal-lt:#2AC8BE;--teal-wash:#E6F7F8;
  --ground:#FFFFFF;--surface:#F6F9FF;--raised:#EEF3FB;
  --border:#DDE6F5;--border-md:#C8D8F0;
  --ink:#0A1F44;--body:#3D5475;--muted:#7A95B8;--subtle:#A8BCE0;
  --r-sm:8px;--r-md:12px;--r-lg:18px;--r-xl:24px;
  --font:'DM Sans',system-ui,sans-serif;--mono:'DM Mono',monospace;
  --nav-h:64px;
  --sh-sm:0 1px 4px rgba(10,31,68,.06),0 2px 12px rgba(10,31,68,.04);
  --sh-md:0 4px 20px rgba(10,31,68,.09),0 1px 4px rgba(10,31,68,.05);
  --sh-lg:0 12px 40px rgba(10,31,68,.12),0 2px 8px rgba(10,31,68,.06);
}

/* reveal */
.reveal{opacity:0;transform:translateY(20px);transition:opacity .55s ease,transform .55s ease}
.reveal.visible{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}}

/* nav */
.biz-nav{position:sticky;top:0;z-index:100;height:var(--nav-h);display:flex;align-items:center;padding:0 32px;gap:20px;background:rgba(255,255,255,.93);backdrop-filter:blur(14px);border-bottom:1px solid var(--border);box-shadow:var(--sh-sm);font-family:var(--font)}
.biz-nav-logo{display:flex;align-items:center;gap:10px;flex-shrink:0}
.biz-wm{font-size:18px;letter-spacing:-.02em;line-height:1}
.biz-c{font-weight:300;color:var(--muted)}.biz-cc{font-weight:700;color:var(--ink)}
.biz-nav-badge{font-size:10px;font-weight:700;font-family:var(--mono);letter-spacing:.07em;text-transform:uppercase;background:var(--teal-wash);color:var(--teal);border:1px solid rgba(11,150,160,.2);border-radius:999px;padding:3px 10px;flex-shrink:0}
.biz-nav-links{display:flex;align-items:center;gap:2px;flex:1}
.biz-nav-links a{font-size:14px;font-weight:500;color:var(--body);padding:6px 12px;border-radius:var(--r-sm);transition:color .2s,background .2s;text-decoration:none}
.biz-nav-links a:hover,.biz-nav-links a.active{color:var(--blue);background:var(--blue-lt)}
.biz-nav-links a.active{font-weight:600}
.biz-nav-actions{display:flex;align-items:center;gap:10px;margin-left:auto}
.biz-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:999px;font-size:14px;font-weight:600;transition:all .2s;white-space:nowrap;text-decoration:none;cursor:pointer;border:none;font-family:var(--font)}
.biz-btn-ghost{color:var(--body);border:1px solid var(--border)}.biz-btn-ghost:hover{border-color:var(--blue);color:var(--blue);background:var(--blue-lt)}
.biz-btn-primary{background:linear-gradient(135deg,var(--blue),var(--teal));color:#fff;box-shadow:0 2px 12px rgba(26,84,168,.22)}.biz-btn-primary:hover{box-shadow:0 6px 24px rgba(11,150,160,.35);transform:translateY(-1px)}
.biz-btn-outline{color:var(--blue);border:1.5px solid var(--blue);background:transparent}.biz-btn-outline:hover{background:var(--blue-lt)}

/* hero */
.biz-hero{padding:80px 32px 0;background:linear-gradient(175deg,#fff 0%,#F6F9FF 60%,#EEF3FB 100%);position:relative;overflow:hidden}
.biz-hero-grid-bg{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(26,84,168,.08) 1px,transparent 1px);background-size:32px 32px;mask-image:radial-gradient(ellipse 70% 60% at 50% 30%,black 30%,transparent 80%);pointer-events:none}
.biz-hero-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:flex-end;position:relative;z-index:1}
.biz-hero-content{padding-bottom:72px}
.biz-hero-eyebrow{display:inline-flex;align-items:center;gap:8px;background:var(--teal-wash);border:1px solid rgba(11,150,160,.2);border-radius:999px;padding:6px 14px;font-size:12px;font-weight:500;color:var(--teal);font-family:var(--mono);letter-spacing:.05em;text-transform:uppercase;margin-bottom:24px}
.biz-hero-dot{width:6px;height:6px;background:var(--teal-lt);border-radius:50%;animation:biz-pd 2.4s ease-in-out infinite}
@keyframes biz-pd{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.65)}}
.biz-hero-h1{font-size:clamp(36px,4.5vw,58px);font-weight:700;letter-spacing:-.035em;line-height:1.08;color:var(--ink);margin-bottom:20px;text-wrap:balance}
.biz-accent{background:linear-gradient(135deg,var(--blue),var(--teal-lt));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.biz-hero-sub{font-size:16px;color:var(--body);line-height:1.7;max-width:460px;margin-bottom:36px}
.biz-hero-btns{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:44px}
.biz-hero-trust{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.biz-trust-item{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--muted)}

/* dashboard */
.biz-dashboard{background:#fff;border-radius:var(--r-xl) var(--r-xl) 0 0;box-shadow:var(--sh-lg);border:1px solid var(--border);border-bottom:none;overflow:hidden;min-height:460px;display:flex;flex-direction:column;position:relative}
.biz-dash-bar{display:flex;align-items:center;gap:8px;padding:10px 16px;background:var(--surface);border-bottom:1px solid var(--border)}
.biz-dash-dot{width:10px;height:10px;border-radius:50%}
.biz-dash-title{font-size:12px;font-weight:500;color:var(--muted);font-family:var(--mono);margin-left:6px;flex:1;text-align:center}
.biz-dash-body{display:grid;grid-template-columns:180px 1fr;flex:1;min-height:0}
.biz-dash-sidebar{background:var(--ink);padding:16px 0;display:flex;flex-direction:column;gap:2px}
.biz-dash-logo-sm{display:flex;align-items:center;gap:6px;padding:0 14px 14px;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:8px}
.biz-dash-logo-sm span{font-size:12px;font-weight:700;color:#fff}
.biz-dash-nav-item{display:flex;align-items:center;gap:8px;padding:7px 14px;font-size:11px;font-weight:500;color:rgba(255,255,255,.5)}
.biz-dash-nav-item.active{background:rgba(255,255,255,.1);color:#fff}
.biz-dash-main{padding:16px;display:flex;flex-direction:column;gap:12px;overflow:hidden}
.biz-dash-welcome{font-size:13px;font-weight:700;color:var(--ink)}.biz-dash-welcome span{color:var(--body);font-weight:400;font-size:12px}
.biz-dash-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.biz-dash-metric{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:10px}
.dm-val{font-size:18px;font-weight:700;color:var(--ink);letter-spacing:-.02em}
.dm-lbl{font-size:9px;color:var(--muted);font-family:var(--mono);text-transform:uppercase;letter-spacing:.05em}
.dm-chg{font-size:9px;font-weight:600;margin-top:2px}.dm-up{color:#16a34a}.dm-dn{color:#dc2626}
.biz-dash-queue{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:10px;flex:1}
.dq-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.dq-title{font-size:10px;font-weight:700;color:var(--ink);font-family:var(--mono);text-transform:uppercase;letter-spacing:.05em}
.dq-badge{background:var(--teal-wash);color:var(--teal);font-size:9px;font-weight:700;border-radius:999px;padding:2px 7px;font-family:var(--mono)}
.dq-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:10px}.dq-row:last-child{border:none}
.dq-num{width:18px;height:18px;background:linear-gradient(135deg,var(--blue),var(--teal));color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0}
.dq-name{font-weight:600;color:var(--ink);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dq-type{color:var(--muted);flex-shrink:0}
.dq-status{font-size:9px;font-weight:700;border-radius:999px;padding:2px 7px;font-family:var(--mono);flex-shrink:0}
.st-w{background:#fef9c3;color:#a16207}.st-c{background:#dcfce7;color:#16a34a}.st-p{background:var(--blue-lt);color:var(--blue)}

/* shared section scaffolding */
.biz-eyebrow{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--teal);margin-bottom:10px;display:block}
.biz-heading{font-size:clamp(26px,3.5vw,40px);font-weight:700;letter-spacing:-.025em;line-height:1.14;color:var(--ink);text-wrap:balance;margin-bottom:12px}
.biz-sub{font-size:15px;color:var(--body);max-width:520px;line-height:1.7;margin-bottom:48px;display:block}

/* value section */
.biz-value-section{background:var(--surface);padding:80px 32px}
.biz-value-inner{max-width:1100px;margin:0 auto}
.biz-value-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:48px}
.biz-value-card{background:#fff;border:1px solid var(--border);border-radius:var(--r-lg);padding:28px 22px;box-shadow:var(--sh-sm);transition:all .22s}
.biz-value-card:hover{box-shadow:var(--sh-md);transform:translateY(-3px);border-color:var(--teal)}
.biz-value-icon{width:48px;height:48px;border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;margin-bottom:16px}
.biz-value-num{font-size:30px;font-weight:700;letter-spacing:-.03em;color:var(--ink);margin-bottom:4px}
.biz-value-num span{font-size:16px;font-weight:500;color:var(--teal)}
.biz-value-label{font-size:14px;font-weight:600;color:var(--ink);margin-bottom:6px}
.biz-value-desc{font-size:13px;color:var(--body);line-height:1.6}

/* provider section */
.biz-provider-section{padding:88px 32px;max-width:1200px;margin:0 auto}
.provider-tabs{display:flex;gap:0;border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:40px;box-shadow:var(--sh-sm)}
.ptab{flex:1;padding:14px 10px;text-align:center;font-size:13px;font-weight:600;color:var(--muted);cursor:pointer;transition:all .2s;border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:center;gap:5px;background:none;border-bottom:none;border-top:none;font-family:var(--font)}
.ptab:last-child{border-right:none}.ptab.active{background:var(--ink);color:#fff}.ptab:hover:not(.active){background:var(--surface);color:var(--ink)}
.ptab-icon{font-size:20px}
.provider-panel{display:grid;grid-template-columns:1.1fr 1fr;gap:48px;align-items:center}
.pp-kicker{font-size:11px;font-weight:600;font-family:var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--teal);margin-bottom:8px}
.pp-h3{font-size:clamp(22px,2.5vw,32px);font-weight:700;letter-spacing:-.025em;line-height:1.15;color:var(--ink);margin-bottom:14px}
.pp-p{font-size:14px;color:var(--body);line-height:1.7;margin-bottom:24px}
.pp-features{display:flex;flex-direction:column;gap:12px;margin-bottom:28px}
.pp-feat{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:var(--body)}
.pp-feat-icon{width:28px;height:28px;border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--teal-wash);font-size:14px}
.pp-feat-title{font-weight:600;color:var(--ink);margin-bottom:1px}.pp-feat-desc{font-size:12px;color:var(--muted)}
.pp-visual{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);padding:28px;min-height:360px;display:flex;flex-direction:column;gap:14px;box-shadow:var(--sh-sm)}
.pv-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.pv-title{font-size:13px;font-weight:700;color:var(--ink)}
.pv-badge{font-size:10px;font-weight:700;font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase;background:var(--teal-wash);color:var(--teal);border-radius:999px;padding:3px 9px}
.pv-stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.pv-stat{background:#fff;border:1px solid var(--border);border-radius:var(--r-md);padding:12px;text-align:center;box-shadow:var(--sh-sm)}
.pv-stat-val{font-size:20px;font-weight:700;color:var(--ink);letter-spacing:-.02em}
.pv-stat-lbl{font-size:10px;color:var(--muted);font-family:var(--mono);text-transform:uppercase;letter-spacing:.04em}
.pv-list{display:flex;flex-direction:column;gap:8px}
.pv-row{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--border);border-radius:var(--r-md);padding:10px 12px;box-shadow:var(--sh-sm)}
.pv-row-icon{width:32px;height:32px;border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px}
.pv-row-label{font-size:12px;font-weight:600;color:var(--ink);flex:1}
.pv-row-val{font-size:11px;font-weight:700;color:var(--teal);font-family:var(--mono)}
.pv-chart{background:#fff;border:1px solid var(--border);border-radius:var(--r-md);padding:14px;box-shadow:var(--sh-sm)}
.pv-chart-label{font-size:10px;color:var(--muted);font-family:var(--mono);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px}
.pv-bar-row{display:flex;align-items:center;gap:8px;margin-bottom:7px;font-size:11px}
.pv-bar-label{width:100px;color:var(--body);font-weight:500;white-space:nowrap}
.pv-bar-track{flex:1;height:7px;background:var(--raised);border-radius:999px;overflow:hidden}
.pv-bar-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--teal))}
.pv-bar-num{width:32px;text-align:right;color:var(--ink);font-weight:700;font-family:var(--mono)}

/* AI section */
.biz-ai-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:48px}
.biz-ai-card{border-radius:var(--r-xl);overflow:hidden;box-shadow:var(--sh-sm);border:1px solid var(--border);transition:all .22s}
.biz-ai-card:hover{box-shadow:var(--sh-lg);transform:translateY(-4px)}
.biz-ai-card-head{padding:28px 24px 20px;display:flex;flex-direction:column;gap:12px}
.biz-ai-card-title{font-size:17px;font-weight:700;color:#fff;line-height:1.2}
.biz-ai-card-sub{font-size:13px;color:rgba(255,255,255,.72);line-height:1.55}
.biz-ai-card-body{background:#fff;padding:20px 24px}
.biz-ai-feature{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--body);padding:6px 0;border-bottom:1px solid var(--border)}
.biz-ai-feature:last-child{border:none}
.biz-ai-feature::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--teal);flex-shrink:0}
.biz-ai-disclaimer{margin-top:32px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:18px 22px;font-size:12px;color:var(--muted);line-height:1.6;display:flex;align-items:flex-start;gap:10px}

/* integrations */
.biz-int-section{background:var(--surface);padding:80px 32px}
.biz-int-inner{max-width:1100px;margin:0 auto}
.biz-int-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:40px}
.biz-int-card{background:#fff;border:1px solid var(--border);border-radius:var(--r-lg);padding:20px 14px;text-align:center;box-shadow:var(--sh-sm);transition:all .2s}
.biz-int-card:hover{border-color:var(--teal);box-shadow:var(--sh-md);transform:translateY(-2px)}
.biz-int-icon{font-size:28px;margin-bottom:10px}
.biz-int-name{font-size:12px;font-weight:700;color:var(--ink);margin-bottom:3px}
.biz-int-type{font-size:10px;color:var(--muted);font-family:var(--mono);letter-spacing:.04em;text-transform:uppercase}
.biz-int-status{display:inline-flex;align-items:center;gap:4px;margin-top:8px;font-size:10px;font-weight:600;color:#16a34a;font-family:var(--mono)}
.biz-int-status::before{content:'';width:5px;height:5px;border-radius:50%;background:#22c55e}

/* security */
.biz-sec-section{padding:88px 32px;max-width:1100px;margin:0 auto}
.biz-sec-grid{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
.biz-sec-pillars{display:flex;flex-direction:column;gap:16px}
.biz-sec-pillar{display:flex;align-items:flex-start;gap:16px;background:#fff;border:1px solid var(--border);border-radius:var(--r-lg);padding:20px;box-shadow:var(--sh-sm);transition:border-color .2s}
.biz-sec-pillar:hover{border-color:var(--teal)}
.biz-sec-pillar-icon{width:40px;height:40px;border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px}
.biz-sec-pillar-title{font-size:14px;font-weight:700;color:var(--ink);margin-bottom:4px}
.biz-sec-pillar-desc{font-size:12px;color:var(--body);line-height:1.55}

/* onboarding */
.biz-onboard-section{background:linear-gradient(135deg,var(--blue-dk) 0%,var(--blue) 50%,var(--teal) 100%);padding:88px 32px}
.biz-onboard-inner{max-width:1000px;margin:0 auto;text-align:center}
.biz-onboard-kicker{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:rgba(42,200,190,.9);margin-bottom:10px;display:block}
.biz-onboard-h2{font-size:clamp(26px,3.5vw,40px);font-weight:700;letter-spacing:-.025em;line-height:1.14;color:#fff;margin-bottom:14px}
.biz-onboard-sub{font-size:15px;color:rgba(255,255,255,.7);max-width:480px;margin:0 auto 56px;line-height:1.7;display:block}
.biz-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;position:relative}
.biz-steps::before{content:'';position:absolute;top:28px;left:calc(12.5% + 14px);right:calc(12.5% + 14px);height:2px;background:rgba(255,255,255,.15);z-index:0}
.biz-step{text-align:center;position:relative;z-index:1}
.biz-step-circle{width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:20px;transition:background .2s}
.biz-step:hover .biz-step-circle{background:rgba(255,255,255,.2)}
.biz-step-num{font-size:10px;font-weight:700;font-family:var(--mono);color:rgba(255,255,255,.5);letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px}
.biz-step-title{font-size:14px;font-weight:700;color:#fff;margin-bottom:6px}
.biz-step-desc{font-size:12px;color:rgba(255,255,255,.65);line-height:1.55}

/* contact */
.biz-contact-section{padding:88px 32px;max-width:1100px;margin:0 auto}
.biz-contact-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:64px;align-items:flex-start}
.biz-contact-h2{font-size:clamp(24px,3vw,36px);font-weight:700;letter-spacing:-.025em;line-height:1.2;color:var(--ink);margin-bottom:14px}
.biz-contact-p{font-size:14px;color:var(--body);line-height:1.7;margin-bottom:28px}
.biz-contact-ways{display:flex;flex-direction:column;gap:12px}
.biz-contact-way{display:flex;align-items:center;gap:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);padding:14px 16px;box-shadow:var(--sh-sm)}
.biz-contact-way-icon{width:36px;height:36px;border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px}
.biz-contact-way-label{font-size:12px;color:var(--muted)}
.biz-contact-way-val{font-size:13px;font-weight:600;color:var(--ink)}

/* contact form (shared with ContactForm component) */
.form{background:#fff;border:1px solid var(--border);border-radius:var(--r-xl);padding:32px;box-shadow:var(--sh-md)}
.form-title{font-size:18px;font-weight:700;color:var(--ink);margin-bottom:4px}
.form-sub{font-size:13px;color:var(--muted);margin-bottom:24px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.form-group{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.form-label{font-size:12px;font-weight:600;color:var(--ink)}
.form-input,.form-select,.form-textarea{width:100%;border:1.5px solid var(--border);border-radius:var(--r-md);padding:10px 14px;font-family:var(--font);font-size:14px;color:var(--ink);background:#fff;transition:border-color .2s,box-shadow .2s;outline:none}
.form-input:focus,.form-select:focus,.form-textarea:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(11,150,160,.1)}
.form-textarea{resize:vertical;min-height:90px}
.form-submit{width:100%;padding:13px;border-radius:var(--r-md);background:linear-gradient(135deg,var(--blue),var(--teal));color:#fff;font-family:var(--font);font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 2px 12px rgba(26,84,168,.22);border:none}
.form-submit:hover:not(:disabled){box-shadow:0 6px 24px rgba(11,150,160,.38);transform:translateY(-1px)}
.form-submit:disabled{opacity:.6;cursor:not-allowed}
.form-note{font-size:11px;color:var(--muted);text-align:center;margin-top:12px;line-height:1.5}

/* footer */
.biz-footer{background:var(--ink);color:rgba(255,255,255,.7);padding:56px 32px 32px;font-family:var(--font)}
.biz-footer-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:40px;margin-bottom:48px}
.biz-footer-logo{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.biz-fl-wm{font-size:16px}
.biz-footer-tagline{font-size:13px;line-height:1.65;color:rgba(255,255,255,.4);max-width:220px}
.biz-footer-col-title{font-size:11px;font-weight:700;color:#fff;font-family:var(--mono);letter-spacing:.08em;text-transform:uppercase;margin-bottom:16px}
.biz-footer-links{display:flex;flex-direction:column;gap:10px}
.biz-footer-links a{font-size:13px;color:rgba(255,255,255,.45);transition:color .2s;text-decoration:none}
.biz-footer-links a:hover{color:rgba(255,255,255,.9)}
.biz-footer-bottom{max-width:1200px;margin:0 auto;border-top:1px solid rgba(255,255,255,.1);padding-top:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.biz-footer-copy{font-size:12px;color:rgba(255,255,255,.3)}
.biz-footer-legal{display:flex;gap:16px}
.biz-footer-legal a{font-size:12px;color:rgba(255,255,255,.3);transition:color .2s;text-decoration:none}
.biz-footer-legal a:hover{color:rgba(255,255,255,.7)}

/* responsive */
@media(max-width:1060px){
  .biz-hero-inner{grid-template-columns:1fr;gap:40px}
  .biz-dashboard{min-height:320px}
  .provider-panel{grid-template-columns:1fr}
  .pp-visual{display:none}
  .biz-ai-grid{grid-template-columns:1fr 1fr}
  .biz-int-grid{grid-template-columns:repeat(4,1fr)}
  .biz-value-grid{grid-template-columns:repeat(2,1fr)}
  .biz-footer-inner{grid-template-columns:1fr 1fr;gap:32px}
}
@media(max-width:760px){
  .biz-hero-content{padding-bottom:40px}
  .biz-steps{grid-template-columns:repeat(2,1fr)}.biz-steps::before{display:none}
  .biz-sec-grid{grid-template-columns:1fr}
  .biz-contact-grid{grid-template-columns:1fr}
  .form-row{grid-template-columns:1fr}
  .biz-ai-grid{grid-template-columns:1fr}
  .biz-int-grid{grid-template-columns:repeat(3,1fr)}
  .provider-tabs{flex-wrap:wrap}
  .ptab{flex:1 0 30%;border-right:none;border-bottom:1px solid var(--border)}
}
@media(max-width:480px){
  .biz-value-grid{grid-template-columns:1fr}
  .biz-int-grid{grid-template-columns:repeat(2,1fr)}
  .biz-steps{grid-template-columns:1fr 1fr}
  .biz-footer-inner{grid-template-columns:1fr}
  .biz-dash-body{grid-template-columns:1fr}
  .biz-dash-sidebar{display:none}
}
`;
