'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building, Layers, Globe, Palette,
  Plus, Save, ShieldCheck, Sliders, Check, CornerDownLeft,
  Landmark, GitBranch, Languages, ToggleRight, History, Network,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Badge, Button, Card, CardHeader, CardTitle,
  CardDescription, CardContent, Tabs, TabsList, TabsTrigger, TabsContent,
  Input, Select, Label, DataTable, type Column, Switch, Timeline, TimelineItem, Progress,
} from '@/components/ui';
import {
  masterDataService, MasterDataItem, HospitalHierarchyNode,
  FeatureFlagConfig, LanguageResourceConfig,
} from '@/services/masterDataService';

const MASTER_CATEGORIES = ['PATIENT', 'CLINICAL', 'PHARMACY', 'LABORATORY', 'RADIOLOGY', 'BILLING'] as const;

const NODE_TYPE_TONE: Record<HospitalHierarchyNode['type'], 'brand' | 'info' | 'neutral' | 'success' | 'warning'> = {
  ORGANIZATION: 'brand',
  HOSPITAL: 'brand',
  CAMPUS: 'info',
  BUILDING: 'info',
  FLOOR: 'neutral',
  DEPARTMENT: 'success',
  WARD: 'warning',
  ROOM: 'neutral',
  BED: 'neutral',
};

const FLAG_CATEGORY_TONE: Record<FeatureFlagConfig['category'], 'brand' | 'info' | 'warning' | 'success'> = {
  CLINICAL: 'success',
  MODULE: 'brand',
  INTEGRATION: 'info',
  AI: 'warning',
};

export default function MasterDataManagementPage() {
  const [activeTab, setActiveTab] = useState<'HIERARCHY' | 'MASTERS' | 'LANGUAGES' | 'BRANDING' | 'FEATURE_FLAGS' | 'VERSIONS'>('HIERARCHY');

  // Service States
  const [hierarchy] = useState<HospitalHierarchyNode[]>(masterDataService.getHierarchy());
  const [masterItems, setMasterItems] = useState<MasterDataItem[]>(masterDataService.getMasterItems());
  const [selectedCategory, setSelectedCategory] = useState<string>('CLINICAL');
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagConfig[]>(masterDataService.getFeatureFlags());
  const [languages] = useState<LanguageResourceConfig[]>(masterDataService.getLanguages());
  const [branding, setBranding] = useState(masterDataService.getBranding());
  const [versions] = useState(masterDataService.getVersions());

  // Modal / Form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemSubCategory, setNewItemSubCategory] = useState('Diagnosis');
  const [saveToast, setSaveToast] = useState(false);

  const handleToggleFlag = (key: string) => {
    masterDataService.toggleFeatureFlag(key);
    setFeatureFlags([...masterDataService.getFeatureFlags()]);
  };

  const handleAddMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemCode) return;

    const created = masterDataService.addMasterItem({
      id: `m-custom-${Date.now()}`,
      category: selectedCategory as any,
      subCategory: newItemSubCategory,
      code: newItemCode,
      name: newItemName,
      status: 'ACTIVE'
    });

    setMasterItems([...masterDataService.getMasterItems()]);
    setNewItemName('');
    setNewItemCode('');
  };

  const handleSaveBranding = () => {
    masterDataService.updateBranding(branding);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handlePublish = () => {
    masterDataService.publishConfiguration('Master Data Configuration published via Admin Hub.');
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const enabledFlags = featureFlags.filter((f) => f.isEnabled).length;
  const maxKeys = Math.max(...languages.map((l) => l.translatedCount), 1);
  const filteredMasters = masterItems.filter((m) => m.category === selectedCategory);

  const hierarchyColumns: Column<HospitalHierarchyNode>[] = [
    {
      key: 'name',
      header: 'Unit',
      sortable: true,
      cell: (node) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <Building className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{node.name}</p>
            <p className="font-mono text-xs text-subtle-foreground">{node.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      cell: (node) => <Badge tone={NODE_TYPE_TONE[node.type]}>{node.type}</Badge>,
    },
    {
      key: 'childrenCount',
      header: 'Child units',
      align: 'right',
      sortable: true,
      accessor: (node) => node.childrenCount ?? 0,
      cell: (node) => (
        <span className="tabular-nums text-muted-foreground">
          {node.childrenCount != null ? node.childrenCount : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (node) => (
        <Badge tone={node.status === 'ACTIVE' ? 'success' : 'neutral'} dot>
          {node.status}
        </Badge>
      ),
    },
  ];

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
        description={`Central catalogue, hierarchy, branding and platform switches for ${branding.hospitalName}.`}
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Master Data' }]}
        actions={
          <>
            {saveToast && (
              <Badge tone="success" dot pulse>
                <Check className="h-3 w-3" aria-hidden /> Saved
              </Badge>
            )}
            <Badge tone="info">v{versions[0].version}.0 Active</Badge>
            <Button onClick={handlePublish}>
              <Save className="h-4 w-4" aria-hidden /> Publish Config
            </Button>
          </>
        }
      />

      <StatGrid>
        <StatCard label="Hierarchy units" value={hierarchy.length} sub="Org → Campus → Ward → Bed" icon={Network} tone="brand" delay={0} />
        <StatCard label="Master records" value={masterItems.length} sub={`${MASTER_CATEGORIES.length} catalogue domains`} icon={Layers} tone="violet" delay={0.05} />
        <StatCard label="Languages" value={languages.length} sub="Prescription & portal locales" icon={Languages} tone="teal" delay={0.1} />
        <StatCard label="Feature flags" value={`${enabledFlags}/${featureFlags.length}`} sub="Modules currently enabled" icon={ToggleRight} tone="emerald" delay={0.15} />
      </StatGrid>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="HIERARCHY"><Building className="h-4 w-4" aria-hidden /> Structure</TabsTrigger>
          <TabsTrigger value="MASTERS"><Layers className="h-4 w-4" aria-hidden /> Masters</TabsTrigger>
          <TabsTrigger value="LANGUAGES"><Globe className="h-4 w-4" aria-hidden /> Multilingual</TabsTrigger>
          <TabsTrigger value="BRANDING"><Palette className="h-4 w-4" aria-hidden /> Branding</TabsTrigger>
          <TabsTrigger value="FEATURE_FLAGS"><Sliders className="h-4 w-4" aria-hidden /> Feature Flags</TabsTrigger>
          <TabsTrigger value="VERSIONS"><ShieldCheck className="h-4 w-4" aria-hidden /> Audit & Versions</TabsTrigger>
        </TabsList>

        {/* TAB 1: ORGANISATION HIERARCHY */}
        <TabsContent value="HIERARCHY" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Hospital Organisation Hierarchy</h2>
              <p className="text-sm text-muted-foreground">Configure multi-tenant groups, campuses, departments, wards & beds.</p>
            </div>
            <Button variant="secondary" disabled title="Coming soon">
              <Plus className="h-4 w-4" aria-hidden /> Add Node
            </Button>
          </div>
          <DataTable<HospitalHierarchyNode>
            columns={hierarchyColumns}
            data={hierarchy}
            rowKey={(node) => node.id}
            searchPlaceholder="Search units…"
            exportName="hospital-hierarchy"
            emptyTitle="No organisation units"
            emptyDescription="Add your first hospital, campus or department node to begin."
          />
        </TabsContent>

        {/* TAB 2: MASTER DATA CATALOGUES */}
        <TabsContent value="MASTERS" className="space-y-4">
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
                <Button type="submit" className="shrink-0">
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

        {/* TAB 3: MULTILINGUAL DEFAULTS */}
        <TabsContent value="LANGUAGES" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Multilingual Resources & Patient Defaults</h2>
            <p className="text-sm text-muted-foreground">Locales for prescriptions, patient portal & WhatsApp dispatches.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {languages.map((lang, i) => (
              <motion.div
                key={lang.code}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full">
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{lang.name}</p>
                        <p className="text-sm text-muted-foreground">{lang.nativeName}</p>
                      </div>
                      <Badge tone="brand" className="font-mono uppercase">{lang.code}</Badge>
                    </div>
                    <Progress
                      value={Math.round((lang.translatedCount / maxKeys) * 100)}
                      tone={lang.translatedCount === maxKeys ? 'success' : 'brand'}
                      label={`${lang.translatedCount} keys`}
                      showValue
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      {lang.isDefaultPrescriptionLanguage && <Badge tone="success" dot>Default Rx</Badge>}
                      {lang.direction === 'rtl' && <Badge tone="outline">RTL</Badge>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: BRANDING & IDENTITY */}
        <TabsContent value="BRANDING">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle>Branding & Hospital Legal Identity</CardTitle>
                <CardDescription>Hospital identity, NABH registration & prescription headers.</CardDescription>
              </div>
              <Button onClick={handleSaveBranding} className="shrink-0">
                <Save className="h-4 w-4" aria-hidden /> Save Branding
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="branding-name">Hospital official name</Label>
                  <Input
                    id="branding-name"
                    icon={<Landmark />}
                    value={branding.hospitalName}
                    onChange={(e) => setBranding({ ...branding, hospitalName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="branding-nabh">NABH registration no.</Label>
                  <Input
                    id="branding-nabh"
                    value={branding.nabhRegistrationNo}
                    onChange={(e) => setBranding({ ...branding, nabhRegistrationNo: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="branding-gstin">GSTIN tax ID</Label>
                  <Input
                    id="branding-gstin"
                    value={branding.gstinNo}
                    onChange={(e) => setBranding({ ...branding, gstinNo: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="branding-header">Prescription header layout</Label>
                  <Select
                    id="branding-header"
                    value={branding.prescriptionHeaderLayout}
                    onChange={(e) => setBranding({ ...branding, prescriptionHeaderLayout: e.target.value as any })}
                  >
                    <option value="HEADER_FULL">Full Standard Header with Logo</option>
                    <option value="HEADER_COMPACT">Compact Modern Header</option>
                    <option value="LETTERHEAD_PREPRINTED">Pre-Printed Letterhead Margins</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: FEATURE FLAGS MANAGER */}
        <TabsContent value="FEATURE_FLAGS" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Feature Flags & Module Switches</h2>
            <p className="text-sm text-muted-foreground">Toggle live platform capabilities across Telemedicine, AI Scribe, Multilingual Rx & ABDM Sync.</p>
          </div>
          <div className="space-y-3">
            {featureFlags.map((flag, i) => (
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
                        <h3 className="font-semibold text-foreground">{flag.name}</h3>
                        <Badge tone={FLAG_CATEGORY_TONE[flag.category]}>{flag.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{flag.description}</p>
                      <p className="mt-1 font-mono text-xs text-subtle-foreground">{flag.key}</p>
                    </div>
                    <Switch
                      checked={flag.isEnabled}
                      onCheckedChange={() => handleToggleFlag(flag.key)}
                      label={`Toggle ${flag.name}`}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 6: AUDIT & VERSIONS */}
        <TabsContent value="VERSIONS">
          <Card>
            <CardHeader>
              <CardTitle>Master Configuration Version Audit</CardTitle>
              <CardDescription>Track master data additions, feature flag toggles and pricing updates.</CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline>
                {versions.map((ver) => (
                  <TimelineItem
                    key={ver.version}
                    icon={ver.status === 'PUBLISHED' ? GitBranch : History}
                    tone={ver.status === 'PUBLISHED' ? 'success' : 'neutral'}
                    title={
                      <span className="inline-flex items-center gap-2">
                        Version v{ver.version}.0
                        <Badge tone={ver.status === 'PUBLISHED' ? 'success' : 'neutral'}>{ver.status}</Badge>
                      </span>
                    }
                    meta={`${ver.publishedAt} · ${ver.publishedBy}`}
                  >
                    <p>{ver.changeSummary}</p>
                    {ver.status !== 'PUBLISHED' && (
                      <Button variant="outline" size="sm" className="mt-2" disabled title="Coming soon">
                        <CornerDownLeft className="h-3.5 w-3.5" aria-hidden /> Rollback to v{ver.version}.0
                      </Button>
                    )}
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
