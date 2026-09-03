'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Database, Activity, Layers, Heart, Play, RefreshCw, Users, FileText,
  Sparkles, AlertTriangle, ArrowRight, Stethoscope, FlaskConical, Pill,
  BedDouble, ClipboardList, Lightbulb, HardDrive,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Tabs, TabsList, TabsTrigger, TabsContent,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, Button, Input, Label, DataTable, EmptyState, Progress,
  type Column,
} from '@/components/ui';
import {
  enterpriseDataPlatformService, MasterPatientIndexRecord, DataAssetRecord,
  PopulationHealthMetric, PredictiveModelInsight, DigitalTwinHospitalState
} from '@/services/enterpriseDataPlatformService';

type TabKey = 'TWIN' | 'POPULATION' | 'PREDICTIVE' | 'EMPI' | 'LAKEHOUSE' | 'RESEARCH';

const riskTone: Record<PredictiveModelInsight['riskLevel'], 'success' | 'warning' | 'danger'> = {
  LOW: 'success',
  MODERATE: 'warning',
  HIGH: 'danger',
  CRITICAL: 'danger',
};

export default function EnterpriseDataPlatformPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('TWIN');

  // States
  const [empi] = useState<MasterPatientIndexRecord[]>(enterpriseDataPlatformService.getEMPI());
  const [assets] = useState<DataAssetRecord[]>(enterpriseDataPlatformService.getAssets());
  const [popHealth] = useState<PopulationHealthMetric[]>(enterpriseDataPlatformService.getPopulationHealth());
  const [predictive] = useState<PredictiveModelInsight[]>(enterpriseDataPlatformService.getPredictiveInsights());
  const [twin, setTwin] = useState<DigitalTwinHospitalState>(enterpriseDataPlatformService.getDigitalTwinState());

  // Research Query Form
  const [cohortName, setCohortName] = useState('Cardiovascular & Type 2 Diabetes High-Risk Cohort');
  const [researchReport, setResearchReport] = useState<any>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const handleRefreshTwin = () => {
    setTwin(enterpriseDataPlatformService.getDigitalTwinState());
  };

  const handleRunResearchQuery = (e: React.FormEvent) => {
    e.preventDefault();
    setIsQuerying(true);
    setTimeout(() => {
      setResearchReport(enterpriseDataPlatformService.runResearchQuery(cohortName, true));
      setIsQuerying(false);
    }, 600);
  };

  const totalRecords = assets.reduce((sum, a) => sum + a.recordCount, 0);
  const totalCohort = popHealth.reduce((sum, p) => sum + p.cohortSize, 0);

  const twinStages = [
    { step: 1, label: 'OPD Triage Queue', value: twin.opdTriageQueue, sub: 'Avg 14 min wait', icon: ClipboardList, tile: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' },
    { step: 2, label: 'Doctor Consultations', value: twin.consultationActive, sub: 'Active consultations', icon: Stethoscope, tile: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400' },
    { step: 3, label: 'Lab & Radiology', value: twin.labSpecimensInQueue + twin.radiologyScansActive, sub: 'In diagnostics', icon: FlaskConical, tile: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400' },
    { step: 4, label: 'Pharmacy Dispense', value: twin.pharmacyDispenseQueue, sub: 'Dispensing queue', icon: Pill, tile: 'bg-emerald-50 text-emerald-500/15 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' },
    { step: 5, label: 'IPD / ICU / OT', value: twin.ipdBedsOccupied + twin.icuBedsOccupied, sub: 'Occupied beds', icon: BedDouble, tile: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400' },
  ];

  const empiColumns: Column<MasterPatientIndexRecord>[] = [
    {
      key: 'patientName',
      header: 'Patient',
      sortable: true,
      cell: (p) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{p.patientName}</p>
          <p className="text-xs text-muted-foreground">{p.gender} · DOB {p.dob}</p>
        </div>
      ),
    },
    {
      key: 'empiId',
      header: 'EMPI / ABHA',
      sortable: true,
      cell: (p) => (
        <div className="font-mono text-xs">
          <p className="text-primary">{p.empiId}</p>
          <p className="text-muted-foreground">{p.abhaAddress}</p>
        </div>
      ),
    },
    {
      key: 'matchedHospitals',
      header: 'Linked hospitals',
      accessor: (p) => p.matchedHospitals.join(', '),
      cell: (p) => (
        <div className="flex max-w-md flex-wrap gap-1.5">
          {p.matchedHospitals.map((h) => (
            <Badge key={h} tone="outline" className="font-mono text-[10px]">{h}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'confidenceScorePct',
      header: 'Match confidence',
      align: 'right',
      sortable: true,
      accessor: (p) => p.confidenceScorePct,
      cell: (p) => <span className="font-semibold tabular-nums text-success">{p.confidenceScorePct}%</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (p) => (
        <Badge tone={p.status === 'VERIFIED' ? 'success' : 'warning'} dot>
          {p.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
  ];

  const assetColumns: Column<DataAssetRecord>[] = [
    {
      key: 'name',
      header: 'Data asset',
      sortable: true,
      cell: (a) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <HardDrive className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{a.name}</p>
            <p className="text-xs text-muted-foreground">Last ingested {a.lastIngested}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      cell: (a) => <span className="text-muted-foreground">{a.category.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'format',
      header: 'Format',
      sortable: true,
      cell: (a) => <Badge tone="brand" className="font-mono uppercase">{a.format}</Badge>,
    },
    {
      key: 'recordCount',
      header: 'Records',
      align: 'right',
      sortable: true,
      accessor: (a) => a.recordCount,
      cell: (a) => <span className="tabular-nums">{a.recordCount.toLocaleString()}</span>,
    },
    {
      key: 'sizeBytes',
      header: 'Size',
      align: 'right',
      sortable: true,
      accessor: (a) => a.sizeBytes,
      cell: (a) => <span className="tabular-nums">{(a.sizeBytes / 1000000).toFixed(1)} MB</span>,
    },
    {
      key: 'qualityScorePct',
      header: 'Quality',
      align: 'right',
      sortable: true,
      accessor: (a) => a.qualityScorePct,
      cell: (a) => <Badge tone="success">{a.qualityScorePct}%</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Data Platform"
        description="Master Patient Index (EMPI), BI studio, population health, ML feature store & live hospital digital twin."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Data Platform' }]}
        actions={
          <Badge tone="success" dot pulse>
            Lakehouse & digital twin active
          </Badge>
        }
      />

      <StatGrid>
        <StatCard label="Active patients (twin)" value={twin.activePatients.toLocaleString()} sub="Live across all facilities" icon={Activity} tone="brand" trend="up" delay={0} />
        <StatCard label="Chronic care cohort" value={totalCohort.toLocaleString()} sub={`${popHealth.length} tracked conditions`} icon={Heart} tone="rose" trend="neutral" delay={0.05} />
        <StatCard label="Records under management" value={totalRecords.toLocaleString()} sub={`${assets.length} governed data assets`} icon={Database} tone="violet" trend="up" delay={0.1} />
        <StatCard label="Predictive risk alerts" value={predictive.length} sub="Sepsis, readmission & SOFA models" icon={Sparkles} tone="amber" trend="neutral" delay={0.15} />
      </StatGrid>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="TWIN"><Activity className="h-4 w-4" aria-hidden /> Digital Twin</TabsTrigger>
          <TabsTrigger value="POPULATION"><Heart className="h-4 w-4" aria-hidden /> Population Health</TabsTrigger>
          <TabsTrigger value="PREDICTIVE"><Sparkles className="h-4 w-4" aria-hidden /> Predictive AI</TabsTrigger>
          <TabsTrigger value="EMPI"><Users className="h-4 w-4" aria-hidden /> EMPI Index</TabsTrigger>
          <TabsTrigger value="LAKEHOUSE"><Layers className="h-4 w-4" aria-hidden /> Data Lakehouse</TabsTrigger>
          <TabsTrigger value="RESEARCH"><FileText className="h-4 w-4" aria-hidden /> Research & ML</TabsTrigger>
        </TabsList>

        {/* TAB 1: HOSPITAL DIGITAL TWIN */}
        <TabsContent value="TWIN" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Live hospital operations digital twin</h2>
              <p className="text-sm text-muted-foreground">Real-time simulation of patient flows across OPD, IPD, ICU, OT, lab & pharmacy.</p>
            </div>
            <Button size="sm" onClick={handleRefreshTwin}>
              <RefreshCw className="h-4 w-4" aria-hidden /> Refresh twin stream
            </Button>
          </div>

          {twin.bottleneckAlert && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              role="alert"
              className="flex items-center gap-3 rounded-2xl bg-warning-soft p-4 text-sm font-medium text-warning"
            >
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
              <span><strong>Digital twin bottleneck alert:</strong> {twin.bottleneckAlert}</span>
            </motion.div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Active operational flow telemetry</CardTitle>
              <CardDescription>Patient journey stages from arrival to admission, updated live.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {twinStages.map((stage, i) => (
                  <motion.div
                    key={stage.step}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="relative rounded-2xl border border-border bg-muted/50 p-4 text-center"
                  >
                    <span className={`mx-auto mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${stage.tile}`}>
                      <stage.icon className="h-4 w-4" aria-hidden />
                    </span>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle-foreground">
                      {stage.step}. {stage.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{stage.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{stage.sub}</p>
                    {i < twinStages.length - 1 && (
                      <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-subtle-foreground lg:block" aria-hidden />
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: POPULATION HEALTH */}
        <TabsContent value="POPULATION" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Population health & chronic disease outcomes</h2>
            <p className="text-sm text-muted-foreground">Disease prevalence, 30-day readmissions & screening compliance across patient cohorts.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {popHealth.map((ph, i) => (
              <motion.div
                key={ph.condition}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone="brand" className="uppercase">{ph.condition.replace(/_/g, ' ')}</Badge>
                      <span className="text-xs font-semibold text-success">{ph.controlledPct}% controlled</span>
                    </div>
                    <div>
                      <p className="text-3xl font-bold tabular-nums text-foreground">{ph.cohortSize.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Enrolled cohort patients · {ph.prevalencePct}% prevalence</p>
                    </div>
                    <Progress value={ph.controlledPct} tone="success" label="Condition controlled" showValue />
                    <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle-foreground">30d readmission</p>
                        <p className="font-semibold tabular-nums text-foreground">{ph.readmissionRate30d}%</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle-foreground">Screening compliance</p>
                        <p className="font-semibold tabular-nums text-foreground">{ph.screeningCompliancePct}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: PREDICTIVE AI */}
        <TabsContent value="PREDICTIVE" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Predictive AI clinical insights & risk models</h2>
            <p className="text-sm text-muted-foreground">Early sepsis alerts, 30-day readmission risk & ICU SOFA deterioration scores.</p>
          </div>
          {predictive.length === 0 ? (
            <EmptyState icon={Sparkles} title="No active risk alerts" description="Predictive model insights will appear here as they are generated." />
          ) : (
            <div className="space-y-4">
              {predictive.map((pred, i) => (
                <motion.div
                  key={pred.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card>
                    <CardContent className="space-y-4 p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="danger" className="font-mono uppercase">{pred.modelName.replace(/_/g, ' ')}</Badge>
                          {pred.patientName && <span className="text-sm font-semibold text-foreground">{pred.patientName}</span>}
                        </div>
                        <Badge tone={riskTone[pred.riskLevel]} dot pulse={pred.riskLevel === 'CRITICAL' || pred.riskLevel === 'HIGH'}>
                          {pred.riskScorePct}% · {pred.riskLevel} RISK
                        </Badge>
                      </div>
                      <div className="rounded-xl bg-muted p-3 font-mono text-xs">
                        <strong className="mb-1 block text-primary">Triggering risk factors:</strong>
                        <span className="text-foreground">{pred.keyFactors.join(' | ')}</span>
                      </div>
                      <p className="flex items-start gap-2 text-sm text-foreground">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                        <span><strong>AI recommendation:</strong> {pred.recommendation}</span>
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 4: EMPI PATIENT INDEX */}
        <TabsContent value="EMPI" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Enterprise Master Patient Index (EMPI)</h2>
            <p className="text-sm text-muted-foreground">Cross-hospital identity resolution, deduplication & ABHA address mapping.</p>
          </div>
          <DataTable<MasterPatientIndexRecord>
            columns={empiColumns}
            data={empi}
            rowKey={(p) => p.empiId}
            searchPlaceholder="Search patients, EMPI or ABHA…"
            exportName="empi-patient-index"
            emptyTitle="No EMPI records"
            emptyDescription="Resolved patient identities will appear here once ingested."
          />
        </TabsContent>

        {/* TAB 5: DATA LAKEHOUSE */}
        <TabsContent value="LAKEHOUSE" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Data lakehouse & clinical catalog</h2>
            <p className="text-sm text-muted-foreground">Unified PostgreSQL, ClickHouse, Apache Iceberg & PgVector storage assets.</p>
          </div>
          <DataTable<DataAssetRecord>
            columns={assetColumns}
            data={assets}
            rowKey={(a) => a.id}
            searchPlaceholder="Search data assets…"
            exportName="data-lakehouse-catalog"
            emptyTitle="No data assets"
            emptyDescription="Catalogued lakehouse assets will appear here."
          />
        </TabsContent>

        {/* TAB 6: RESEARCH & ML FEATURE STORE */}
        <TabsContent value="RESEARCH" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">De-identified research workspace & feature store</h2>
            <p className="text-sm text-muted-foreground">Build HIPAA-compliant research cohorts & query ML time-series features.</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleRunResearchQuery} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label htmlFor="cohort-definition">Cohort definition</Label>
                  <Input
                    id="cohort-definition"
                    type="text"
                    placeholder="Cohort Definition (e.g. Cardiovascular & Diabetes Dual Cohort)"
                    value={cohortName}
                    onChange={(e) => setCohortName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <Button type="submit" loading={isQuerying} className="shrink-0">
                  <Play className="h-4 w-4" aria-hidden />
                  {isQuerying ? 'Querying cohort…' : 'Extract research cohort'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {researchReport ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle>{researchReport.cohortName}</CardTitle>
                  <Badge tone="success" dot>{researchReport.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-2 font-mono text-xs text-foreground">
                  <p><span className="text-muted-foreground">Query ID:</span> {researchReport.queryId}</p>
                  <p><span className="text-muted-foreground">Matched de-identified patients:</span> {researchReport.patientCount}</p>
                  <p><span className="text-muted-foreground">Export format:</span> {researchReport.exportFormat}</p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No cohort extracted yet"
              description="Define a cohort above and run the extraction to see the de-identified research report."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
