'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  GitMerge, Play, CheckCircle2, AlertTriangle, Plus, Trash2, Save, 
  ZoomIn, ZoomOut, Maximize2, RefreshCw, Copy, Layers, Cpu, Clock, 
  ShieldCheck, ArrowRight, UserCheck, Bell, Sparkles, Code, FileText, 
  Sliders, Eye, Check, X, Compass, Activity, Database
} from 'lucide-react';
import { 
  WorkflowDefinition, WorkflowNode, WorkflowTransition, NodeType, 
  AssigneeRole, WORKFLOW_TEMPLATES, lowCodeWorkflowService 
} from '@/services/lowCodeWorkflowService';

export default function WorkflowBuilderPage() {
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowDefinition>(WORKFLOW_TEMPLATES[0]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(activeWorkflow.nodes[3]);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStepIndex, setSimStepIndex] = useState(0);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  // Palette Node Types
  const NODE_TYPES: { type: NodeType; label: string; icon: React.ReactNode; color: string }[] = [
    { type: 'START', label: 'Start Event', icon: <Play className="w-4 h-4" />, color: 'bg-emerald-500' },
    { type: 'END', label: 'End Event', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-rose-500' },
    { type: 'USER_TASK', label: 'User Task (Role)', icon: <UserCheck className="w-4 h-4" />, color: 'bg-blue-500' },
    { type: 'AI_TASK', label: 'AI Copilot Task', icon: <Sparkles className="w-4 h-4" />, color: 'bg-purple-500' },
    { type: 'APPROVAL', label: 'Approval Step', icon: <ShieldCheck className="w-4 h-4" />, color: 'bg-amber-500' },
    { type: 'DECISION', label: 'Decision Rule', icon: <GitMerge className="w-4 h-4" />, color: 'bg-indigo-500' },
    { type: 'TIMER', label: 'Timer & Delay', icon: <Clock className="w-4 h-4" />, color: 'bg-slate-500' },
    { type: 'NOTIFICATION', label: 'Dispatch Notification', icon: <Bell className="w-4 h-4" />, color: 'bg-teal-500' },
    { type: 'INTEGRATION_API', label: 'API / PACS Integration', icon: <Code className="w-4 h-4" />, color: 'bg-cyan-500' },
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
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100 dark:bg-slate-950">
        
        {/* TOP WORKFLOW TOOLBAR */}
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <select
                  value={activeWorkflow.id}
                  onChange={(e) => {
                    const found = WORKFLOW_TEMPLATES.find(t => t.id === e.target.value);
                    if (found) {
                      setActiveWorkflow(found);
                      setSelectedNode(found.nodes[0] || null);
                    }
                  }}
                  className="bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  {WORKFLOW_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (v{t.version}.0)</option>
                  ))}
                </select>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold rounded-md uppercase">
                  {activeWorkflow.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md">{activeWorkflow.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Canvas Zoom Controls */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
              <button 
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-slate-700 dark:text-slate-200">{zoomLevel}%</span>
              <button 
                onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Validation CTA */}
            <button 
              onClick={handleValidate}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Validate
            </button>

            {/* Simulation CTA */}
            <button 
              onClick={handleStartSimulation}
              className="px-3 py-2 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-purple-100 transition-all"
            >
              <Play className="w-4 h-4" /> Simulate Execution
            </button>

            {/* Save CTA */}
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Save className="w-4 h-4" /> Save Workflow
            </button>
          </div>
        </div>

        {/* WORKFLOW BUILDER THREE-PANEL CANVAS */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* PANEL 1: LEFT PALETTE (NODE LIBRARY) */}
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

            {/* MiniMap Preview Box */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Canvas MiniMap</h4>
              <div className="w-full h-24 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl relative p-2 overflow-hidden">
                <div className="w-12 h-8 border border-indigo-500 bg-indigo-500/10 rounded absolute top-3 left-4"></div>
                <div className="w-16 h-8 border border-purple-500 bg-purple-500/10 rounded absolute top-3 left-18"></div>
              </div>
            </div>
          </div>

          {/* PANEL 2: CENTER DRAG & DROP CANVAS */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-950 relative overflow-auto p-8 flex items-center justify-center">
            
            {/* Simulation Overlay Banner */}
            {isSimulating && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-purple-900 text-white px-6 py-2 rounded-2xl shadow-xl flex items-center gap-4 z-50 animate-bounce">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-purple-300" /> Simulating Step {simStepIndex + 1} of {activeWorkflow.nodes.length}
                </div>
                <button 
                  onClick={handleNextSimStep}
                  className="px-3 py-1 bg-purple-700 hover:bg-purple-600 rounded-lg text-xs font-bold text-white transition-all"
                >
                  Next Step ➔
                </button>
                <button 
                  onClick={() => setIsSimulating(false)}
                  className="p-1 hover:bg-purple-800 rounded text-purple-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Canvas Nodes Container */}
            <div 
              className="min-w-[1200px] min-h-[600px] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] rounded-3xl border border-slate-200 dark:border-slate-800 p-12 relative flex flex-wrap gap-8 items-center justify-start transition-all"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
            >
              {activeWorkflow.nodes.map((node, idx) => {
                const isSelected = selectedNode?.id === node.id;
                const isSimActive = isSimulating && simStepIndex === idx;

                return (
                  <React.Fragment key={node.id}>
                    {/* Visual Node */}
                    <div
                      onClick={() => setSelectedNode(node)}
                      className={`w-64 p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-sm relative group ${
                        isSimActive
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 ring-4 ring-purple-300 shadow-lg scale-105'
                          : isSelected
                          ? 'border-indigo-600 bg-white dark:bg-slate-900 ring-2 ring-indigo-200 dark:ring-indigo-900 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                          {node.type}
                        </span>
                        {node.assignedRole && (
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            👤 {node.assignedRole}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {node.label}
                      </h4>

                      {node.slaMinutes && (
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-semibold border-t border-slate-100 dark:border-slate-800/80 pt-1.5">
                          <span>SLA Target</span>
                          <span className="text-amber-600 font-bold">⏱️ {node.slaMinutes} mins</span>
                        </div>
                      )}

                      {/* Delete Node CTA on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNode(node.id);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Transition Connector Arrow */}
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

          {/* PANEL 3: RIGHT NODE INSPECTOR & CONFIGURATOR */}
          <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-5 space-y-5 overflow-y-auto shrink-0">
            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Node Configuration
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">{selectedNode.id}</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Node Title</label>
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={(e) => handleUpdateNode({ label: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Assigned Role</label>
                  <select
                    value={selectedNode.assignedRole || ''}
                    onChange={(e) => handleUpdateNode({ assignedRole: e.target.value as AssigneeRole })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="">None (System / Event)</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="NURSE">Nurse</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="BILLING">Billing Executive</option>
                    <option value="PHARMACY">Pharmacist</option>
                    <option value="LABORATORY">Lab Technician</option>
                    <option value="RADIOLOGY">Radiologist</option>
                    <option value="AI_AGENT">AI Copilot Agent</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target SLA (Minutes)</label>
                  <input
                    type="number"
                    value={selectedNode.slaMinutes || 15}
                    onChange={(e) => handleUpdateNode({ slaMinutes: parseInt(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                {selectedNode.type === 'AI_TASK' && (
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">AI Copilot Task Mode</label>
                    <select
                      value={selectedNode.aiTaskType || 'DRUG_INTERACTION'}
                      onChange={(e) => handleUpdateNode({ aiTaskType: e.target.value as any })}
                      className="w-full p-2.5 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 rounded-xl text-purple-900 dark:text-purple-100 font-semibold"
                    >
                      <option value="SOAP_NOTE">Generate SOAP Note Draft</option>
                      <option value="ICD10_SUGGESTION">Suggest ICD-10 Diagnosis Codes</option>
                      <option value="RISK_PREDICTION">Predict Clinical Sepsis Risk</option>
                      <option value="DRUG_INTERACTION">Detect Drug Interaction Alert</option>
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Select a node on the canvas to configure parameters, SLAs, and AI prompts.
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
