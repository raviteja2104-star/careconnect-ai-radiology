'use client';
import React, { useEffect, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Users, IndianRupee, FileSignature,
  Video, CheckCircle2, AlertTriangle, Ticket, Wallet,
  Clock, X, Loader2, ShieldCheck, Fingerprint, Phone, ArrowRight, ShieldAlert,
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
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // ABHA enrollment OTP flow
  type EnrollStep = 'idle' | 'method' | 'generating' | 'otp' | 'verifying' | 'done';
  const [enrollStep, setEnrollStep] = useState<EnrollStep>('idle');
  const [enrollMethod, setEnrollMethod] = useState<'aadhaar' | 'mobile'>('aadhaar');
  const [enrollInput, setEnrollInput] = useState('');
  const [enrollTxnId, setEnrollTxnId] = useState('');
  const [enrollOtp, setEnrollOtp] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [enrolledAbha, setEnrolledAbha] = useState('');

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

  const generateAbhaOtp = useCallback(async () => {
    setEnrollStep('generating');
    setEnrollError('');
    try {
      const res = await fetch(`${API}/api/abdm/generate-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ [enrollMethod]: enrollInput, method: enrollMethod }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'OTP request failed');
      setEnrollTxnId(json.data.txnId);
      setEnrollStep('otp');
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : 'Failed to send OTP');
      setEnrollStep('method');
    }
  }, [enrollMethod, enrollInput]);

  const verifyAbhaOtp = useCallback(async () => {
    setEnrollStep('verifying');
    setEnrollError('');
    try {
      const res = await fetch(`${API}/api/abdm/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ txnId: enrollTxnId, otp: enrollOtp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'OTP verification failed');
      setEnrolledAbha(json.data.abhaAddress ?? json.data.abhaNumber ?? '');
      setEnrollStep('done');
      queryClient.invalidateQueries({ queryKey: ['patient_wallet', patientId] });
      await refetch();
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : 'OTP incorrect or expired');
      setEnrollStep('otp');
    }
  }, [enrollTxnId, enrollOtp, patientId, queryClient, refetch]);

  const abhaId = wallet.profile?.abhaId;
  const actionCount = wallet.pendingInvoices.length + wallet.pendingConsents.length;

  useEffect(() => {
    if (!showQR || !abhaId) return;
    QRCode.toDataURL(abhaId, { width: 256, margin: 2 })
      .then(url => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [showQR, abhaId]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health Wallet"
        description="Your ABHA identity, live queue tokens, invoices, and consultation sessions."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Patient', href: '/patient' }, { label: 'Wallet' }]}
        actions={
          <Button variant="outline" disabled={!abhaId} onClick={() => setShowQR(true)} title={abhaId ? undefined : 'ABHA ID not enrolled'}>
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
                    {enrollStep === 'done' ? enrolledAbha : abhaId}
                  </h2>
                ) : enrollStep === 'idle' ? (
                  <button
                    onClick={() => setEnrollStep('method')}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm hover:bg-white/30 transition-colors"
                  >
                    <Fingerprint className="h-3.5 w-3.5" aria-hidden /> Enroll ABHA <ArrowRight className="h-3 w-3" aria-hidden />
                  </button>
                ) : enrollStep === 'method' ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <button onClick={() => setEnrollMethod('aadhaar')} className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-colors ${enrollMethod === 'aadhaar' ? 'bg-white/40' : 'bg-white/20 hover:bg-white/30'}`}>
                        <Fingerprint className="h-3 w-3" aria-hidden /> Aadhaar
                      </button>
                      <button onClick={() => setEnrollMethod('mobile')} className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-colors ${enrollMethod === 'mobile' ? 'bg-white/40' : 'bg-white/20 hover:bg-white/30'}`}>
                        <Phone className="h-3 w-3" aria-hidden /> Mobile
                      </button>
                    </div>
                    <input
                      type="text"
                      value={enrollInput}
                      onChange={e => setEnrollInput(e.target.value)}
                      placeholder={enrollMethod === 'aadhaar' ? 'Aadhaar number' : 'Mobile number'}
                      className="w-full rounded bg-white/20 px-2 py-1 text-xs placeholder-white/60 outline-none focus:bg-white/30"
                    />
                    {enrollError && <p className="text-xs text-red-200">{enrollError}</p>}
                    <div className="flex gap-2">
                      <button onClick={generateAbhaOtp} disabled={!enrollInput} className="rounded bg-white/30 px-2 py-1 text-xs font-semibold disabled:opacity-50 hover:bg-white/40">
                        Send OTP
                      </button>
                      <button onClick={() => { setEnrollStep('idle'); setEnrollError(''); setEnrollInput(''); }} className="text-xs opacity-70 hover:opacity-100">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : enrollStep === 'generating' ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs opacity-80"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Sending OTP…</p>
                ) : enrollStep === 'otp' ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs opacity-80">Enter the OTP sent to your {enrollMethod}</p>
                    <input
                      type="text"
                      value={enrollOtp}
                      onChange={e => setEnrollOtp(e.target.value)}
                      maxLength={6}
                      placeholder="6-digit OTP"
                      className="w-32 rounded bg-white/20 px-2 py-1 text-xs placeholder-white/60 outline-none focus:bg-white/30 tabular-nums tracking-widest"
                    />
                    {enrollError && <p className="text-xs text-red-200">{enrollError}</p>}
                    <div className="flex gap-2">
                      <button onClick={verifyAbhaOtp} disabled={enrollOtp.length < 4} className="rounded bg-white/30 px-2 py-1 text-xs font-semibold disabled:opacity-50 hover:bg-white/40">
                        Verify
                      </button>
                      <button onClick={() => { setEnrollStep('idle'); setEnrollError(''); setEnrollOtp(''); }} className="text-xs opacity-70 hover:opacity-100">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : enrollStep === 'verifying' ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs opacity-80"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Verifying…</p>
                ) : enrollStep === 'done' ? (
                  <div className="mt-1">
                    <p className="flex items-center gap-1 text-xs text-green-200"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> ABHA created</p>
                    <h2 className="mt-0.5 text-lg font-extrabold tracking-[0.2em] tabular-nums">{enrolledAbha}</h2>
                  </div>
                ) : null}
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

      {/* ABHA Consent Management link */}
      <Link
        href="/patient/consent"
        className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft">
            <ShieldAlert className="h-4.5 w-4.5 text-brand" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold">ABHA Data Consent</p>
            <p className="text-xs text-muted-foreground">Manage health record sharing requests</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
      </Link>

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
                          Dr. {[(session.doctor as {firstName?: string; lastName?: string; name?: string} | undefined)?.firstName, (session.doctor as {firstName?: string; lastName?: string; name?: string} | undefined)?.lastName].filter(Boolean).join(' ') || session.doctor?.name || 'Assigned Doctor'}
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

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && abhaId && (
          <motion.div
            key="qr-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                  <ShieldCheck className="h-5 w-5 text-primary" aria-hidden /> ABHA Health ID
                </h2>
                <button
                  onClick={() => setShowQR(false)}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={`QR code for ABHA ID ${abhaId}`} className="mx-auto mb-4 rounded-lg" width={200} height={200} />
              ) : (
                <div className="mx-auto mb-4 flex h-[200px] w-[200px] items-center justify-center rounded-lg bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
                </div>
              )}
              <p className="font-mono text-sm font-bold tracking-widest text-foreground">{abhaId}</p>
              <p className="mt-1 text-xs text-muted-foreground">{patientDisplayName}</p>
              <p className="mt-4 text-xs text-muted-foreground">Show this QR at registration or pharmacy counters.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
