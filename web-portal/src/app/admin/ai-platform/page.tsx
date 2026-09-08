'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Bot, ShieldCheck, Cpu, Mic, FileText,
  UserCheck, BookOpen, Database, FileSearch, Lock, Fingerprint, Gauge, Construction,
} from 'lucide-react';
import {
  PageHeader, Tabs, TabsList, TabsTrigger, TabsContent,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, Button, Textarea, Label, EmptyState,
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

type ScribeOutput = {
  soap: { subjective: string; objective: string; assessment: string; plan: string };
  generatedAt: string;
};

export default function EnterpriseAIPlatformPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('AGENTS');

  // Scribe tab — calls real backend endpoint: POST /api/admin/ai-scribe
  const [dictationText, setDictationText] = useState(
    'Patient is a 54yo male complaining of shortness of breath and fever for 2 days. History of hypertension. BP 138/86, HR 80. Chest reveals mild rhonchi.'
  );
  const [scribeOutput, setScribeOutput] = useState<ScribeOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRunScribe = async () => {
    setIsGenerating(true);
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
      }
    } catch {
      // Network error — silently ignore; user can retry
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

        {/* TAB 1: AI AGENT STUDIO — no backend endpoint */}
        <TabsContent value="AGENTS" className="mt-6">
          <EmptyState
            icon={Construction}
            title="AI Agent Studio not yet available"
            description="The agent configuration API is not yet implemented. AI agents and their configurations will be manageable here once the backend agent registry is ready."
          />
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

        {/* TAB 3: HUMAN REVIEW QUEUE — no backend endpoint */}
        <TabsContent value="REVIEW" className="mt-6">
          <EmptyState
            icon={Construction}
            title="Clinician review queue not yet available"
            description="The AI review queue API is not yet implemented. AI outputs requiring clinician sign-off will appear here once the backend review workflow is ready."
          />
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

        {/* TAB 5: MODEL REGISTRY — no backend endpoint */}
        <TabsContent value="MODELS" className="mt-6">
          <EmptyState
            icon={Construction}
            title="AI model registry not yet available"
            description="The model registry API is not yet implemented. Registered AI models with latency and cost telemetry will appear here once the backend model registry is ready."
          />
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
