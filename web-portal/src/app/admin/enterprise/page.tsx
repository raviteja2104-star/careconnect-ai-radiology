'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Server, Code, Activity, Cpu, ShieldCheck, Wifi, Terminal, Key,
  Play, HardDrive, Check, MemoryStick, Database, BatteryMedium,
  MonitorSpeaker, Globe2, ArrowRight,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Badge, Button, Card, CardHeader, CardTitle,
  CardDescription, CardContent, Tabs, TabsList, TabsTrigger, TabsContent,
  Input, Label, Progress,
} from '@/components/ui';
import {
  integrationHubService, FHIRResourceRecord, HL7MessageRecord,
  DeviceTelemetryRecord,
} from '@/services/integrationHubService';

const HL7_STATUS_TONE: Record<HL7MessageRecord['status'], 'success' | 'info' | 'warning' | 'danger'> = {
  PROCESSED: 'success',
  QUEUED: 'info',
  RETRY: 'warning',
  FAILED: 'danger',
};

const DEVICE_STATUS_TONE: Record<DeviceTelemetryRecord['status'], 'success' | 'warning' | 'danger' | 'neutral'> = {
  ONLINE: 'success',
  WARNING: 'warning',
  CRITICAL: 'danger',
  OFFLINE: 'neutral',
};

const ABDM_MILESTONES = [
  { key: 'M1', title: 'Milestone 1 (M1)', description: 'ABHA Address Creation & Aadhaar OTP Authentication.' },
  { key: 'M2', title: 'Milestone 2 (M2)', description: 'Personal Health Record (PHR) Linking & HIP/HIU Gateways.' },
  { key: 'M3', title: 'Milestone 3 (M3)', description: 'Digital Patient Consent Management & Health Data Exchange.' },
];

export default function EnterpriseIntegrationHubPage() {
  const [activeTab, setActiveTab] = useState<'FHIR' | 'HL7' | 'DEVICES' | 'ABDM' | 'API_GATEWAY' | 'RECOVERY'>('FHIR');

  // States
  const [fhirResources] = useState<FHIRResourceRecord[]>(integrationHubService.getFHIRResources());
  const [hl7Messages] = useState<HL7MessageRecord[]>(integrationHubService.getHL7Messages());
  const [devices] = useState<DeviceTelemetryRecord[]>(integrationHubService.getDevices());
  const [health] = useState(integrationHubService.getSystemHealth());

  const [testEndpoint, setTestEndpoint] = useState('https://fhir.careconnect.hospital/r4/Patient');
  const [testResult, setTestResult] = useState<any>(null);
  const [backupToast, setBackupToast] = useState(false);

  const handleTestIntegration = () => {
    setTestResult({
      status: 200,
      responseTimeMs: 34,
      protocol: 'FHIR R4 / JSON',
      security: 'TLS 1.3 mTLS Authorized'
    });
  };

  const handleTriggerBackup = () => {
    setBackupToast(true);
    setTimeout(() => setBackupToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Integration Hub"
        description="FHIR R4, HL7 v2.x, DICOM PACS, ABDM ABHA & live device telemetry."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Integration Hub' }]}
        actions={
          <>
            <Badge tone="success" dot pulse>{health.status}</Badge>
            <Link
              href="/admin/command-center"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
            >
              <Activity className="h-4 w-4" aria-hidden /> Command Center
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </>
        }
      />

      <StatGrid>
        <StatCard label="Platform uptime" value={`${health.uptimePct}%`} sub="Rolling 30-day availability" icon={Server} tone="emerald" trend="up" delay={0} />
        <StatCard label="CPU usage" value={`${health.cpuUsagePct}%`} sub="Cluster average" icon={Cpu} tone="brand" delay={0.05} />
        <StatCard label="Memory usage" value={`${health.memoryUsagePct}%`} sub={`${health.databaseConnections} DB connections`} icon={MemoryStick} tone="violet" delay={0.1} />
        <StatCard label="Kafka queue" value={health.kafkaQueueLength} sub="Messages awaiting processing" icon={Database} tone="teal" delay={0.15} />
      </StatGrid>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="FHIR"><Code className="h-4 w-4" aria-hidden /> FHIR R4</TabsTrigger>
          <TabsTrigger value="HL7"><Terminal className="h-4 w-4" aria-hidden /> HL7 v2.x</TabsTrigger>
          <TabsTrigger value="DEVICES"><Wifi className="h-4 w-4" aria-hidden /> IoT Telemetry</TabsTrigger>
          <TabsTrigger value="ABDM"><ShieldCheck className="h-4 w-4" aria-hidden /> ABDM / ABHA</TabsTrigger>
          <TabsTrigger value="API_GATEWAY"><Key className="h-4 w-4" aria-hidden /> API Gateway</TabsTrigger>
          <TabsTrigger value="RECOVERY"><HardDrive className="h-4 w-4" aria-hidden /> Recovery</TabsTrigger>
        </TabsList>

        {/* TAB 1: FHIR R4 SERVER */}
        <TabsContent value="FHIR" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">FHIR R4 Interoperability Server</h2>
              <p className="text-sm text-muted-foreground">Expose standardized HL7 FHIR R4 resources for external EMRs, insurance & ABDM.</p>
            </div>
            <div className="flex w-full items-end gap-2 sm:w-auto">
              <div className="w-full sm:w-96">
                <Label htmlFor="fhir-endpoint">Endpoint under test</Label>
                <Input
                  id="fhir-endpoint"
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  className="font-mono"
                />
              </div>
              <Button onClick={handleTestIntegration} className="shrink-0">
                <Play className="h-4 w-4" aria-hidden /> Test Endpoint
              </Button>
            </div>
          </div>

          {testResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-success/30 bg-success-soft p-4 font-mono text-xs"
            >
              <span className="inline-flex items-center gap-2 font-semibold text-success">
                <Check className="h-4 w-4" aria-hidden />
                STATUS {testResult.status} OK — {testResult.responseTimeMs}ms response · {testResult.protocol}
              </span>
              <span className="text-success">{testResult.security}</span>
            </motion.div>
          )}

          <div className="space-y-3">
            {fhirResources.map((res, i) => (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card>
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="brand" className="font-mono">{res.resourceType}</Badge>
                        <span className="font-mono text-xs font-semibold text-foreground">ID: {res.id}</span>
                      </div>
                      <span className="font-mono text-xs text-subtle-foreground">v{res.meta.versionId} · updated {res.meta.lastUpdated}</span>
                    </div>
                    <pre className="overflow-x-auto scrollbar-thin rounded-xl border border-border bg-muted/60 p-4 font-mono text-xs leading-relaxed text-foreground">
                      {JSON.stringify(res.data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: HL7 V2.X ENGINE */}
        <TabsContent value="HL7" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">HL7 v2.x Interface Parser Engine</h2>
            <p className="text-sm text-muted-foreground">Monitor live ADT, ORM, ORU, SIU & DFT pipeline messages from legacy LIS/RIS.</p>
          </div>
          <div className="space-y-3">
            {hl7Messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card>
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="info" className="font-mono">{msg.messageType}</Badge>
                        <span className="font-mono text-xs font-semibold text-foreground">Control ID: {msg.controlId}</span>
                        <span className="text-xs text-subtle-foreground">{msg.sendingFacility} → {msg.receivingFacility}</span>
                      </div>
                      <Badge tone={HL7_STATUS_TONE[msg.status]} dot>{msg.status}</Badge>
                    </div>
                    <pre className="overflow-x-auto scrollbar-thin whitespace-pre-wrap rounded-xl border border-border bg-muted/60 p-3 font-mono text-xs leading-relaxed text-foreground">
                      {msg.rawMessage}
                    </pre>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: IOT TELEMETRY */}
        <TabsContent value="DEVICES" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">IoT Medical Device Telemetry Hub</h2>
            <p className="text-sm text-muted-foreground">Real-time telemetry from Hamilton ventilators, Mindray monitors & CT scanners.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {devices.map((dev, i) => (
              <motion.div
                key={dev.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full">
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone="brand">{dev.deviceType.replace(/_/g, ' ')}</Badge>
                      <Badge tone={DEVICE_STATUS_TONE[dev.status]} dot pulse={dev.status === 'CRITICAL'}>{dev.status}</Badge>
                    </div>
                    <div>
                      <h3 className="inline-flex items-center gap-2 font-semibold text-foreground">
                        <MonitorSpeaker className="h-4 w-4 text-muted-foreground" aria-hidden /> {dev.deviceName}
                      </h3>
                      <p className="text-xs font-medium text-primary">{dev.location}</p>
                    </div>
                    <Progress
                      value={dev.batteryPct}
                      tone={dev.batteryPct > 50 ? 'success' : dev.batteryPct > 20 ? 'warning' : 'danger'}
                      label="Battery"
                      showValue
                    />
                    <div className="space-y-1 rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs">
                      {Object.entries(dev.readings).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3">
                          <span className="capitalize text-muted-foreground">{k}</span>
                          <span className="font-semibold text-foreground">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-subtle-foreground">Last ping: {dev.lastPing}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: ABDM & ABHA */}
        <TabsContent value="ABDM" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">ABDM / ABHA National Health Stack</h2>
            <p className="text-sm text-muted-foreground">Integrated with Ayushman Bharat Digital Mission (M1 Verification, M2 PHR Link, M3 Consent).</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {ABDM_MILESTONES.map((m, i) => (
              <motion.div
                key={m.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full">
                  <CardContent className="space-y-3 pt-5">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                      <ShieldCheck className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="font-semibold text-foreground">{m.title}</h3>
                    <p className="text-sm text-muted-foreground">{m.description}</p>
                    <Badge tone="success" dot>CERTIFIED & ACTIVE</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 5: API GATEWAY */}
        <TabsContent value="API_GATEWAY" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">API Gateway & Key Management</h2>
            <p className="text-sm text-muted-foreground">Manage OAuth 2.1 credentials, JWT tokens and rate limits.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Active credentials</CardTitle>
                <CardDescription>Production OAuth 2.1 client keys issued for this tenant.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-foreground">careconnect_prod_v1</p>
                    <p className="mt-0.5 font-mono text-xs text-subtle-foreground">Scope: read:fhir write:fhir read:prescriptions</p>
                  </div>
                  <Badge tone="brand" dot>ACTIVE KEY</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Service latency</CardTitle>
                <CardDescription>Gateway-routed platform services.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {health.services.map((svc: { name: string; status: string; latencyMs: number }) => (
                  <div key={svc.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-muted-foreground">{svc.name}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-xs tabular-nums text-foreground">{svc.latencyMs}ms</span>
                      <Badge tone={svc.status === 'OPERATIONAL' ? 'success' : 'warning'} dot>{svc.status}</Badge>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 6: DISASTER RECOVERY */}
        <TabsContent value="RECOVERY" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Disaster Recovery & System Backups</h2>
              <p className="text-sm text-muted-foreground">Trigger instant encrypted snapshots and monitor multi-region replication.</p>
            </div>
            <div className="flex items-center gap-2">
              {backupToast && (
                <Badge tone="success" dot pulse>
                  <Check className="h-3 w-3" aria-hidden /> Snapshot Taken
                </Badge>
              )}
              <Button onClick={handleTriggerBackup}>
                <HardDrive className="h-4 w-4" aria-hidden /> Trigger Immediate Backup
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
              <Card className="h-full">
                <CardContent className="space-y-3 pt-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                    <Globe2 className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="font-semibold text-foreground">Primary AWS Region (US-East-1)</h3>
                  <p className="text-sm text-muted-foreground">Master RDS PostgreSQL Database Cluster with Multi-AZ Failover.</p>
                  <Badge tone="success" dot>HEALTHY & SYNCED</Badge>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}>
              <Card className="h-full">
                <CardContent className="space-y-3 pt-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
                    <BatteryMedium className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="font-semibold text-foreground">Standby Replica Region (AP-South-1 Hyderabad)</h3>
                  <p className="text-sm text-muted-foreground">Real-Time Asynchronous Replication (Lag: 12ms).</p>
                  <Badge tone="success" dot pulse>REPLICATING</Badge>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
