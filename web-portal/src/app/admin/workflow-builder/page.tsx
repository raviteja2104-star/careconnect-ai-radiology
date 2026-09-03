'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitMerge, Play, CheckCircle2, Plus, Trash2, Save,
  ShieldCheck, ArrowRight, UserCheck, Bell, Sparkles, Code, FileText,
  X, Activity, ShoppingBag, Clock,
  SlidersHorizontal, History, CornerDownLeft, Workflow, Star, User,
} from 'lucide-react';
import {
  WorkflowDefinition, WorkflowNode, WorkflowTransition, NodeType,
  AssigneeRole, WORKFLOW_TEMPLATES, lowCodeWorkflowService
} from '@/services/lowCodeWorkflowService';
import { bpmWorkflowStudioService, MARKETPLACE_TEMPLATES } from '@/services/bpmWorkflowStudioService';
import {
  PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Tabs, TabsList, TabsTrigger, TabsContent, Badge, Button, Input, Select, Label,
  DataTable, type Column, EmptyState,
} from '@/components/ui';
import { cn } from '@/lib/utils';

type StudioTab = 'BUILDER' | 'FORMS' | 'RULES' | 'APPROVALS' | 'NOTIFICATIONS' | 'INTEGRATIONS' | 'MARKETPLACE' | 'VERSIONS';

export default function EnterpriseWorkflowStudioPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>('BUILDER');

  // Canvas State
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowDefinition>(WORKFLOW_TEMPLATES[0]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(activeWorkflow.nodes[3]);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStepIndex, setSimStepIndex] = useState(0);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  // Studio Sub-State
  const [formsList, setFormsList] = useState(bpmWorkflowStudioService.getForms());
  const [rulesList, setRulesList] = useState(bpmWorkflowStudioService.getRules());
  const [approvalsList, setApprovalsList] = useState(bpmWorkflowStudioService.getApprovalChains());
  const [notificationsList, setNotificationsList] = useState(bpmWorkflowStudioService.getNotifications());
  const [integrationsList, setIntegrationsList] = useState(bpmWorkflowStudioService.getIntegrations());

  // Palette Node Types
  const NODE_TYPES: { type: NodeType; label: string; icon: React.ReactNode; color: string }[] = [
    { type: 'START', label: 'Start Event', icon: <Play className="w-4 h-4" />, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' },
    { type: 'END', label: 'End Event', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400' },
    { type: 'USER_TASK', label: 'Human Role Task', icon: <UserCheck className="w-4 h-4" />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' },
    { type: 'AI_TASK', label: 'AI Copilot Task', icon: <Sparkles className="w-4 h-4" />, color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400' },
    { type: 'APPROVAL', label: 'Multi-Stage Approval', icon: <ShieldCheck className="w-4 h-4" />, color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' },
    { type: 'DECISION', label: 'Business Rule Gateway', icon: <GitMerge className="w-4 h-4" />, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400' },
    { type: 'TIMER', label: 'SLA Timer / Delay', icon: <Clock className="w-4 h-4" />, color: 'bg-slate-50 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400' },
    { type: 'NOTIFICATION', label: 'Dispatch Alert (WhatsApp/SMS)', icon: <Bell className="w-4 h-4" />, color: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400' },
    { type: 'INTEGRATION_API', label: 'FHIR / PACS API Integration', icon: <Code className="w-4 h-4" />, color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400' },
    { type: 'EVENT_PUBLISHER', label: 'Event Publisher', icon: <Activity className="w-4 h-4" />, color: 'bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400' }
  ];

  const handleAddNode = (type: NodeType, label: string) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      label,
      position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 100 },
      assignedRole: type === 'USER_TASK' ? 'DOCTOR' : undefined,
      slaMinutes: type === 'USER_TASK' ? 15 : undefined
    };

    const updatedNodes = [...activeWorkflow.nodes, newNode];
    const updated = { ...activeWorkflow, nodes: updatedNodes };
    setActiveWorkflow(updated);
    setSelectedNode(newNode);
  };

  const handleUpdateNode = (updatedFields: Partial<WorkflowNode>) => {
    if (!selectedNode) return;
    const updatedNodes = activeWorkflow.nodes.map(n =>
      n.id === selectedNode.id ? { ...n, ...updatedFields } : n
    );
    const updated = { ...activeWorkflow, nodes: updatedNodes };
    setActiveWorkflow(updated);
    setSelectedNode({ ...selectedNode, ...updatedFields });
  };

  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = activeWorkflow.nodes.filter(n => n.id !== nodeId);
    const updatedTransitions = activeWorkflow.transitions.filter(
      t => t.sourceNodeId !== nodeId && t.targetNodeId !== nodeId
    );
    setActiveWorkflow({ ...activeWorkflow, nodes: updatedNodes, transitions: updatedTransitions });
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  };

  const handleValidate = () => {
    const res = lowCodeWorkflowService.validateWorkflow(activeWorkflow);
    setValidationResult(res);
  };

  const handleSave = () => {
    lowCodeWorkflowService.saveDefinition(activeWorkflow);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleStartSimulation = () => {
    setIsSimulating(true);
    setSimStepIndex(0);
  };

  const handleCreateForm = () => {
    setFormsList(prev => [
      ...prev,
      {
        id: `form-${Date.now()}`,
        name: 'Untitled Clinical Form',
        fields: [{ id: `fld-${Date.now()}`, label: 'Untitled Field', type: 'TEXT' as const, required: false }],
      },
    ]);
  };

  const handleAddRule = () => {
    setRulesList(prev => [
      ...prev,
      {
        id: `rule-${Date.now()}`,
        name: 'New Clinical Rule (configure condition)',
        ifCondition: 'patient.condition == "…"',
        thenAction: 'Define action',
      },
    ]);
  };

  const handleDeleteRule = (ruleId: string) => {
    setRulesList(prev => prev.filter(r => r.id !== ruleId));
  };

  // Marketplace items map onto the built-in workflow definitions where one exists.
  const findTemplateForMarketplaceItem = (category: string): WorkflowDefinition | undefined =>
    WORKFLOW_TEMPLATES.find(t =>
      t.category === category.toUpperCase() ||
      (category === 'Emergency' && t.category === 'EMERGENCY')
    );

  const handleCloneTemplate = (itemTitle: string, category: string) => {
    const template = findTemplateForMarketplaceItem(category);
    if (!template) return;
    const cloned: WorkflowDefinition = {
      ...template,
      id: `wf-clone-${Date.now()}`,
      name: `${itemTitle} (Cloned)`,
      status: 'DRAFT',
      version: 1,
      nodes: template.nodes.map(n => ({ ...n })),
      transitions: template.transitions.map(t => ({ ...t })),
    };
    setActiveWorkflow(cloned);
    setSelectedNode(null);
    setValidationResult(null);
    setActiveTab('BUILDER');
  };

  const handleNextSimStep = () => {
    if (simStepIndex < activeWorkflow.nodes.length - 1) {
      setSimStepIndex(simStepIndex + 1);
    } else {
      setIsSimulating(false);
      setSimStepIndex(0);
    }
  };

  const integrationColumns: Column<(typeof integrationsList)[number]>[] = [
    {
      key: 'name',
      header: 'Endpoint',
      sortable: true,
      cell: (integ) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400">
            <Code className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-foreground">{integ.name}</p>
            <p className="truncate font-mono text-xs text-primary">{integ.endpointUrl}</p>
          </div>
        </div>
      ),
      accessor: (integ) => integ.name,
    },
    { key: 'protocol', header: 'Protocol', sortable: true, cell: (integ) => <Badge tone="info">{integ.protocol}</Badge> },
    { key: 'status', header: 'Status', align: 'right', cell: () => <Badge tone="success" dot>Connected</Badge>, accessor: () => 'Connected' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white shadow-soft">
              <Workflow className="h-5 w-5" aria-hidden />
            </span>
            Healthcare BPM Studio
          </span>
        }
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {activeWorkflow.name}
            <Badge tone="brand">v{activeWorkflow.version}.0 Published</Badge>
            {saveToast && <Badge tone="success" dot>Saved</Badge>}
          </span>
        }
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Workflow Builder' }]}
        actions={
          <>
            <Button variant="secondary" onClick={handleValidate}>
              <ShieldCheck className="h-4 w-4 text-success" aria-hidden /> Validate
            </Button>
            <Button variant="outline" onClick={handleStartSimulation}>
              <Play className="h-4 w-4" aria-hidden /> Simulate
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4" aria-hidden /> Save Studio
            </Button>
          </>
        }
      />

      {validationResult && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'flex items-start justify-between gap-3 rounded-2xl border p-4 text-sm',
            validationResult.valid
              ? 'border-border bg-success-soft text-success'
              : 'border-border bg-danger-soft text-danger'
          )}
          role="status"
        >
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">
                {validationResult.valid ? 'Workflow definition is valid.' : 'Validation found issues:'}
              </p>
              {!validationResult.valid && (
                <ul className="mt-1 list-inside list-disc text-xs">
                  {validationResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Dismiss validation result" onClick={() => setValidationResult(null)}>
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StudioTab)}>
        <TabsList className="h-auto max-w-full flex-wrap overflow-x-auto no-scrollbar">
          <TabsTrigger value="BUILDER"><GitMerge className="h-4 w-4" aria-hidden /> Designer</TabsTrigger>
          <TabsTrigger value="FORMS"><FileText className="h-4 w-4" aria-hidden /> Forms</TabsTrigger>
          <TabsTrigger value="RULES"><SlidersHorizontal className="h-4 w-4" aria-hidden /> Rules</TabsTrigger>
          <TabsTrigger value="APPROVALS"><ShieldCheck className="h-4 w-4" aria-hidden /> Approvals</TabsTrigger>
          <TabsTrigger value="NOTIFICATIONS"><Bell className="h-4 w-4" aria-hidden /> Alerts</TabsTrigger>
          <TabsTrigger value="INTEGRATIONS"><Code className="h-4 w-4" aria-hidden /> APIs</TabsTrigger>
          <TabsTrigger value="MARKETPLACE"><ShoppingBag className="h-4 w-4" aria-hidden /> Marketplace</TabsTrigger>
          <TabsTrigger value="VERSIONS"><History className="h-4 w-4" aria-hidden /> Versions</TabsTrigger>
        </TabsList>

        {/* TAB 1: WORKFLOW DESIGNER CANVAS */}
        <TabsContent value="BUILDER" className="mt-6">
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[16rem_minmax(0,1fr)_19rem]">
            {/* LEFT PALETTE */}
            <Card className="xl:sticky xl:top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Node Palette</CardTitle>
                <CardDescription>Drag or click to add nodes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {NODE_TYPES.map(nt => (
                    <button
                      key={nt.type}
                      onClick={() => handleAddNode(nt.type, nt.label)}
                      className="group flex w-full items-center gap-2.5 rounded-xl border border-border bg-muted/40 p-2.5 text-left transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className={cn('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110', nt.color)}>
                        {nt.icon}
                      </span>
                      <span className="text-xs font-semibold text-foreground">{nt.label}</span>
                    </button>
                  ))}
                </div>

                {/* Canvas Zoom Slider */}
                <div className="space-y-2 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <label htmlFor="wf-zoom">Zoom Level</label>
                    <span className="tabular-nums text-primary">{zoomLevel}%</span>
                  </div>
                  <input
                    id="wf-zoom"
                    type="range"
                    min="25"
                    max="200"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                    className="w-full accent-[var(--primary)]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* CENTER CANVAS */}
            <div className="relative min-w-0">
              {isSimulating && (
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-1/2 top-3 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-popover px-5 py-2.5 shadow-pop border border-border"
                >
                  <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                    Simulating step {simStepIndex + 1} of {activeWorkflow.nodes.length}
                  </span>
                  <Button size="sm" onClick={handleNextSimStep}>
                    Next Step <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Stop simulation" onClick={() => setIsSimulating(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              <div className="scrollbar-thin overflow-auto rounded-3xl border border-border bg-card shadow-soft">
                <div
                  className="relative flex min-h-[600px] min-w-[1200px] flex-wrap items-center justify-start gap-8 rounded-3xl p-12 transition-all [background-image:radial-gradient(var(--chart-grid)_1px,transparent_1px)] [background-size:16px_16px]"
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
                >
                  {activeWorkflow.nodes.map((node, idx) => {
                    const isSelected = selectedNode?.id === node.id;
                    const isSimActive = isSimulating && simStepIndex === idx;

                    return (
                      <React.Fragment key={node.id}>
                        <div
                          onClick={() => setSelectedNode(node)}
                          className={cn(
                            'group relative w-64 cursor-pointer rounded-2xl border-2 bg-card p-4 shadow-soft transition-all',
                            isSimActive ? 'scale-105 border-primary ring-4 ring-primary/30 shadow-pop' :
                            isSelected ? 'border-primary ring-2 ring-primary/20 shadow-float' :
                            'border-border hover:border-primary/40 hover:shadow-float'
                          )}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <Badge tone="neutral">{node.type}</Badge>
                            {node.assignedRole && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                                <User className="h-3 w-3" aria-hidden /> {node.assignedRole}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-semibold leading-tight text-foreground">{node.label}</h4>
                          {node.slaMinutes && (
                            <div className="mt-2 flex items-center justify-between border-t border-border pt-1.5 text-[10px] font-semibold text-muted-foreground">
                              <span>SLA Target</span>
                              <span className="inline-flex items-center gap-1 font-bold text-warning">
                                <Clock className="h-3 w-3" aria-hidden /> {node.slaMinutes} mins
                              </span>
                            </div>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}
                            aria-label={`Delete ${node.label}`}
                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white opacity-0 shadow-soft transition-opacity group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3" aria-hidden />
                          </button>
                        </div>
                        {idx < activeWorkflow.nodes.length - 1 && (
                          <div className="flex flex-col items-center justify-center">
                            <ArrowRight className="h-5 w-5 text-primary" aria-hidden />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT INSPECTOR */}
            <Card className="xl:sticky xl:top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Node Configuration</CardTitle>
                <CardDescription>Parameters for the selected node.</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedNode ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="wf-node-title">Node title</Label>
                      <Input
                        id="wf-node-title"
                        type="text"
                        value={selectedNode.label}
                        onChange={(e) => handleUpdateNode({ label: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="wf-node-role">Assigned role</Label>
                      <Select
                        id="wf-node-role"
                        value={selectedNode.assignedRole || ''}
                        onChange={(e) => handleUpdateNode({ assignedRole: e.target.value as AssigneeRole })}
                      >
                        <option value="">None (System / Event)</option>
                        <option value="DOCTOR">Doctor</option>
                        <option value="NURSE">Nurse</option>
                        <option value="RECEPTIONIST">Receptionist</option>
                        <option value="PHARMACY">Pharmacist</option>
                        <option value="LABORATORY">Lab Technician</option>
                        <option value="AI_AGENT">AI Copilot Agent</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="wf-node-sla">Target SLA (minutes)</Label>
                      <Input
                        id="wf-node-sla"
                        type="number"
                        value={selectedNode.slaMinutes || 15}
                        onChange={(e) => handleUpdateNode({ slaMinutes: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={SlidersHorizontal}
                    title="No node selected"
                    description="Select a node on the canvas to configure parameters."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: DYNAMIC FORM BUILDER */}
        <TabsContent value="FORMS" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Dynamic Form Designer</h2>
              <p className="text-sm text-muted-foreground">Configure no-code clinical forms and nurse vitals inputs.</p>
            </div>
            <Button onClick={handleCreateForm}>
              <Plus className="h-4 w-4" aria-hidden /> Create New Form
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {formsList.map((form, i) => (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-primary" aria-hidden /> {form.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {form.fields.map(field => (
                      <div key={field.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3 text-xs">
                        <span className="font-medium text-foreground">{field.label}</span>
                        <Badge tone="brand">{field.type}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: BUSINESS RULES ENGINE */}
        <TabsContent value="RULES" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Visual Business Rules Engine</h2>
              <p className="text-sm text-muted-foreground">Define IF-THEN clinical triggers without writing code.</p>
            </div>
            <Button onClick={handleAddRule}>
              <Plus className="h-4 w-4" aria-hidden /> Add Rule
            </Button>
          </div>
          <div className="space-y-3">
            {rulesList.map((rule, i) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
                    <div className="min-w-0">
                      <h3 className="mb-2 text-sm font-semibold text-foreground">{rule.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-lg bg-warning-soft px-3 py-1 font-mono font-semibold text-warning">IF: {rule.ifCondition}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                        <span className="rounded-lg bg-success-soft px-3 py-1 font-mono font-semibold text-success">THEN: {rule.thenAction}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" aria-label={`Delete rule ${rule.name}`} className="text-muted-foreground hover:text-danger" onClick={() => handleDeleteRule(rule.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: APPROVAL DESIGNER */}
        <TabsContent value="APPROVALS" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Multi-Stage Approval Designer</h2>
              <p className="text-sm text-muted-foreground">Configure prescription sign-offs and high-value financial claims.</p>
            </div>
            <Button disabled title="Coming soon">
              <Plus className="h-4 w-4" aria-hidden /> Create Approval Chain
            </Button>
          </div>
          <div className="space-y-4">
            {approvalsList.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{app.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="scrollbar-thin flex items-center gap-3 overflow-x-auto pb-1">
                      {app.stages.map(stg => (
                        <React.Fragment key={stg.stageNumber}>
                          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-muted/40 p-3 text-xs font-semibold text-foreground">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">{stg.stageNumber}</span>
                            <span>{stg.role}</span>
                            <span className="font-mono text-[10px] text-warning">({stg.slaMinutes}m)</span>
                          </div>
                          {stg.stageNumber < app.stages.length && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
                        </React.Fragment>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 5: NOTIFICATIONS */}
        <TabsContent value="NOTIFICATIONS" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Multi-Channel Alerts & Templates</h2>
              <p className="text-sm text-muted-foreground">Dispatch WhatsApp, SMS, Email, and In-App push notifications.</p>
            </div>
            <Button disabled title="Coming soon">
              <Plus className="h-4 w-4" aria-hidden /> Add Template
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {notificationsList.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm">{notif.name}</CardTitle>
                    <Badge tone="info">{notif.channel}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
                      {notif.bodyTemplate}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 6: API INTEGRATION STUDIO */}
        <TabsContent value="INTEGRATIONS" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">API Integration Studio</h2>
              <p className="text-sm text-muted-foreground">Connect ABDM / ABHA, FHIR R4, HL7, and PACS DICOM servers.</p>
            </div>
            <Button disabled title="Coming soon">
              <Plus className="h-4 w-4" aria-hidden /> Add Integration Endpoint
            </Button>
          </div>
          <DataTable
            columns={integrationColumns}
            data={integrationsList}
            rowKey={(integ) => integ.id}
            searchPlaceholder="Search endpoints…"
            exportName="workflow-integrations"
            emptyTitle="No integrations configured"
            emptyDescription="Connected FHIR, HL7 and PACS endpoints will appear here."
          />
        </TabsContent>

        {/* TAB 7: WORKFLOW MARKETPLACE */}
        <TabsContent value="MARKETPLACE" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Healthcare Workflow Marketplace</h2>
            <p className="text-sm text-muted-foreground">Clone pre-built clinical pathways verified by Mayo Clinic & Apollo Hospitals standards.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {MARKETPLACE_TEMPLATES.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card variant="interactive" className="flex h-full flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone="brand">{item.category}</Badge>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                        {item.rating} ({item.downloadsCount} installs)
                      </span>
                    </div>
                    <CardTitle className="pt-2 text-sm">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map(t => (
                        <Badge key={t} tone="neutral">#{t}</Badge>
                      ))}
                    </div>
                    {findTemplateForMarketplaceItem(item.category) ? (
                      <Button className="mt-auto w-full" onClick={() => handleCloneTemplate(item.title, item.category)}>
                        <Sparkles className="h-4 w-4" aria-hidden /> Clone Template into Studio
                      </Button>
                    ) : (
                      <Button className="mt-auto w-full" disabled title="Coming soon">
                        <Sparkles className="h-4 w-4" aria-hidden /> Clone Template into Studio
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 8: VERSION CONTROL & ROLLBACK */}
        <TabsContent value="VERSIONS" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Workflow Version Control & Audit</h2>
            <p className="text-sm text-muted-foreground">Manage published versions, view change logs, and perform 1-click rollbacks.</p>
          </div>
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-success-soft p-4 text-sm">
                <div>
                  <p className="font-semibold text-success">v3.0 Current Active Build</p>
                  <p className="text-xs text-muted-foreground">Published on 2026-07-25 by Dr. Raj Sharma. Added AI Drug Safety Step.</p>
                </div>
                <Badge tone="success" dot>Published</Badge>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
                <div>
                  <p className="font-semibold text-foreground">v2.0 Previous Version</p>
                  <p className="text-xs text-muted-foreground">Published on 2026-07-10 by Anita Desai. Added ABDM Gateway check.</p>
                </div>
                <Button size="sm" variant="outline" disabled title="Coming soon">
                  <CornerDownLeft className="h-3.5 w-3.5" aria-hidden /> Rollback to v2.0
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
