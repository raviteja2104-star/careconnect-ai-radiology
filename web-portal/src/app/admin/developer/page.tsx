'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Code2, ShoppingBag, Terminal, Webhook, Zap, ShieldCheck, Key,
  Check, Plus, ExternalLink, Star, BadgeCheck, Copy, Activity,
  Users, Puzzle, Gauge, Radio, Lock,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Badge, Button, Card, CardHeader, CardTitle,
  CardDescription, CardContent, Tabs, TabsList, TabsTrigger, TabsContent,
  Input, Select, Label, DataTable, type Column, Progress, EmptyState,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
  developerPlatformService, MarketplaceAppListing, SDKReleaseItem,
  WebhookSubscriptionRecord, EventBusMessage,
} from '@/services/developerPlatformService';

const APP_CATEGORY_TONE: Record<MarketplaceAppListing['category'], 'brand' | 'info' | 'warning' | 'success' | 'neutral'> = {
  CLINICAL: 'success',
  AI: 'warning',
  INTEGRATION: 'info',
  BILLING: 'neutral',
  TELEMEDICINE: 'brand',
};

const EVENT_STATUS_TONE: Record<EventBusMessage['status'], 'success' | 'warning' | 'danger'> = {
  DELIVERED: 'success',
  RETRY: 'warning',
  DEAD_LETTER: 'danger',
};

function CodeBlock({ children, onCopy, copyLabel }: { children: React.ReactNode; onCopy?: () => void; copyLabel?: string }) {
  return (
    <div className="group/code relative rounded-xl border border-border bg-muted/60">
      <pre className="overflow-x-auto scrollbar-thin p-3 font-mono text-xs leading-relaxed text-foreground">
        {children}
      </pre>
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          aria-label={copyLabel ?? 'Copy to clipboard'}
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground opacity-0 shadow-soft transition-all hover:text-foreground focus-visible:opacity-100 group-hover/code:opacity-100"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

export default function DeveloperPlatformPage() {
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'SDKS' | 'WEBHOOKS' | 'EVENTS' | 'OAUTH' | 'CERTIFICATION'>('MARKETPLACE');
  const { toast } = useToast();

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

  const handleCopy = (value: string, what: string) => {
    navigator.clipboard?.writeText(value);
    toast('success', `${what} copied to clipboard`);
  };

  const webhookColumns: Column<WebhookSubscriptionRecord>[] = [
    {
      key: 'targetUrl',
      header: 'Endpoint',
      sortable: true,
      cell: (wh) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-foreground">{wh.targetUrl}</span>
          <button
            type="button"
            aria-label="Copy endpoint URL"
            onClick={() => handleCopy(wh.targetUrl, 'Endpoint URL')}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ),
    },
    {
      key: 'events',
      header: 'Events',
      accessor: (wh) => wh.events.join(', '),
      cell: (wh) => (
        <div className="flex flex-wrap gap-1">
          {wh.events.map((ev) => (
            <Badge key={ev} tone="info" className="font-mono">{ev}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'successPct',
      header: 'Delivery',
      sortable: true,
      accessor: (wh) => wh.successPct,
      cell: (wh) => (
        <div className="min-w-[8rem]">
          <Progress value={wh.successPct} tone={wh.successPct >= 99 ? 'success' : wh.successPct >= 95 ? 'brand' : 'warning'} showValue />
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (wh) => (
        <Badge tone={wh.status === 'ACTIVE' ? 'success' : 'neutral'} dot>{wh.status}</Badge>
      ),
    },
    {
      key: 'signingSecret',
      header: 'Signing secret',
      cell: (wh) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-subtle-foreground">{wh.signingSecret}</span>
          <button
            type="button"
            aria-label="Copy signing secret"
            onClick={() => handleCopy(wh.signingSecret, 'Signing secret')}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ),
    },
    { key: 'lastDelivery', header: 'Last delivery', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Healthcare Platform Ecosystem"
        description="Developer portal, app marketplace, official SDKs, webhooks & certification."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Developer Platform' }]}
        actions={<Badge tone="success" dot pulse>HPaaS Enabled</Badge>}
      />

      <StatGrid>
        <StatCard
          label="API requests today"
          value={analytics.totalApiRequestsToday.toLocaleString()}
          sub={`${analytics.avgLatencyMs}ms avg latency`}
          icon={Activity}
          tone="brand"
          delay={0}
        />
        <StatCard
          label="Active developers"
          value={analytics.activeDevelopersCount}
          sub={`${analytics.sandboxActiveSessions} sandbox sessions live`}
          icon={Users}
          tone="violet"
          delay={0.05}
        />
        <StatCard
          label="Installed plugins"
          value={analytics.installedPluginsCount}
          sub="Certified marketplace apps"
          icon={Puzzle}
          tone="teal"
          delay={0.1}
        />
        <StatCard
          label="Webhook delivery"
          value={`${analytics.webhookDeliveryRatePct}%`}
          sub={`${webhooks.length} active subscriptions`}
          icon={Gauge}
          tone="emerald"
          delay={0.15}
        />
      </StatGrid>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="MARKETPLACE"><ShoppingBag className="h-4 w-4" aria-hidden /> Marketplace</TabsTrigger>
          <TabsTrigger value="SDKS"><Terminal className="h-4 w-4" aria-hidden /> SDKs & APIs</TabsTrigger>
          <TabsTrigger value="WEBHOOKS"><Webhook className="h-4 w-4" aria-hidden /> Webhooks</TabsTrigger>
          <TabsTrigger value="EVENTS"><Zap className="h-4 w-4" aria-hidden /> Event Bus</TabsTrigger>
          <TabsTrigger value="OAUTH"><Key className="h-4 w-4" aria-hidden /> OAuth 2.1</TabsTrigger>
          <TabsTrigger value="CERTIFICATION"><ShieldCheck className="h-4 w-4" aria-hidden /> Certification</TabsTrigger>
        </TabsList>

        {/* TAB 1: APP MARKETPLACE */}
        <TabsContent value="MARKETPLACE" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">App & Extension Marketplace</h2>
            <p className="text-sm text-muted-foreground">Discover & 1-click install certified clinical packs, AI agents & health integrations.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {apps.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="flex h-full flex-col">
                  <CardContent className="flex flex-1 flex-col gap-3 pt-5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={APP_CATEGORY_TONE[app.category]}>{app.category}</Badge>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
                        <Star className="h-3.5 w-3.5 fill-current" aria-hidden /> {app.rating}
                      </span>
                    </div>
                    <div>
                      <h3 className="flex items-start gap-1.5 font-semibold text-foreground">
                        <span className="min-w-0">{app.name}</span>
                        {app.isVerified && <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-label="Verified publisher" />}
                      </h3>
                      <p className="text-xs font-medium text-subtle-foreground">{app.publisher} · {app.version}</p>
                    </div>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{app.description}</p>
                    <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                      <span className="font-mono text-xs text-subtle-foreground">{app.installCount} installs</span>
                      {app.status === 'INSTALLED' ? (
                        <Badge tone="success"><Check className="h-3 w-3" aria-hidden /> Installed</Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleInstallApp(app.id)}>Install App</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: SDKS & APIS */}
        <TabsContent value="SDKS" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Official CareConnect Client SDKs</h2>
            <p className="text-sm text-muted-foreground">Fully typed SDKs with authentication, retry policies & FHIR R4 models.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sdks.map((sdk, i) => (
              <motion.div
                key={sdk.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full">
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 font-semibold text-foreground">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                          <Code2 className="h-4 w-4" aria-hidden />
                        </span>
                        {sdk.language}
                      </span>
                      <Badge tone="brand" className="font-mono">v{sdk.version}</Badge>
                    </div>
                    <CodeBlock
                      onCopy={() => handleCopy(sdk.packageName, 'Package name')}
                      copyLabel={`Copy ${sdk.language} package name`}
                    >
                      {sdk.packageName}
                    </CodeBlock>
                    <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                      <span className="tabular-nums">{sdk.downloadsCount.toLocaleString()} downloads</span>
                      <a
                        href={sdk.documentationUrl}
                        className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:underline"
                      >
                        Docs <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: WEBHOOK MANAGER */}
        <TabsContent value="WEBHOOKS" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Outbound Webhook Subscriptions</h2>
            <p className="text-sm text-muted-foreground">Receive real-time HTTP POST notifications when clinical events occur.</p>
          </div>

          <Card>
            <CardContent className="pt-5">
              <form onSubmit={handleAddWebhook} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="w-full flex-1">
                  <Label htmlFor="webhook-url">Target endpoint URL</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    icon={<Webhook />}
                    placeholder="https://api.hospital.com/webhooks"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="w-full sm:w-56">
                  <Label htmlFor="webhook-event">Event topic</Label>
                  <Select id="webhook-event" value={newWebhookEvent} onChange={(e) => setNewWebhookEvent(e.target.value)}>
                    <option value="lab.result.ready">lab.result.ready</option>
                    <option value="patient.registered">patient.registered</option>
                    <option value="prescription.signed">prescription.signed</option>
                    <option value="invoice.paid">invoice.paid</option>
                  </Select>
                </div>
                <Button type="submit" className="shrink-0">
                  <Plus className="h-4 w-4" aria-hidden /> Add Webhook
                </Button>
              </form>
            </CardContent>
          </Card>

          <DataTable<WebhookSubscriptionRecord>
            columns={webhookColumns}
            data={webhooks}
            rowKey={(wh) => wh.id}
            searchPlaceholder="Search webhooks…"
            exportName="webhook-subscriptions"
            emptyTitle="No webhook subscriptions"
            emptyDescription="Register your first endpoint above to start receiving clinical events."
          />
        </TabsContent>

        {/* TAB 4: EVENT BUS EXPLORER */}
        <TabsContent value="EVENTS" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Enterprise Event Bus Stream</h2>
            <p className="text-sm text-muted-foreground">Live pub-sub events across registration, lab orders, prescriptions & billing.</p>
          </div>
          <div className="space-y-3">
            {events.map((evt, i) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card>
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="brand" className="font-mono">{evt.eventTopic}</Badge>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Radio className="h-3.5 w-3.5" aria-hidden /> {evt.sourceModule}
                        </span>
                        <span className="font-mono text-xs text-subtle-foreground">{evt.timestamp}</span>
                      </div>
                      <Badge tone={EVENT_STATUS_TONE[evt.status]} dot>{evt.status}</Badge>
                    </div>
                    <CodeBlock
                      onCopy={() => handleCopy(JSON.stringify(evt.payload, null, 2), 'Event payload')}
                      copyLabel="Copy event payload"
                    >
                      {JSON.stringify(evt.payload, null, 2)}
                    </CodeBlock>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 5: OAUTH 2.1 */}
        <TabsContent value="OAUTH" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">OAuth 2.1 Registered Client Applications</h2>
            <p className="text-sm text-muted-foreground">Manage PKCE OAuth 2.1 client credentials & API rate limits.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {oauthApps.map((oa, i) => (
              <motion.div
                key={oa.clientId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full">
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="inline-flex items-center gap-2 font-semibold text-foreground">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                          <Lock className="h-4 w-4" aria-hidden />
                        </span>
                        {oa.appName}
                      </h3>
                      <Badge tone={oa.status === 'ACTIVE' ? 'success' : 'danger'} dot>{oa.status}</Badge>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-24 shrink-0 font-medium text-muted-foreground">Client ID</span>
                        <span className="min-w-0 truncate font-mono font-semibold text-primary">{oa.clientId}</span>
                        <button
                          type="button"
                          aria-label={`Copy client ID for ${oa.appName}`}
                          onClick={() => handleCopy(oa.clientId, 'Client ID')}
                          className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-24 shrink-0 font-medium text-muted-foreground">Redirect URIs</span>
                        <span className="min-w-0 break-all font-mono text-subtle-foreground">{oa.redirectUris.join(', ')}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-24 shrink-0 font-medium text-muted-foreground">Scopes</span>
                        <span className="flex flex-wrap gap-1">
                          {oa.allowedScopes.map((scope: string) => (
                            <Badge key={scope} tone="outline" className="font-mono">{scope}</Badge>
                          ))}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-24 shrink-0 font-medium text-muted-foreground">Rate limit</span>
                        <span className="tabular-nums text-foreground">{oa.rateLimitPerMin.toLocaleString()} req/min</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 6: CERTIFICATION */}
        <TabsContent value="CERTIFICATION" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Plugin Security & Compliance Certification</h2>
              <p className="text-sm text-muted-foreground">Automated vulnerability analysis, FHIR R4 compliance checks & HIPAA privacy audit.</p>
            </div>
            <Button onClick={handleRunCertification} disabled={isScanning} loading={isScanning}>
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {isScanning ? 'Running Security Audit…' : 'Run Security & FHIR Scanner'}
            </Button>
          </div>

          {certReport ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border">
                  <div>
                    <CardTitle>{certReport.pluginName}</CardTitle>
                    <CardDescription>{certReport.version} · certified {new Date(certReport.certifiedAt).toLocaleString()}</CardDescription>
                  </div>
                  <Badge tone="success" dot>{certReport.certificationStatus}</Badge>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                      { label: 'Security vulnerabilities', value: certReport.scans.securityVulnerabilities },
                      { label: 'FHIR compliance', value: certReport.scans.fhirCompliance },
                      { label: 'Latency benchmark', value: `${certReport.scans.performanceBenchmarkMs}ms` },
                      { label: 'HIPAA privacy audit', value: certReport.scans.hipaaPrivacyCheck },
                    ].map((scan) => (
                      <div key={scan.label} className="rounded-xl border border-border bg-muted/40 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{scan.label}</p>
                        <p className="mt-1 font-mono text-sm font-semibold text-success">{scan.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            !isScanning && (
              <EmptyState
                icon={ShieldCheck}
                title="No certification report yet"
                description="Run the security & FHIR scanner to generate a compliance certification report."
                action={{ label: 'Run Scanner', onClick: handleRunCertification }}
              />
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
