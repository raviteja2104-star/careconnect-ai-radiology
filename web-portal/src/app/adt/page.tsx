'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus, ArrowRightLeft, UserMinus, Activity,
  FileCheck, FileText, AlertTriangle, Stethoscope, Pill,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Button, Badge, Card, CardHeader, CardTitle,
  CardContent, Tabs, TabsList, TabsTrigger, TabsContent, EmptyState, Progress,
} from '@/components/ui';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface AdmissionRow {
  id: string; patient: string; type: string; diagnosis: string;
  status: string; priority: string; timeSlot: string; doctor: string; specialty: string; bedStatus: string;
}

interface DischargeRow {
  id: string; patient: string; doctor: string; specialty: string;
  docClear: boolean; nurseClear: boolean; pharmClear: boolean; billClear: boolean;
}

interface TransferRow {
  id: string; patient: string; fromDepartment: string; toDepartment: string;
  priority: string; status: string; reason: string; requestedBy: string;
}

interface Stats { admissionsToday: number; pendingDischarges: number; activeTransfers: number; currentInpatients: number; }

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    const r = await fetch(`${API}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

export default function ADTDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<Stats>({ admissionsToday: 0, pendingDischarges: 0, activeTransfers: 0, currentInpatients: 0 });
  const [admissions, setAdmissions] = useState<AdmissionRow[]>([]);
  const [discharges, setDischarges] = useState<DischargeRow[]>([]);
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, a, d, t] = await Promise.all([
        apiFetch<Stats>('/api/adt/stats'),
        apiFetch<AdmissionRow[]>('/api/adt/admissions'),
        apiFetch<DischargeRow[]>('/api/adt/discharges'),
        apiFetch<TransferRow[]>('/api/adt/transfers'),
      ]);
      if (s) setStats(s);
      if (a) setAdmissions(a);
      if (d) setDischarges(d);
      if (t) setTransfers(t);
      setLoading(false);
    })();
  }, []);

  const statCards = [
    { label: 'Admissions (Today)', value: String(stats.admissionsToday), icon: UserPlus, tone: 'emerald' as const, sub: 'Checked in since midnight' },
    { label: 'Pending Discharges', value: String(stats.pendingDischarges), icon: UserMinus, tone: 'amber' as const, sub: 'Awaiting clearances' },
    { label: 'Active Transfers', value: String(stats.activeTransfers), icon: ArrowRightLeft, tone: 'teal' as const, sub: 'Between wards / units' },
    { label: 'Current Inpatients', value: String(stats.currentInpatients), icon: Activity, tone: 'brand' as const, sub: 'Open IPD encounters' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="IPD / ADT Center"
        description="Admission, Transfer, and Discharge Operations"
        crumbs={[{ label: 'Home', href: '/' }, { label: 'ADT' }]}
        actions={
          <Button onClick={() => setActiveTab('admissions')}>
            <UserPlus className="h-4 w-4" aria-hidden /> New Admission
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap">
          {['dashboard', 'admissions', 'transfers', 'discharge planner', 'clearance checklist'].map(tab => (
            <TabsTrigger key={tab} value={tab} className="capitalize">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="mt-6 space-y-6">
          <StatGrid>
            {statCards.map((s, i) => (
              <StatCard key={s.label} label={s.label} value={loading ? '—' : s.value} sub={s.sub} icon={s.icon} tone={s.tone} delay={i * 0.05} />
            ))}
          </StatGrid>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Pending Admissions */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
              <Card className="flex h-full flex-col overflow-hidden">
                <CardHeader className="flex-row items-center justify-between border-b border-border">
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" aria-hidden /> Pending Admissions
                  </CardTitle>
                  <Button variant="link" size="sm" onClick={() => setActiveTab('admissions')}>View All</Button>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : admissions.length === 0 ? (
                    <EmptyState icon={UserPlus} title="No pending admissions" description="Today's admission queue is empty." />
                  ) : (
                    admissions.slice(0, 5).map((adm, i) => (
                      <div key={i} className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center">
                        <div className="min-w-0">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-bold text-foreground">{adm.patient}</span>
                            <Badge tone={adm.type === 'Emergency' ? 'danger' : 'info'} className="uppercase">{adm.type}</Badge>
                          </div>
                          <p className="mb-1 text-sm text-muted-foreground">{adm.diagnosis || adm.specialty}</p>
                          <p className="flex items-center gap-1 text-xs font-semibold text-warning">
                            <AlertTriangle className="h-3 w-3" aria-hidden /> {adm.bedStatus}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button variant="outline" size="sm">View Details</Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Discharge Planner */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }}>
              <Card className="flex h-full flex-col overflow-hidden">
                <CardHeader className="flex-row items-center justify-between border-b border-border">
                  <CardTitle className="flex items-center gap-2">
                    <UserMinus className="h-4 w-4 text-success" aria-hidden /> Discharge Planner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : discharges.length === 0 ? (
                    <EmptyState icon={FileCheck} title="No pending discharges" description="Today's discharge queue is empty." />
                  ) : (
                    discharges.slice(0, 5).map((dis, i) => {
                      const isFullyCleared = dis.docClear && dis.nurseClear && dis.pharmClear && dis.billClear;
                      const clearances = [
                        { label: 'Clinical', done: dis.docClear, icon: Stethoscope },
                        { label: 'Nursing', done: dis.nurseClear, icon: Activity },
                        { label: 'Pharmacy', done: dis.pharmClear, icon: Pill },
                        { label: 'Billing', done: dis.billClear, icon: FileText },
                      ];
                      const clearedCount = clearances.filter(c => c.done).length;
                      return (
                        <div key={i} className="rounded-xl border border-border bg-muted/40 p-4">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-foreground">{dis.patient}</p>
                              <p className="text-xs text-muted-foreground">{dis.specialty}</p>
                            </div>
                            {isFullyCleared ? (
                              <Button size="sm" className="bg-success hover:bg-success/90" disabled title="Coming soon">Final Discharge</Button>
                            ) : (
                              <Badge tone="warning" dot>Pending Clearances</Badge>
                            )}
                          </div>
                          <Progress value={(clearedCount / clearances.length) * 100} tone={isFullyCleared ? 'success' : 'warning'} size="sm" label={`${clearedCount} of ${clearances.length} clearances`} className="mb-3" />
                          <div className="grid grid-cols-4 gap-2">
                            {clearances.map(c => {
                              const Icon = c.icon;
                              return (
                                <div key={c.label} className={`flex flex-col items-center justify-center rounded-lg border p-2 transition-colors ${c.done ? 'border-success/30 bg-success-soft text-success' : 'border-border bg-card text-subtle-foreground'}`}>
                                  <Icon className="mb-1 h-4 w-4" aria-hidden />
                                  <span className="text-center text-[10px] font-semibold leading-tight">{c.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Active Transfers */}
          {transfers.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3 }}>
              <Card>
                <CardHeader className="border-b border-border">
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-teal-500" aria-hidden /> Active Transfers
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border pt-2">
                  {transfers.map((t, i) => (
                    <div key={i} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-semibold text-foreground">{t.patient}</p>
                        <p className="text-sm text-muted-foreground">{t.fromDepartment} → {t.toDepartment}</p>
                        {t.reason && <p className="text-xs text-muted-foreground">{t.reason}</p>}
                      </div>
                      <Badge tone={t.priority === 'Emergency' || t.priority === 'STAT' ? 'danger' : t.priority === 'Urgent' ? 'warning' : 'info'}>
                        {t.priority}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="admissions" className="mt-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : admissions.length === 0 ? (
            <EmptyState icon={UserPlus} title="No admissions today" description="Today's admission requests will appear here." />
          ) : (
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {admissions.map((adm, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold text-foreground">{adm.patient}</p>
                      <p className="text-sm text-muted-foreground">{adm.specialty} · {adm.timeSlot} · {adm.doctor}</p>
                    </div>
                    <Badge tone={adm.status === 'In_Consultation' ? 'brand' : adm.status === 'Completed' ? 'success' : 'info'}>{adm.status.replace(/_/g, ' ')}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transfers" className="mt-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : transfers.length === 0 ? (
            <EmptyState icon={ArrowRightLeft} title="No active transfer requests" description="Ward-to-ward and unit-to-unit patient transfer requests will appear here." />
          ) : (
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {transfers.map((t, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold text-foreground">{t.patient}</p>
                      <p className="text-sm text-muted-foreground">{t.fromDepartment} → {t.toDepartment}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="info">{t.status}</Badge>
                      <Badge tone={t.priority === 'Emergency' ? 'danger' : 'warning'}>{t.priority}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="discharge planner" className="mt-6">
          <EmptyState icon={FileCheck} title="Discharge Clearance Checklist" description="Multi-department sign-off tracking for pending discharges." />
        </TabsContent>

        <TabsContent value="clearance checklist" className="mt-6">
          <EmptyState icon={FileCheck} title="Clearance checklist" description="Departmental clearance tracking for pending discharges will appear here." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
