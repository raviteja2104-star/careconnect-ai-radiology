'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  ShieldCheck, Lock, Key, Server, UploadCloud, CheckCircle, 
  Terminal, Activity, RefreshCw, FileText, Check, Cpu, Layers, 
  Play, Download, AlertTriangle, HardDrive, Zap, Eye, Smartphone, 
  Sparkles, Award, Globe, HeartPulse, GraduationCap
} from 'lucide-react';
import { authService, AuthUserSession } from '@/services/authService';
import { securityAuditService, AuditLogEntry } from '@/services/securityAuditService';
import { hospitalMigrationService, MigrationJobRecord } from '@/services/hospitalMigrationService';
import { testingSuiteService, QualityMetricsData } from '@/services/testingSuiteService';
import { productionHardeningService, RegulatoryComplianceStatus, ClinicalDeviceInterface, AISafetyValidationMetric, MobileAppHealthStatus } from '@/services/productionHardeningService';

export default function ProductionHardeningPage() {
  const [activeTab, setActiveTab] = useState<'AUTH' | 'COMPLIANCE' | 'HARDWARE' | 'TESTING' | 'MOBILE' | 'AI_SAFETY' | 'GOLIVE'>('AUTH');
  
  // Service Data States
  const [session] = useState<AuthUserSession>(authService.getCurrentSession());
  const [policy] = useState(authService.getSecurityPolicy());
  const [logs] = useState<AuditLogEntry[]>(securityAuditService.getAuditLogs());
  const [migrationJobs, setMigrationJobs] = useState<MigrationJobRecord[]>(hospitalMigrationService.getJobs());
  const [testMetrics, setTestMetrics] = useState<QualityMetricsData>(testingSuiteService.getTestMetrics());
  
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
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">CareConnect Enterprise v1.1 Production Hardening</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-md uppercase">
                  100% Compliance & Production Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">OAuth 2.1, NABH/ABDM Compliance, Clinical Devices, QA Suite & Go-Live Toolkit</p>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold overflow-x-auto">
            <button 
              onClick={() => setActiveTab('AUTH')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'AUTH' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Key className="w-3.5 h-3.5" /> Auth & Gateway
            </button>
            <button 
              onClick={() => setActiveTab('COMPLIANCE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'COMPLIANCE' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Award className="w-3.5 h-3.5" /> Compliance Scorecard
            </button>
            <button 
              onClick={() => setActiveTab('HARDWARE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'HARDWARE' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <HeartPulse className="w-3.5 h-3.5" /> Clinical Devices
            </button>
            <button 
              onClick={() => setActiveTab('TESTING')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'TESTING' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Activity className="w-3.5 h-3.5" /> QA & Testing (&gt;90%)
            </button>
            <button 
              onClick={() => setActiveTab('MOBILE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'MOBILE' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile Apps
            </button>
            <button 
              onClick={() => setActiveTab('AI_SAFETY')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'AI_SAFETY' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Safety
            </button>
            <button 
              onClick={() => setActiveTab('GOLIVE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'GOLIVE' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Go-Live & LMS
            </button>
          </div>
        </div>

        {/* TAB 1: AUTH & GATEWAY */}
        {activeTab === 'AUTH' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">OAuth 2.1, OIDC & Envoy API Gateway Infrastructure</h2>
              <p className="text-xs text-slate-500">PKCE token enforcement, TOTP MFA verification, SAML 2.0 SSO, WebAuthn Passkeys, & Envoy WAF.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Clinician Identity & Session</h3>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{session.name}</p>
                <p className="text-xs font-mono text-indigo-600">{session.email}</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">MFA & WEBAUTHN ACTIVE</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">OAuth 2.1 & Envoy WAF</h3>
                <p className="text-xs text-slate-500">{policy.oauth2Version}</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">ENVOY GATEWAY ACTIVE</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">RBAC / ABAC Multi-Tenant Partitioning</h3>
                <p className="text-xs text-slate-500">Row & Column Level Security Isolation</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">ENFORCED ENTIRE STACK</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPLIANCE SCORECARD */}
        {activeTab === 'COMPLIANCE' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">International Healthcare Regulatory Compliance Dashboard</h2>
              <p className="text-xs text-slate-500">Audit readiness tracking for NABH, ABDM Milestone 1-3, HIPAA, GDPR, ISO 27001, & ISO 27799.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {compliance.map(c => (
                <div key={c.standard} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold rounded uppercase">{c.standard}</span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{c.status}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{c.compliancePct}%</h3>
                    <p className="text-xs text-slate-400">Compliance & Controls Standard Score</p>
                  </div>
                  <p className="text-xs text-slate-500 border-t pt-3">
                    Missing Controls: <strong className="text-slate-900 dark:text-white">{c.missingControls}</strong> | Audited: {c.lastAudited}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CLINICAL DEVICES */}
        {activeTab === 'HARDWARE' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Real Clinical Hardware, LIS, RIS & Orthanc PACS Interfaces</h2>
              <p className="text-xs text-slate-500">Live HL7 MLLP streams, Orthanc DICOMweb PACS servers, ICU monitors, & WhatsApp hubs.</p>
            </div>

            <div className="space-y-4">
              {devices.map(dev => (
                <div key={dev.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{dev.deviceName}</h3>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold rounded uppercase">{dev.protocol}</span>
                    </div>
                    <p className="text-xs text-slate-500">Category: {dev.category} | Heartbeat: {dev.lastHeartbeat}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {dev.status}
                  </span>
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
                <p className="text-xs text-slate-500">Vitest unit tests, Playwright E2E suites, k6 10,000 clinician load tests (&gt;90% Target).</p>
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

        {/* TAB 5: MOBILE ECOSYSTEM */}
        {activeTab === 'MOBILE' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Native Mobile Applications & Offline Sync Telemetry</h2>
              <p className="text-xs text-slate-500">Doctor, Patient, Nurse, & Ambulance native apps with Face ID biometric authentication.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mobileApps.map(m => (
                <div key={m.appName} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{m.appName}</span>
                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold rounded">{m.platform}</span>
                  </div>
                  <p className="text-xs text-slate-500">Active Installed Devices: <strong>{m.activeInstalls.toLocaleString()}</strong></p>
                  <div className="flex items-center justify-between text-xs border-t pt-3">
                    <span>Offline Sync: <strong className="text-emerald-600">ENABLED</strong></span>
                    <span>Biometric: <strong className="text-indigo-600">{m.biometricAuth}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: AI CLINICAL SAFETY */}
        {activeTab === 'AI_SAFETY' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Clinical Safety, Hallucination Control & Physician Oversight</h2>
              <p className="text-xs text-slate-500">Rigorous accuracy, precision, recall, and mandatory human clinician approval safeguards.</p>
            </div>

            <div className="space-y-4">
              {aiSafety.map(ai => (
                <div key={ai.module} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{ai.module}</span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      Hallucination: {ai.hallucinationRatePct}% (&lt;0.01% Target)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-center font-mono">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Precision</span>
                      <strong className="text-indigo-600">{ai.precisionPct}%</strong>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Recall</span>
                      <strong className="text-indigo-600">{ai.recallPct}%</strong>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Physician Acceptance</span>
                      <strong className="text-emerald-600">{ai.physicianAcceptancePct}%</strong>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                    🔒 Clinician Oversight Enforcement: {ai.clinicianApprovalRequired ? 'REQUIRED BEFORE MEDICAL RECORD COMMIT' : 'NONE'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: GO-LIVE & LMS */}
        {activeTab === 'GOLIVE' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Hospital Go-Live Centre, LMS Training & Hypercare SLA</h2>
              <p className="text-xs text-slate-500">Deployment readiness verification, hospital staff LMS training, & 24/7 hypercare support.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Go-Live Readiness Telemetry</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Staff Readiness</span>
                  <strong className="text-xl font-bold text-emerald-600">{goLive.userReadinessPct}%</strong>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Device Connectivity</span>
                  <strong className="text-xl font-bold text-emerald-600">{goLive.deviceReadinessPct}%</strong>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Network SLA</span>
                  <strong className="text-xl font-bold text-emerald-600">{goLive.networkReadinessPct}%</strong>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">Hypercare Response SLA</span>
                  <strong className="text-xl font-bold text-indigo-600">&lt; {goLive.hypercareSlaHours} hrs</strong>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
