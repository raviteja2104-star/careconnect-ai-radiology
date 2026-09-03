'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, LifeBuoy, MessageCircle, Phone, Mail,
  CalendarClock, CreditCard, FileText, Video, SearchX,
} from 'lucide-react';
import { PageHeader, Badge, Button, Card, CardContent, EmptyState, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
  icon: React.ElementType;
}

// Mock help-center content — replace with CMS/API data when the support service ships.
const FAQS: Faq[] = [
  {
    id: 'faq-1',
    category: 'Appointments',
    icon: CalendarClock,
    question: 'How do I reschedule or cancel an appointment?',
    answer:
      'Open Appointments from the sidebar, select the visit you want to change, and choose Reschedule or Cancel. Changes made at least 4 hours before the slot are free; later changes may incur a fee depending on the department.',
  },
  {
    id: 'faq-2',
    category: 'Telemedicine',
    icon: Video,
    question: 'What do I need for a video consultation?',
    answer:
      'A device with a camera and microphone, a stable internet connection, and an up-to-date browser. Join from the link in your appointment reminder 5 minutes early — the virtual waiting room runs an automatic device check before you connect.',
  },
  {
    id: 'faq-3',
    category: 'Records',
    icon: FileText,
    question: 'How can I download my medical records and reports?',
    answer:
      'Go to Health Records, open the document you need, and use the Download button. Lab results and radiology reports are available as PDFs; DICOM images can be viewed in the browser or shared securely with another provider.',
  },
  {
    id: 'faq-4',
    category: 'Billing',
    icon: CreditCard,
    question: 'Where can I find my invoices and payment history?',
    answer:
      'Billing lives under your profile menu. Every consultation, lab test, and pharmacy order generates an itemized invoice in INR (₹). You can pay outstanding balances online and download GST-compliant receipts for insurance claims.',
  },
  {
    id: 'faq-5',
    category: 'Telemedicine',
    icon: Video,
    question: 'Is my video consultation private and secure?',
    answer:
      'Yes. All consultations are end-to-end encrypted and are never recorded without your explicit consent. If AI scribe features are enabled, you will be asked to consent before any transcription begins.',
  },
  {
    id: 'faq-6',
    category: 'Account',
    icon: LifeBuoy,
    question: 'How do I update my contact details or emergency contact?',
    answer:
      'Open Settings from your profile menu and edit the Personal Information section. Changes to your phone number require OTP verification to keep your account secure.',
  },
];

export default function supportPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const query = search.trim().toLowerCase();
  const filteredFaqs = FAQS.filter(
    (f) =>
      !query ||
      f.question.toLowerCase().includes(query) ||
      f.answer.toLowerCase().includes(query) ||
      f.category.toLowerCase().includes(query)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help & Support"
        description="Search the knowledge base or reach our care support team — we're here around the clock."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Support' }]}
        actions={<Badge tone="success" dot>Support online</Badge>}
      />

      {/* Hero search */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl gradient-brand p-6 text-primary-foreground shadow-float sm:p-10"
      >
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <LifeBuoy className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">How can we help you today?</h2>
          <p className="mt-1.5 text-sm text-primary-foreground/80">
            Answers about appointments, telemedicine, records, and billing.
          </p>
          <div className="mt-6 text-left">
            <Input
              icon={<Search />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help articles, e.g. “reschedule appointment”…"
              aria-label="Search help articles"
              className="h-12 rounded-2xl bg-card text-foreground shadow-pop"
            />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* FAQ list */}
        <div className="space-y-3 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Frequently asked questions
            </h3>
            <span className="text-xs tabular-nums text-subtle-foreground">
              {filteredFaqs.length} of {FAQS.length} articles
            </span>
          </div>

          {filteredFaqs.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No matching articles"
              description={`We couldn't find anything for “${search}”. Try a different keyword or contact our team below.`}
              action={{ label: 'Clear search', onClick: () => setSearch('') }}
            />
          ) : (
            filteredFaqs.map((faq, i) => {
              const isOpen = openId === faq.id;
              const Icon = faq.icon;
              return (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <Card
                    className={cn(
                      'overflow-hidden transition-shadow',
                      isOpen ? 'shadow-float' : 'hover:shadow-float'
                    )}
                  >
                    <button
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      aria-expanded={isOpen}
                      aria-controls={`${faq.id}-answer`}
                      className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
                    >
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-subtle-foreground">
                          {faq.category}
                        </span>
                        <span className="mt-0.5 block text-sm font-semibold text-foreground sm:text-base">
                          {faq.question}
                        </span>
                      </span>
                      <ChevronDown
                        className={cn(
                          'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
                          isOpen && 'rotate-180'
                        )}
                        aria-hidden
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`${faq.id}-answer`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="border-t border-border px-4 pb-5 pt-4 text-sm leading-relaxed text-muted-foreground sm:px-5 sm:pl-[76px]">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Contact rail */}
        <div className="space-y-4 xl:col-span-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Still need help?</h3>

          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MessageCircle className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Live chat</p>
                  <p className="text-xs text-muted-foreground">Typical reply in under 2 minutes</p>
                </div>
              </div>
              <Button className="w-full" onClick={() => router.push('/messages')}>
                <MessageCircle className="h-4 w-4" aria-hidden /> Start a chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
                  <Phone className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">24/7 helpline</p>
                  <p className="text-xs text-muted-foreground">For urgent, non-emergency help</p>
                </div>
              </div>
              <a
                href="tel:18001234567"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Phone className="h-4 w-4" aria-hidden /> 1800-123-4567
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                  <Mail className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Email us</p>
                  <p className="text-xs text-muted-foreground">Replies within one business day</p>
                </div>
              </div>
              <a
                href="mailto:support@careconnect.health"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Mail className="h-4 w-4" aria-hidden /> support@careconnect.health
              </a>
            </CardContent>
          </Card>

          <p className="px-1 text-[11px] leading-relaxed text-subtle-foreground">
            For medical emergencies, call your local emergency number or visit the nearest emergency department immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
