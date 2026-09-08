import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Privacy Policy — CareConnect',
    description: 'How CareConnect collects, uses, and protects your personal and health data. Compliant with India\'s Digital Personal Data Protection Act 2023.',
}

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-gray-100 bg-white/96 backdrop-blur-md sticky top-0 z-40">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center gap-4">
                    <Link href="/home" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                        ← CareConnect
                    </Link>
                    <span className="text-gray-300">|</span>
                    <span className="text-sm font-semibold text-gray-800">Privacy Policy</span>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 lg:py-16">
                {/* Title block */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 mb-4">
                        Last updated: September 2025
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 sm:text-4xl mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-base leading-relaxed text-gray-500 max-w-2xl">
                        CareConnect Health Technologies Pvt. Ltd. (&ldquo;CareConnect&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) is committed to protecting your personal and health data. This policy explains what we collect, how we use it, and your rights.
                    </p>
                </div>

                <div className="prose prose-gray max-w-none space-y-10">

                    {/* Section 1 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">1. Data We Collect</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We collect information that you provide directly, information generated through your use of the platform, and — with your explicit consent — health information shared by your care providers.
                        </p>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 space-y-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-800 mb-1">Identity &amp; Contact</p>
                                <p className="text-sm text-gray-500">Full name, email address, mobile number, date of birth, and gender, collected when you register or book an appointment.</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800 mb-1">Health Records</p>
                                <p className="text-sm text-gray-500">Prescriptions, lab reports, discharge summaries, diagnoses, and medical history — uploaded by you or shared by treating providers with your consent.</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800 mb-1">Appointment Data</p>
                                <p className="text-sm text-gray-500">Booking history, consultation notes (from teleconsultations), and appointment status updates.</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800 mb-1">Usage &amp; Device Data</p>
                                <p className="text-sm text-gray-500">IP address, browser type, pages visited, and interaction logs — used to improve the platform and detect fraud.</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800 mb-1">Location</p>
                                <p className="text-sm text-gray-500">City, area, or pincode entered when searching for nearby providers. Precise GPS location is requested only when you use the &ldquo;Near Me&rdquo; feature and is never stored without your permission.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Data</h2>
                        <ul className="space-y-2 text-gray-600 text-sm leading-relaxed list-none">
                            {[
                                'Providing healthcare discovery and booking services — connecting you with doctors, labs, hospitals, and pharmacies.',
                                'Managing your appointments, sending confirmations, reminders, and follow-up notifications.',
                                'Storing and displaying your health records in your secure health vault.',
                                'Enabling teleconsultations and sharing visit summaries with your consent.',
                                'Improving platform features through anonymised, aggregated usage analytics.',
                                'Complying with legal obligations, including tax, regulatory, and law-enforcement requirements.',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                    <span className="mt-1 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 text-sm text-gray-500 leading-relaxed">
                            We do not use your health data for advertising, profiling for commercial purposes, or sale to third parties.
                        </p>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Sharing</h2>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                            We share your data only in the following circumstances, and only to the extent necessary:
                        </p>
                        <div className="space-y-4">
                            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                                <p className="text-sm font-semibold text-gray-800 mb-1">With Treating Doctors &amp; Care Teams</p>
                                <p className="text-sm text-gray-500">When you book an appointment or initiate a teleconsultation, your name, contact details, and relevant health records are shared with the treating provider. This access is time-limited and consent-gated.</p>
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                                <p className="text-sm font-semibold text-gray-800 mb-1">With Diagnostic Labs &amp; Pharmacies</p>
                                <p className="text-sm text-gray-500">When you book a lab test or pharmacy service, your order and contact details are shared with the relevant provider. Health records are shared only with your explicit consent.</p>
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                                <p className="text-sm font-semibold text-gray-800 mb-1">With Service Providers</p>
                                <p className="text-sm text-gray-500">Trusted technology partners who operate parts of our infrastructure (cloud hosting, payment processing, SMS/email delivery) under strict confidentiality agreements. They process data only as instructed by us.</p>
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                                <p className="text-sm font-semibold text-gray-800 mb-1">When Required by Law</p>
                                <p className="text-sm text-gray-500">In response to valid legal process, court orders, or regulatory requirements. We notify you when permitted to do so.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">4. Security Measures</h2>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                            We implement industry-standard security controls designed for healthcare data:
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600 leading-relaxed list-none">
                            {[
                                'Encryption in transit: all data between your device and our servers uses TLS 1.3.',
                                'Encryption at rest: health records and sensitive fields are encrypted using AES-256-GCM with individual file-level envelope encryption.',
                                'Role-based access control: staff and provider access is strictly limited to what is needed for their role.',
                                'Immutable audit logs: every read, write, and share of health data is logged in a tamper-evident audit trail.',
                                'Regular security assessments and penetration testing.',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                    <span className="mt-1 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-teal-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 text-sm text-gray-500">
                            No system is perfectly secure. If you suspect unauthorised access to your account, contact us immediately at <a href="mailto:privacy@careconnect.health" className="text-blue-600 hover:underline">privacy@careconnect.health</a>.
                        </p>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">5. Your Rights</h2>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                            Under the Digital Personal Data Protection Act 2023 (DPDP Act) and applicable law, you have the following rights regarding your personal data:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { title: 'Access', desc: 'Request a copy of the personal data we hold about you.' },
                                { title: 'Correction', desc: 'Ask us to correct inaccurate or incomplete data.' },
                                { title: 'Deletion', desc: 'Request erasure of your personal data, subject to legal retention requirements.' },
                                { title: 'Withdrawal of Consent', desc: 'Withdraw consent for any data processing at any time. This does not affect prior lawful processing.' },
                                { title: 'Grievance Redressal', desc: 'Lodge a complaint with our Data Protection Officer or the Data Protection Board of India.' },
                                { title: 'Nominate a Representative', desc: 'Nominate a person to exercise your rights on your behalf in the event of incapacity or death.' },
                            ].map(right => (
                                <div key={right.title} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                    <p className="text-sm font-semibold text-gray-800 mb-1">{right.title}</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">{right.desc}</p>
                                </div>
                            ))}
                        </div>
                        <p className="mt-4 text-sm text-gray-500">
                            To exercise any of these rights, email <a href="mailto:support@careconnect.health" className="text-blue-600 hover:underline">support@careconnect.health</a>. We will respond within 30 days.
                        </p>
                    </section>

                    {/* Section 6 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">6. DPDP Act 2023 Compliance</h2>
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                            <p className="text-sm text-gray-700 leading-relaxed">
                                CareConnect is committed to compliance with India&apos;s <strong>Digital Personal Data Protection Act 2023</strong>. We process personal data only for specified, lawful purposes; we seek clear consent before processing sensitive health data; we do not transfer your data outside India except where required by law or with your explicit consent; and we maintain a Data Protection Officer who can be reached at <a href="mailto:privacy@careconnect.health" className="text-blue-700 hover:underline font-medium">privacy@careconnect.health</a>.
                            </p>
                        </div>
                    </section>

                    {/* Section 7 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">7. Data Retention</h2>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            We retain your account and health data for as long as your account is active, or as required by applicable law (including medical records retention requirements under Indian health regulations). When you request deletion, we remove your data within 30 days except where retention is legally mandated.
                        </p>
                    </section>

                    {/* Section 8 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">8. Children&apos;s Data</h2>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            CareConnect supports managing healthcare for family members including minors. When a child&apos;s data is added by a parent or guardian, the consenting adult is responsible for the accuracy of that data. We do not knowingly collect data from children under 18 without verified parental consent.
                        </p>
                    </section>

                    {/* Section 9 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">9. Changes to This Policy</h2>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of material changes via email or an in-app notice at least 14 days before the changes take effect. Continued use of the platform after that date constitutes acceptance of the updated policy.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Contact &amp; Grievances</h2>
                        <p className="text-sm text-gray-500 leading-relaxed mb-3">
                            For privacy-related queries, data requests, or to reach our Data Protection Officer:
                        </p>
                        <p className="text-sm font-medium text-gray-700">
                            Email: <a href="mailto:privacy@careconnect.health" className="text-blue-600 hover:underline">privacy@careconnect.health</a>
                        </p>
                        <p className="text-sm font-medium text-gray-700 mt-1">
                            Support: <a href="mailto:support@careconnect.health" className="text-blue-600 hover:underline">support@careconnect.health</a>
                        </p>
                        <p className="text-sm text-gray-500 mt-3">
                            CareConnect Health Technologies Pvt. Ltd.<br />
                            India
                        </p>
                    </section>

                </div>

                {/* Footer links */}
                <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-400">
                    <Link href="/home" className="hover:text-gray-600 transition-colors">Home</Link>
                    <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
                    <Link href="/support" className="hover:text-gray-600 transition-colors">Support</Link>
                </div>
            </main>
        </div>
    )
}
