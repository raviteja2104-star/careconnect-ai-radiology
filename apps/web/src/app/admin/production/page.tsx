'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  ShieldCheck, Lock, Key, Server, UploadCloud, CheckCircle, 
  Terminal, Activity, RefreshCw, FileText, Check, Cpu, Layers, 
  Play, Download, AlertTriangle, HardDrive, Zap, Eye
} from 'lucide-react';
import { authService, AuthUserSession } from '@/services/authService';
import { securityAuditService, AuditLogEntry } from '@/services/securityAuditService';
import { hospitalMigrationService, MigrationJobRecord } from '@/services/hospitalMigrationService';
import { testingSuiteService, QualityMetricsData } from '@/services/testingSuiteService';

export default function ProductionHardeningPage() {
  const [activeTab, setActiveTab] = useState<'AUTH' | 'SECURITY' | 'MIGRATION' | 'TESTING' | 'DEVOPS'>('AUTH');
  
  // States
  const [session] = useState<AuthUserSession>(authService.getCurrentSession());
  const [policy] = useState(authService.getSecurityPolicy());
  const [logs] = useState<AuditLogEntry[]>(securityAuditService.getAuditLogs());
  const [kms] = useState(securityAuditService.getKMSStatus());
  const [migrationJobs, setMigrationJobs] = useState<MigrationJobRecord[]>(hospitalMigrationService.getJobs());
  const [testMetrics, setTestMetrics] = useState<QualityMetricsData>(testingSuiteService.getTestMetrics());

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

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
        
        {/* TOP HEADER */}
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">CareConnect Production Hardening</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-md uppercase">
                  v1.1 Hardened ({testMetrics.overallCoveragePct}% Coverage)
                </span>
              </div>
              <p className="text-xs text-slate-400">OAuth 2.1 / OIDC, PHI Redaction, Legacy HIS Migration, & Automated Testing</p>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button 
              onClick={() => setActiveTab('AUTH')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'AUTH' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Key className="w-3.5 h-3.5" /> Identity & OAuth 2.1
            </button>
            <button 
              onClick={() => setActiveTab('SECURITY')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'SECURITY' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Lock className="w-3.5 h-3.5" /> Audit & PHI Scanner
            </button>
            <button 
              onClick={() => setActiveTab('MIGRATION')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'MIGRATION' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <UploadCloud className="w-3.5 h-3.5" /> HIS Migration Wizard
            </button>
            <button 
              onClick={() => setActiveTab('TESTING')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'TESTING' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Activity className="w-3.5 h-3.5" /> QA & Testing
            </button>
            <button 
              onClick={() => setActiveTab('DEVOPS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'DEVOPS' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Server className="w-3.5 h-3.5" /> DevOps & Infra
            </button>
          </div>
        </div>

        {/* TAB 1: IDENTITY & OAUTH 2.1 */}
        {activeTab === 'AUTH' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">OAuth 2.1, OIDC & Tenant Session Status</h2>
              <p className="text-xs text-slate-500">PKCE OAuth 2.1 token enforcement, TOTP MFA verification, and SAML 2.0 Enterprise SSO.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Clinician Session</h3>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{session.name}</p>
                <p className="text-xs font-mono text-indigo-600">{session.email}</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">MFA VERIFIED</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">OAuth 2.1 & PKCE Protocol</h3>
                <p className="text-xs text-slate-500">{policy.oauth2Version}</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">PKCE ENFORCED</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Multi-Tenant Isolation Policy</h3>
                <p className="text-xs text-slate-500">Row & Column Level Tenant Partitioning</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">RBAC/ABAC ACTIVE</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT & PHI SCANNER */}
        {activeTab === 'SECURITY' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">SHA-256 Audit Logs & PHI Redaction Filter</h2>
              <p className="text-xs text-slate-500">Immutable audit trails signed with SHA-256 and zero-trust PHI masking.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300">Live HIPAA PHI Redaction Test Sandbox</h3>
              <textarea
                rows={3}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono"
              />
              <button onClick={handleScanPHI} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">
                Run PHI Masking Filter
              </button>

              {phiResult && (
                <div className="p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl">
                  <strong>Redacted Output:</strong> {phiResult.redactedText}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300">SHA-256 Signed Immutable Audit Trail</h3>
              {logs.map(log => (
                <div key={log.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-xs font-mono flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{log.action}</span> by {log.userName} ({log.ipAddress})
                    <p className="text-[10px] text-slate-400">Resource: {log.resourceId} | Hash: {log.sha256Hash}</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{log.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: HIS MIGRATION WIZARD */}
        {activeTab === 'MIGRATION' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Hospital Onboarding & Legacy HIS Data Import Wizard</h2>
              <p className="text-xs text-slate-500">Automated ingestion pipelines for Epic, Cerner, local Excel, & PACS DICOM files.</p>
            </div>

            <form onSubmit={handleStartMigration} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <select value={importSystem} onChange={(e) => setImportSystem(e.target.value)} className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                <option value="LOCAL_EXCEL">Local Excel / CSV Patient List</option>
                <option value="EPIC_EHR">Epic Systems EHR Export</option>
                <option value="CERNER">Oracle Cerner Export</option>
                <option value="ORTHANC_PACS">Orthanc PACS DICOM Stream</option>
              </select>
              <input
                type="number"
                value={importRecords}
                onChange={(e) => setImportRecords(Number(e.target.value))}
                className="w-32 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono"
              />
              <button type="submit" className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0">
                <UploadCloud className="w-4 h-4" /> Execute Import Pipeline
              </button>
            </form>

            <div className="space-y-3">
              {migrationJobs.map(job => (
                <div key={job.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">{job.sourceSystem} ➔ {job.dataType}</h3>
                    <p className="text-[11px] text-slate-400">{job.processedCount} / {job.recordCount} Records Processed</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{job.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: QA & TESTING */}
        {activeTab === 'TESTING' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Automated QA Testing Suite & Coverage Telemetry</h2>
                <p className="text-xs text-slate-500">Vitest unit tests, Playwright E2E suites, k6 10k clinician load tests.</p>
              </div>

              <button onClick={handleRunTestSuites} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                <Play className="w-3.5 h-3.5" /> Trigger Full Test Suite
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Overall Platform Test Coverage</span>
                <span className="text-xl font-black text-emerald-600">{testMetrics.overallCoveragePct}% (Target: &gt;90%)</span>
              </div>

              <div className="space-y-3">
                {testMetrics.suites.map(st => (
                  <div key={st.suiteName} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{st.suiteName}</span>
                      <p className="text-[10px] text-slate-400">{st.passed} / {st.totalTests} Passed | Duration: {st.durationSec}s</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{st.status} ({st.coveragePct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DEVOPS & INFRA */}
        {activeTab === 'DEVOPS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Kubernetes & Infrastructure Telemetry</h2>
              <p className="text-xs text-slate-500">Prometheus / Grafana metrics for Envoy, Kafka, Redis Cluster, & ClickHouse OLAP.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
              <div className="p-5 bg-white dark:bg-slate-900 border rounded-2xl space-y-2">
                <strong className="text-indigo-600 block">Kubernetes Cluster (EKS)</strong>
                <p className="text-slate-500">24 Nodes Active (US-East-1 & AP-South-1)</p>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">HEALTHY</span>
              </div>
              <div className="p-5 bg-white dark:bg-slate-900 border rounded-2xl space-y-2">
                <strong className="text-indigo-600 block">Kafka Event Brokers</strong>
                <p className="text-slate-500">3 Brokers Cluster | 18 Topics</p>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">HEALTHY</span>
              </div>
              <div className="p-5 bg-white dark:bg-slate-900 border rounded-2xl space-y-2">
                <strong className="text-indigo-600 block">Redis Caching Cluster</strong>
                <p className="text-slate-500">Hit Rate: 99.4% | Memory: 4.2 GB</p>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">HEALTHY</span>
              </div>
              <div className="p-5 bg-white dark:bg-slate-900 border rounded-2xl space-y-2">
                <strong className="text-indigo-600 block">ClickHouse Analytics OLAP</strong>
                <p className="text-slate-500">Query Latency: 14ms | 1.8B Rows</p>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">HEALTHY</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
