'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building, Globe, Shield, FileText, Save, CheckCircle2, Cpu, Mail,
  MessageSquare, Sun, Moon, Monitor, Contrast, Palette,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/services/prescriptionTranslationService';
import {
  PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Tabs, TabsList, TabsTrigger, TabsContent, Input, Select, Label, FieldHint,
  Button, Badge, Switch, EmptyState,
} from '@/components/ui';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';

const INTEGRATIONS = [
  {
    icon: MessageSquare,
    tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    name: 'WhatsApp Business API',
    detail: 'Connected to Meta Business Gateway (+91 98765 00000). Sends automated Rx PDFs.',
    status: 'Active',
  },
  {
    icon: Mail,
    tile: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    name: 'Email SendGrid Gateway',
    detail: 'SMTP: smtp.sendgrid.net | Port: 587. Sends patient lab results and invoices.',
    status: 'Active',
  },
  {
    icon: Cpu,
    tile: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
    name: 'DICOM / PACS Radiology Server',
    detail: 'Orthanc DICOM Server (192.168.1.100:4242). Live imaging integration.',
    status: 'Connected',
  },
];

const THEME_MODES = [
  { id: 'light' as const, label: 'Light', icon: Sun, hint: 'Bright clinical surfaces' },
  { id: 'dark' as const, label: 'Dark', icon: Moon, hint: 'Low-glare night shifts' },
  { id: 'system' as const, label: 'System', icon: Monitor, hint: 'Follow device preference' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'rx' | 'languages' | 'security' | 'integrations'>('profile');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const { theme, setTheme, highContrast, setHighContrast } = useTheme();

  // Form states
  const [hospitalInfo, setHospitalInfo] = useState({
    name: 'CareConnect Super Specialty Hospital',
    tagline: 'Center for Advanced Cardiovascular & Medical Sciences',
    regNo: 'NABH Accr. Reg No: HMC-2024-8849',
    phone: '+91 (080) 4567-8900 / Emergency: 108',
    email: 'contact@careconnect.health',
    address: 'Plot 42, Health City, Electronic City Ph-1, Bangalore - 560100',
    taxId: '29ABCDE1234F1Z5'
  });

  const [defaultRxLang, setDefaultRxLang] = useState('te');
  const [enableBilingualDefault, setEnableBilingualDefault] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage organization profile, appearance, multi-language defaults, security roles, & integration gateways."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Settings' }]}
        actions={
          <AnimatePresence>
            {savedSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Badge tone="success" dot pulse>
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Settings saved successfully
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="max-w-full overflow-x-auto no-scrollbar">
          <TabsTrigger value="profile"><Building className="h-4 w-4" aria-hidden /> Hospital Profile</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="h-4 w-4" aria-hidden /> Appearance</TabsTrigger>
          <TabsTrigger value="rx"><FileText className="h-4 w-4" aria-hidden /> Prescription (Rx)</TabsTrigger>
          <TabsTrigger value="languages"><Globe className="h-4 w-4" aria-hidden /> Languages</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4" aria-hidden /> Roles & Security</TabsTrigger>
          <TabsTrigger value="integrations"><Cpu className="h-4 w-4" aria-hidden /> Integrations</TabsTrigger>
        </TabsList>

        {/* HOSPITAL PROFILE */}
        <TabsContent value="profile">
          <form onSubmit={handleSave}>
            <Card>
              <CardHeader>
                <CardTitle>Organization Legal Identity & Contact Details</CardTitle>
                <CardDescription>Shown on prescriptions, invoices, and statutory documents.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <Label htmlFor="hospital-name">Hospital / Clinic Full Name</Label>
                    <Input
                      id="hospital-name"
                      type="text"
                      value={hospitalInfo.name}
                      onChange={(e) => setHospitalInfo({ ...hospitalInfo, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hospital-tagline">Tagline / Subtitle</Label>
                    <Input
                      id="hospital-tagline"
                      type="text"
                      value={hospitalInfo.tagline}
                      onChange={(e) => setHospitalInfo({ ...hospitalInfo, tagline: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hospital-regno">NABH / Medical License Reg No</Label>
                    <Input
                      id="hospital-regno"
                      type="text"
                      value={hospitalInfo.regNo}
                      onChange={(e) => setHospitalInfo({ ...hospitalInfo, regNo: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hospital-taxid">GSTIN / Tax Registration ID</Label>
                    <Input
                      id="hospital-taxid"
                      type="text"
                      value={hospitalInfo.taxId}
                      onChange={(e) => setHospitalInfo({ ...hospitalInfo, taxId: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="hospital-address">Official Address</Label>
                    <Input
                      id="hospital-address"
                      type="text"
                      value={hospitalInfo.address}
                      onChange={(e) => setHospitalInfo({ ...hospitalInfo, address: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t border-border !pt-5">
                <Button type="submit">
                  <Save className="h-4 w-4" aria-hidden /> Save Profile Settings
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* APPEARANCE */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance & Accessibility</CardTitle>
              <CardDescription>Theme preferences apply instantly across the portal and persist on this device.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Interface Theme</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Interface theme">
                  {THEME_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      role="radio"
                      aria-checked={theme === mode.id}
                      onClick={() => setTheme(mode.id)}
                      className={cn(
                        'flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200',
                        theme === mode.id
                          ? 'border-primary bg-primary/5 shadow-soft ring-2 ring-primary/25'
                          : 'border-border bg-card hover:border-primary/40'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                          theme === mode.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <mode.icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-foreground">{mode.label}</span>
                        <span className="block text-xs text-muted-foreground">{mode.hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Contrast className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">High Contrast Mode</p>
                    <p className="text-xs text-muted-foreground">Stronger borders and focus rings for low-vision readability.</p>
                  </div>
                </div>
                <Switch checked={highContrast} onCheckedChange={setHighContrast} label="High contrast mode" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRESCRIPTION (RX) */}
        <TabsContent value="rx">
          <EmptyState
            icon={FileText}
            title="Prescription customization coming soon"
            description="Letterhead layout, digital signature blocks, and Rx template controls will appear here."
          />
        </TabsContent>

        {/* MULTI-LANGUAGE DEFAULTS */}
        <TabsContent value="languages">
          <form onSubmit={handleSave}>
            <Card>
              <CardHeader>
                <CardTitle>Default Patient Prescription Language</CardTitle>
                <CardDescription>Configure how translated prescriptions render across the hospital.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <Label htmlFor="rx-lang">Default System Preferred Language</Label>
                    <Select
                      id="rx-lang"
                      value={defaultRxLang}
                      onChange={(e) => setDefaultRxLang(e.target.value)}
                    >
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name} ({lang.nativeName})
                        </option>
                      ))}
                    </Select>
                    <FieldHint>Used whenever a patient has no saved language preference.</FieldHint>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 p-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Default to Bilingual Render Mode</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Always print English generic names alongside patient native language instructions.
                      </p>
                    </div>
                    <Switch
                      checked={enableBilingualDefault}
                      onCheckedChange={setEnableBilingualDefault}
                      label="Default to bilingual render mode"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t border-border !pt-5">
                <Button type="submit">
                  <Save className="h-4 w-4" aria-hidden /> Save Multi-Language Settings
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* ROLES & SECURITY */}
        <TabsContent value="security">
          <EmptyState
            icon={Shield}
            title="Role-based access controls coming soon"
            description="Granular RBAC policies, session rules, and audit controls will be managed from this section."
          />
        </TabsContent>

        {/* INTEGRATIONS */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Communication & Hospital Hardware APIs</CardTitle>
              <CardDescription>Live gateways powering messaging, results delivery, and imaging.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {INTEGRATIONS.map((integration, i) => (
                  <motion.div
                    key={integration.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-xl', integration.tile)}>
                        <integration.icon className="h-5 w-5" aria-hidden />
                      </span>
                      <Badge tone="success" dot>{integration.status}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{integration.name}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{integration.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
