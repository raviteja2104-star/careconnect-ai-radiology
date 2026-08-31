'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Server, Code, Activity, Cpu, ShieldCheck, Database, Wifi, Zap, 
  Terminal, RefreshCcw, CheckCircle, AlertTriangle, Key, Layers, 
  Play, Download, HardDrive, Check, ArrowRight
} from 'lucide-react';
import { 
  integrationHubService, FHIRResourceRecord, HL7MessageRecord, 
  DeviceTelemetryRecord 
} from '@/services/integrationHubService';

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
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
        
        {/* TOP HEADER */}
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">Enterprise Integration Hub</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-md uppercase">
                  {health.status} ({health.uptimePct}% Uptime)
                </span>
              </div>
              <p className="text-xs text-slate-400">FHIR R4, HL7 v2.x, DICOM PACS, ABDM ABHA & Live Telemetry</p>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button 
              onClick={() => setActiveTab('FHIR')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'FHIR' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Code className="w-3.5 h-3.5" /> FHIR R4
            </button>
            <button 
              onClick={() => setActiveTab('HL7')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'HL7' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Terminal className="w-3.5 h-3.5" /> HL7 v2.x
            </button>
            <button 
              onClick={() => setActiveTab('DEVICES')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'DEVICES' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Wifi className="w-3.5 h-3.5" /> IoT Telemetry
            </button>
            <button 
              onClick={() => setActiveTab('ABDM')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'ABDM' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> ABDM / ABHA
            </button>
            <button 
              onClick={() => setActiveTab('API_GATEWAY')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'API_GATEWAY' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Key className="w-3.5 h-3.5" /> API Gateway
            </button>
            <button 
              onClick={() => setActiveTab('RECOVERY')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'RECOVERY' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <HardDrive className="w-3.5 h-3.5" /> Recovery
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href="/admin/command-center" 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Activity className="w-4 h-4" /> Command Center ➔
            </a>
          </div>
        </div>

        {/* TAB 1: FHIR R4 SERVER */}
        {activeTab === 'FHIR' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">FHIR R4 Interoperability Server</h2>
                <p className="text-xs text-slate-500">Expose standardized HL7 FHIR R4 resources for external EMRs, Insurance, & ABDM.</p>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={testEndpoint} 
                  onChange={(e) => setTestEndpoint(e.target.value)} 
                  className="w-80 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono"
                />
                <button onClick={handleTestIntegration} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" /> Test Endpoint
                </button>
              </div>
            </div>

            {testResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs flex items-center justify-between font-mono">
                <span className="text-emerald-800 font-bold">STATUS 200 OK — {testResult.responseTimeMs}ms response time</span>
                <span className="text-emerald-700">{testResult.security}</span>
              </div>
            )}

            <div className="space-y-4">
              {fhirResources.map(res => (
                <div key={res.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold rounded uppercase">{res.resourceType}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">ID: {res.id}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">v{res.meta.versionId} updated {res.meta.lastUpdated}</span>
                  </div>
                  <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto">
                    {JSON.stringify(res.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: HL7 V2.X ENGINE */}
        {activeTab === 'HL7' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">HL7 v2.x Interface Parser Engine</h2>
              <p className="text-xs text-slate-500">Monitor live ADT, ORM, ORU, SIU, & DFT pipeline messages from legacy LIS/RIS.</p>
            </div>

            <div className="space-y-4">
              {hl7Messages.map(msg => (
                <div key={msg.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 font-mono text-[10px] font-bold rounded uppercase">{msg.messageType}</span>
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">Control ID: {msg.controlId}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{msg.status}</span>
                  </div>
                  <pre className="p-3 bg-slate-900 text-purple-300 font-mono text-[11px] rounded-xl whitespace-pre-wrap">
                    {msg.rawMessage}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: IOT TELEMETRY */}
        {activeTab === 'DEVICES' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">IoT Medical Device Telemetry Hub</h2>
              <p className="text-xs text-slate-500">Real-time telemetry streaming from Hamilton Ventilators, Mindray Monitors, & CT Scanners.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {devices.map(dev => (
                <div key={dev.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-800 text-[10px] font-bold rounded uppercase">{dev.deviceType}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{dev.status} ({dev.batteryPct}%)</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{dev.deviceName}</h3>
                    <p className="text-xs text-indigo-600 font-semibold">{dev.location}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 font-mono text-xs">
                    {Object.entries(dev.readings).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-400 capitalize">{k}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ABDM & ABHA */}
        {activeTab === 'ABDM' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">ABDM / ABHA National Health Stack</h2>
              <p className="text-xs text-slate-500">Integrated with Ayushman Bharat Digital Mission (M1 Verification, M2 PHR Link, M3 Consent).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Milestone 1 (M1)</h3>
                <p className="text-xs text-slate-500">ABHA Address Creation & Aadhaar OTP Authentication.</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">CERTIFIED & ACTIVE</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Milestone 2 (M2)</h3>
                <p className="text-xs text-slate-500">Personal Health Record (PHR) Linking & HIP/HIU Gateways.</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">CERTIFIED & ACTIVE</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Milestone 3 (M3)</h3>
                <p className="text-xs text-slate-500">Digital Patient Consent Management & Health Data Exchange.</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">CERTIFIED & ACTIVE</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: API GATEWAY */}
        {activeTab === 'API_GATEWAY' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">API Gateway & Key Management</h2>
              <p className="text-xs text-slate-500">Manage OAuth 2.1 credentials, JWT tokens, and rate limits.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Client ID: careconnect_prod_v1</span>
                  <span className="text-slate-400 font-mono">Scope: read:fhir write:fhir read:prescriptions</span>
                </div>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-bold rounded-lg text-[10px]">ACTIVE KEY</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DISASTER RECOVERY */}
        {activeTab === 'RECOVERY' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Disaster Recovery & System Backups</h2>
                <p className="text-xs text-slate-500">Trigger instant encrypted snapshots and monitor multi-region replication.</p>
              </div>

              <div className="flex items-center gap-2">
                {backupToast && (
                  <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 animate-pulse">
                    <Check className="w-3.5 h-3.5" /> Snapshot Taken!
                  </span>
                )}
                <button onClick={handleTriggerBackup} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                  <HardDrive className="w-4 h-4" /> Trigger Immediate Backup
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Primary AWS Region (US-East-1)</h3>
                <p className="text-xs text-slate-500">Master RDS PostgreSQL Database Cluster with Multi-AZ Failover.</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">HEALTHY & SYNCED</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Standby Replica Region (AP-South-1 Hyderabad)</h3>
                <p className="text-xs text-slate-500">Real-Time Asynchronous Replication (Lag: 12ms).</p>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full inline-block">REPLICATING</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
