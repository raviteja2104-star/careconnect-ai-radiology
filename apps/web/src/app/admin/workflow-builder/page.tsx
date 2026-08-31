'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  GitMerge, Play, CheckCircle2, AlertTriangle, Plus, Trash2, Save, 
  ZoomIn, ZoomOut, Maximize2, RefreshCw, Copy, Layers, Cpu, Clock, 
  ShieldCheck, ArrowRight, UserCheck, Bell, Sparkles, Code, FileText, 
  Sliders, Eye, Check, X, Compass, Activity, Database, ShoppingBag, 
  Layers3, SlidersHorizontal, History, Share2, CornerDownLeft, Lock, Workflow, CheckSquare
} from 'lucide-react';
import { 
  WorkflowDefinition, WorkflowNode, WorkflowTransition, NodeType, 
  AssigneeRole, WORKFLOW_TEMPLATES, lowCodeWorkflowService 
} from '@/services/lowCodeWorkflowService';
import { bpmWorkflowStudioService, MARKETPLACE_TEMPLATES } from '@/services/bpmWorkflowStudioService';

export default function EnterpriseWorkflowStudioPage() {
  const [activeTab, setActiveTab] = useState<'BUILDER' | 'FORMS' | 'RULES' | 'APPROVALS' | 'NOTIFICATIONS' | 'INTEGRATIONS' | 'MARKETPLACE' | 'VERSIONS'>('BUILDER');
  
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
    { type: 'START', label: 'Start Event', icon: <Play className="w-4 h-4" />, color: 'bg-emerald-500' },
    { type: 'END', label: 'End Event', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-rose-500' },
    { type: 'USER_TASK', label: 'Human Role Task', icon: <UserCheck className="w-4 h-4" />, color: 'bg-blue-500' },
    { type: 'AI_TASK', label: 'AI Copilot Task', icon: <Sparkles className="w-4 h-4" />, color: 'bg-purple-500' },
    { type: 'APPROVAL', label: 'Multi-Stage Approval', icon: <ShieldCheck className="w-4 h-4" />, color: 'bg-amber-500' },
    { type: 'DECISION', label: 'Business Rule Gateway', icon: <GitMerge className="w-4 h-4" />, color: 'bg-indigo-500' },
    { type: 'TIMER', label: 'SLA Timer / Delay', icon: <Clock className="w-4 h-4" />, color: 'bg-slate-500' },
    { type: 'NOTIFICATION', label: 'Dispatch Alert (WhatsApp/SMS)', icon: <Bell className="w-4 h-4" />, color: 'bg-teal-500' },
    { type: 'INTEGRATION_API', label: 'FHIR / PACS API Integration', icon: <Code className="w-4 h-4" />, color: 'bg-cyan-500' },
    { type: 'EVENT_PUBLISHER', label: 'Event Publisher', icon: <Activity className="w-4 h-4" />, color: 'bg-pink-500' }
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

  const handleNextSimStep = () => {
    if (simStepIndex < activeWorkflow.nodes.length - 1) {
      setSimStepIndex(simStepIndex + 1);
    } else {
      setIsSimulating(false);
      setSimStepIndex(0);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
        
        {/* TOP WORKFLOW STUDIO HEADER */}
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">Healthcare BPM Studio</span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold rounded-md uppercase">
                  v{activeWorkflow.version}.0 Published
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xs">{activeWorkflow.name}</p>
            </div>
          </div>

          {/* STUDIO NAVIGATION TABS */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button 
              onClick={() => setActiveTab('BUILDER')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'BUILDER' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <GitMerge className="w-3.5 h-3.5" /> Designer
            </button>
            <button 
              onClick={() => setActiveTab('FORMS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'FORMS' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <FileText className="w-3.5 h-3.5" /> Forms
            </button>
            <button 
              onClick={() => setActiveTab('RULES')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'RULES' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Rules
            </button>
            <button 
              onClick={() => setActiveTab('APPROVALS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'APPROVALS' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Approvals
            </button>
            <button 
              onClick={() => setActiveTab('NOTIFICATIONS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'NOTIFICATIONS' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Bell className="w-3.5 h-3.5" /> Alerts
            </button>
            <button 
              onClick={() => setActiveTab('INTEGRATIONS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'INTEGRATIONS' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Code className="w-3.5 h-3.5" /> APIs
            </button>
            <button 
              onClick={() => setActiveTab('MARKETPLACE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'MARKETPLACE' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Marketplace
            </button>
            <button 
              onClick={() => setActiveTab('VERSIONS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'VERSIONS' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <History className="w-3.5 h-3.5" /> Versions
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleValidate}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Validate
            </button>
            <button 
              onClick={handleStartSimulation}
              className="px-3 py-2 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-purple-100 transition-all"
            >
              <Play className="w-4 h-4" /> Simulate
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Save className="w-4 h-4" /> Save Studio
            </button>
          </div>
        </div>

        {/* TAB 1: WORKFLOW DESIGNER CANVAS */}
        {activeTab === 'BUILDER' && (
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT PALETTE */}
            <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 space-y-4 overflow-y-auto shrink-0">
              <div>
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                  Node Palette (Drag/Click)
                </h3>
                <div className="space-y-2">
                  {NODE_TYPES.map(nt => (
                    <button
                      key={nt.type}
                      onClick={() => handleAddNode(nt.type, nt.label)}
                      className="w-full p-2.5 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-left flex items-center gap-2.5 transition-all group"
                    >
                      <div className={`p-1.5 ${nt.color} text-white rounded-lg group-hover:scale-110 transition-transform`}>
                        {nt.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{nt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Canvas Zoom Slider & MiniMap */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span>Zoom Level</span>
                  <span className="text-indigo-600 font-mono">{zoomLevel}%</span>
                </div>
                <input 
                  type="range" 
                  min="25" 
                  max="200" 
                  value={zoomLevel} 
                  onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            {/* CENTER CANVAS */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-950 relative overflow-auto p-8 flex items-center justify-center">
              {isSimulating && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-purple-900 text-white px-6 py-2 rounded-2xl shadow-xl flex items-center gap-4 z-50 animate-bounce">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-purple-300" /> Simulating Step {simStepIndex + 1} of {activeWorkflow.nodes.length}
                  </div>
                  <button onClick={handleNextSimStep} className="px-3 py-1 bg-purple-700 hover:bg-purple-600 rounded-lg text-xs font-bold text-white">Next Step ➔</button>
                  <button onClick={() => setIsSimulating(false)} className="p-1 hover:bg-purple-800 rounded text-purple-200"><X className="w-4 h-4" /></button>
                </div>
              )}

              <div 
                className="min-w-[1200px] min-h-[600px] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] rounded-3xl border border-slate-200 dark:border-slate-800 p-12 relative flex flex-wrap gap-8 items-center justify-start transition-all"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
              >
                {activeWorkflow.nodes.map((node, idx) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isSimActive = isSimulating && simStepIndex === idx;

                  return (
                    <React.Fragment key={node.id}>
                      <div
                        onClick={() => setSelectedNode(node)}
                        className={`w-64 p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-sm relative group ${
                          isSimActive ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 ring-4 ring-purple-300 shadow-lg scale-105' :
                          isSelected ? 'border-indigo-600 bg-white dark:bg-slate-900 ring-2 ring-indigo-200 dark:ring-indigo-900 shadow-md' :
                          'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                            {node.type}
                          </span>
                          {node.assignedRole && <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">👤 {node.assignedRole}</span>}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{node.label}</h4>
                        {node.slaMinutes && (
                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-semibold border-t border-slate-100 dark:border-slate-800/80 pt-1.5">
                            <span>SLA Target</span>
                            <span className="text-amber-600 font-bold">⏱️ {node.slaMinutes} mins</span>
                          </div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      {idx < activeWorkflow.nodes.length - 1 && (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <ArrowRight className="w-5 h-5 text-indigo-500" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* RIGHT INSPECTOR */}
            <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-5 space-y-5 overflow-y-auto shrink-0">
              {selectedNode ? (
                <div className="space-y-4 text-xs">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b">Node Configuration</h3>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Node Title</label>
                    <input type="text" value={selectedNode.label} onChange={(e) => handleUpdateNode({ label: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Assigned Role</label>
                    <select value={selectedNode.assignedRole || ''} onChange={(e) => handleUpdateNode({ assignedRole: e.target.value as AssigneeRole })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold">
                      <option value="">None (System / Event)</option>
                      <option value="DOCTOR">Doctor</option>
                      <option value="NURSE">Nurse</option>
                      <option value="RECEPTIONIST">Receptionist</option>
                      <option value="PHARMACY">Pharmacist</option>
                      <option value="LABORATORY">Lab Technician</option>
                      <option value="AI_AGENT">AI Copilot Agent</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target SLA (Minutes)</label>
                    <input type="number" value={selectedNode.slaMinutes || 15} onChange={(e) => handleUpdateNode({ slaMinutes: parseInt(e.target.value) })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold" />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">Select a node on the canvas to configure parameters.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DYNAMIC FORM BUILDER */}
        {activeTab === 'FORMS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dynamic Form Designer</h2>
                <p className="text-xs text-slate-500">Configure no-code clinical forms and nurse vitals inputs.</p>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create New Form
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formsList.map(form => (
                <div key={form.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" /> {form.name}
                  </h3>
                  <div className="space-y-2">
                    {form.fields.map(field => (
                      <div key={field.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{field.label}</span>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono text-[10px] rounded font-bold">
                          {field.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BUSINESS RULES ENGINE */}
        {activeTab === 'RULES' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Visual Business Rules Engine</h2>
                <p className="text-xs text-slate-500">Define IF-THEN clinical triggers without writing code.</p>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Rule
              </button>
            </div>
            <div className="space-y-4">
              {rulesList.map(rule => (
                <div key={rule.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">{rule.name}</h3>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 font-mono rounded-lg font-bold">IF: {rule.ifCondition}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-mono rounded-lg font-bold">THEN: {rule.thenAction}</span>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: APPROVAL DESIGNER */}
        {activeTab === 'APPROVALS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Multi-Stage Approval Designer</h2>
                <p className="text-xs text-slate-500">Configure prescription sign-offs and high-value financial claims.</p>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Approval Chain
              </button>
            </div>
            {approvalsList.map(app => (
              <div key={app.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{app.name}</h3>
                <div className="flex items-center gap-4">
                  {app.stages.map(stg => (
                    <React.Fragment key={stg.stageNumber}>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px]">{stg.stageNumber}</span>
                        <span>{stg.role}</span>
                        <span className="text-[10px] text-amber-600 font-mono">({stg.slaMinutes}m)</span>
                      </div>
                      {stg.stageNumber < app.stages.length && <ArrowRight className="w-4 h-4 text-slate-400" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: NOTIFICATIONS */}
        {activeTab === 'NOTIFICATIONS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Multi-Channel Alerts & Templates</h2>
                <p className="text-xs text-slate-500">Dispatch WhatsApp, SMS, Email, and In-App push notifications.</p>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Template
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notificationsList.map(notif => (
                <div key={notif.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{notif.name}</h3>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-mono text-[10px] font-bold rounded uppercase">{notif.channel}</span>
                  </div>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed">{notif.bodyTemplate}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: API INTEGRATION STUDIO */}
        {activeTab === 'INTEGRATIONS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">API Integration Studio</h2>
                <p className="text-xs text-slate-500">Connect ABDM / ABHA, FHIR R4, HL7, & PACS DICOM servers.</p>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Integration Endpoint
              </button>
            </div>
            <div className="space-y-4">
              {integrationsList.map(integ => (
                <div key={integ.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{integ.name}</h3>
                    <p className="text-xs font-mono text-indigo-600">{integ.endpointUrl}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-cyan-100 text-cyan-800 font-mono text-[10px] font-bold rounded">{integ.protocol}</span>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">Connected</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: WORKFLOW MARKETPLACE */}
        {activeTab === 'MARKETPLACE' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Healthcare Workflow Marketplace</h2>
              <p className="text-xs text-slate-500">Clone pre-built clinical pathways verified by Mayo Clinic & Apollo Hospitals standards.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MARKETPLACE_TEMPLATES.map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded uppercase">{item.category}</span>
                      <span className="text-xs font-bold text-amber-500">⭐ {item.rating} ({item.downloadsCount} installs)</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 mb-3">{item.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 text-[10px] font-medium rounded-md">#{t}</span>
                      ))}
                    </div>
                  </div>
                  <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                    <Copy className="w-4 h-4" /> Clone Template into Studio
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: VERSION CONTROL & ROLLBACK */}
        {activeTab === 'VERSIONS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Workflow Version Control & Audit</h2>
              <p className="text-xs text-slate-500">Manage published versions, view change logs, and perform 1-click rollbacks.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <div>
                  <span className="font-bold text-emerald-800">v3.0 Current Active Build</span>
                  <p className="text-emerald-700">Published on 2026-07-25 by Dr. Raj Sharma. Added AI Drug Safety Step.</p>
                </div>
                <span className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[10px]">PUBLISHED</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <span className="font-bold text-slate-800">v2.0 Previous Version</span>
                  <p className="text-slate-500">Published on 2026-07-10 by Anita Desai. Added ABDM Gateway check.</p>
                </div>
                <button className="px-3 py-1 bg-indigo-600 text-white font-bold rounded-lg text-[10px] flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3" /> Rollback to v2.0
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
