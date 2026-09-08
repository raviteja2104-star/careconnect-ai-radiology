'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Users, IndianRupee, FileSignature,
  Video, CheckCircle2, AlertTriangle, Ticket, Wallet,
  Clock, X, Loader2, ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PageHeader, StatCard, StatGrid, Card, CardContent, Button, Badge, EmptyState,
} from '@/components/ui';
import { useSession } from '@/components/providers/SessionProvider';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type ActiveToken = {
  _id?: string;
  department?: string;
  tokenNumber?: string | number;
  status?: string;
};

type PendingInvoice = {
  _id?: string;
  amountDue?: number;
  type?: string;
  invoiceNumber?: string;
};

type PendingConsent = {
  _id?: string;
  title?: string;
  status?: string;
};

type TelemedicineSession = {
  _id?: string;
  doctor?: { name?: string };
  status?: string;
};

type WalletData = {
  profile?: { abhaId?: string; firstName?: string; lastName?: string };
  activeTokens: ActiveToken[];
  pendingInvoices: PendingInvoice[];
  pendingConsents: PendingConsent[];
  appointments: unknown[];
  telemedicine: TelemedicineSession[];
};

export default function DigitalHealthWallet() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useSession();
  const patientId = session?.userId ?? null;
  const patientDisplayName = session?.name ?? 'Patient';

  const [signingConsentId, setSigningConsentId] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  const { data: walletRes, refetch, isFetching } = useQuery({
    queryKey: ['patient_wallet', patientId],
    enabled: !!patientId,
    staleTime: 30_000,
    queryFn: () =>
      fetch(`${API}/api/patient/${patientId}/wallet`, {
        headers: authHeaders(),
      }).then(res => res.json()),
  });

  const wallet: WalletData = walletRes?.data ?? {
    activeTokens: [],
    pendingInvoices: [],
    pendingConsents: [],
    appointments: [],
    telemedicine: [],
  };

  // Live updates via Socket.io
  useEffect(() => {
    const socket = io(API);
    const handleRefresh = () => refetch();
    socket.on('QUEUE_UPDATED', handleRefresh);
    socket.on('INVOICE_CREATED', handleRefresh);
    socket.on('CONSENT_REQUESTED', handleRefresh);
    socket.on('MESSAGE_SENT', handleRefresh);
    return () => { socket.disconnect(); };
  }, [refetch]);

  const signConsent = useCallback(async (consentId: string) => {
    setSigningConsentId(consentId);
    setSignError(null);
    try {
      const res = await fetch(`${API}/api/consents/${consentId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ signerType: 'PATIENT', signerName: patientDisplayName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Signature failed');
      queryClient.invalidateQueries({ queryKey: ['patient_wallet', patientId] });
      await refetch();
    } catch (err) {
      setSignError(err instanceof Error ? err.message : 'Could not sign consent');
    } finally {
      setSigningConsentId(null);
    }
  }, [patientDisplayName, patientId, queryClient, refetch]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const actionCount = wallet.pendingInvoices.length + wallet.pendingConsents.length;

  const abhaId = wallet.profile?.abhaId;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health Wallet"
        description="Your ABHA identity, live queue tokens, invoices, and consultation sessions."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Patient', href: '/patient' }, { label: 'Wallet' }]}
        actions={
          <Button variant="outline" disabled title="QR sharing requires ABHA enrollment — coming soon">
            <QrCode className="h-4 w-4" aria-hidden /> Show QR
          </Button>
        }
      />

      {/* ABHA / QR identity card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card variant="gradient" className="overflow-hidden rounded-3xl">
          <CardContent className="relative p-6 sm:p-8">
            <span
              className="pointer-events-none absolute -mr-10 -mt-10 right-0 top-0 h-32 w-32 rounded-bl-full bg-white/10"
              aria-hidden
            />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">ABHA Health ID</p>
                {abhaId ? (
                  <h2 className="mt-1 text-xl font-extrabold tracking-[0.2em] tabular-nums sm:text-2xl">
                    {abhaId}
                  </h2>
                ) : (
                  <p className="mt-1 text-sm font-semibold opacity-70 italic">
                    Not enrolled — visit registration desk
                  </p>
                )}
              </div>
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/20 backdrop-blur-md">
                {abhaId ? <QrCode className="h-6 w-6" aria-hidden /> : <Wallet className="h-6 w-6" aria-hidden />}
              </span>
            </div>
            <p className="relative mt-6 text-sm font-medium opacity-90">{patientDisplayName}</p>
          </CardContent>
        </Card>
      </motion.div>

      <StatGrid>
        <StatCard
          label="Live Queue Tokens"
          value={wallet.activeTokens.length}
          sub="Physical hospital visits"
          icon={Ticket}
          tone="emerald"
          delay={0}
        />
        <StatCard
          label="Pending Invoices"
          value={wallet.pendingInvoices.length}
          sub="Awaiting payment"
          icon={IndianRupee}
          tone="amber"
          delay={0.05}
        />
        <StatCard
          label="Pending Consents"
          value={wallet.pendingConsents.length}
          sub="Need your signature"
          icon={FileSignature}
          tone="brand"
          delay={0.1}
        />
        <StatCard
          label="Virtual Consults"
          value={wallet.telemedicine.length}
          sub="Telemedicine sessions"
          icon={Video}
          tone="violet"
          delay={0.15}
        />
      </StatGrid>

      {/* Sign error toast */}
      <AnimatePresence>
        {signError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"
          >
            <span className="text-sm text-destructive">{signError}</span>
            <button onClick={() => setSignError(null)} className="ml-4 text-destructive hover:opacity-70">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Required Section */}
      {actionCount > 0 && (
        <section aria-label="Action required">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <AlertTriangle className="h-4 w-4 text-warning" aria-hidden /> Action Required
            <Badge tone="warning" dot pulse>{actionCount}</Badge>
          </h3>
          <div className="space-y-3">
            {wallet.pendingInvoices.map((inv, i) => (
              <motion.div
                key={inv._id ?? i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-center justify-between rounded-2xl border border-warning/30 bg-warning-soft p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                    <IndianRupee className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {inv.invoiceNumber ?? 'Pay Invoice'}
                    </p>
                    <p className="text-xs font-medium text-warning">
                      {formatCurrency(inv.amountDue ?? 0)} Due{inv.type ? ` • ${inv.type}` : ''}
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => router.push('/billing')}>Pay Now</Button>
              </motion.div>
            ))}

            {wallet.pendingConsents.map((consent, i) => (
              <motion.div
                key={consent._id ?? i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: (wallet.pendingInvoices.length + i) * 0.05 }}
                className="flex items-center justify-between rounded-2xl border border-info/30 bg-info-soft p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                    <FileSignature className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">Sign Consent</p>
                    <p className="text-xs font-medium text-info">{consent.title ?? 'Medical consent form'}</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={signingConsentId === consent._id}
                  onClick={() => consent._id && signConsent(consent._id)}
                >
                  {signingConsentId === consent._id ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Signing…</>
                  ) : (
                    <><ShieldCheck className="h-3.5 w-3.5 mr-1" />Review &amp; Sign</>
                  )}
                </Button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Live Hospital Visits (Tokens & Telemedicine) */}
      <section aria-label="Live visits and queues">
        <h3 className="mb-3 text-sm font-bold text-foreground">Live Visits &amp; Queues</h3>

        {wallet.activeTokens.length === 0 && wallet.telemedicine.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No active visits"
            description="You're all caught up for today."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {wallet.activeTokens.map((token, i) => (
              <motion.div
                key={token._id ?? i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
              >
                <Card className="relative overflow-hidden">
                  <span
                    className="pointer-events-none absolute -mr-2 -mt-2 right-0 top-0 h-12 w-12 rounded-bl-full bg-success/10"
                    aria-hidden
                  />
                  <CardContent className="p-5">
                    <div className="relative mb-4 flex items-start justify-between">
                      <div>
                        <Badge tone="success" dot pulse>Live Queue</Badge>
                        <h4 className="mt-2 text-base font-bold text-foreground">{token.department}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Your Token
                        </p>
                        <p className="text-2xl font-extrabold tabular-nums text-primary">{token.tokenNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-subtle-foreground" aria-hidden />
                        <span className="text-xs text-muted-foreground">
                          Status: <strong className="text-foreground">{token.status ?? 'WAITING'}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        <span>Check display board</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {wallet.telemedicine.map((session, i) => (
              <motion.div
                key={session._id ?? i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: (wallet.activeTokens.length + i) * 0.05 }}
              >
                <Card variant="glass" className="relative overflow-hidden">
                  <span
                    className="pointer-events-none absolute -mr-2 -mt-2 right-0 top-0 h-12 w-12 rounded-bl-full bg-primary/10"
                    aria-hidden
                  />
                  <CardContent className="p-5">
                    <div className="relative mb-4 flex items-start justify-between">
                      <div>
                        <Badge tone="brand" dot pulse>Virtual Consult</Badge>
                        <h4 className="mt-2 text-base font-bold text-foreground">
                          Dr. {session.doctor?.name ?? 'Assigned Doctor'}
                        </h4>
                      </div>
                    </div>

                    <Link
                      href={`/telemedicine/patient/${session._id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:opacity-90"
                    >
                      <Video className="h-4 w-4" aria-hidden /> Join Waiting Room
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Background refresh indicator */}
      {isFetching && (
        <p className="text-center text-xs text-muted-foreground">
          <Loader2 className="inline h-3 w-3 animate-spin mr-1" />Refreshing wallet…
        </p>
      )}
    </div>
  );
}
