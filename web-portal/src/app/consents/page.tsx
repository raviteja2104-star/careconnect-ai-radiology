'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, CheckCircle2, Clock, ChevronDown, ChevronUp, ShieldCheck,
  Loader2, AlertTriangle,
} from 'lucide-react';
import {
  PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, Button, EmptyState, Skeleton,
} from '@/components/ui';
import { useSession } from '@/components/providers/SessionProvider';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care'}/api`;

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ConsentDocument {
  _id: string;
  title: string;
  content: string;
  templateId: string;
  status: 'REQUESTED' | 'VIEWED' | 'SIGNED' | 'REJECTED' | 'EXPIRED';
  language: string;
  createdAt: string;
  appointment?: { _id: string };
  signatures: Array<{
    signerType: string;
    signerName: string;
    signedAt: string;
  }>;
}

const STATUS_TONE: Record<ConsentDocument['status'], 'info' | 'success' | 'danger' | 'neutral'> = {
  REQUESTED: 'info',
  VIEWED: 'info',
  SIGNED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'neutral',
};

function useConsents(patientId: string) {
  return useQuery<ConsentDocument[]>({
    queryKey: ['consents', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const res = await fetch(`${API_BASE}/consents?patientId=${encodeURIComponent(patientId)}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to load consents (${res.status})`);
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
    enabled: !!patientId,
    staleTime: 30_000,
  });
}

function useSignConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ consentId, signerName }: { consentId: string; signerName: string }) => {
      const res = await fetch(`${API_BASE}/consents/${consentId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          signerType: 'PATIENT',
          signerName,
          signatureData: `patient-agreed-${Date.now()}`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Sign failed (${res.status})`);
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['consents'] });
    },
  });
}

function ConsentCard({ consent, patientName }: { consent: ConsentDocument; patientName: string }) {
  const [expanded, setExpanded] = useState(false);
  const [signed, setSigned] = useState(consent.status === 'SIGNED');
  const signMutation = useSignConsent();

  const handleAgree = async () => {
    await signMutation.mutateAsync({ consentId: consent._id, signerName: patientName });
    setSigned(true);
  };

  const isPending = consent.status === 'REQUESTED' || consent.status === 'VIEWED';
  const formattedDate = new Date(consent.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className={signed ? 'border-success/30' : isPending ? 'border-warning/30' : undefined}>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${signed ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                {signed ? (
                  <CheckCircle2 className="h-5 w-5" aria-hidden />
                ) : (
                  <FileText className="h-5 w-5" aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <CardTitle className="text-base">{consent.title}</CardTitle>
                <CardDescription className="mt-0.5">
                  <span className="inline-flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden />
                      Requested {formattedDate}
                    </span>
                    {consent.templateId && (
                      <Badge tone="neutral" className="font-mono text-[10px] uppercase">
                        {consent.templateId.replace(/_/g, ' ')}
                      </Badge>
                    )}
                    {consent.language && consent.language !== 'English' && (
                      <Badge tone="neutral" className="text-[10px]">{consent.language}</Badge>
                    )}
                  </span>
                </CardDescription>
              </div>
            </div>
            <Badge tone={signed ? 'success' : STATUS_TONE[consent.status]} dot={isPending || signed}>
              {signed ? 'Signed' : consent.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {!signed && isPending && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              <span>{expanded ? 'Hide consent text' : 'Review & Sign'}</span>
              {expanded ? (
                <ChevronUp className="h-4 w-4" aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden />
              )}
            </Button>
          )}

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="consent-text"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-muted/50 p-4 text-sm leading-relaxed text-foreground scrollbar-thin">
                    {consent.content}
                  </div>

                  {signMutation.isError && (
                    <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                      <span>{(signMutation.error as Error)?.message ?? 'Failed to sign. Please try again.'}</span>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleAgree}
                    disabled={signMutation.isPending}
                  >
                    {signMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Signing…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" aria-hidden />
                        I Agree — Sign Consent
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {signed && (
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              <span>
                {consent.signatures?.[0]
                  ? `Signed on ${new Date(consent.signatures[0].signedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : 'Consent signed successfully.'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ConsentsPage() {
  const { session } = useSession();
  const patientId = session.userId;
  const patientName = session.name ?? 'Patient';

  const { data: consents, isLoading, isError, error } = useConsents(patientId);

  const pending = consents?.filter((c) => c.status === 'REQUESTED' || c.status === 'VIEWED') ?? [];
  const completed = consents?.filter((c) => c.status === 'SIGNED' || c.status === 'REJECTED' || c.status === 'EXPIRED') ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consent Documents"
        description="Review and sign consent forms requested by your care team before procedures or teleconsultations."
        crumbs={[{ label: 'Home', href: '/patient' }, { label: 'Consents' }]}
        actions={
          pending.length > 0 ? (
            <Badge tone="warning" dot pulse>
              {pending.length} pending signature{pending.length !== 1 ? 's' : ''}
            </Badge>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
          <span>
            Unable to load consent documents.{' '}
            {(error as Error)?.message}
          </span>
        </div>
      )}

      {!isLoading && !isError && consents && consents.length === 0 && (
        <EmptyState
          icon={CheckCircle2}
          title="No consent documents"
          description="Your care team has not requested any consent documents yet. Pending consents will appear here before procedures or teleconsultations."
        />
      )}

      {!isLoading && !isError && pending.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Pending — requires your signature
          </h2>
          {pending.map((consent) => (
            <ConsentCard key={consent._id} consent={consent} patientName={patientName} />
          ))}
        </section>
      )}

      {!isLoading && !isError && completed.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Completed
          </h2>
          {completed.map((consent) => (
            <ConsentCard key={consent._id} consent={consent} patientName={patientName} />
          ))}
        </section>
      )}
    </div>
  );
}
