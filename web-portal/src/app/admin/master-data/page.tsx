'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Layers, Plus, ShieldCheck, Sliders, Check,
  ToggleRight, Construction,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Badge, Button, Card, CardContent,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Input, Label, DataTable, type Column, Switch, EmptyState,
} from '@/components/ui';
import { MasterDataItem, FeatureFlagConfig } from '@/services/masterDataService';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';
function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ApiMasterItem { key: string; value: string; category: string; description?: string }

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
      </StatGrid>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="HIERARCHY">Structure</TabsTrigger>
          <TabsTrigger value="MASTERS"><Layers className="h-4 w-4" aria-hidden /> Masters</TabsTrigger>
          <TabsTrigger value="LANGUAGES">Multilingual</TabsTrigger>
          <TabsTrigger value="BRANDING">Branding</TabsTrigger>
          <TabsTrigger value="FEATURE_FLAGS"><Sliders className="h-4 w-4" aria-hidden /> Feature Flags</TabsTrigger>
          <TabsTrigger value="VERSIONS"><ShieldCheck className="h-4 w-4" aria-hidden /> Audit & Versions</TabsTrigger>
        </TabsList>

        {/* TAB 1: ORGANISATION HIERARCHY — no backend endpoint */}
        <TabsContent value="HIERARCHY" className="mt-6">
          <EmptyState
            icon={Construction}
            title="Hospital hierarchy not yet available"
            description="Organisation structure (hospitals, campuses, departments, wards, beds) is not yet managed via the API. Configure it directly in your database or contact the platform team."
          />
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

        {/* TAB 3: MULTILINGUAL — no backend endpoint */}
        <TabsContent value="LANGUAGES" className="mt-6">
          <EmptyState
            icon={Construction}
            title="Multilingual configuration not yet available"
            description="Language and locale management is not yet implemented in the backend API. This feature is planned for a future release."
          />
        </TabsContent>

        {/* TAB 4: BRANDING — no backend endpoint */}
        <TabsContent value="BRANDING" className="mt-6">
          <EmptyState
            icon={Construction}
            title="Branding configuration not yet available"
            description="Hospital branding, NABH registration, and prescription header settings are not yet managed via the API. Configure these directly in the database or contact the platform team."
          />
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

        {/* TAB 6: AUDIT & VERSIONS — no backend endpoint */}
        <TabsContent value="VERSIONS" className="mt-6">
          <EmptyState
            icon={Construction}
            title="Configuration audit log not yet available"
            description="Version history and audit trail for master data configuration changes are not yet implemented in the backend API."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
