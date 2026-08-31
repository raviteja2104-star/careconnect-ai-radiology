'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  DollarSign, Building2, CreditCard, Award, Users, TrendingUp, 
  Sparkles, CheckCircle, Plus, Globe, Tag, ShieldCheck, Layers, RefreshCw, BarChart3
} from 'lucide-react';
import { commercialSaaSPlatformService, TenantAccountRecord, FinancialMetricRecord, PartnerEcosystemRecord } from '@/services/commercialSaaSPlatformService';

export default function EnterpriseCommercialPage() {
  const [activeTab, setActiveTab] = useState<'TENANTS' | 'SUBSCRIPTIONS' | 'REVENUE' | 'PARTNERS' | 'EXECUTIVE'>('TENANTS');
  
  // States
  const [tenants, setTenants] = useState<TenantAccountRecord[]>(commercialSaaSPlatformService.getTenants());
  const [financials] = useState<FinancialMetricRecord>(commercialSaaSPlatformService.getFinancials());
  const [partners] = useState<PartnerEcosystemRecord[]>(commercialSaaSPlatformService.getPartners());

  // Form State
  const [newHosp, setNewHosp] = useState('Fortis Memorial Research Institute');
  const [newTier, setNewTier] = useState('HOSPITAL_CORE');

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    commercialSaaSPlatformService.createTenant(newHosp, newTier as any);
    setTenants([...commercialSaaSPlatformService.getTenants()]);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
        
        {/* TOP HEADER */}
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">CareConnect Enterprise Commercial SaaS Platform</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-md uppercase">
                  Phase 19 Commercial Active
                </span>
              </div>
              <p className="text-xs text-slate-400">Multi-tenant SaaS Provisioning, MRR/ARR Revenue Engine, Partner Ecosystem & Marketplace</p>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button 
              onClick={() => setActiveTab('TENANTS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'TENANTS' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Building2 className="w-3.5 h-3.5" /> Multi-Tenant Provisioning
            </button>
            <button 
              onClick={() => setActiveTab('SUBSCRIPTIONS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'SUBSCRIPTIONS' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <CreditCard className="w-3.5 h-3.5" /> Subscriptions & Licensing
            </button>
            <button 
              onClick={() => setActiveTab('REVENUE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'REVENUE' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <DollarSign className="w-3.5 h-3.5" /> Revenue & MRR/ARR
            </button>
            <button 
              onClick={() => setActiveTab('PARTNERS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'PARTNERS' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Award className="w-3.5 h-3.5" /> Partner Ecosystem
            </button>
            <button 
              onClick={() => setActiveTab('EXECUTIVE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'EXECUTIVE' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Executive Intelligence
            </button>
          </div>
        </div>

        {/* TAB 1: MULTI-TENANT SAAS PROVISIONING */}
        {activeTab === 'TENANTS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Multi-Tenant SaaS Provisioning & Hospital Accounts</h2>
              <p className="text-xs text-slate-500">Provision active production hospital tenants, trial environments, and white-label branding.</p>
            </div>

            <form onSubmit={handleCreateTenant} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <input
                type="text"
                placeholder="Hospital Name (e.g. Fortis Memorial)"
                value={newHosp}
                onChange={(e) => setNewHosp(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold"
              />
              <select value={newTier} onChange={(e) => setNewTier(e.target.value)} className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                <option value="ENTERPRISE_UNLIMITED">ENTERPRISE UNLIMITED ($14.5k/mo)</option>
                <option value="HOSPITAL_CORE">HOSPITAL CORE ($8.2k/mo)</option>
                <option value="CLINIC_STARTER">CLINIC STARTER ($2.4k/mo)</option>
              </select>
              <button type="submit" className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0">
                <Plus className="w-4 h-4" /> Provision Tenant
              </button>
            </form>

            <div className="space-y-4">
              {tenants.map(t => (
                <div key={t.tenantId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t.hospitalName}</h3>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${t.classification === 'LIVE_IMPLEMENTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          [{t.classification}]
                        </span>
                      </div>
                      <p className="text-xs font-mono text-indigo-600">{t.tenantId} | Plan: {t.planTier}</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">{t.status}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs font-mono pt-2 border-t">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Monthly Subscription</span>
                      <strong className="text-slate-900 dark:text-white">${t.monthlySubscriptionUsd.toLocaleString()} / mo</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Doctor Quota</span>
                      <strong className="text-slate-900 dark:text-white">{t.activeDoctorsLimit} Doctors</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Monthly AI Token Quota</span>
                      <strong className="text-slate-900 dark:text-white">{(t.aiTokenQuotaMonthly / 1000000).toFixed(1)}M Tokens</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: SUBSCRIPTIONS & LICENSING */}
        {activeTab === 'SUBSCRIPTIONS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Commercial Subscription Plans & Licensing Entitlements</h2>
              <p className="text-xs text-slate-500">Tiered plans per hospital, branch, doctor, bed, transaction, & AI token usage.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-4">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded uppercase">CLINIC STARTER</span>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">$2,400 <span className="text-xs text-slate-400 font-normal">/ mo</span></h3>
                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
                  <li>✓ Up to 25 Active Doctors</li>
                  <li>✓ OPD & Telemedicine EMR</li>
                  <li>✓ 500k AI Scribe Tokens / mo</li>
                  <li>✓ Basic Billing & Rx</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-900 border-2 border-indigo-600 rounded-2xl p-6 shadow-md space-y-4 relative">
                <span className="absolute -top-3 right-4 px-2.5 py-0.5 bg-indigo-600 text-white font-bold text-[10px] rounded-full">MOST POPULAR</span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold text-[10px] rounded uppercase">HOSPITAL CORE</span>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">$8,200 <span className="text-xs text-slate-400 font-normal">/ mo</span></h3>
                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
                  <li>✓ Up to 150 Active Doctors</li>
                  <li>✓ Full EMR, LIS, RIS/PACS & IPD/ICU</li>
                  <li>✓ 3M AI Scribe Tokens / mo</li>
                  <li>✓ BPM Studio & ABDM Milestone 1-3</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-4">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold text-[10px] rounded uppercase">ENTERPRISE UNLIMITED</span>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">$14,500 <span className="text-xs text-slate-400 font-normal">/ mo</span></h3>
                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
                  <li>✓ Unlimited Doctors & Beds</li>
                  <li>✓ Complete Healthcare OS Suite</li>
                  <li>✓ 10M AI Scribe Tokens / mo</li>
                  <li>✓ Dedicated Instance & White-Label</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REVENUE & FINANCIALS */}
        {activeTab === 'REVENUE' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Commercial Revenue Platform (MRR / ARR Engine)</h2>
                <p className="text-xs text-slate-500">Track recurring revenue, CAC, LTV, GRR, & net expansion metrics.</p>
              </div>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-mono text-[10px] font-bold rounded">
                [{financials.classification}]
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
              <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Recurring Revenue (MRR)</span>
                <h3 className="text-2xl font-black text-emerald-600">${financials.mrrUsd.toLocaleString()}</h3>
                <span className="text-[10px] text-emerald-600 font-bold">+$18.2k expansion MRR</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Annual Recurring Revenue (ARR)</span>
                <h3 className="text-2xl font-black text-indigo-600">${(financials.arrUsd / 1000000).toFixed(2)}M</h3>
                <span className="text-[10px] text-slate-400">Annual Run-Rate</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">CAC : LTV Ratio</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">1 : {(financials.ltvUsd / financials.cacUsd).toFixed(1)}</h3>
                <span className="text-[10px] text-slate-400">LTV: ${financials.ltvUsd.toLocaleString()}</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Net Revenue Retention (NRR)</span>
                <h3 className="text-2xl font-black text-cyan-600">{financials.nrrPct}%</h3>
                <span className="text-[10px] text-slate-400">GRR: {financials.grrPct}%</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PARTNER ECOSYSTEM */}
        {activeTab === 'PARTNERS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Partner Ecosystem & Reseller Commissions</h2>
              <p className="text-xs text-slate-500">Manage System Integrator (SI) partners, technology ISVs, & commission shares.</p>
            </div>

            <div className="space-y-4">
              {partners.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{p.partnerName}</h3>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-mono text-[10px] font-bold rounded">{p.tier}</span>
                    </div>
                    <p className="text-xs text-slate-500">Type: {p.type} | Revenue Share: <strong>{p.revenueSharePct}%</strong></p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-bold text-xs rounded-full">
                    {p.activeDeployments} Active Hospital Deployments
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: EXECUTIVE INTELLIGENCE */}
        {activeTab === 'EXECUTIVE' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Executive Business Intelligence & Global Tenant Map</h2>
              <p className="text-xs text-slate-500">High-level executive metrics for hospital expansion, product health, & AI consumption.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-4 text-xs font-mono">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white font-sans">Global Platform Deployment Telemetry</h3>
              <p>Active Multi-Hospital Tenants: {tenants.length}</p>
              <p>Active Certified Partners: {partners.length}</p>
              <p>Annualized SaaS Run Rate: ${(financials.arrUsd / 1000000).toFixed(2)}M ARR</p>
              <p>Gross Churn Rate: {financials.churnRatePct}%</p>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
