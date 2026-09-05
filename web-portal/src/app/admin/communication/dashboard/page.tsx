'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import {
  Send, CheckCircle2, AlertTriangle, Smartphone, Mail, BellRing, Radio,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Badge, DataTable, type Column, Progress, Skeleton,
} from '@/components/ui';

const CHANNEL_META: Record<string, { icon: React.ElementType; classes: string }> = {
  WhatsApp: {
    icon: Smartphone,
    classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  Email: {
    icon: Mail,
    classes: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  },
  SMS: {
    icon: BellRing,
    classes: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
  },
};

export default function CommunicationDashboard() {
  const [liveLogs, setLiveLogs] = useState<any[]>([]);

  const { data: analyticsRes, isLoading: analyticsLoading } = useQuery({
    queryKey: ['communication_analytics'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'}/api/communication/analytics`).then(res => res.json())
  });

  const { data: historyRes, isLoading: historyLoading } = useQuery({
    queryKey: ['communication_history'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'}/api/communication/history`).then(res => res.json())
  });

  useEffect(() => {
    if (historyRes?.data) {
      setLiveLogs(historyRes.data);
    }
  }, [historyRes]);

  // Hook into Event Bus for live message updates
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000');
    socket.on('MESSAGE_SENT', (data) => {
      setLiveLogs(prev => [data.message, ...prev].slice(0, 50));
    });
    return () => { socket.disconnect(); };
  }, []);

  const stats = analyticsRes?.data || { totalSent: 0, delivered: 0, failed: 0, deliveryRate: 0, channels: { whatsapp: 0, sms: 0, email: 0 } };

  const channelMix = useMemo(() => {
    const total = (stats.channels.whatsapp ?? 0) + (stats.channels.sms ?? 0) + (stats.channels.email ?? 0);
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return [
      { label: 'WhatsApp', count: stats.channels.whatsapp ?? 0, pct: pct(stats.channels.whatsapp ?? 0), tone: 'success' as const, icon: Smartphone },
      { label: 'SMS', count: stats.channels.sms ?? 0, pct: pct(stats.channels.sms ?? 0), tone: 'brand' as const, icon: BellRing },
      { label: 'Email', count: stats.channels.email ?? 0, pct: pct(stats.channels.email ?? 0), tone: 'gradient' as const, icon: Mail },
    ];
  }, [stats.channels.whatsapp, stats.channels.sms, stats.channels.email]);

  const columns: Column<any>[] = [
    {
      key: 'channel',
      header: 'Channel',
      sortable: true,
      accessor: (log: any) => log.channel ?? '',
      cell: (log: any) => {
        const meta = CHANNEL_META[log.channel] ?? CHANNEL_META.SMS;
        const Icon = meta.icon;
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${meta.classes}`}>
            <Icon className="h-3 w-3" aria-hidden />
            {log.channel}
          </span>
        );
      },
    },
    {
      key: 'patient',
      header: 'Patient',
      sortable: true,
      accessor: (log: any) => log.patient?.name ?? '',
      cell: (log: any) => (
        <p className="font-medium text-foreground">{log.patient?.name || 'Unknown'}</p>
      ),
    },
    {
      key: 'relatedEvent',
      header: 'Trigger Event',
      accessor: (log: any) => log.relatedEvent ?? 'MANUAL_SEND',
      cell: (log: any) => (
        <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
          {log.relatedEvent || 'MANUAL_SEND'}
        </code>
      ),
    },
    {
      key: 'content',
      header: 'Content Snippet',
      accessor: (log: any) => log.content ?? '',
      cell: (log: any) => (
        <p className="max-w-xs truncate text-sm text-muted-foreground">{log.content}</p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      sortable: true,
      accessor: (log: any) => log.status ?? '',
      cell: (log: any) => {
        const ok = log.status === 'DELIVERED' || log.status === 'SENT';
        return (
          <Badge tone={ok ? 'success' : 'danger'} dot>
            {log.status}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Omnichannel Hub"
        description="Real-time overview of all hospital outbound communications."
        crumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Communication' },
          { label: 'Dashboard' },
        ]}
        actions={
          <Badge tone="brand" dot pulse>
            Listening to event bus
          </Badge>
        }
      />

      {analyticsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[7.5rem] rounded-2xl" />
          ))}
        </div>
      ) : (
        <StatGrid>
          <StatCard
            label="Total Sent Today"
            value={stats.totalSent}
            sub="All outbound channels"
            icon={Send}
            tone="violet"
            delay={0}
          />
          <StatCard
            label="Delivery Rate"
            value={`${stats.deliveryRate}%`}
            sub={`${stats.delivered} delivered`}
            icon={CheckCircle2}
            tone="emerald"
            delay={0.05}
          />
          <StatCard
            label="WhatsApp Sent"
            value={stats.channels.whatsapp}
            sub="Primary patient channel"
            icon={Smartphone}
            tone="teal"
            delay={0.1}
          />
          <StatCard
            label="Failed Messages"
            value={stats.failed}
            sub="Require attention"
            icon={AlertTriangle}
            tone="rose"
            delay={0.15}
          />
        </StatGrid>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Main: live delivery log */}
        <motion.div
          className="xl:col-span-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                    <Radio className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <CardTitle>Live Delivery Log</CardTitle>
                    <CardDescription>Streaming the latest 50 outbound messages.</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3" aria-busy>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <DataTable<any>
                  columns={columns}
                  data={liveLogs}
                  rowKey={(log: any, i: number) => log._id || String(i)}
                  searchPlaceholder="Search messages…"
                  exportName="delivery-log"
                  emptyTitle="No messages found"
                  emptyDescription="Outbound SMS, WhatsApp and email messages will stream in here as they are sent."
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Context rail: channel mix */}
        <motion.div
          className="xl:col-span-1"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Channel Mix</CardTitle>
              <CardDescription>Share of today&apos;s sends by channel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {analyticsLoading ? (
                <div className="space-y-4" aria-busy>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                channelMix.map(({ label, count, pct, tone, icon: Icon }) => (
                  <div key={label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2 font-medium text-foreground">
                        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                        {label}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {count} <span className="text-subtle-foreground">· {pct}%</span>
                      </span>
                    </div>
                    <Progress value={pct} tone={tone} />
                  </div>
                ))
              )}
              <div className="rounded-2xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
                Delivery events arrive over the socket event bus — counters refresh automatically as
                messages fan out to patients.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
