'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, LifeBuoy, MessageCircle, Phone, Mail,
  CalendarClock, CreditCard, FileText, Video, SearchX, type LucideIcon,
} from 'lucide-react';
import { PageHeader, Badge, Button, Card, CardContent, EmptyState, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

interface FaqData {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Appointments: CalendarClock,
  Telemedicine: Video,
  Records: FileText,
  'Medical Records': FileText,
  Billing: CreditCard,
  Account: LifeBuoy,
};

function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? LifeBuoy;
}

export default function SupportPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: faqRes, isLoading, isError } = useQuery<{ success: boolean; data: FaqData[] }>({
    queryKey: ['support-faqs'],
    queryFn: () => fetch(`${API_BASE}/api/support/faqs`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const allFaqs: FaqData[] = faqRes?.data ?? [];

  const query = search.trim().toLowerCase();
  const filteredFaqs = allFaqs.filter(
    (f) =>
      !query ||
      f.question.toLowerCase().includes(query) ||
      f.answer.toLowerCase().includes(query) ||
      f.category.toLowerCase().includes(query),
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
              placeholder={'Search help articles, e.g. "reschedule appointment"…'}
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
            {!isLoading && (
              <span className="text-xs tabular-nums text-subtle-foreground">
                {filteredFaqs.length} of {allFaqs.length} articles
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              icon={LifeBuoy}
              title="Could not load help articles"
              description="Check your connection and try again."
              action={{ label: 'Retry', onClick: () => window.location.reload() }}
            />
          ) : filteredFaqs.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No matching articles"
              description={
                query
                  ? `We couldn't find anything for "${search}". Try a different keyword or contact our team below.`
                  : 'No help articles available at the moment.'
              }
              action={query ? { label: 'Clear search', onClick: () => setSearch('') } : undefined}
            />
          ) : (
            filteredFaqs.map((faq, i) => {
              const isOpen = openId === faq.id;
              const Icon = getCategoryIcon(faq.category);
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
                      isOpen ? 'shadow-float' : 'hover:shadow-float',
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
                          isOpen && 'rotate-180',
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
                  <p className="text-sm font-semibold text-foreground">Email support</p>
                  <p className="text-xs text-muted-foreground">We respond within 24 hours</p>
                </div>
              </div>
              <a href="mailto:support@careconnect.health"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors">
                <MessageCircle className="h-4 w-4" aria-hidden /> Email us
              </a>
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
