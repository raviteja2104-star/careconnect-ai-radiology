'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lock, Key, Activity, Play, Smartphone,
  Sparkles, Award, HeartPulse, GraduationCap, ScanSearch, UploadCloud,
  Fingerprint, Server, FlaskConical, Gauge, Users, Plus,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Badge, Button, Card, CardHeader, CardTitle,
  CardDescription, CardContent, Tabs, TabsList, TabsTrigger, TabsContent,
  Input, Textarea, Select, Label, DataTable, type Column, Progress, ProgressRing,
} from '@/components/ui';
import { authService, AuthUserSession } from '@/services/authService';
import { securityAuditService, AuditLogEntry, INITIAL_AUDIT_LOGS } from '@/services/securityAuditService';
import { hospitalMigrationService, MigrationJobRecord } from '@/services/hospitalMigrationService';
import { testingSuiteService, QualityMetricsData } from '@/services/testingSuiteService';
import { productionHardeningService, RegulatoryComplianceStatus, ClinicalDeviceInterface, AISafetyValidationMetric, MobileAppHealthStatus } from '@/services/productionHardeningService';

const COMPLIANCE_TONE: Record<RegulatoryComplianceStatus['status'], 'success' | 'info' | 'warning'> = {
  COMPLIANT: 'success',
  AUDIT_READY: 'info',
  ACTION_REQUIRED: 'warning',
};

const AUDIT_STATUS_TONE: Record<AuditLogEntry['status'], 'success' | 'danger' | 'warning'> = {
  SUCCESS: 'success',
  DENIED: 'danger',
  FLAGGED: 'warning',
};

const MIGRATION_STATUS_TONE: Record<MigrationJobRecord['status'], 'neutral' | 'info' | 'success' | 'danger'> = {
  PENDING: 'neutral',
  PROCESSING: 'info',
  COMPLETED: 'success',
  FAILED: 'danger',
};

export default function ProductionHardeningPage() {
  const [activeTab, setActiveTab] = useState<'AUTH' | 'COMPLIANCE' | 'HARDWARE' | 'TESTING' | 'MOBILE' | 'AI_SAFETY' | 'GOLIVE'>('AUTH');

  // Service Data States
  const [session] = useState<AuthUserSession>(authService.getCurrentSession());
  const [policy] = useState(authService.getSecurityPolicy());
  const [logs, setLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [migrationJobs, setMigrationJobs] = useState<MigrationJobRecord[]>(hospitalMigrationService.getJobs());
  const [testMetrics, setTestMetrics] = useState<QualityMetricsData>(testingSuiteService.getTestMetrics());

  // Audit trail is fetched from the real backend when a session token exists;
  // otherwise the labeled demo rows remain in place.
  useEffect(() => {
    let active = true;
    securityAuditService.getAuditLogs()
      .then((res) => { if (active) setLogs(res.data); })
      .catch(() => { /* keep demo rows */ });
    return () => { active = false; };
  }, []);

  const [compliance] = useState<RegulatoryComplianceStatus[]>(productionHardeningService.getCompliance());
  const [devices] = useState<ClinicalDeviceInterface[]>(productionHardeningService.getDevices());
  const [aiSafety] = useState<AISafetyValidationMetric[]>(productionHardeningService.getAISafety());
  const [mobileApps] = useState<MobileAppHealthStatus[]>(productionHardeningService.getMobileApps());
  const [goLive] = useState(productionHardeningService.getGoLiveChecklist());

  // Interactive PHI Scanner State
  const [rawText, setRawText] = useState('Patient Rajesh Rao (SSN: 901-28-4920, Phone: 9876543210, Email: rajesh@example.com) presented with acute dyspnea.');
  const [phiResult, setPhiResult] = useState<any>(null);

  // Interactive Migration Form
  const [importSystem, setImportSystem] = useState('LOCAL_EXCEL');
  const [importRecords, setImportRecords] = useState(1420);

  const handleScanPHI = () => {
    setPhiResult(securityAuditService.scanAndRedactPHI(rawText));
  };

  const handleStartMigration = (e: React.FormEvent) => {
    e.preventDefault();
    hospitalMigrationService.uploadAndMigrate(importSystem as any, 'PATIENTS', importRecords);
    setMigrationJobs([...hospitalMigrationService.getJobs()]);
  };

  const handleRunTestSuites = () => {
    setTestMetrics(testingSuiteService.triggerFullTestSuite());
  };

  const avgCompliancePct = compliance.reduce((sum, c) => sum + c.compliancePct, 0) / (compliance.length || 1);

  const auditColumns: Column<AuditLogEntry>[] = [
    { key: 'timestamp', header: 'Timestamp', sortable: true, cell: (l) => <span className="font-mono text-xs text-muted-foreground">{l.timestamp}</span> },
    {
      key: 'userName',
      header: 'User',
      sortable: true,
      cell: (l) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{l.userName}</p>
          <p className="font-mono text-xs text-subtle-foreground">{l.userId}</p>
        </div>
      ),
    },
    { key: 'action', header: 'Action', sortable: true, cell: (l) => <Badge tone="brand" className="font-mono">{l.action}</Badge> },
    { key: 'resourceId', header: 'Resource', cell: (l) => <span className="font-mono text-xs text-muted-foreground">{l.resourceId}</span> },
    { key: 'ipAddress', header: 'IP', cell: (l) => <span className="font-mono text-xs text-muted-foreground">{l.ipAddress}</span> },
    { key: 'status', header: 'Status', cell: (l) => <Badge tone={AUDIT_STATUS_TONE[l.status]} dot>{l.status}</Badge> },
  ];

  const migrationColumns: Column<MigrationJobRecord>[] = [
    { key: 'id', header: 'Job', cell: (j) => <span className="font-mono text-xs font-semibold text-primary">{j.id}</span> },
    { key: 'sourceSystem', header: 'Source', sortable: true, cell: (j) => <Badge tone="info" className="font-mono">{j.sourceSystem}</Badge> },
    { key: 'dataType', header: 'Data type', sortable: true, cell: (j) => <span className="text-muted-foreground">{j.dataType.replace(/_/g, ' ')}</span> },
    {
      key: 'processedCount',
      header: 'Progress',
      sortable: true,
      accessor: (j) => j.processedCount,
      cell: (j) => (
        <div className="min-w-[9rem]">
          <Progress
            value={j.recordCount ? (j.processedCount / j.recordCount) * 100 : 0}
            tone={j.status === 'FAILED' ? 'danger' : j.status === 'COMPLETED' ? 'success' : 'brand'}
            label={`${j.processedCount.toLocaleString()} / ${j.recordCount.toLocaleString()}`}
            size="sm"
          />
        </div>
      ),
    },
    { key: 'startedAt', header: 'Started', sortable: true, cell: (j) => <span className="font-mono text-xs text-muted-foreground">{j.startedAt}</span> },
    { key: 'status', header: 'Status', cell: (j) => <Badge tone={MIGRATION_STATUS_TONE[j.status]} dot pulse={j.status === 'PROCESSING'}>{j.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Hardening"
        description="OAuth 2.1, NABH/ABDM compliance, clinical devices, QA suite & go-live toolkit."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Production' }]}
        actions={<Badge tone="success" dot>100% Compliance & Production Ready</Badge>}
      />

      <StatGrid>
        <StatCard
          label="Test coverage"
          value={`${testMetrics.overallCoveragePct}%`}
          sub={`Target >${testMetrics.targetCoveragePct}% · 0 critical vulns`}
          icon={FlaskConical}
          tone="emerald"
          trend="up"
          delay={0}
        />
        <StatCard
          label="Compliance score"
          value={`${avgCompliancePct.toFixed(1)}%`}
          sub={`${compliance.length} regulatory standards`}
          icon={Award}
          tone="brand"
          delay={0.05}
        />
        <StatCard
          label="Clinical interfaces"
          value={devices.length}
          sub="HL7 MLLP, DICOMweb & webhook streams"
          icon={HeartPulse}
          tone="violet"
          delay={0.1}
        />
        <StatCard
          label="Staff readiness"
          value={`${goLive.userReadinessPct}%`}
          sub={`Hypercare SLA < ${goLive.hypercareSlaHours} hrs`}
          icon={GraduationCap}
          tone="teal"
          trend="up"
          delay={0.15}
        />
      </StatGrid>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="AUTH"><Key className="h-4 w-4" aria-hidden /> Auth & Gateway</TabsTrigger>
          <TabsTrigger value="COMPLIANCE"><Award className="h-4 w-4" aria-hidden /> Compliance</TabsTrigger>
          <TabsTrigger value="HARDWARE"><HeartPulse className="h-4 w-4" aria-hidden /> Clinical Devices</TabsTrigger>
          <TabsTrigger value="TESTING"><Activity className="h-4 w-4" aria-hidden /> QA & Testing</TabsTrigger>
          <TabsTrigger value="MOBILE"><Smartphone className="h-4 w-4" aria-hidden /> Mobile Apps</TabsTrigger>
          <TabsTrigger value="AI_SAFETY"><Sparkles className="h-4 w-4" aria-hidden /> AI Safety</TabsTrigger>
          <TabsTrigger value="GOLIVE"><GraduationCap className="h-4 w-4" aria-hidden /> Go-Live & LMS</TabsTrigger>
        </TabsList>

        {/* TAB 1: AUTH & GATEWAY */}
        <TabsContent value="AUTH" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">OAuth 2.1, OIDC & Envoy API Gateway Infrastructure</h2>
            <p className="text-sm text-muted-foreground">PKCE token enforcement, TOTP MFA verification, SAML 2.0 SSO, WebAuthn Passkeys & Envoy WAF.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                icon: Fingerprint,
                tile: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
                title: 'Clinician Identity & Session',
                body: (
                  <>
                    <p className="text-sm font-semibold text-foreground">{session.name}</p>
                    <p className="font-mono text-xs text-primary">{session.email}</p>
                  </>
                ),
                badge: 'MFA & WEBAUTHN ACTIVE',
              },
              {
                icon: Lock,
                tile: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
                title: 'OAuth 2.1 & Envoy WAF',
                body: <p className="text-sm text-muted-foreground">{policy.oauth2Version}</p>,
                badge: 'ENVOY GATEWAY ACTIVE',
              },
              {
                icon: Server,
                tile: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
                title: 'RBAC / ABAC Multi-Tenant Partitioning',
                body: <p className="text-sm text-muted-foreground">Row & Column Level Security Isolation</p>,
                badge: 'ENFORCED ENTIRE STACK',
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full">
                  <CardContent className="space-y-3 pt-5">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.tile}`}>
                      <item.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    {item.body}
                    <Badge tone="success" dot>{item.badge}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanSearch className="h-4 w-4 text-primary" aria-hidden /> PHI Redaction Scanner
              </CardTitle>
              <CardDescription>Scan free text for SSNs, phone numbers and emails, then auto-redact for HIPAA-safe storage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="phi-text">Clinical note text</Label>
                <Textarea id="phi-text" rows={3} value={rawText} onChange={(e) => setRawText(e.target.value)} />
              </div>
              <Button onClick={handleScanPHI}>
                <ScanSearch className="h-4 w-4" aria-hidden /> Scan & Redact PHI
              </Button>
              {phiResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-2 rounded-xl border border-success/30 bg-success-soft p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="success" dot>{phiResult.hipaaCompliant ? 'HIPAA COMPLIANT' : 'REVIEW REQUIRED'}</Badge>
                    <span className="text-xs font-medium text-success">{phiResult.phiDetectedCount} PHI pattern(s) detected & redacted</span>
                  </div>
                  <pre className="overflow-x-auto scrollbar-thin whitespace-pre-wrap rounded-lg bg-card/70 p-3 font-mono text-xs text-foreground">
                    {phiResult.redactedText}
                  </pre>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Immutable Security Audit Trail</h3>
            <DataTable<AuditLogEntry>
              columns={auditColumns}
              data={logs}
              rowKey={(l) => l.id}
              searchPlaceholder="Search audit events…"
              exportName="security-audit-log"
              emptyTitle="No audit events"
              emptyDescription="Security events across EHR access, prescriptions and exports will appear here."
              dense
            />
          </div>
        </TabsContent>

        {/* TAB 2: COMPLIANCE SCORECARD */}
        <TabsContent value="COMPLIANCE" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">International Healthcare Regulatory Compliance</h2>
            <p className="text-sm text-muted-foreground">Audit readiness tracking for NABH, ABDM Milestone 1-3, HIPAA, GDPR, ISO 27001 & ISO 27799.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {compliance.map((c, i) => (
              <motion.div
                key={c.standard}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <Badge tone="brand" className="font-mono">{c.standard.replace(/_/g, ' ')}</Badge>
                        <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{c.compliancePct}%</p>
                        <p className="text-xs text-muted-foreground">Compliance & controls score</p>
                      </div>
                      <ProgressRing
                        value={c.compliancePct}
                        tone={c.compliancePct >= 99 ? 'success' : 'warning'}
                        size={72}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                      <Badge tone={COMPLIANCE_TONE[c.status]} dot>{c.status.replace(/_/g, ' ')}</Badge>
                      <span>Missing controls: <strong className="text-foreground">{c.missingControls}</strong> · {c.lastAudited}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: CLINICAL DEVICES */}
        <TabsContent value="HARDWARE" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Real Clinical Hardware, LIS, RIS & Orthanc PACS Interfaces</h2>
            <p className="text-sm text-muted-foreground">Live HL7 MLLP streams, Orthanc DICOMweb PACS servers, ICU monitors & WhatsApp hubs.</p>
          </div>
          <div className="space-y-3">
            {devices.map((dev, i) => (
              <motion.div
                key={dev.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                        <HeartPulse className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                          {dev.deviceName}
                          <Badge tone="brand" className="font-mono">{dev.protocol}</Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dev.category.replace(/_/g, ' ')} · heartbeat {dev.lastHeartbeat}
                        </p>
                      </div>
                    </div>
                    <Badge tone="success" dot pulse={dev.status === 'ACTIVE_STREAMING'}>{dev.status.replace(/_/g, ' ')}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: QA & TESTING */}
        <TabsContent value="TESTING" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Automated QA Testing Suite & Coverage Telemetry</h2>
              <p className="text-sm text-muted-foreground">Vitest unit tests, Playwright E2E suites, k6 10,000 clinician load tests (&gt;90% target).</p>
            </div>
            <Button onClick={handleRunTestSuites}>
              <Play className="h-4 w-4" aria-hidden /> Trigger Full Test Suite
            </Button>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Overall Platform Test Coverage</CardTitle>
                <CardDescription>
                  Load-tested to {testMetrics.loadTestMaxClinicians.toLocaleString()} concurrent clinicians · P99 {testMetrics.loadTestP99LatencyMs}ms
                </CardDescription>
              </div>
              <ProgressRing
                value={testMetrics.overallCoveragePct}
                tone={testMetrics.overallCoveragePct >= testMetrics.targetCoveragePct ? 'success' : 'warning'}
                size={72}
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {testMetrics.suites.map((st) => (
                <div key={st.suiteName} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{st.suiteName}</p>
                    <p className="text-xs text-muted-foreground">
                      {st.passed} / {st.totalTests} passed · {st.durationSec}s
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32">
                      <Progress value={st.coveragePct} tone={st.status === 'PASSED' ? 'success' : 'danger'} size="sm" showValue />
                    </div>
                    <Badge tone={st.status === 'PASSED' ? 'success' : 'danger'} dot>{st.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: MOBILE ECOSYSTEM */}
        <TabsContent value="MOBILE" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Native Mobile Applications & Offline Sync Telemetry</h2>
            <p className="text-sm text-muted-foreground">Doctor, Patient, Nurse & Ambulance native apps with Face ID biometric authentication.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mobileApps.map((m, i) => (
              <motion.div
                key={m.appName}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full">
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 font-semibold text-foreground">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                          <Smartphone className="h-4 w-4" aria-hidden />
                        </span>
                        {m.appName.replace(/_/g, ' ')}
                      </span>
                      <Badge tone="brand" className="font-mono">{m.platform}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Active installed devices: <strong className="text-foreground tabular-nums">{m.activeInstalls.toLocaleString()}</strong>
                    </p>
                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs">
                      <Badge tone={m.offlineSyncEnabled ? 'success' : 'neutral'} dot>
                        Offline sync {m.offlineSyncEnabled ? 'ENABLED' : 'OFF'}
                      </Badge>
                      <Badge tone="info">
                        <Fingerprint className="h-3 w-3" aria-hidden /> {m.biometricAuth.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 6: AI CLINICAL SAFETY */}
        <TabsContent value="AI_SAFETY" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI Clinical Safety, Hallucination Control & Physician Oversight</h2>
            <p className="text-sm text-muted-foreground">Rigorous accuracy, precision, recall, and mandatory human clinician approval safeguards.</p>
          </div>
          <div className="space-y-3">
            {aiSafety.map((ai, i) => (
              <motion.div
                key={ai.module}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card>
                  <CardContent className="space-y-4 pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 font-semibold text-foreground">
                        <Sparkles className="h-4 w-4 text-warning" aria-hidden /> {ai.module.replace(/_/g, ' ')}
                      </span>
                      <Badge tone="success" dot>Hallucination {ai.hallucinationRatePct}% (&lt;0.01% target)</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {[
                        { label: 'Precision', value: ai.precisionPct, tone: 'brand' as const },
                        { label: 'Recall', value: ai.recallPct, tone: 'brand' as const },
                        { label: 'Physician acceptance', value: ai.physicianAcceptancePct, tone: 'success' as const },
                      ].map((metric) => (
                        <div key={metric.label} className="rounded-xl border border-border bg-muted/40 p-3">
                          <Progress value={metric.value} tone={metric.tone} label={metric.label} showValue size="sm" />
                        </div>
                      ))}
                    </div>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" aria-hidden />
                      Clinician oversight enforcement: {ai.clinicianApprovalRequired ? 'REQUIRED BEFORE MEDICAL RECORD COMMIT' : 'NONE'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 7: GO-LIVE & LMS */}
        <TabsContent value="GOLIVE" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Hospital Go-Live Centre, LMS Training & Hypercare SLA</h2>
            <p className="text-sm text-muted-foreground">Deployment readiness verification, hospital staff LMS training & 24/7 hypercare support.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Go-Live Readiness Telemetry</CardTitle>
              <CardDescription>
                {goLive.complianceStatus} · data migration {goLive.dataMigrationStatus}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Staff readiness', value: `${goLive.userReadinessPct}%`, icon: Users, ring: goLive.userReadinessPct },
                  { label: 'Device connectivity', value: `${goLive.deviceReadinessPct}%`, icon: HeartPulse, ring: goLive.deviceReadinessPct },
                  { label: 'Network SLA', value: `${goLive.networkReadinessPct}%`, icon: Gauge, ring: goLive.networkReadinessPct },
                  { label: 'Hypercare response SLA', value: `< ${goLive.hypercareSlaHours} hrs`, icon: Activity, ring: 100 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
                    <ProgressRing value={item.ring} tone="success" size={56} strokeWidth={5}>
                      <item.icon className="h-4 w-4 text-success" aria-hidden />
                    </ProgressRing>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                      <p className="text-lg font-bold tabular-nums text-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-primary" aria-hidden /> Legacy Data Migration
              </CardTitle>
              <CardDescription>Import patient masters from legacy EHR, Excel, PACS and LIS systems.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleStartMigration} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="w-full sm:w-64">
                  <Label htmlFor="migration-source">Source system</Label>
                  <Select id="migration-source" value={importSystem} onChange={(e) => setImportSystem(e.target.value)}>
                    <option value="LOCAL_EXCEL">LOCAL_EXCEL</option>
                    <option value="EPIC_EHR">EPIC_EHR</option>
                    <option value="CERNER">CERNER</option>
                    <option value="ORTHANC_PACS">ORTHANC_PACS</option>
                    <option value="LEGACY_LIS">LEGACY_LIS</option>
                  </Select>
                </div>
                <div className="w-full sm:w-48">
                  <Label htmlFor="migration-records">Record count</Label>
                  <Input
                    id="migration-records"
                    type="number"
                    value={importRecords}
                    onChange={(e) => setImportRecords(Number(e.target.value))}
                  />
                </div>
                <Button type="submit" className="shrink-0">
                  <Plus className="h-4 w-4" aria-hidden /> Start Migration
                </Button>
              </form>

              <DataTable<MigrationJobRecord>
                columns={migrationColumns}
                data={migrationJobs}
                rowKey={(j) => j.id}
                searchable={false}
                emptyTitle="No migration jobs"
                emptyDescription="Start a migration above to import legacy hospital data."
                dense
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
