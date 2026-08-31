'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Sparkles, Bot, ShieldCheck, Cpu, Mic, FileText, CheckCircle, 
  XCircle, RefreshCw, BarChart2, BookOpen, Layers, Play, Check, 
  Trash2, AlertTriangle, ArrowRight, UserCheck, Key, Zap
} from 'lucide-react';
import { aiPlatformService, AIAgentRecord, AIReviewRecord, AIModelRecord } from '@/services/aiPlatformService';

export default function EnterpriseAIPlatformPage() {
  const [activeTab, setActiveTab] = useState<'AGENTS' | 'SCRIBE' | 'REVIEW' | 'KNOWLEDGE' | 'MODELS' | 'GOVERNANCE'>('AGENTS');
  
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

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
        
        {/* TOP HEADER */}
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 text-white rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">CareConnect AI Healthcare OS</span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold rounded-md uppercase">
                  {analytics.acceptedPct}% Clinician Acceptance Rate
                </span>
              </div>
              <p className="text-xs text-slate-400">Enterprise AI Layer across EMR, CDS, Scribe, Coding, RAG & Translation</p>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button 
              onClick={() => setActiveTab('AGENTS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'AGENTS' ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Bot className="w-3.5 h-3.5" /> AI Agent Studio
            </button>
            <button 
              onClick={() => setActiveTab('SCRIBE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'SCRIBE' ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Mic className="w-3.5 h-3.5" /> AI Scribe Lab
            </button>
            <button 
              onClick={() => setActiveTab('REVIEW')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'REVIEW' ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <UserCheck className="w-3.5 h-3.5" /> Review Queue
            </button>
            <button 
              onClick={() => setActiveTab('KNOWLEDGE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'KNOWLEDGE' ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Knowledge Hub (RAG)
            </button>
            <button 
              onClick={() => setActiveTab('MODELS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'MODELS' ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Cpu className="w-3.5 h-3.5" /> Model Registry
            </button>
            <button 
              onClick={() => setActiveTab('GOVERNANCE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'GOVERNANCE' ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> AI Guardrails
            </button>
          </div>
        </div>

        {/* TAB 1: AI AGENT STUDIO */}
        {activeTab === 'AGENTS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Configurable Healthcare AI Agents</h2>
                <p className="text-xs text-slate-500">Configure role-specific AI Copilots with tool permissions & confidence thresholds.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {agents.map(ag => (
                <div key={ag.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded uppercase">{ag.role}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{ag.status}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{ag.name}</h3>
                    <p className="text-xs text-purple-600 font-mono mt-0.5">{ag.model}</p>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{ag.systemPrompt}</p>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] font-bold text-slate-400">
                    <span>Threshold: {ag.confidenceThreshold}%</span>
                    <span className="text-indigo-600">👤 Clinician Review Req.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: AI SCRIBE LAB */}
        {activeTab === 'SCRIBE' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ambient AI Clinical Scribe Playground</h2>
              <p className="text-xs text-slate-500">Simulate ambient audio dictation to generate structured SOAP notes & ICD-10 drafts.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <label className="font-bold text-xs text-slate-700 dark:text-slate-300 block">Doctor-Patient Audio Dictation Transcript</label>
                <textarea
                  rows={6}
                  value={dictationText}
                  onChange={(e) => setDictationText(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono"
                />
                <button 
                  onClick={handleRunScribe} 
                  disabled={isGenerating}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
                >
                  <Sparkles className="w-4 h-4" /> {isGenerating ? 'Generating SOAP Notes...' : 'Run Clinical AI Scribe'}
                </button>
              </div>

              {scribeOutput && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" /> Generated Structured SOAP Note
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                      {scribeOutput.confidencePct}% Confidence
                    </span>
                  </div>

                  <div className="space-y-3 font-mono">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <strong className="text-purple-600 block">Subjective:</strong> {scribeOutput.soapNote.subjective}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <strong className="text-purple-600 block">Objective:</strong> {scribeOutput.soapNote.objective}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <strong className="text-purple-600 block">Assessment:</strong> {scribeOutput.soapNote.assessment}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <strong className="text-purple-600 block">Plan:</strong> {scribeOutput.soapNote.plan}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: HUMAN REVIEW QUEUE */}
        {activeTab === 'REVIEW' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Clinician Human Review & Governance Queue</h2>
              <p className="text-xs text-slate-500">Every AI clinical recommendation requires physician sign-off before entering legal EHR.</p>
            </div>

            <div className="space-y-4">
              {reviews.map(rev => (
                <div key={rev.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 font-mono text-[10px] font-bold rounded uppercase">{rev.taskType}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{rev.patientId}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${rev.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' : rev.status === 'EDITED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                      {rev.status} ({rev.confidencePct}% Confidence)
                    </span>
                  </div>

                  <p className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300">{rev.aiOutput}</p>

                  {rev.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleReviewAction(rev.id, 'ACCEPTED')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Accept AI Suggestion
                      </button>
                      <button onClick={() => handleReviewAction(rev.id, 'REJECTED')} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" /> Reject / Override
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RAG KNOWLEDGE HUB */}
        {activeTab === 'KNOWLEDGE' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Retrieval-Augmented Generation (RAG) Knowledge Hub</h2>
              <p className="text-xs text-slate-500">Connect hospital SOPs, drug interaction databases, & clinical guidelines to AI grounding pipeline.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Hospital SOPs & Clinical Guidelines</h3>
                <p className="text-xs text-slate-500">1,420 vector chunks indexed with PgVector embeddings.</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">INDEXED & ACTIVE</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">RxNorm & Drug Interaction Knowledge Base</h3>
                <p className="text-xs text-slate-500">Full pharmacopoeia contraindications & dose adjustment tables.</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">INDEXED & ACTIVE</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">ICD-10 & CPT Billing Codebook</h3>
                <p className="text-xs text-slate-500">2026 Edition official medical coding taxonomy.</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">INDEXED & ACTIVE</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MODEL REGISTRY */}
        {activeTab === 'MODELS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Model Registry & Cost Telemetry</h2>
              <p className="text-xs text-slate-500">Manage LLM reasoning models, Whisper STT, & Bio-embedding pipelines.</p>
            </div>

            <div className="space-y-4">
              {models.map(mod => (
                <div key={mod.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{mod.name}</h3>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-mono text-[10px] font-bold rounded uppercase">{mod.provider}</span>
                    </div>
                    <p className="text-xs text-slate-500">Avg Latency: {mod.avgLatencyMs}ms | Cost: ${mod.costPer1kTokensUSD}/1k tokens</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{mod.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: GOVERNANCE & GUARDRAILS */}
        {activeTab === 'GOVERNANCE' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Safety Guardrails & PHI Protection</h2>
              <p className="text-xs text-slate-500">Automated hallucination scoring, HIPAA PHI masking, & audit logging.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">HIPAA PHI Redaction Filter</h3>
                <p className="text-xs text-slate-500">Redacts SSN, phone numbers, and addresses prior to external LLM calls.</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">ENABLED & PROTECTED</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Minimum Confidence Gate</h3>
                <p className="text-xs text-slate-500">Outputs with &lt; 85% confidence automatically flag physician review.</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">GATE ACTIVE</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">SHA-256 Audit Trail Signature</h3>
                <p className="text-xs text-slate-500">Every prompt & AI output is digitally signed and logged for SOC2 compliance.</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">AUDIT LOG ACTIVE</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
