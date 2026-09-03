'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus, ArrowRightLeft, UserMinus, Activity,
  FileCheck, FileText, AlertTriangle, Stethoscope, Pill,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Button, Badge, Card, CardHeader, CardTitle,
  CardContent, Tabs, TabsList, TabsTrigger, TabsContent, EmptyState, Progress,
} from '@/components/ui';

export default function ADTDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock Data
  const stats = [
    { label: 'Admissions (Today)', value: '24', icon: UserPlus, tone: 'emerald' as const, sub: 'Checked in since midnight' },
    { label: 'Pending Discharges', value: '12', icon: UserMinus, tone: 'amber' as const, sub: 'Awaiting clearances' },
    { label: 'Active Transfers', value: '5', icon: ArrowRightLeft, tone: 'teal' as const, sub: 'Between wards / units' },
    { label: 'Current Inpatients', value: '382', icon: Activity, tone: 'brand' as const, sub: 'Occupying beds now' },
  ];

  const pendingAdmissions = [
    { id: 'ADM-26-891', patient: 'Rohit Sharma', age: 32, type: 'Emergency', diagnosis: 'Acute Appendicitis', priority: 'High', bedStatus: 'Allocated (W4-B12)' },
    { id: 'ADM-26-892', patient: 'Meena Gupta', age: 45, type: 'Elective', diagnosis: 'Cholecystectomy', priority: 'Medium', bedStatus: 'Pending Allocation' },
  ];

  const dischargeQueue = [
    { id: 'DIS-26-442', patient: 'Anil Kumar', bed: 'W2-105', docClear: true, nurseClear: true, pharmClear: false, billClear: false },
    { id: 'DIS-26-443', patient: 'Sunita Rao', bed: 'ICU-B4', docClear: true, nurseClear: true, pharmClear: true, billClear: true },
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
            {stats.map((s, i) => (
              <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} icon={s.icon} tone={s.tone} delay={i * 0.05} />
            ))}
          </StatGrid>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Pending Admissions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="flex h-full flex-col overflow-hidden">
                <CardHeader className="flex-row items-center justify-between border-b border-border">
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" aria-hidden /> Pending Admissions
                  </CardTitle>
                  <Button variant="link" size="sm" onClick={() => setActiveTab('admissions')}>View All</Button>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {pendingAdmissions.map((adm, i) => (
                    <div
                      key={i}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-bold text-foreground">{adm.patient}</span>
                          <Badge tone={adm.type === 'Emergency' ? 'danger' : 'info'} className="uppercase">
                            {adm.type}
                          </Badge>
                        </div>
                        <p className="mb-1 text-sm text-muted-foreground">{adm.diagnosis}</p>
                        <p className="flex items-center gap-1 text-xs font-semibold text-warning">
                          <AlertTriangle className="h-3 w-3" aria-hidden /> {adm.bedStatus}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" onClick={() => setActiveTab('admissions')}>View Details</Button>
                        <Button size="sm" disabled title="Coming soon">Check-in</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Discharge Planner / Clearance Tracker */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="flex h-full flex-col overflow-hidden">
                <CardHeader className="flex-row items-center justify-between border-b border-border">
                  <CardTitle className="flex items-center gap-2">
                    <UserMinus className="h-4 w-4 text-success" aria-hidden /> Discharge Planner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {dischargeQueue.map((dis, i) => {
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
                            <p className="text-xs text-muted-foreground">Bed: {dis.bed} · ID: {dis.id}</p>
                          </div>
                          {isFullyCleared ? (
                            <Button size="sm" className="bg-success hover:bg-success/90" disabled title="Coming soon">Final Discharge</Button>
                          ) : (
                            <Badge tone="warning" dot>Pending Clearances</Badge>
                          )}
                        </div>
                        <Progress
                          value={(clearedCount / clearances.length) * 100}
                          tone={isFullyCleared ? 'success' : 'warning'}
                          size="sm"
                          label={`${clearedCount} of ${clearances.length} clearances`}
                          className="mb-3"
                        />
                        <div className="grid grid-cols-4 gap-2">
                          {clearances.map(c => {
                            const Icon = c.icon;
                            return (
                              <div
                                key={c.label}
                                className={`flex flex-col items-center justify-center rounded-lg border p-2 transition-colors ${
                                  c.done
                                    ? 'border-success/30 bg-success-soft text-success'
                                    : 'border-border bg-card text-subtle-foreground'
                                }`}
                              >
                                <Icon className="mb-1 h-4 w-4" aria-hidden />
                                <span className="text-center text-[10px] font-semibold leading-tight">{c.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="admissions" className="mt-6">
          <EmptyState
            icon={UserPlus}
            title="Admissions workspace"
            description="The full admission request queue, bed allocation, and check-in workflows will appear here."
          />
        </TabsContent>

        <TabsContent value="transfers" className="mt-6">
          <EmptyState
            icon={ArrowRightLeft}
            title="No active transfer requests"
            description="Ward-to-ward and unit-to-unit patient transfer requests will appear here for coordination."
          />
        </TabsContent>

        <TabsContent value="discharge planner" className="mt-6">
          <EmptyState
            icon={FileCheck}
            title="Discharge Clearance Checklist"
            description="Orchestrating multi-department sign-offs to safely transition patients out of inpatient care and release beds."
          />
        </TabsContent>

        <TabsContent value="clearance checklist" className="mt-6">
          <EmptyState
            icon={FileCheck}
            title="Clearance checklist"
            description="Departmental clearance tracking for pending discharges will appear here."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
