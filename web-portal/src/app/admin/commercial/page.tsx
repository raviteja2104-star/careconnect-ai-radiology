'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Building2, CreditCard, Award, TrendingUp, Check, Plus,
  BarChart3, Sparkles, Landmark, Handshake, Globe2, Bot,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Badge, Button, Card, CardHeader, CardTitle,
  CardDescription, CardContent, Tabs, TabsList, TabsTrigger, TabsContent,
  Input, Select, Label, DataTable, type Column,
} from '@/components/ui';
import { commercialSaaSPlatformService, TenantAccountRecord, FinancialMetricRecord, PartnerEcosystemRecord } from '@/services/commercialSaaSPlatformService';

const TENANT_STATUS_TONE: Record<TenantAccountRecord['status'], 'success' | 'warning' | 'danger'> = {
  ACTIVE_PRODUCTION: 'success',
  TRIAL_EXPIRING: 'warning',
  SUSPENDED: 'danger',
};

const PLAN_TIER_TONE: Record<TenantAccountRecord['planTier'], 'brand' | 'info' | 'neutral' | 'outline'> = {
  ENTERPRISE_UNLIMITED: 'brand',
  HOSPITAL_CORE: 'info',
  CLINIC_STARTER: 'neutral',
  SANDBOX_TRIAL: 'outline',
};

const PARTNER_TIER_TONE: Record<PartnerEcosystemRecord['tier'], 'warning' | 'neutral' | 'brand'> = {
  GOLD_PARTNER: 'warning',
  SILVER_PARTNER: 'neutral',
  STRATEGIC: 'brand',
};

const PRICING_PLANS = [
  {
    id: 'CLINIC_STARTER',
    name: 'Clinic Starter',
    price: '$2,400',
    tone: 'info' as const,
    popular: false,
    features: ['Up to 25 Active Doctors', 'OPD & Telemedicine EMR', '500k AI Scribe Tokens / mo', 'Basic Billing & Rx'],
  },
  {
    id: 'HOSPITAL_CORE',
    name: 'Hospital Core',
    price: '$8,200',
    tone: 'brand' as const,
    popular: true,
    features: ['Up to 150 Active Doctors', 'Full EMR, LIS, RIS/PACS & IPD/ICU', '3M AI Scribe Tokens / mo', 'BPM Studio & ABDM Milestone 1-3'],
  },
  {
    id: 'ENTERPRISE_UNLIMITED',
    name: 'Enterprise Unlimited',
    price: '$14,500',
    tone: 'neutral' as const,
    popular: false,
    features: ['Unlimited Doctors & Beds', 'Complete Healthcare OS Suite', '10M AI Scribe Tokens / mo', 'Dedicated Instance & White-Label'],
  },
];

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

  const tenantColumns: Column<TenantAccountRecord>[] = [
    {
      key: 'hospitalName',
      header: 'Hospital tenant',
      sortable: true,
      cell: (t) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <Building2 className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <span className="truncate">{t.hospitalName}</span>
              <Badge tone={t.classification === 'LIVE_IMPLEMENTED' ? 'success' : 'warning'}>{t.classification}</Badge>
            </p>
            <p className="font-mono text-xs text-subtle-foreground">{t.tenantId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'planTier',
      header: 'Plan',
      sortable: true,
      cell: (t) => <Badge tone={PLAN_TIER_TONE[t.planTier]}>{t.planTier.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'monthlySubscriptionUsd',
      header: 'Subscription',
      align: 'right',
      sortable: true,
      accessor: (t) => t.monthlySubscriptionUsd,
      cell: (t) => (
        <span className="font-mono font-semibold tabular-nums text-foreground">
          ${t.monthlySubscriptionUsd.toLocaleString()}<span className="text-xs font-normal text-muted-foreground"> /mo</span>
        </span>
      ),
    },
    {
      key: 'activeDoctorsLimit',
      header: 'Doctor quota',
      align: 'right',
      sortable: true,
      accessor: (t) => t.activeDoctorsLimit,
      cell: (t) => <span className="tabular-nums text-muted-foreground">{t.activeDoctorsLimit}</span>,
    },
    {
      key: 'aiTokenQuotaMonthly',
      header: 'AI tokens / mo',
      align: 'right',
      sortable: true,
      accessor: (t) => t.aiTokenQuotaMonthly,
      cell: (t) => <span className="tabular-nums text-muted-foreground">{(t.aiTokenQuotaMonthly / 1000000).toFixed(1)}M</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (t) => <Badge tone={TENANT_STATUS_TONE[t.status]} dot>{t.status.replace(/_/g, ' ')}</Badge>,
    },
  ];

  const partnerColumns: Column<PartnerEcosystemRecord>[] = [
    {
      key: 'partnerName',
      header: 'Partner',
      sortable: true,
      cell: (p) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
            <Handshake className="h-4 w-4" aria-hidden />
          </span>
          <span className="font-semibold text-foreground">{p.partnerName}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      cell: (p) => <span className="text-muted-foreground">{p.type.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'tier',
      header: 'Tier',
      sortable: true,
      cell: (p) => <Badge tone={PARTNER_TIER_TONE[p.tier]}>{p.tier.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'revenueSharePct',
      header: 'Revenue share',
      align: 'right',
      sortable: true,
      accessor: (p) => p.revenueSharePct,
      cell: (p) => <span className="font-semibold tabular-nums text-foreground">{p.revenueSharePct}%</span>,
    },
    {
      key: 'activeDeployments',
      header: 'Deployments',
      align: 'right',
      sortable: true,
      accessor: (p) => p.activeDeployments,
      cell: (p) => <Badge tone="brand">{p.activeDeployments} active</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commercial SaaS Platform"
        description="Multi-tenant SaaS provisioning, MRR/ARR revenue engine, partner ecosystem & marketplace."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Commercial' }]}
        actions={<Badge tone="success" dot>Phase 19 Commercial Active</Badge>}
      />

      <StatGrid>
        <StatCard
          label="Monthly Recurring Revenue"
          value={`$${financials.mrrUsd.toLocaleString()}`}
          sub={`+$${(financials.expansionMrrUsd / 1000).toFixed(1)}k expansion MRR`}
          icon={DollarSign}
          tone="emerald"
          trend="up"
          delay={0}
        />
        <StatCard
          label="Annual Recurring Revenue"
          value={`$${(financials.arrUsd / 1000000).toFixed(2)}M`}
          sub="Annual run-rate"
          icon={Landmark}
          tone="brand"
          trend="up"
          delay={0.05}
        />
        <StatCard
          label="CAC : LTV ratio"
          value={`1 : ${(financials.ltvUsd / financials.cacUsd).toFixed(1)}`}
          sub={`LTV $${financials.ltvUsd.toLocaleString()}`}
          icon={TrendingUp}
          tone="violet"
          delay={0.1}
        />
        <StatCard
          label="Net Revenue Retention"
          value={`${financials.nrrPct}%`}
          sub={`GRR ${financials.grrPct}% · churn ${financials.churnRatePct}%`}
          icon={BarChart3}
          tone="teal"
          trend="up"
          delay={0.15}
        />
      </StatGrid>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="TENANTS"><Building2 className="h-4 w-4" aria-hidden /> Tenants</TabsTrigger>
          <TabsTrigger value="SUBSCRIPTIONS"><CreditCard className="h-4 w-4" aria-hidden /> Subscriptions</TabsTrigger>
          <TabsTrigger value="REVENUE"><DollarSign className="h-4 w-4" aria-hidden /> Revenue</TabsTrigger>
          <TabsTrigger value="PARTNERS"><Award className="h-4 w-4" aria-hidden /> Partners</TabsTrigger>
          <TabsTrigger value="EXECUTIVE"><BarChart3 className="h-4 w-4" aria-hidden /> Executive</TabsTrigger>
        </TabsList>

        {/* TAB 1: MULTI-TENANT SAAS PROVISIONING */}
        <TabsContent value="TENANTS" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Multi-Tenant SaaS Provisioning & Hospital Accounts</h2>
            <p className="text-sm text-muted-foreground">Provision production hospital tenants, trial environments and white-label branding.</p>
          </div>

          <Card>
            <CardContent className="pt-5">
              <form onSubmit={handleCreateTenant} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="w-full flex-1">
                  <Label htmlFor="tenant-name">Hospital name</Label>
                  <Input
                    id="tenant-name"
                    placeholder="e.g. Fortis Memorial"
                    value={newHosp}
                    onChange={(e) => setNewHosp(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-72">
                  <Label htmlFor="tenant-tier">Plan tier</Label>
                  <Select id="tenant-tier" value={newTier} onChange={(e) => setNewTier(e.target.value)}>
                    <option value="ENTERPRISE_UNLIMITED">ENTERPRISE UNLIMITED ($14.5k/mo)</option>
                    <option value="HOSPITAL_CORE">HOSPITAL CORE ($8.2k/mo)</option>
                    <option value="CLINIC_STARTER">CLINIC STARTER ($2.4k/mo)</option>
                  </Select>
                </div>
                <Button type="submit" className="shrink-0">
                  <Plus className="h-4 w-4" aria-hidden /> Provision Tenant
                </Button>
              </form>
            </CardContent>
          </Card>

          <DataTable<TenantAccountRecord>
            columns={tenantColumns}
            data={tenants}
            rowKey={(t) => t.tenantId}
            searchPlaceholder="Search tenants…"
            exportName="saas-tenants"
            emptyTitle="No hospital tenants"
            emptyDescription="Provision your first hospital tenant using the form above."
          />
        </TabsContent>

        {/* TAB 2: SUBSCRIPTIONS & LICENSING */}
        <TabsContent value="SUBSCRIPTIONS" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Commercial Subscription Plans & Licensing Entitlements</h2>
            <p className="text-sm text-muted-foreground">Tiered plans per hospital, branch, doctor, bed, transaction & AI token usage.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {PRICING_PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="h-full"
              >
                <Card
                  className={`relative h-full ${plan.popular ? 'border-primary shadow-float ring-1 ring-primary/30' : ''}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground shadow-soft">
                      <Sparkles className="h-3 w-3" aria-hidden /> Most Popular
                    </span>
                  )}
                  <CardContent className="space-y-4 pt-6">
                    <Badge tone={plan.tone}>{plan.name.toUpperCase()}</Badge>
                    <p className="text-3xl font-bold tracking-tight text-foreground">
                      {plan.price} <span className="text-sm font-normal text-muted-foreground">/ mo</span>
                    </p>
                    <ul className="space-y-2.5 text-sm text-muted-foreground">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: REVENUE & FINANCIALS */}
        <TabsContent value="REVENUE" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Commercial Revenue Platform (MRR / ARR Engine)</h2>
              <p className="text-sm text-muted-foreground">Track recurring revenue, CAC, LTV, GRR & net expansion metrics.</p>
            </div>
            <Badge tone="warning" className="font-mono">{financials.classification}</Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="MRR"
              value={`$${financials.mrrUsd.toLocaleString()}`}
              sub={`+$${(financials.expansionMrrUsd / 1000).toFixed(1)}k expansion MRR`}
              icon={DollarSign}
              tone="emerald"
              trend="up"
              delay={0}
            />
            <StatCard
              label="ARR"
              value={`$${(financials.arrUsd / 1000000).toFixed(2)}M`}
              sub="Annual run-rate"
              icon={Landmark}
              tone="brand"
              delay={0.05}
            />
            <StatCard
              label="CAC : LTV"
              value={`1 : ${(financials.ltvUsd / financials.cacUsd).toFixed(1)}`}
              sub={`CAC $${financials.cacUsd.toLocaleString()} · LTV $${financials.ltvUsd.toLocaleString()}`}
              icon={TrendingUp}
              tone="violet"
              delay={0.1}
            />
            <StatCard
              label="NRR"
              value={`${financials.nrrPct}%`}
              sub={`GRR ${financials.grrPct}% · churn ${financials.churnRatePct}%`}
              icon={BarChart3}
              tone="teal"
              delay={0.15}
            />
          </div>
        </TabsContent>

        {/* TAB 4: PARTNER ECOSYSTEM */}
        <TabsContent value="PARTNERS" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Partner Ecosystem & Reseller Commissions</h2>
            <p className="text-sm text-muted-foreground">Manage System Integrator (SI) partners, technology ISVs & commission shares.</p>
          </div>
          <DataTable<PartnerEcosystemRecord>
            columns={partnerColumns}
            data={partners}
            rowKey={(p) => p.id}
            searchPlaceholder="Search partners…"
            exportName="partner-ecosystem"
            emptyTitle="No partners onboarded"
            emptyDescription="Certified SI, reseller and ISV partners will appear here."
          />
        </TabsContent>

        {/* TAB 5: EXECUTIVE INTELLIGENCE */}
        <TabsContent value="EXECUTIVE">
          <Card>
            <CardHeader>
              <CardTitle>Executive Business Intelligence & Global Tenant Map</CardTitle>
              <CardDescription>High-level executive metrics for hospital expansion, product health & AI consumption.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Active multi-hospital tenants', value: String(tenants.length), icon: Building2 },
                  { label: 'Active certified partners', value: String(partners.length), icon: Award },
                  { label: 'Annualized SaaS run rate', value: `$${(financials.arrUsd / 1000000).toFixed(2)}M ARR`, icon: Globe2 },
                  { label: 'Gross churn rate', value: `${financials.churnRatePct}%`, icon: Bot },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-border bg-muted/40 p-4">
                    <item.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p>
                    <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
