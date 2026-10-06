'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, ShieldAlert, ShieldX, Clock, CheckCircle2,
  XCircle, AlertTriangle, Loader2, RotateCcw, FileHeart,
} from 'lucide-react';
import {
  PageHeader, Card, CardContent, Badge, Button, EmptyState,
} from '@/components/ui';
import { useSession } from '@/components/providers/SessionProvider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type ConsentRequest = {
  _id: string;
  consentRequestId: string;
  requesterName: string;
  purpose: string;
  purposeText?: string;
  hiTypes: string[];
  dateFrom?: string;
  dateTo?: string;
  status: 'REQUESTED' | 'GRANTED' | 'DENIED' | 'EXPIRED' | 'REVOKED';
  createdAt: string;
  grantedAt?: string;
  deniedAt?: string;
  revokedAt?: string;
};

const STATUS_LABEL: Record<ConsentRequest['status'], string> = {
  REQUESTED: 'Pending',
  GRANTED: 'Approved',
  DENIED: 'Denied',
  EXPIRED: 'Expired',
  REVOKED: 'Revoked',
};

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
const STATUS_TONE: Record<ConsentRequest['status'], BadgeTone> = {
  REQUESTED: 'warning',
  GRANTED: 'success',
  DENIED: 'danger',
  EXPIRED: 'neutral',
  REVOKED: 'neutral',
};

const HI_TYPE_LABEL: Record<string, string> = {
  DiagnosticReport: 'Diagnostic Reports',
  ImagingStudy: 'Imaging Studies',
  Prescription: 'Prescriptions',
  DischargeSummary: 'Discharge Summaries',
  OPConsultation: 'OP Consultations',
  WellnessRecord: 'Wellness Records',
};

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AbhaConsentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useSession();
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: res, isLoading, isError } = useQuery({
    queryKey: ['abha_consents'],
    enabled: !!session?.userId,
    staleTime: 30_000,
    queryFn: () =>
      fetch(`${API}/api/abdm/consents`, { headers: authHeaders() }).then(r => r.json()),
  });

  const consentMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'deny' | 'revoke' }) =>
      fetch(`${API}/api/abdm/consents/${id}/${action}`, {
        method: 'POST',
        headers: authHeaders(),
      }).then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.message ?? 'Action failed');
        return json;
      }),
    onMutate: ({ id }) => setActionId(id),
    onError: (err: Error) => { setActionError(err.message); setActionId(null); },
    onSuccess: () => {
      setActionId(null);
      queryClient.invalidateQueries({ queryKey: ['abha_consents'] });
    },
  });

  const consents: ConsentRequest[] = res?.data ?? [];
  const pending = consents.filter(c => c.status === 'REQUESTED');
  const history = consents.filter(c => c.status !== 'REQUESTED');

  const act = (id: string, action: 'approve' | 'deny' | 'revoke') => {
    setActionError(null);
    consentMutation.mutate({ id, action });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="ABHA Data Consent"
        description="Review and manage healthcare providers requesting access to your health records via ABDM."
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Patient', href: '/patient' },
          { label: 'Wallet', href: '/patient/wallet' },
          { label: 'ABHA Consent' },
        ]}
      />

      {/* Info card */}
      <Card>
        <CardContent className="flex items-start gap-3 py-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
          <div>
            <p className="text-sm font-semibold">Your data, your control</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Under India's ABDM framework, healthcare institutions (HIUs) must request your consent before
              accessing your health records. You can approve, deny, or revoke any request at any time.
            </p>
          </div>
        </CardContent>
      </Card>

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {actionError}
        </div>
      )}

      {/* Pending requests */}
      <section aria-label="Pending consent requests">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
          <Clock className="h-4 w-4 text-warning" aria-hidden />
          Pending Requests
          {pending.length > 0 && (
            <Badge tone="warning" dot pulse>{pending.length}</Badge>
          )}
        </h2>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading requests…
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-warning" aria-hidden />
              Could not load consent requests. Backend may be offline.
            </CardContent>
          </Card>
        ) : pending.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No pending requests"
            description="You have no outstanding consent requests. Any new request from a healthcare provider will appear here."
          />
        ) : (
          <div className="space-y-3">
            {pending.map(cr => (
              <Card key={cr._id}>
                <CardContent className="py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{cr.requesterName}</p>
                        <Badge tone={STATUS_TONE[cr.status]}>{STATUS_LABEL[cr.status]}</Badge>
                        {res?.demo && <Badge tone="neutral">Demo</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Purpose: <span className="font-medium text-foreground">{cr.purposeText ?? cr.purpose}</span>
                      </p>
                      {cr.hiTypes?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {cr.hiTypes.map(t => (
                            <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                              {HI_TYPE_LABEL[t] ?? t}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Records from <span className="font-medium text-foreground">{formatDate(cr.dateFrom)}</span> to{' '}
                        <span className="font-medium text-foreground">{formatDate(cr.dateTo)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">Requested {formatDate(cr.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => act(cr._id, 'deny')}
                        disabled={actionId === cr._id}
                        aria-label={`Deny consent from ${cr.requesterName}`}
                        className="text-destructive border-destructive/40 hover:bg-destructive/10"
                      >
                        {actionId === cr._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <XCircle className="h-3.5 w-3.5" aria-hidden />}
                        Deny
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => act(cr._id, 'approve')}
                        disabled={actionId === cr._id}
                        aria-label={`Approve consent from ${cr.requesterName}`}
                      >
                        {actionId === cr._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* History */}
      {history.length > 0 && (
        <section aria-label="Consent history">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <FileHeart className="h-4 w-4 text-muted-foreground" aria-hidden />
            History
          </h2>
          <div className="space-y-2">
            {history.map(cr => (
              <Card key={cr._id}>
                <CardContent className="py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{cr.requesterName}</p>
                        <Badge tone={STATUS_TONE[cr.status]}>{STATUS_LABEL[cr.status]}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {cr.status === 'GRANTED' && `Approved ${formatDate(cr.grantedAt)}`}
                        {cr.status === 'DENIED' && `Denied ${formatDate(cr.deniedAt)}`}
                        {cr.status === 'REVOKED' && `Revoked ${formatDate(cr.revokedAt)}`}
                        {cr.status === 'EXPIRED' && `Expired`}
                      </p>
                    </div>
                    {cr.status === 'GRANTED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => act(cr._id, 'revoke')}
                        disabled={actionId === cr._id}
                        aria-label={`Revoke access granted to ${cr.requesterName}`}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        {actionId === cr._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <RotateCcw className="h-3.5 w-3.5" aria-hidden />}
                        Revoke
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
