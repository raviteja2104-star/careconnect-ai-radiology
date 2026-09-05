'use client';
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import {
  QrCode, Users, IndianRupee, FileSignature,
  Video, Calendar, CheckCircle2, AlertTriangle, Ticket, Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PageHeader, StatCard, StatGrid, Card, CardContent, Button, Badge, EmptyState,
} from '@/components/ui';

export default function DigitalHealthWallet() {
  const router = useRouter();
  const [wallet, setWallet] = useState<any>({
    activeTokens: [], pendingInvoices: [], pendingConsents: [], appointments: [], telemedicine: []
  });

  // MOCK: using a hardcoded patient ID for demonstration
  const patientId = '66a1e3b5e4b0c12345678901';

  const { data: walletRes, refetch } = useQuery({
    queryKey: ['patient_wallet', patientId],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care'}/api/patient/${patientId}/wallet`).then(res => res.json())
  });

  useEffect(() => {
    if (walletRes?.data) {
      setWallet(walletRes.data);
    }
  }, [walletRes]);

  // Hook into Event Bus for live updates on the patient's phone
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care');

    const handleRefresh = () => refetch();

    socket.on('QUEUE_UPDATED', handleRefresh);
    socket.on('INVOICE_CREATED', handleRefresh);
    socket.on('CONSENT_REQUESTED', handleRefresh);
    socket.on('MESSAGE_SENT', handleRefresh);

    return () => { socket.disconnect(); };
  }, [refetch]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const actionCount = wallet.pendingInvoices.length + wallet.pendingConsents.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health Wallet"
        description="Your ABHA identity, live queue tokens, invoices, and consultation sessions."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Patient', href: '/patient' }, { label: 'Wallet' }]}
        actions={
          <Button variant="outline" disabled title="Coming soon">
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
                <h2 className="mt-1 text-xl font-extrabold tracking-[0.2em] tabular-nums sm:text-2xl">
                  14-9023-8821-0021
                </h2>
              </div>
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/20 backdrop-blur-md">
                <QrCode className="h-6 w-6" aria-hidden />
              </span>
            </div>
            <p className="relative mt-6 text-sm font-medium opacity-90">John Doe • Male • 34 Yrs</p>
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

      {/* Action Required Section */}
      {(wallet.pendingInvoices.length > 0 || wallet.pendingConsents.length > 0) && (
        <section aria-label="Action required">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <AlertTriangle className="h-4 w-4 text-warning" aria-hidden /> Action Required
            <Badge tone="warning" dot pulse>{actionCount}</Badge>
          </h3>
          <div className="space-y-3">
            {wallet.pendingInvoices.map((inv: any, i: number) => (
              <motion.div
                key={inv._id}
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
                    <p className="text-sm font-bold text-foreground">Pay Invoice</p>
                    <p className="text-xs font-medium text-warning">
                      {formatCurrency(inv.amountDue)} Due • {inv.type}
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => router.push('/billing')}>Pay Now</Button>
              </motion.div>
            ))}

            {wallet.pendingConsents.map((consent: any, i: number) => (
              <motion.div
                key={consent._id}
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
                    <p className="text-xs font-medium text-info">{consent.title}</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" disabled title="Coming soon">Review</Button>
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
            {/* Physical Queues */}
            {wallet.activeTokens.map((token: any, i: number) => (
              <motion.div
                key={i}
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
                          <strong className="text-foreground">4</strong> patients ahead
                        </span>
                      </div>
                      <span className="text-xs font-bold text-warning">Est. Wait: 25 mins</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Telemedicine */}
            {wallet.telemedicine.map((session: any, i: number) => (
              <motion.div
                key={i}
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
                          Dr. {session.doctor?.name || 'Assigned Doctor'}
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
    </div>
  );
}
