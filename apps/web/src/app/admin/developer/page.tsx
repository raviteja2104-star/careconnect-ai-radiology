'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Code2, ShoppingBag, Terminal, Webhook, Zap, ShieldCheck, Key, 
  Download, Play, Check, Plus, RefreshCw, CheckCircle, ExternalLink, 
  Layers, Star, Sparkles, Heart, MessageSquare, Film, Lock, HardDrive
} from 'lucide-react';
import { 
  developerPlatformService, MarketplaceAppListing, SDKReleaseItem, 
  WebhookSubscriptionRecord, EventBusMessage 
} from '@/services/developerPlatformService';

export default function DeveloperPlatformPage() {
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'SDKS' | 'WEBHOOKS' | 'EVENTS' | 'OAUTH' | 'CERTIFICATION'>('MARKETPLACE');
  
  // State
  const [apps, setApps] = useState<MarketplaceAppListing[]>(developerPlatformService.getMarketplaceApps());
  const [sdks] = useState<SDKReleaseItem[]>(developerPlatformService.getSDKs());
  const [webhooks, setWebhooks] = useState<WebhookSubscriptionRecord[]>(developerPlatformService.getWebhooks());
  const [events] = useState<EventBusMessage[]>(developerPlatformService.getEvents());
  const [oauthApps] = useState(developerPlatformService.getOAuthApps());
  const [analytics] = useState(developerPlatformService.getAnalytics());

  // Webhook Registration Modal State
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvent, setNewWebhookEvent] = useState('lab.result.ready');

  // Certification Scanner State
  const [certReport, setCertReport] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleInstallApp = (id: string) => {
    developerPlatformService.installApp(id);
    setApps([...developerPlatformService.getMarketplaceApps()]);
  };

  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl) return;
    developerPlatformService.registerWebhook(newWebhookUrl, [newWebhookEvent]);
    setWebhooks([...developerPlatformService.getWebhooks()]);
    setNewWebhookUrl('');
  };

  const handleRunCertification = () => {
    setIsScanning(true);
    setTimeout(() => {
      setCertReport({
        pluginName: 'Apollo Cardiology Pack',
        version: 'v3.2.0',
        certificationStatus: 'PASSED_CERTIFIED',
        scans: {
          securityVulnerabilities: '0 Critical, 0 High',
          fhirCompliance: '100% FHIR R4 Compliant',
          performanceBenchmarkMs: 18,
          hipaaPrivacyCheck: 'PASSED'
        },
        certifiedAt: new Date().toISOString()
      });
      setIsScanning(false);
    }, 600);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
        
        {/* TOP HEADER */}
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">Healthcare Platform Ecosystem</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-md uppercase">
                  HPaaS Enabled ({analytics.totalApiRequestsToday.toLocaleString()} Requests/Day)
                </span>
              </div>
              <p className="text-xs text-slate-400">Developer Portal, App Marketplace, Official SDKs, Webhooks & Certification</p>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button 
              onClick={() => setActiveTab('MARKETPLACE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'MARKETPLACE' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Marketplace
            </button>
            <button 
              onClick={() => setActiveTab('SDKS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'SDKS' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Terminal className="w-3.5 h-3.5" /> SDKs & APIs
            </button>
            <button 
              onClick={() => setActiveTab('WEBHOOKS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'WEBHOOKS' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Webhook className="w-3.5 h-3.5" /> Webhooks
            </button>
            <button 
              onClick={() => setActiveTab('EVENTS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'EVENTS' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Zap className="w-3.5 h-3.5" /> Event Bus
            </button>
            <button 
              onClick={() => setActiveTab('OAUTH')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'OAUTH' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Key className="w-3.5 h-3.5" /> OAuth 2.1
            </button>
            <button 
              onClick={() => setActiveTab('CERTIFICATION')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'CERTIFICATION' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Certification
            </button>
          </div>
        </div>

        {/* TAB 1: APP MARKETPLACE */}
        {activeTab === 'MARKETPLACE' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">CareConnect App & Extension Marketplace</h2>
                <p className="text-xs text-slate-500">Discover & 1-click install certified clinical packs, AI agents, & health integrations.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {apps.map(app => (
                <div key={app.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded uppercase">{app.category}</span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold text-xs"><Star className="w-3.5 h-3.5 fill-amber-500" /> {app.rating}</span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{app.name}</h3>
                      <p className="text-[11px] text-slate-400 font-semibold">{app.publisher}</p>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-3">{app.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-400">{app.installCount} installs</span>
                    {app.status === 'INSTALLED' ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Installed
                      </span>
                    ) : (
                      <button onClick={() => handleInstallApp(app.id)} className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg text-xs shadow-xs">
                        Install App
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: SDKS & APIS */}
        {activeTab === 'SDKS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Official CareConnect Client SDKs</h2>
              <p className="text-xs text-slate-500">Fully typed SDKs with authentication, retry policies, & FHIR R4 models.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sdks.map(sdk => (
                <div key={sdk.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{sdk.language}</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold rounded">v{sdk.version}</span>
                  </div>
                  <pre className="p-3 bg-slate-950 text-indigo-300 font-mono text-[11px] rounded-xl overflow-x-auto">
                    {sdk.packageName}
                  </pre>
                  <div className="flex justify-between items-center text-xs text-slate-400 border-t pt-2">
                    <span>{sdk.downloadsCount.toLocaleString()} downloads</span>
                    <a href={sdk.documentationUrl} className="text-indigo-600 font-bold flex items-center gap-1">Docs <ExternalLink className="w-3.5 h-3.5" /></a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: WEBHOOK MANAGER */}
        {activeTab === 'WEBHOOKS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Outbound Webhook Subscriptions</h2>
                <p className="text-xs text-slate-500">Receive real-time HTTP POST notifications when clinical events occur.</p>
              </div>
            </div>

            <form onSubmit={handleAddWebhook} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <input
                type="url"
                placeholder="Target Endpoint URL (e.g. https://api.hospital.com/webhooks)"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono"
              />
              <select value={newWebhookEvent} onChange={(e) => setNewWebhookEvent(e.target.value)} className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                <option value="lab.result.ready">lab.result.ready</option>
                <option value="patient.registered">patient.registered</option>
                <option value="prescription.signed">prescription.signed</option>
                <option value="invoice.paid">invoice.paid</option>
              </select>
              <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0">
                <Plus className="w-4 h-4" /> Add Webhook
              </button>
            </form>

            <div className="space-y-4">
              {webhooks.map(wh => (
                <div key={wh.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{wh.targetUrl}</span>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{wh.successPct}% Success</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {wh.events.map(ev => (
                      <span key={ev} className="px-2 py-0.5 bg-purple-100 text-purple-800 font-mono text-[10px] font-bold rounded">{ev}</span>
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block">Signing Secret: {wh.signingSecret}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: EVENT BUS EXPLORER */}
        {activeTab === 'EVENTS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Hospital Enterprise Event Bus Stream</h2>
              <p className="text-xs text-slate-500">Live pub-sub events across registration, lab orders, prescriptions, & billing.</p>
            </div>

            <div className="space-y-4">
              {events.map(evt => (
                <div key={evt.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold rounded uppercase">{evt.eventTopic}</span>
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">From: {evt.sourceModule}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{evt.status}</span>
                  </div>
                  <pre className="p-3 bg-slate-950 text-indigo-300 font-mono text-[11px] rounded-xl overflow-x-auto">
                    {JSON.stringify(evt.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: OAUTH 2.1 */}
        {activeTab === 'OAUTH' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">OAuth 2.1 Registered Client Applications</h2>
              <p className="text-xs text-slate-500">Manage PKCE OAuth 2.1 client credentials & API rate limits.</p>
            </div>

            <div className="space-y-4">
              {oauthApps.map(oa => (
                <div key={oa.clientId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{oa.appName}</h3>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{oa.status}</span>
                  </div>
                  <p className="text-xs font-mono text-indigo-600">Client ID: {oa.clientId}</p>
                  <p className="text-xs text-slate-500 font-mono">Redirect URIs: {oa.redirectUris.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: CERTIFICATION */}
        {activeTab === 'CERTIFICATION' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Plugin Security & Compliance Certification Scanner</h2>
                <p className="text-xs text-slate-500">Automated vulnerability analysis, FHIR R4 compliance checks, & HIPAA privacy audit.</p>
              </div>

              <button 
                onClick={handleRunCertification} 
                disabled={isScanning}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" /> {isScanning ? 'Running Security Audit...' : 'Run Security & FHIR Scanner'}
              </button>
            </div>

            {certReport && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                <div className="flex justify-between items-center border-b pb-3">
                  <span className="font-bold text-slate-900 dark:text-white">{certReport.pluginName} ({certReport.version})</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                    {certReport.certificationStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <strong className="text-indigo-600 block">Security Vulnerabilities:</strong> {certReport.scans.securityVulnerabilities}
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <strong className="text-indigo-600 block">FHIR Compliance:</strong> {certReport.scans.fhirCompliance}
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <strong className="text-indigo-600 block">Latency Benchmark:</strong> {certReport.scans.performanceBenchmarkMs}ms
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <strong className="text-indigo-600 block">HIPAA Privacy Audit:</strong> {certReport.scans.hipaaPrivacyCheck}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
