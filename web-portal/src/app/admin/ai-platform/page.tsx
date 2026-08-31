'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Bot, ShieldCheck, Cpu, Mic, FileText, XCircle, BookOpen,
  Check, UserCheck, Zap, Activity, Clock, BadgeCheck, Database,
  FileSearch, Lock, Fingerprint, Gauge,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Tabs, TabsList, TabsTrigger, TabsContent,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, Button, Textarea, Label, DataTable, EmptyState, Progress,
  type Column,
} from '@/components/ui';
import { aiPlatformService, AIAgentRecord, AIReviewRecord, AIModelRecord } from '@/services/aiPlatformService';

type TabKey = 'AGENTS' | 'SCRIBE' | 'REVIEW' | 'KNOWLEDGE' | 'MODELS' | 'GOVERNANCE';

const reviewStatusTone: Record<AIReviewRecord['status'], 'success' | 'warning' | 'danger' | 'neutral'> = {
  ACCEPTED: 'success',
  EDITED: 'warning',
  REJECTED: 'danger',
  PENDING: 'neutral',
};

const modelStatusTone: Record<AIModelRecord['status'], 'success' | 'info' | 'danger'> = {
  PRODUCTION: 'success',
  STAGING: 'info',
  DEPRECATED: 'danger',
};

const knowledgeSources = [
  {
    icon: BookOpen,
    title: 'Hospital SOPs & Clinical Guidelines',
    description: '1,420 vector chunks indexed with PgVector embeddings.',
    tile: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  },
  {
    icon: Database,
    title: 'RxNorm & Drug Interaction Knowledge Base',
    description: 'Full pharmacopoeia contraindications & dose adjustment tables.',
    tile: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  },
  {
    icon: FileSearch,
    title: 'ICD-10 & CPT Billing Codebook',
    description: '2026 Edition official medical coding taxonomy.',
    tile: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
  },
];

const guardrails = [
  {
    icon: Lock,
    title: 'HIPAA PHI Redaction Filter',
    description: 'Redacts SSN, phone numbers, and addresses prior to external LLM calls.',
    status: 'Enabled & protected',
    tile: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  },
  {
    icon: Gauge,
    title: 'Minimum Confidence Gate',
    description: 'Outputs with < 85% confidence automatically flag physician review.',
    status: 'Gate active',
    tile: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  },
  {
    icon: Fingerprint,
    title: 'SHA-256 Audit Trail Signature',
    description: 'Every prompt & AI output is digitally signed and logged for SOC2 compliance.',
    status: 'Audit log active',
    tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
];

export default function EnterpriseAIPlatformPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('AGENTS');

  // State
  const [agents, setAgents] = useState<AIAgentRecord[]>(aiPlatformService.getAgents());
  const [reviews, setReviews] = useState<AIReviewRecord[]>(aiPlatformService.getReviews());
  const [models] = useState<AIModelRecord[]>(aiPlatformService.getModels());
  const [analytics] = useState(aiPlatformService.getAnalytics());

  // Interactive Scribe State
  const [dictationText, setDictationText] = useState('Patient is a 54yo male complaining of shortness of breath and fever for 2 days. History of hypertension. BP 138/86, HR 80. Chest reveals mild rhonchi.');
  const [scribeOutput, setScribeOutput] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRunScribe = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setScribeOutput(aiPlatformService.generateSOAPScribe(dictationText));
      setIsGenerating(false);
    }, 600);
  };

  const handleReviewAction = (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    aiPlatformService.submitReviewDecision(id, status);
    setReviews([...aiPlatformService.getReviews()]);
  };

  const modelColumns: Column<AIModelRecord>[] = [
    {
      key: 'name',
      header: 'Model',
      sortable: true,
      cell: (m) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{m.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{m.version}</p>
        </div>
      ),
    },
    {
      key: 'provider',
      header: 'Provider',
      sortable: true,
      cell: (m) => <Badge tone="brand" className="font-mono uppercase">{m.provider.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      cell: (m) => <span className="text-muted-foreground">{m.type.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'avgLatencyMs',
      header: 'Avg latency',
      align: 'right',
      sortable: true,
      accessor: (m) => m.avgLatencyMs,
      cell: (m) => <span className="tabular-nums">{m.avgLatencyMs} ms</span>,
    },
    {
      key: 'costPer1kTokensUSD',
      header: 'Cost / 1k tokens',
      align: 'right',
      sortable: true,
      accessor: (m) => m.costPer1kTokensUSD,
      cell: (m) => <span className="tabular-nums">${m.costPer1kTokensUSD}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (m) => <Badge tone={modelStatusTone[m.status]} dot>{m.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Healthcare Platform"
        description="Enterprise AI layer across EMR, CDS, scribe, coding, RAG & translation — with clinician-in-the-loop governance."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'AI Platform' }]}
        actions={
          <Badge tone="success" dot pulse>
            {analytics.acceptedPct}% clinician acceptance
          </Badge>
        }
      />

      <StatGrid>
        <StatCard label="Requests (24h)" value={analytics.totalRequests24h.toLocaleString()} sub="Across all AI agents" icon={Activity} tone="brand" trend="up" delay={0} />
        <StatCard label="Acceptance rate" value={`${analytics.acceptedPct}%`} sub={`${analytics.overridePct}% clinician overrides`} icon={BadgeCheck} tone="emerald" trend="up" delay={0.05} />
        <StatCard label="Clinician time saved" value={`${analytics.timeSavedHours} hrs`} sub="Documentation automated" icon={Clock} tone="violet" trend="up" delay={0.1} />
        <StatCard label="Avg latency" value={`${analytics.avgLatencyMs} ms`} sub={`Coding accuracy ${analytics.codingAccuracyPct}%`} icon={Zap} tone="amber" trend="neutral" delay={0.15} />
      </StatGrid>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="AGENTS"><Bot className="h-4 w-4" aria-hidden /> Agent Studio</TabsTrigger>
          <TabsTrigger value="SCRIBE"><Mic className="h-4 w-4" aria-hidden /> Scribe Lab</TabsTrigger>
          <TabsTrigger value="REVIEW"><UserCheck className="h-4 w-4" aria-hidden /> Review Queue</TabsTrigger>
          <TabsTrigger value="KNOWLEDGE"><BookOpen className="h-4 w-4" aria-hidden /> Knowledge Hub</TabsTrigger>
          <TabsTrigger value="MODELS"><Cpu className="h-4 w-4" aria-hidden /> Model Registry</TabsTrigger>
          <TabsTrigger value="GOVERNANCE"><ShieldCheck className="h-4 w-4" aria-hidden /> Guardrails</TabsTrigger>
        </TabsList>

        {/* TAB 1: AI AGENT STUDIO */}
        <TabsContent value="AGENTS" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Configurable healthcare AI agents</h2>
            <p className="text-sm text-muted-foreground">Role-specific AI copilots with tool permissions & confidence thresholds.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((ag, i) => (
              <motion.div
                key={ag.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="flex h-full flex-col">
                  <CardContent className="flex flex-1 flex-col gap-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                        <Bot className="h-5 w-5" aria-hidden />
                      </span>
                      <Badge tone={ag.status === 'ACTIVE' ? 'success' : 'warning'} dot pulse={ag.status === 'ACTIVE'}>
                        {ag.status}
                      </Badge>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">{ag.name}</h3>
                      <p className="mt-0.5 font-mono text-xs text-primary">{ag.model}</p>
                      <Badge tone="brand" className="mt-2 uppercase">{ag.role.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{ag.systemPrompt}</p>
                    <div className="mt-auto space-y-2 border-t border-border pt-4">
                      <Progress value={ag.confidenceThreshold} tone="brand" label="Confidence threshold" showValue />
                      {ag.humanApprovalRequired && (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <UserCheck className="h-3.5 w-3.5 text-info" aria-hidden /> Clinician review required
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: AI SCRIBE LAB */}
        <TabsContent value="SCRIBE" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Ambient AI clinical scribe playground</h2>
            <p className="text-sm text-muted-foreground">Simulate ambient audio dictation to generate structured SOAP notes & ICD-10 drafts.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-primary" aria-hidden /> Dictation transcript
                </CardTitle>
                <CardDescription>Doctor–patient audio dictation transcript</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="dictation-transcript" className="sr-only">Doctor-patient audio dictation transcript</Label>
                  <Textarea
                    id="dictation-transcript"
                    rows={6}
                    value={dictationText}
                    onChange={(e) => setDictationText(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
                <Button onClick={handleRunScribe} loading={isGenerating} className="w-full">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  {isGenerating ? 'Generating SOAP notes…' : 'Run clinical AI scribe'}
                </Button>
              </CardContent>
            </Card>

            {scribeOutput ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <Card className="h-full">
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" aria-hidden /> Structured SOAP note
                    </CardTitle>
                    <Badge tone="success">{scribeOutput.confidencePct}% confidence</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 font-mono text-xs">
                    {(['subjective', 'objective', 'assessment', 'plan'] as const).map((section) => (
                      <div key={section} className="rounded-xl bg-muted p-3">
                        <strong className="mb-0.5 block capitalize text-primary">{section}:</strong>
                        <span className="text-foreground">{scribeOutput.soapNote[section]}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="flex items-center justify-center">
                <EmptyState
                  icon={FileText}
                  title="No note generated yet"
                  description="Run the clinical AI scribe on the transcript to see the structured SOAP output here."
                />
              </Card>
            )}
          </div>
        </TabsContent>

        {/* TAB 3: HUMAN REVIEW QUEUE */}
        <TabsContent value="REVIEW" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Clinician human review & governance queue</h2>
            <p className="text-sm text-muted-foreground">Every AI clinical recommendation requires physician sign-off before entering the legal EHR.</p>
          </div>
          {reviews.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="Review queue is clear"
              description="No AI outputs are awaiting clinician review."
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((rev, i) => (
                <motion.div
                  key={rev.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card>
                    <CardContent className="space-y-4 p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="brand" className="font-mono uppercase">{rev.taskType.replace(/_/g, ' ')}</Badge>
                          <span className="text-sm font-semibold text-foreground">{rev.patientId}</span>
                          <span className="text-xs text-subtle-foreground">by {rev.agentName}</span>
                        </div>
                        <Badge tone={reviewStatusTone[rev.status]} dot>
                          {rev.status} · {rev.confidencePct}% confidence
                        </Badge>
                      </div>
                      <p className="rounded-xl bg-muted p-4 font-mono text-xs leading-relaxed text-foreground">{rev.aiOutput}</p>
                      {rev.status === 'PENDING' && (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => handleReviewAction(rev.id, 'ACCEPTED')}>
                            <Check className="h-4 w-4" aria-hidden /> Accept AI suggestion
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleReviewAction(rev.id, 'REJECTED')}>
                            <XCircle className="h-4 w-4" aria-hidden /> Reject / Override
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 4: RAG KNOWLEDGE HUB */}
        <TabsContent value="KNOWLEDGE" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Retrieval-augmented generation (RAG) knowledge hub</h2>
            <p className="text-sm text-muted-foreground">Hospital SOPs, drug interaction databases & clinical guidelines connected to the AI grounding pipeline.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {knowledgeSources.map((src, i) => (
              <motion.div
                key={src.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full">
                  <CardContent className="space-y-3 p-6">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${src.tile}`}>
                      <src.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="font-semibold text-foreground">{src.title}</h3>
                    <p className="text-xs text-muted-foreground">{src.description}</p>
                    <Badge tone="success" dot>Indexed & active</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 5: MODEL REGISTRY */}
        <TabsContent value="MODELS" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI model registry & cost telemetry</h2>
            <p className="text-sm text-muted-foreground">LLM reasoning models, Whisper STT & bio-embedding pipelines.</p>
          </div>
          <DataTable<AIModelRecord>
            columns={modelColumns}
            data={models}
            rowKey={(m) => m.id}
            searchPlaceholder="Search models…"
            exportName="ai-model-registry"
            emptyTitle="No models registered"
            emptyDescription="Registered AI models will appear here with latency and cost telemetry."
          />
        </TabsContent>

        {/* TAB 6: GOVERNANCE & GUARDRAILS */}
        <TabsContent value="GOVERNANCE" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI safety guardrails & PHI protection</h2>
            <p className="text-sm text-muted-foreground">Automated hallucination scoring, HIPAA PHI masking & audit logging.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {guardrails.map((g, i) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full">
                  <CardContent className="space-y-3 p-6">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${g.tile}`}>
                      <g.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="font-semibold text-foreground">{g.title}</h3>
                    <p className="text-xs text-muted-foreground">{g.description}</p>
                    <Badge tone="success" dot>{g.status}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
