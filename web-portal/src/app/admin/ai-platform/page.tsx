'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles, Bot, ShieldCheck, Cpu, Mic, FileText,
  UserCheck, BookOpen, Database, FileSearch, Lock, Fingerprint, Gauge,
  Activity, Clock, CheckCircle2, AlertCircle, Server, ThumbsUp, ThumbsDown, Filter,
} from 'lucide-react';
import {
  PageHeader, Tabs, TabsList, TabsTrigger, TabsContent,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, Button, Textarea, Label, EmptyState, Skeleton,
} from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem('token'); } catch { return null; }
}

type TabKey = 'AGENTS' | 'SCRIBE' | 'REVIEW' | 'KNOWLEDGE' | 'MODELS' | 'GOVERNANCE';

// Static informational panels — these describe planned/configured infrastructure,
// not live API data, so they remain as documentation cards.
const knowledgeSources = [
  {
    icon: BookOpen,
    title: 'Hospital SOPs & Clinical Guidelines',
    description: 'Vector embeddings of clinical protocols to ground AI recommendations.',
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

type AiAgent = {
  _id: string;
  id: string;
  name: string;
  type: string;
  description: string;
  model: string;
  trigger: string;
  status: 'ACTIVE' | 'STAGING' | 'PAUSED' | 'DRAFT';
  totalRunsToday: number;
  avgResponseMs: number;
  successRatePct: number;
  lastTriggeredAt: string | null;
};

type AiModel = {
  _id: string;
  id: string;
  name: string;
  provider: string;
  useCase: string;
  status: 'ACTIVE' | 'STAGING' | 'DEPRECATED';
  deployedAt: string;
  avgLatencyMs: number;
  p99LatencyMs: number;
  successRatePct: number;
  costPer1kTokens: number;
  totalCallsToday: number;
  maxTokens: number | null;
  region: string;
};

type AiReview = {
  _id: string;
  id: string;
  type: 'SOAP_NOTE' | 'DRUG_INTERACTION' | 'ICD_CODING' | 'DISCHARGE_SUMMARY' | 'IMAGING';
  patientDisplay: string;
  summary: string;
  generatedBy: string;
  assignedTo: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
};

type ScribeOutput = {
  soap: { subjective: string; objective: string; assessment: string; plan: string };
  generatedAt: string;
};

export default function EnterpriseAIPlatformPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('AGENTS');

  // Scribe tab — calls real backend endpoint: POST /api/admin/ai-scribe
  const [dictationText, setDictationText] = useState('');
  const [scribeOutput, setScribeOutput] = useState<ScribeOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scribeError, setScribeError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: reviewRes, isLoading: reviewLoading } = useQuery({
    queryKey: ['ops', 'ai_review'],
    queryFn: () => {
      const token = getToken();
      return fetch(`${API_BASE}/api/admin/ops/ai_review`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      }).then(r => r.json());
    },
    staleTime: 30_000,
  });
  const reviewList = (reviewRes?.data ?? []) as AiReview[];

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) => {
      const token = getToken();
      return fetch(`${API_BASE}/api/admin/ops/ai_review/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status }),
      }).then(r => r.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ops', 'ai_review'] }),
  });

  const { data: agentsRes, isLoading: agentsLoading } = useQuery({
    queryKey: ['ops', 'ai_agent'],
    queryFn: () => {
      const token = getToken();
      return fetch(`${API_BASE}/api/admin/ops/ai_agent`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      }).then(r => r.json());
    },
    staleTime: 60_000,
  });
  const agentsList = (agentsRes?.data ?? []) as AiAgent[];

  const { data: modelsRes, isLoading: modelsLoading } = useQuery({
    queryKey: ['ops', 'ai_model'],
    queryFn: () => {
      const token = getToken();
      return fetch(`${API_BASE}/api/admin/ops/ai_model`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      }).then(r => r.json());
    },
    staleTime: 60_000,
  });
  const modelsList = (modelsRes?.data ?? []) as AiModel[];

  const handleRunScribe = async () => {
    setIsGenerating(true);
    setScribeError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/admin/ai-scribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ dictationText }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setScribeOutput(json.data as ScribeOutput);
      } else {
        setScribeError(json.message ?? 'Failed to generate SOAP note. Try again.');
      }
    } catch {
      setScribeError('Network error — check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Healthcare Platform"
        description="Enterprise AI layer across EMR, CDS, scribe, coding, RAG & translation — with clinician-in-the-loop governance."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'AI Platform' }]}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="AGENTS"><Bot className="h-4 w-4" aria-hidden /> Agent Studio</TabsTrigger>
          <TabsTrigger value="SCRIBE"><Mic className="h-4 w-4" aria-hidden /> Scribe Lab</TabsTrigger>
          <TabsTrigger value="REVIEW"><UserCheck className="h-4 w-4" aria-hidden /> Review Queue</TabsTrigger>
          <TabsTrigger value="KNOWLEDGE"><BookOpen className="h-4 w-4" aria-hidden /> Knowledge Hub</TabsTrigger>
          <TabsTrigger value="MODELS"><Cpu className="h-4 w-4" aria-hidden /> Model Registry</TabsTrigger>
          <TabsTrigger value="GOVERNANCE"><ShieldCheck className="h-4 w-4" aria-hidden /> Guardrails</TabsTrigger>
        </TabsList>

        {/* TAB 1: AI AGENT STUDIO — real backend: GET /api/admin/ops/ai_agent */}
        <TabsContent value="AGENTS" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI Agent Studio</h2>
            <p className="text-sm text-muted-foreground">Autonomous AI agents deployed across the clinical workflow — triggers, models, and live telemetry.</p>
          </div>

          {agentsLoading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}><CardContent className="p-5"><div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-56" /><Skeleton className="h-3 w-96" /></div></div></CardContent></Card>
              ))}
            </div>
          )}

          {!agentsLoading && agentsList.length === 0 && (
            <EmptyState icon={Bot} title="No agents registered" description="AI agents will appear here once seeded." />
          )}

          {!agentsLoading && agentsList.length > 0 && (
            <div className="space-y-3">
              {agentsList.map((agent, i) => {
                const AGENT_TYPE_COLORS: Record<string, string> = {
                  SAFETY_CHECK: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
                  CODING: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
                  ALERTING: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
                  SUMMARISATION: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
                  IMAGING: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400',
                  TRANSLATION: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
                };
                const typeColor = AGENT_TYPE_COLORS[agent.type] ?? 'bg-muted text-muted-foreground';
                const minutesAgo = agent.lastTriggeredAt
                  ? Math.round((Date.now() - new Date(agent.lastTriggeredAt).getTime()) / 60000)
                  : null;

                return (
                  <motion.div
                    key={agent._id ?? agent.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Card>
                      <CardContent className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          {/* Left: agent identity */}
                          <div className="flex items-start gap-3 min-w-0">
                            <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${typeColor}`}>
                              <Bot className="h-5 w-5" aria-hidden />
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                                <Badge tone={agent.status === 'ACTIVE' ? 'success' : agent.status === 'STAGING' ? 'warning' : 'neutral'} dot={agent.status === 'ACTIVE'}>
                                  {agent.status}
                                </Badge>
                                <Badge tone="neutral">{agent.type.replace('_', ' ')}</Badge>
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">{agent.description}</p>
                              <p className="mt-1 inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                                <Sparkles className="h-3 w-3" aria-hidden /> {agent.model}
                              </p>
                            </div>
                          </div>

                          {/* Right: metrics */}
                          <div className="flex flex-wrap items-center gap-4 shrink-0 text-xs">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Activity className="h-3.5 w-3.5" aria-hidden />
                              <span className="tabular-nums"><span className="font-semibold text-foreground">{agent.totalRunsToday}</span> runs today</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" aria-hidden />
                              <span className="tabular-nums"><span className="font-semibold text-foreground">{agent.avgResponseMs}</span> ms avg</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden />
                              <span className="tabular-nums"><span className="font-semibold text-foreground">{agent.successRatePct}%</span> success</span>
                            </div>
                          </div>
                        </div>

                        {/* Trigger + last run */}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" aria-hidden />
                            <span>Trigger: <span className="font-medium text-foreground">{agent.trigger}</span></span>
                          </span>
                          {minutesAgo !== null
                            ? <span>Last run <span className="font-medium text-foreground">{minutesAgo} min ago</span></span>
                            : <span className="text-muted-foreground/60">Not yet triggered in staging</span>
                          }
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: AI SCRIBE LAB — real backend: POST /api/admin/ai-scribe */}
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
                {scribeError && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
                    {scribeError}
                  </p>
                )}
              </CardContent>
            </Card>

            {scribeOutput ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <Card className="h-full">
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" aria-hidden /> Structured SOAP note
                    </CardTitle>
                    <Badge tone="success">Generated</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 font-mono text-xs">
                    {(['subjective', 'objective', 'assessment', 'plan'] as const).map((section) => (
                      <div key={section} className="rounded-xl bg-muted p-3">
                        <strong className="mb-0.5 block capitalize text-primary">{section}:</strong>
                        <span className="text-foreground">{scribeOutput.soap[section]}</span>
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

        {/* TAB 3: HUMAN REVIEW QUEUE — real backend: GET/PATCH /api/admin/ops/ai_review */}
        <TabsContent value="REVIEW" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Clinician Review Queue</h2>
              <p className="text-sm text-muted-foreground">AI-generated outputs awaiting physician or specialist sign-off before being actioned.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" aria-hidden />
              <span className="tabular-nums font-medium text-foreground">
                {reviewList.filter(r => r.status === 'PENDING').length}
              </span> pending
            </div>
          </div>

          {reviewLoading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}><CardContent className="p-5"><div className="space-y-2"><Skeleton className="h-4 w-64" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /></div></CardContent></Card>
              ))}
            </div>
          )}

          {!reviewLoading && reviewList.length === 0 && (
            <EmptyState icon={UserCheck} title="Queue is clear" description="No AI outputs are awaiting clinician review." />
          )}

          {!reviewLoading && reviewList.length > 0 && (
            <div className="space-y-3">
              {(() => {
                const REVIEW_TYPE_LABELS: Record<string, string> = {
                  SOAP_NOTE: 'SOAP Note',
                  DRUG_INTERACTION: 'Drug Interaction',
                  ICD_CODING: 'ICD Coding',
                  DISCHARGE_SUMMARY: 'Discharge Summary',
                  IMAGING: 'Imaging',
                };
                const PRIORITY_COLORS: Record<string, string> = {
                  HIGH: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
                  MEDIUM: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
                  LOW: 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-400',
                };
                const sorted = [...reviewList].sort((a, b) => {
                  const p = { HIGH: 0, MEDIUM: 1, LOW: 2 };
                  if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                  if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
                  return (p[a.priority] ?? 2) - (p[b.priority] ?? 2);
                });

                return sorted.map((item, i) => {
                  const isPending = item.status === 'PENDING';
                  const minutesAgo = Math.round((Date.now() - new Date(item.createdAt).getTime()) / 60000);
                  const isMutating = reviewMutation.isPending && (reviewMutation.variables as { id: string })?.id === (item._id ?? item.id);

                  return (
                    <motion.div
                      key={item._id ?? item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Card className={isPending ? '' : 'opacity-60'}>
                        <CardContent className="p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            {/* Left: identity */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_COLORS[item.priority]}`}>
                                  {item.priority}
                                </span>
                                <Badge tone="neutral">{REVIEW_TYPE_LABELS[item.type] ?? item.type}</Badge>
                                <Badge tone={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}>
                                  {item.status}
                                </Badge>
                              </div>
                              <p className="mt-1.5 text-sm font-medium text-foreground">{item.patientDisplay}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">{item.summary}</p>
                            </div>

                            {/* Right: actions */}
                            {isPending && (
                              <div className="flex shrink-0 gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isMutating}
                                  onClick={() => reviewMutation.mutate({ id: item._id ?? item.id, status: 'REJECTED' })}
                                  className="gap-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                >
                                  <ThumbsDown className="h-3.5 w-3.5" aria-hidden /> Reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isMutating}
                                  onClick={() => reviewMutation.mutate({ id: item._id ?? item.id, status: 'APPROVED' })}
                                  className="gap-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                >
                                  <ThumbsUp className="h-3.5 w-3.5" aria-hidden /> Approve
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
                            <span>Generated by <span className="font-medium text-foreground">{item.generatedBy}</span></span>
                            <span className="flex items-center gap-3">
                              <span>Assigned: <span className="font-medium text-foreground">{item.assignedTo}</span></span>
                              <span>{minutesAgo < 60 ? `${minutesAgo} min ago` : `${Math.round(minutesAgo / 60)}h ago`}</span>
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                });
              })()}
            </div>
          )}
        </TabsContent>

        {/* TAB 4: RAG KNOWLEDGE HUB — static informational panel */}
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
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 5: MODEL REGISTRY — real backend: GET /api/admin/ops/ai_model */}
        <TabsContent value="MODELS" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI Model Registry</h2>
            <p className="text-sm text-muted-foreground">All AI models deployed across the platform — latency, success rate, and cost telemetry.</p>
          </div>

          {modelsLoading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}><CardContent className="p-5"><div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-56" /><Skeleton className="h-3 w-80" /></div></div></CardContent></Card>
              ))}
            </div>
          )}

          {!modelsLoading && modelsList.length === 0 && (
            <EmptyState icon={Cpu} title="No models registered" description="AI models will appear here once seeded." />
          )}

          {!modelsLoading && modelsList.length > 0 && (
            <div className="space-y-3">
              {modelsList.map((model, i) => (
                <motion.div
                  key={model._id ?? model.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        {/* Left: model identity */}
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Server className="h-5 w-5 text-primary" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-mono text-sm font-semibold text-foreground">{model.name}</h3>
                              <Badge tone={model.status === 'ACTIVE' ? 'success' : model.status === 'STAGING' ? 'warning' : 'neutral'} dot={model.status === 'ACTIVE'}>
                                {model.status}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">{model.useCase}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground/70">{model.provider} · {model.region} · deployed {model.deployedAt}</p>
                          </div>
                        </div>

                        {/* Right: metrics */}
                        <div className="flex flex-wrap items-center gap-4 shrink-0 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" aria-hidden />
                            <span className="tabular-nums">
                              <span className="font-semibold text-foreground">{model.avgLatencyMs}</span> ms avg
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden />
                            <span className="tabular-nums">
                              <span className="font-semibold text-foreground">{model.successRatePct}%</span> success
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Activity className="h-3.5 w-3.5" aria-hidden />
                            <span className="tabular-nums">
                              <span className="font-semibold text-foreground">{model.totalCallsToday.toLocaleString()}</span> calls today
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Gauge className="h-3.5 w-3.5" aria-hidden />
                            <span className="tabular-nums">
                              {model.costPer1kTokens === 0
                                ? <span className="font-semibold text-success">Free (on-premise)</span>
                                : <><span className="font-semibold text-foreground">${model.costPer1kTokens}</span> /1k tokens</>
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* p99 latency bar */}
                      <div className="mt-4 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Latency distribution</span>
                          <span className="tabular-nums">p99 {model.p99LatencyMs} ms</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary/60 transition-all"
                            style={{ width: `${Math.min(100, (model.avgLatencyMs / model.p99LatencyMs) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 6: GOVERNANCE & GUARDRAILS — static informational panel */}
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
                    <Badge tone="info">{g.status}</Badge>
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
