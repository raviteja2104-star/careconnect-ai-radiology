'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban, Terminal, Sparkles, Workflow, BookOpen, GitCommitHorizontal,
  ShieldCheck, Gauge, BarChart2, Wrench, GitPullRequest, FileCode,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Badge, Button, Card, CardHeader, CardTitle,
  CardDescription, CardContent, Tabs, TabsList, TabsTrigger, TabsContent,
  Textarea, Label, DataTable, type Column, Progress,
} from '@/components/ui';
import { enterpriseProgramService, PortfolioInitiative, TraceabilityMatrixItem, TechDebtItem, ArchitectureRecord } from '@/services/enterpriseProgramService';

const INITIATIVE_STATUS_TONE: Record<PortfolioInitiative['status'], 'success' | 'info' | 'neutral'> = {
  COMPLETED: 'success',
  IN_PROGRESS: 'info',
  PLANNED: 'neutral',
};

const INITIATIVE_CATEGORY_TONE: Record<PortfolioInitiative['category'], 'brand' | 'warning' | 'info' | 'success'> = {
  PRODUCT_HEALTH: 'success',
  ENTERPRISE_AI: 'warning',
  INTEROPERABILITY: 'info',
  COMMERCIAL_SAAS: 'brand',
};

const ADR_STATUS_TONE: Record<ArchitectureRecord['status'], 'success' | 'info' | 'neutral'> = {
  APPROVED: 'success',
  PROPOSED: 'info',
  DEPRECATED: 'neutral',
};

const DEBT_SEVERITY_TONE: Record<TechDebtItem['severity'], 'danger' | 'warning' | 'neutral'> = {
  CRITICAL: 'danger',
  MAJOR: 'warning',
  MINOR: 'neutral',
};

export default function EnterpriseProgramPage() {
  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'TRACEABILITY' | 'DEVSECOPS' | 'ARCHITECTURE' | 'TECH_DEBT'>('PORTFOLIO');

  // States
  const [initiatives] = useState<PortfolioInitiative[]>(enterpriseProgramService.getInitiatives());
  const [matrix] = useState<TraceabilityMatrixItem[]>(enterpriseProgramService.getMatrix());
  const [techDebt] = useState<TechDebtItem[]>(enterpriseProgramService.getTechDebt());
  const [adrs] = useState<ArchitectureRecord[]>(enterpriseProgramService.getADRs());
  const [engMetrics] = useState(enterpriseProgramService.getEngineeringDevSecOpsMetrics());

  // Interactive AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('Generate release notes for v1.1.0-hardened detailing OAuth 2.1, PHI scanner, & k6 load test results.');
  const [aiOutput, setAiOutput] = useState<string>('');

  const handleRunAiCopilot = () => {
    setAiOutput(`### CareConnect v1.1.0-Hardened Release Notes\n\n- **Authentication**: OAuth 2.1 with PKCE & WebAuthn passkey support.\n- **Security**: Immutable SHA-256 audit logging & automated HIPAA PHI redaction filter.\n- **Performance**: Verified 10,000 concurrent clinician load benchmarks at 140ms P99 latency.\n- **Compliance**: Certified 100% NABH & ABDM Milestone 1-3 controls.`);
  };

  const initiativeColumns: Column<PortfolioInitiative>[] = [
    {
      key: 'name',
      header: 'Initiative',
      sortable: true,
      cell: (init) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <FolderKanban className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{init.name}</p>
            <p className="text-xs text-subtle-foreground">Lead: {init.leadExecutive}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      cell: (init) => <Badge tone={INITIATIVE_CATEGORY_TONE[init.category]}>{init.category.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'budgetAllocatedUsd',
      header: 'Budget',
      align: 'right',
      sortable: true,
      accessor: (init) => init.budgetAllocatedUsd,
      cell: (init) => (
        <span className="font-mono font-semibold tabular-nums text-foreground">${init.budgetAllocatedUsd.toLocaleString()}</span>
      ),
    },
    {
      key: 'completionPct',
      header: 'Completion',
      sortable: true,
      accessor: (init) => init.completionPct,
      cell: (init) => (
        <div className="min-w-[9rem]">
          <Progress value={init.completionPct} tone={init.completionPct >= 100 ? 'success' : 'brand'} showValue size="sm" />
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (init) => <Badge tone={INITIATIVE_STATUS_TONE[init.status]} dot>{init.status.replace(/_/g, ' ')}</Badge>,
    },
  ];

  const adrColumns: Column<ArchitectureRecord>[] = [
    { key: 'adrId', header: 'ADR', sortable: true, cell: (adr) => <span className="font-mono text-xs font-semibold text-primary">{adr.adrId}</span> },
    {
      key: 'title',
      header: 'Decision',
      sortable: true,
      cell: (adr) => (
        <span className="inline-flex items-center gap-2 font-semibold text-foreground">
          <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /> {adr.title}
        </span>
      ),
    },
    { key: 'author', header: 'Author', sortable: true, cell: (adr) => <span className="text-muted-foreground">{adr.author}</span> },
    { key: 'date', header: 'Approved', sortable: true, cell: (adr) => <span className="font-mono text-xs text-muted-foreground">{adr.date}</span> },
    { key: 'status', header: 'Status', cell: (adr) => <Badge tone={ADR_STATUS_TONE[adr.status]} dot>{adr.status}</Badge> },
  ];

  const debtColumns: Column<TechDebtItem>[] = [
    {
      key: 'component',
      header: 'Component',
      sortable: true,
      cell: (td) => (
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <Wrench className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /> {td.component}
          </p>
          <p className="text-xs text-muted-foreground">{td.description}</p>
        </div>
      ),
    },
    { key: 'assignedEngineer', header: 'Assigned', sortable: true, cell: (td) => <span className="text-muted-foreground">{td.assignedEngineer}</span> },
    {
      key: 'estimatedRefactorHours',
      header: 'Est. refactor',
      align: 'right',
      sortable: true,
      accessor: (td) => td.estimatedRefactorHours,
      cell: (td) => <span className="tabular-nums text-muted-foreground">{td.estimatedRefactorHours} hrs</span>,
    },
    { key: 'severity', header: 'Severity', cell: (td) => <Badge tone={DEBT_SEVERITY_TONE[td.severity]} dot>{td.severity}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Programme Management"
        description="SAFe increment planning, traceability matrix, DevSecOps telemetry, ADR repository & AI copilots."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Programme' }]}
        actions={<Badge tone="brand" dot>Phase 20 Complete</Badge>}
      />

      <StatGrid>
        <StatCard
          label="CI/CD build success"
          value={`${engMetrics.ciBuildSuccessRatePct}%`}
          sub="GitHub Actions pipeline"
          icon={Terminal}
          tone="emerald"
          trend="up"
          delay={0}
        />
        <StatCard
          label="Code quality grade"
          value={engMetrics.sonarQubeCodeQualityGrade}
          sub={`SonarQube · ${engMetrics.codeCoveragePct}% coverage`}
          icon={ShieldCheck}
          tone="brand"
          delay={0.05}
        />
        <StatCard
          label="Open vulnerabilities"
          value={engMetrics.openSecurityVulnerabilitiesCount}
          sub="Snyk / Dependabot scans"
          icon={Gauge}
          tone="teal"
          trend="down"
          delay={0.1}
        />
        <StatCard
          label="Sprint velocity"
          value={`${engMetrics.sprintVelocityStoryPoints} pts`}
          sub={`${engMetrics.openPullRequestsCount} open pull requests`}
          icon={BarChart2}
          tone="violet"
          trend="up"
          delay={0.15}
        />
      </StatGrid>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="PORTFOLIO"><FolderKanban className="h-4 w-4" aria-hidden /> Portfolio</TabsTrigger>
          <TabsTrigger value="TRACEABILITY"><Workflow className="h-4 w-4" aria-hidden /> Traceability</TabsTrigger>
          <TabsTrigger value="DEVSECOPS"><Terminal className="h-4 w-4" aria-hidden /> DevSecOps</TabsTrigger>
          <TabsTrigger value="ARCHITECTURE"><BookOpen className="h-4 w-4" aria-hidden /> ADR Repository</TabsTrigger>
          <TabsTrigger value="TECH_DEBT"><Sparkles className="h-4 w-4" aria-hidden /> Tech Debt & AI</TabsTrigger>
        </TabsList>

        {/* TAB 1: PORTFOLIO & INITIATIVES */}
        <TabsContent value="PORTFOLIO" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Strategic Portfolio Initiatives & Program Increments</h2>
            <p className="text-sm text-muted-foreground">Track executive initiatives, budget allocations, completion status & leadership owners.</p>
          </div>
          <DataTable<PortfolioInitiative>
            columns={initiativeColumns}
            data={initiatives}
            rowKey={(init) => init.id}
            searchPlaceholder="Search initiatives…"
            exportName="portfolio-initiatives"
            emptyTitle="No portfolio initiatives"
            emptyDescription="Strategic initiatives approved by the executive committee will appear here."
          />
        </TabsContent>

        {/* TAB 2: REQUIREMENTS TRACEABILITY MATRIX */}
        <TabsContent value="TRACEABILITY" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Requirements Lineage & Traceability Matrix</h2>
            <p className="text-sm text-muted-foreground">End-to-end lineage: Requirement → Feature → Story → Commit → Build → Test Case → Production.</p>
          </div>
          <div className="space-y-3">
            {matrix.map((m, i) => (
              <motion.div
                key={m.reqId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card>
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 font-mono text-sm font-semibold text-primary">
                        <GitCommitHorizontal className="h-4 w-4" aria-hidden /> {m.reqId}
                        <span className="font-sans text-foreground">— {m.featureName}</span>
                      </span>
                      <Badge tone={m.productionDeployed ? 'success' : 'neutral'} dot>
                        {m.productionDeployed ? 'PRODUCTION DEPLOYED' : 'NOT DEPLOYED'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs sm:grid-cols-3">
                      <div>
                        <p className="text-subtle-foreground">Epic / Story</p>
                        <p className="mt-0.5 font-semibold text-info">{m.epicId} · {m.storyId}</p>
                      </div>
                      <div>
                        <p className="text-subtle-foreground">Commit / CI build</p>
                        <p className="mt-0.5 font-semibold text-success">{m.commitHash} · {m.buildStatus}</p>
                      </div>
                      <div>
                        <p className="text-subtle-foreground">Test case / coverage</p>
                        <p className="mt-0.5 font-semibold text-primary">{m.testCaseId} · PASSED</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: DEVSECOPS & VELOCITY */}
        <TabsContent value="DEVSECOPS" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">DevSecOps Pipeline & Engineering Velocity Dashboard</h2>
            <p className="text-sm text-muted-foreground">CI/CD build success rate, SonarQube code quality grades & Snyk security scans.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="CI/CD build success" value={`${engMetrics.ciBuildSuccessRatePct}%`} sub="GitHub Actions pipeline" icon={Terminal} tone="emerald" delay={0} />
            <StatCard label="SonarQube code quality" value={engMetrics.sonarQubeCodeQualityGrade} sub="Static code analysis" icon={ShieldCheck} tone="brand" delay={0.05} />
            <StatCard label="Security vulnerabilities" value={`${engMetrics.openSecurityVulnerabilitiesCount} open`} sub="Snyk / Dependabot" icon={Gauge} tone="teal" delay={0.1} />
            <StatCard label="Sprint velocity" value={`${engMetrics.sprintVelocityStoryPoints} pts`} sub="Story points / sprint" icon={GitPullRequest} tone="violet" delay={0.15} />
          </div>
        </TabsContent>

        {/* TAB 4: ADR ARCHITECTURE REPOSITORY */}
        <TabsContent value="ARCHITECTURE" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Architecture Decision Records (ADR) Repository</h2>
            <p className="text-sm text-muted-foreground">Formal decisions for framework selection, data store topologies & security protocols.</p>
          </div>
          <DataTable<ArchitectureRecord>
            columns={adrColumns}
            data={adrs}
            rowKey={(adr) => adr.adrId}
            searchPlaceholder="Search decisions…"
            exportName="architecture-decision-records"
            emptyTitle="No architecture decisions"
            emptyDescription="Approved ADRs and proposals will appear here."
          />
        </TabsContent>

        {/* TAB 5: TECH DEBT & AI COPILOT */}
        <TabsContent value="TECH_DEBT" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Technical Debt Manager & AI Engineering Copilot</h2>
            <p className="text-sm text-muted-foreground">Refactoring backlog and AI assistant for code review, release notes & impact analysis.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-warning" aria-hidden /> AI Engineering Copilot Sandbox
              </CardTitle>
              <CardDescription>Draft release notes, impact analyses and review summaries from engineering telemetry.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="copilot-prompt">Prompt</Label>
                <Textarea
                  id="copilot-prompt"
                  rows={2}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="font-mono"
                />
              </div>
              <Button onClick={handleRunAiCopilot}>
                <Sparkles className="h-4 w-4" aria-hidden /> Execute AI Copilot
              </Button>
              {aiOutput && (
                <motion.pre
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-x-auto scrollbar-thin whitespace-pre-wrap rounded-xl border border-border bg-muted/60 p-4 font-mono text-xs leading-relaxed text-foreground"
                >
                  {aiOutput}
                </motion.pre>
              )}
            </CardContent>
          </Card>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Active Technical Debt Backlog</h3>
            <DataTable<TechDebtItem>
              columns={debtColumns}
              data={techDebt}
              rowKey={(td) => td.id}
              searchPlaceholder="Search backlog…"
              exportName="tech-debt-backlog"
              emptyTitle="No technical debt items"
              emptyDescription="Nice — the refactoring backlog is clear."
              dense
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
