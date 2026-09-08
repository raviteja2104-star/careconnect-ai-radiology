import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Terms of Service — CareConnect',
    description: 'Terms and conditions governing the use of CareConnect\'s healthcare platform, including appointment booking, payment, and account policies.',
}

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-gray-100 bg-white/96 backdrop-blur-md sticky top-0 z-40">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center gap-4">
                    <Link href="/home" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                        ← CareConnect
                    </Link>
                    <span className="text-gray-300">|</span>
                    <span className="text-sm font-semibold text-gray-800">Terms of Service</span>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 lg:py-16">
                {/* Title block */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 mb-4">
                        Last updated: September 2025
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 sm:text-4xl mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-base leading-relaxed text-gray-500 max-w-2xl">
                        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the CareConnect platform operated by CareConnect Health Technologies Pvt. Ltd. (&ldquo;CareConnect&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;). By accessing or using the platform, you agree to these Terms.
                    </p>
                </div>

                <div className="prose prose-gray max-w-none space-y-10">

                    {/* Section 1 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">1. Platform Use</h2>
                        <p className="text-sm text-gray-600 leading-relaxed mb-3">
                            CareConnect provides a digital healthcare discovery and management platform. You may use the platform to find healthcare providers, book appointments, manage health records, and access teleconsultation services.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600 leading-relaxed list-none">
                            {[
                                'You must be at least 18 years old to create an account. Minors may be added as family members under a verified adult account.',
                                'You are responsible for maintaining the confidentiality of your account credentials.',
                                'You must not use the platform for any unlawful purpose or in a manner that could harm other users, providers, or the integrity of the platform.',
                                'Automated scraping, bulk data extraction, and reverse engineering of the platform are prohibited.',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                    <span className="mt-1 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">2. Healthcare Service Disclaimer</h2>
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                            <p className="text-sm font-semibold text-amber-800 mb-2">Important — Please Read</p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                <strong>CareConnect is a technology platform, not a healthcare provider.</strong> We facilitate connections between patients and independent healthcare professionals and organisations. We do not provide medical advice, diagnoses, or treatment. The healthcare providers listed on our platform are independent professionals responsible for their own services, standards of care, and clinical decisions.
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed mt-3">
                                Any AI-assisted features on the platform are decision-support tools for licensed clinicians. They do not constitute medical advice and require clinician review before any action is taken.
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed mt-3">
                                In a medical emergency, call 112 or your local emergency number. Do not rely on this platform for emergency care.
                            </p>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">3. User Responsibilities</h2>
                        <p className="text-sm text-gray-600 leading-relaxed mb-3">You agree to:</p>
                        <ul className="space-y-2 text-sm text-gray-600 leading-relaxed list-none">
                            {[
                                'Provide accurate and complete information when registering, booking appointments, or uploading health records.',
                                'Keep your contact details and health profile up to date.',
                                'Attend booked appointments or cancel them with adequate notice (see Appointment Booking Terms below).',
                                'Use health records and information on the platform solely for your own healthcare management.',
                                'Treat healthcare providers and platform staff with respect.',
                                'Report any inaccuracies in provider listings or platform information to support@careconnect.health.',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                    <span className="mt-1 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">4. Appointment Booking Terms</h2>
                        <div className="space-y-3">
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                <p className="text-sm font-semibold text-gray-800 mb-1">Booking Confirmation</p>
                                <p className="text-sm text-gray-500 leading-relaxed">A booking is confirmed when you receive a confirmation notification via email or SMS. Until confirmed, slot availability is not guaranteed.</p>
                            </div>
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                <p className="text-sm font-semibold text-gray-800 mb-1">Cancellations &amp; Rescheduling</p>
                                <p className="text-sm text-gray-500 leading-relaxed">You may cancel or reschedule an appointment up to 2 hours before the scheduled time at no charge. Cancellations within 2 hours may be subject to the provider&apos;s cancellation policy. Some providers charge a non-refundable booking fee — this is disclosed at the time of booking.</p>
                            </div>
                            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                <p className="text-sm font-semibold text-gray-800 mb-1">Provider Cancellations</p>
                                <p className="text-sm text-gray-500 leading-relaxed">If a provider cancels your appointment, you will receive a full refund of any platform-collected booking fee and the option to reschedule.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">5. Payment Terms</h2>
                        <p className="text-sm text-gray-600 leading-relaxed mb-3">
                            Payments for services booked through CareConnect are processed securely via our payment partners. By completing a payment, you agree to the following:
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600 leading-relaxed list-none">
                            {[
                                'All prices are displayed in Indian Rupees (INR) inclusive of applicable taxes unless stated otherwise.',
                                'Platform booking fees, where applicable, are clearly disclosed before payment.',
                                'Consultation fees are set by the healthcare provider and may change. The fee shown at booking is the fee you will be charged.',
                                'Refunds for cancelled appointments are processed within 5–7 business days to the original payment method.',
                                'CareConnect is not responsible for fee disputes between you and an independent healthcare provider for services rendered.',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5">
                                    <span className="mt-1 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Section 6 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">6. Intellectual Property</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            All platform content — including the CareConnect name, logo, software, design, and text — is owned by or licensed to CareConnect Health Technologies Pvt. Ltd. You may not reproduce, distribute, or create derivative works without our prior written permission. Your health records and personal data remain yours.
                        </p>
                    </section>

                    {/* Section 7 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">7. Limitation of Liability</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            To the maximum extent permitted by applicable law, CareConnect is not liable for any indirect, incidental, or consequential damages arising from your use of the platform, including adverse outcomes from healthcare services received from independent providers listed on the platform. Our total liability to you for any claim arising from platform use is limited to the fees you paid to CareConnect in the 12 months prior to the claim.
                        </p>
                    </section>

                    {/* Section 8 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">8. Account Termination</h2>
                        <p className="text-sm text-gray-600 leading-relaxed mb-3">
                            You may close your account at any time from your account settings or by contacting support. We will delete your personal data within 30 days, subject to legal retention requirements.
                        </p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            We may suspend or terminate your account if we determine, in our reasonable judgment, that you have violated these Terms, engaged in fraudulent activity, or used the platform in a manner harmful to other users or providers. We will notify you of the reason unless prohibited by law.
                        </p>
                    </section>

                    {/* Section 9 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">9. Governing Law</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            These Terms are governed by the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana, India.
                        </p>
                    </section>

                    {/* Section 10 */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">10. Changes to These Terms</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            We may update these Terms from time to time. Material changes will be communicated via email or in-app notice at least 14 days before they take effect. Continued use of the platform after that date constitutes your acceptance of the updated Terms.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Questions &amp; Legal Contact</h2>
                        <p className="text-sm text-gray-500 leading-relaxed mb-3">
                            For questions about these Terms or to contact our legal team:
                        </p>
                        <p className="text-sm font-medium text-gray-700">
                            Email: <a href="mailto:legal@careconnect.health" className="text-blue-600 hover:underline">legal@careconnect.health</a>
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
                    <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
                    <Link href="/support" className="hover:text-gray-600 transition-colors">Support</Link>
                </div>
            </main>
        </div>
    )
}
