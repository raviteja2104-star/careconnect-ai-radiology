'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Layers, Plus, ShieldCheck, Sliders, Check,
  ToggleRight, Globe, Building2, Palette, History, ChevronRight,
  Hospital, FlaskConical, Stethoscope, Construction,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Badge, Button, Card, CardContent, CardHeader, CardTitle,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Input, Label, DataTable, type Column, Switch, Skeleton, EmptyState,
} from '@/components/ui';
import { MasterDataItem, FeatureFlagConfig } from '@/services/masterDataService';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';
function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ApiMasterItem { key: string; value: string; category: string; description?: string }

type HospitalUnit = {
  _id: string; id: string; name: string; type: 'HOSPITAL' | 'CAMPUS' | 'DEPARTMENT' | 'WARD' | 'BED';
  parentId: string | null; code: string; floor: string | null; bedCapacity: number | null; status: 'ACTIVE' | 'INACTIVE';
};
type I18nLocale = {
  _id: string; id: string; code: string; name: string; nativeName: string;
  isDefault: boolean; isEnabled: boolean; rxPrintLanguage: boolean; reportLanguage: boolean; patientPortalLanguage: boolean;
};
type BrandingConfig = {
  _id: string; id: string; key: string; label: string; value: string;
  category: 'IDENTITY' | 'REGISTRATION' | 'PRESCRIPTION' | 'COLORS'; dataType: 'TEXT' | 'TEXTAREA' | 'COLOR';
};
type ConfigAuditEntry = {
  _id: string; id: string; module: string; action: 'CREATED' | 'UPDATED' | 'DELETED';
  key: string; changedBy: string; changedAt: string; summary: string;
  oldValue: string | null; newValue: string | null;
};

const MASTER_CATEGORIES = ['PATIENT', 'CLINICAL', 'PHARMACY', 'LABORATORY', 'RADIOLOGY', 'BILLING'] as const;

const FLAG_CATEGORY_TONE: Record<FeatureFlagConfig['category'], 'brand' | 'info' | 'warning' | 'success'> = {
  CLINICAL: 'success',
  MODULE: 'brand',
  INTEGRATION: 'info',
  AI: 'warning',
};

export default function MasterDataManagementPage() {
  const [activeTab, setActiveTab] = useState<'HIERARCHY' | 'MASTERS' | 'LANGUAGES' | 'BRANDING' | 'FEATURE_FLAGS' | 'VERSIONS'>('HIERARCHY');
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<string>('CLINICAL');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemSubCategory, setNewItemSubCategory] = useState('Diagnosis');
  const [saveToast, setSaveToast] = useState(false);

  // Ops CRUD queries for 4 new tabs
  const { data: hierarchyRes, isLoading: hierarchyLoading } = useQuery({
    queryKey: ['ops', 'hospital_unit'],
    queryFn: () => fetch(`${API}/api/admin/ops/hospital_unit`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 60000,
  });
  const { data: localesRes, isLoading: localesLoading } = useQuery({
    queryKey: ['ops', 'i18n_locale'],
    queryFn: () => fetch(`${API}/api/admin/ops/i18n_locale`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 60000,
  });
  const { data: brandingRes, isLoading: brandingLoading } = useQuery({
    queryKey: ['ops', 'branding_config'],
    queryFn: () => fetch(`${API}/api/admin/ops/branding_config`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 60000,
  });
  const { data: auditRes, isLoading: auditLoading } = useQuery({
    queryKey: ['ops', 'config_audit'],
    queryFn: () => fetch(`${API}/api/admin/ops/config_audit`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 30000,
  });

  const localeMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<I18nLocale> }) =>
      fetch(`${API}/api/admin/ops/i18n_locale/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(patch),
      }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ops', 'i18n_locale'] }),
  });

  const hospitalUnits: HospitalUnit[] = hierarchyRes?.data ?? [];
  const locales: I18nLocale[] = localesRes?.data ?? [];
  const brandingItems: BrandingConfig[] = brandingRes?.data ?? [];
  const auditEntries: ConfigAuditEntry[] = auditRes?.data ?? [];

  // Real API queries
  const { data: flagsRes } = useQuery({
    queryKey: ['master_feature_flags'],
    queryFn: () => fetch(`${API}/api/master-data/feature-flags`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 30000,
  });

  const { data: itemsRes } = useQuery({
    queryKey: ['master_data_items'],
    queryFn: () => fetch(`${API}/api/master-data/items`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 30000,
  });

  const toggleFlagMutation = useMutation({
    mutationFn: ({ key, isEnabled }: { key: string; isEnabled: boolean }) =>
      fetch(`${API}/api/master-data/feature-flags/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ isEnabled }),
      }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master_feature_flags'] }),
  });

  const addItemMutation = useMutation({
    mutationFn: (item: { key: string; value: string; category: string; description?: string }) =>
      fetch(`${API}/api/master-data/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(item),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master_data_items'] });
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    },
  });

  const liveFlags: Array<{ key: string; label?: string; name?: string; description?: string; isEnabled: boolean; category: FeatureFlagConfig['category'] }> =
    flagsRes?.data ?? [];

  const handleToggleFlag = (key: string) => {
    const flag = liveFlags.find((f) => f.key === key);
    if (!flag) return;
    toggleFlagMutation.mutate({ key, isEnabled: !flag.isEnabled });
  };

  const handleAddMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemCode) return;
    addItemMutation.mutate({
      key: newItemCode,
      value: newItemName,
      category: selectedCategory,
      description: newItemSubCategory || undefined,
    });
    setNewItemName('');
    setNewItemCode('');
  };

  const enabledFlags = liveFlags.filter((f) => f.isEnabled).length;

  const apiItems: ApiMasterItem[] = itemsRes?.data ?? [];
  const liveMasterItems: MasterDataItem[] = apiItems.map((item) => ({
    id: item.key,
    category: item.category as MasterDataItem['category'],
    subCategory: item.description ?? '',
    code: item.key,
    name: item.value,
    description: item.description,
    status: 'ACTIVE' as const,
  }));
  const filteredMasters = liveMasterItems.filter((m) => m.category === selectedCategory);

  const masterColumns: Column<MasterDataItem>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      cell: (item) => <span className="font-mono text-xs font-semibold text-primary">{item.code}</span>,
    },
    { key: 'subCategory', header: 'Sub-category', sortable: true },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      cell: (item) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{item.name}</p>
          {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => (
        <Badge tone={item.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data & Config Hub"
        description="Central catalogue, hierarchy, branding and platform switches."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Master Data' }]}
        actions={
          saveToast ? (
            <Badge tone="success" dot pulse>
              <Check className="h-3 w-3" aria-hidden /> Saved
            </Badge>
          ) : undefined
        }
      />

      <StatGrid>
        <StatCard
          label="Master records"
          value={liveMasterItems.length}
          sub={`${MASTER_CATEGORIES.length} catalogue domains`}
          icon={Layers}
          tone="violet"
          delay={0}
        />
        <StatCard
          label="Feature flags"
          value={liveFlags.length > 0 ? `${enabledFlags}/${liveFlags.length}` : '—'}
          sub="Modules currently enabled"
          icon={ToggleRight}
          tone="emerald"
          delay={0.05}
        />
        <StatCard
          label="Org units"
          value={hospitalUnits.length}
          sub="Hospitals, depts & wards"
          icon={Building2}
          tone="brand"
          delay={0.1}
        />
        <StatCard
          label="Active languages"
          value={locales.filter(l => l.isEnabled).length}
          sub={`of ${locales.length} configured`}
          icon={Globe}
          tone="amber"
          delay={0.15}
        />
      </StatGrid>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="HIERARCHY"><Building2 className="h-4 w-4" aria-hidden /> Structure</TabsTrigger>
          <TabsTrigger value="MASTERS"><Layers className="h-4 w-4" aria-hidden /> Masters</TabsTrigger>
          <TabsTrigger value="LANGUAGES"><Globe className="h-4 w-4" aria-hidden /> Multilingual</TabsTrigger>
          <TabsTrigger value="BRANDING"><Palette className="h-4 w-4" aria-hidden /> Branding</TabsTrigger>
          <TabsTrigger value="FEATURE_FLAGS"><Sliders className="h-4 w-4" aria-hidden /> Feature Flags</TabsTrigger>
          <TabsTrigger value="VERSIONS"><History className="h-4 w-4" aria-hidden /> Audit Log</TabsTrigger>
        </TabsList>

        {/* TAB 1: ORGANISATION HIERARCHY */}
        <TabsContent value="HIERARCHY" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Hospital Hierarchy</h2>
            <p className="text-sm text-muted-foreground">Hospitals, campuses, departments, wards, and beds.</p>
          </div>
          {hierarchyLoading ? (
            <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="space-y-1">
              {(['HOSPITAL', 'DEPARTMENT', 'WARD'] as const).map((tier) => {
                const units = hospitalUnits.filter(u => u.type === tier);
                if (units.length === 0) return null;
                const tierMeta = {
                  HOSPITAL: { icon: Hospital, indent: 'pl-0', bg: 'bg-brand/5 border-brand/20', badge: 'brand' as const },
                  DEPARTMENT: { icon: Stethoscope, indent: 'pl-6', bg: 'bg-muted/40 border-border', badge: 'info' as const },
                  WARD: { icon: FlaskConical, indent: 'pl-12', bg: 'bg-muted/20 border-border', badge: 'success' as const },
                };
                const { icon: Icon, indent, bg, badge } = tierMeta[tier];
                return units.map((unit, i) => (
                  <motion.div
                    key={unit._id ?? unit.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`${indent}`}
                  >
                    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${bg}`}>
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm">{unit.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{unit.code}{unit.floor ? ` · Floor ${unit.floor}` : ''}{unit.bedCapacity ? ` · ${unit.bedCapacity} beds` : ''}</p>
                      </div>
                      <Badge tone={badge}>{tier}</Badge>
                      <Badge tone={unit.status === 'ACTIVE' ? 'success' : 'neutral'} dot>{unit.status}</Badge>
                    </div>
                  </motion.div>
                ));
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: MASTER DATA CATALOGUES — real API: GET /api/master-data/items, POST /api/master-data/items */}
        <TabsContent value="MASTERS" className="space-y-4 mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Master Data Catalogue</h2>
              <p className="text-sm text-muted-foreground">Clinical diagnoses, pharmacy generics, lab tests & charge masters.</p>
            </div>
            <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-muted p-1">
              {MASTER_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={selectedCategory === cat}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'bg-card text-primary shadow-soft'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="pt-5">
              <form onSubmit={handleAddMaster} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="w-full sm:w-56">
                  <Label htmlFor="master-code">Item code</Label>
                  <Input
                    id="master-code"
                    placeholder="e.g. LAB-LIPID"
                    value={newItemCode}
                    onChange={(e) => setNewItemCode(e.target.value)}
                  />
                </div>
                <div className="w-full flex-1">
                  <Label htmlFor="master-name">Item name</Label>
                  <Input
                    id="master-name"
                    placeholder="e.g. Fasting Lipid Profile"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Label htmlFor="master-subcat">Sub-category</Label>
                  <Input
                    id="master-subcat"
                    placeholder="e.g. Diagnosis"
                    value={newItemSubCategory}
                    onChange={(e) => setNewItemSubCategory(e.target.value)}
                  />
                </div>
                <Button type="submit" className="shrink-0" loading={addItemMutation.isPending}>
                  <Plus className="h-4 w-4" aria-hidden /> Add to {selectedCategory}
                </Button>
              </form>
            </CardContent>
          </Card>

          <DataTable<MasterDataItem>
            columns={masterColumns}
            data={filteredMasters}
            rowKey={(item) => item.id}
            searchPlaceholder={`Search ${selectedCategory.toLowerCase()} masters…`}
            exportName={`master-${selectedCategory.toLowerCase()}`}
            emptyTitle={`No ${selectedCategory.toLowerCase()} records`}
            emptyDescription="Use the quick-add form above to create the first catalogue entry."
          />
        </TabsContent>

        {/* TAB 3: MULTILINGUAL */}
        <TabsContent value="LANGUAGES" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Multilingual Configuration</h2>
            <p className="text-sm text-muted-foreground">Languages active for Rx printing, reports, and the patient portal.</p>
          </div>
          {localesLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            <div className="space-y-2">
              {locales.map((loc, i) => (
                <motion.div
                  key={loc._id ?? loc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <CardContent className="flex items-center gap-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-foreground text-sm">{loc.name}</span>
                          <span className="text-xs text-muted-foreground">({loc.nativeName})</span>
                          <span className="font-mono text-xs text-subtle-foreground uppercase">{loc.code}</span>
                          {loc.isDefault && <Badge tone="brand">Default</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className={loc.rxPrintLanguage ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                            {loc.rxPrintLanguage ? '✓' : '✗'} Rx Print
                          </span>
                          <span className={loc.reportLanguage ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                            {loc.reportLanguage ? '✓' : '✗'} Reports
                          </span>
                          <span className={loc.patientPortalLanguage ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                            {loc.patientPortalLanguage ? '✓' : '✗'} Patient Portal
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{loc.isEnabled ? 'Enabled' : 'Disabled'}</span>
                        <Switch
                          checked={loc.isEnabled}
                          onCheckedChange={(checked) => localeMutation.mutate({ id: loc._id ?? loc.id, patch: { isEnabled: checked } })}
                          label={`Toggle ${loc.name}`}
                          disabled={loc.isDefault}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 4: BRANDING */}
        <TabsContent value="BRANDING" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Branding & Registration</h2>
            <p className="text-sm text-muted-foreground">Hospital identity, NABH/Rohini registration, and prescription header settings.</p>
          </div>
          {brandingLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <div className="space-y-4">
              {(['IDENTITY', 'REGISTRATION', 'PRESCRIPTION', 'COLORS'] as const).map((cat) => {
                const items = brandingItems.filter(b => b.category === cat);
                if (items.length === 0) return null;
                const catMeta = {
                  IDENTITY:     { label: 'Identity',                  tone: 'brand' as const },
                  REGISTRATION: { label: 'Legal & Accreditation',     tone: 'info' as const },
                  PRESCRIPTION: { label: 'Prescription Header',       tone: 'violet' as const },
                  COLORS:       { label: 'Brand Colors',              tone: 'warning' as const },
                };
                return (
                  <Card key={cat}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge tone={catMeta[cat].tone}>{catMeta[cat].label}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {items.map((item) => (
                        <div key={item._id ?? item.id} className="flex items-start gap-4">
                          <div className="w-52 shrink-0">
                            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                            <p className="text-xs font-mono text-subtle-foreground">{item.key}</p>
                          </div>
                          {item.dataType === 'COLOR' ? (
                            <div className="flex items-center gap-2">
                              <span className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: item.value }} />
                              <span className="font-mono text-sm text-foreground">{item.value}</span>
                            </div>
                          ) : (
                            <p className="text-sm text-foreground">{item.value}</p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 5: FEATURE FLAGS — real API: GET /api/master-data/feature-flags, PATCH /api/master-data/feature-flags/:key */}
        <TabsContent value="FEATURE_FLAGS" className="space-y-4 mt-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Feature Flags & Module Switches</h2>
            <p className="text-sm text-muted-foreground">Toggle live platform capabilities across Telemedicine, AI Scribe, Multilingual Rx & ABDM Sync.</p>
          </div>
          {liveFlags.length === 0 ? (
            <EmptyState
              icon={Construction}
              title="No feature flags configured"
              description="Feature flags will appear here once configured in the backend. Contact the platform team to set up feature flags."
            />
          ) : (
            <div className="space-y-3">
              {liveFlags.map((flag, i) => {
                const displayName = flag.label ?? flag.name ?? flag.key;
                const tone = FLAG_CATEGORY_TONE[flag.category as FeatureFlagConfig['category']] ?? 'neutral';
                return (
                  <motion.div
                    key={flag.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Card>
                      <CardContent className="flex items-center justify-between gap-4 py-4">
                        <div className="min-w-0">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground">{displayName}</h3>
                            <Badge tone={tone}>{flag.category}</Badge>
                          </div>
                          {flag.description && <p className="text-sm text-muted-foreground">{flag.description}</p>}
                          <p className="mt-1 font-mono text-xs text-subtle-foreground">{flag.key}</p>
                        </div>
                        <Switch
                          checked={flag.isEnabled}
                          onCheckedChange={() => handleToggleFlag(flag.key)}
                          label={`Toggle ${displayName}`}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 6: AUDIT & VERSIONS */}
        <TabsContent value="VERSIONS" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Configuration Audit Log</h2>
            <p className="text-sm text-muted-foreground">Version history of master data, branding, and feature flag changes.</p>
          </div>
          {auditLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <div className="space-y-2">
              {auditEntries.map((entry, i) => {
                const actionTone: Record<string, 'success' | 'info' | 'error'> = {
                  CREATED: 'success', UPDATED: 'info', DELETED: 'error',
                };
                const timeAgo = (iso: string) => {
                  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
                  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                  return `${Math.floor(diff / 86400)}d ago`;
                };
                return (
                  <motion.div key={entry._id ?? entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card>
                      <CardContent className="flex items-start gap-4 py-3">
                        <div className="shrink-0 mt-0.5">
                          <Badge tone={actionTone[entry.action] ?? 'neutral'}>{entry.action}</Badge>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground leading-snug">{entry.summary}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                            <span className="font-mono">{entry.module}</span>
                            <ChevronRight className="h-3 w-3" aria-hidden />
                            <span className="font-mono">{entry.key}</span>
                            <span>·</span>
                            <span>{entry.changedBy}</span>
                          </div>
                          {(entry.oldValue || entry.newValue) && (
                            <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
                              {entry.oldValue && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 font-mono">- {entry.oldValue}</span>}
                              {entry.newValue && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 font-mono">+ {entry.newValue}</span>}
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{timeAgo(entry.changedAt)}</span>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
