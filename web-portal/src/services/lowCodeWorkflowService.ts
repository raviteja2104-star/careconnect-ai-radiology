/**
 * CareConnect Low-Code / No-Code Executable Workflow Orchestration Engine
 * Powers state machines, role routing, AI nodes, SLAs, event bus, & audit trails across all hospital modules.
 */

export type NodeType = 
  | 'START' 
  | 'END' 
  | 'USER_TASK' 
  | 'SYSTEM_TASK' 
  | 'APPROVAL' 
  | 'DECISION' 
  | 'TIMER' 
  | 'NOTIFICATION' 
  | 'AI_TASK' 
  | 'INTEGRATION_API' 
  | 'EVENT_PUBLISHER' 
  | 'EVENT_SUBSCRIBER' 
  | 'PARALLEL_GATEWAY' 
  | 'EXCLUSIVE_GATEWAY' 
  | 'SLA_MONITOR' 
  | 'DIGITAL_SIGNATURE' 
  | 'FORM_INPUT';

export type AssigneeRole = 
  | 'DOCTOR' 
  | 'NURSE' 
  | 'RECEPTIONIST' 
  | 'BILLING' 
  | 'PHARMACY' 
  | 'LABORATORY' 
  | 'RADIOLOGY' 
  | 'HOUSEKEEPING' 
  | 'ADMIN' 
  | 'PATIENT' 
  | 'AI_AGENT';

export type AssignmentStrategy = 
  | 'ROUND_ROBIN' 
  | 'LEAST_LOADED' 
  | 'SKILL_BASED' 
  | 'DEPARTMENT_BASED' 
  | 'HOSPITAL_BASED';

export type WorkflowLifecycle = 
  | 'DRAFT' 
  | 'PUBLISHED' 
  | 'ACTIVE' 
  | 'IN_PROGRESS' 
  | 'WAITING' 
  | 'APPROVAL' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'REJECTED' 
  | 'FAILED' 
  | 'EXPIRED' 
  | 'ESCALATED';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  position: { x: number; y: number };
  assignedRole?: AssigneeRole;
  assignmentStrategy?: AssignmentStrategy;
  slaMinutes?: number;
  aiTaskType?: 'SOAP_NOTE' | 'ICD10_SUGGESTION' | 'RISK_PREDICTION' | 'LAB_RECOMMENDATION' | 'RX_TRANSLATION' | 'DRUG_INTERACTION';
  aiPrompt?: string;
  conditionExpression?: string;
  apiEndpoint?: string;
  eventName?: string;
  formFields?: string[];
}

export interface WorkflowTransition {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  conditionLabel?: string;
}

export interface WorkflowDefinition {
  id: string;
  key: string;
  name: string;
  category: 'OPD' | 'IPD' | 'EMERGENCY' | 'ICU' | 'SURGERY' | 'LAB' | 'RADIOLOGY' | 'PHARMACY' | 'BILLING' | 'DISCHARGE';
  description: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  nodes: WorkflowNode[];
  transitions: WorkflowTransition[];
  updatedAt: string;
}

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  definitionName: string;
  patientId: string;
  patientName: string;
  status: WorkflowLifecycle;
  currentNodeId: string;
  assignedRole?: AssigneeRole;
  assignedUser?: string;
  startedAt: string;
  updatedAt: string;
  slaDueAt: string;
  variables: Record<string, any>;
  auditTrail: {
    id: string;
    timestamp: string;
    nodeId: string;
    nodeLabel: string;
    action: string;
    performedBy: string;
    digitalSignature: string;
  }[];
}

// Built-in Workflow Templates
export const WORKFLOW_TEMPLATES: WorkflowDefinition[] = [
  {
    id: 'tmpl-opd-01',
    key: 'opd-consultation',
    name: 'OPD Consultation & EMR Workflow',
    category: 'OPD',
    description: 'Standard outpatient workflow from registration token to multi-language e-prescription and billing checkout.',
    version: 1,
    status: 'PUBLISHED',
    updatedAt: '2026-07-25',
    nodes: [
      { id: 'n1', type: 'START', label: 'Patient Arrival & Token Generated', position: { x: 50, y: 150 } },
      { id: 'n2', type: 'USER_TASK', label: 'Reception Check-in & Insurance Verification', assignedRole: 'RECEPTIONIST', slaMinutes: 10, position: { x: 250, y: 150 } },
      { id: 'n3', type: 'USER_TASK', label: 'Nurse Station Vitals Entry', assignedRole: 'NURSE', slaMinutes: 15, position: { x: 450, y: 150 } },
      { id: 'n4', type: 'USER_TASK', label: 'Doctor Specialty Consultation', assignedRole: 'DOCTOR', slaMinutes: 30, position: { x: 650, y: 150 } },
      { id: 'n5', type: 'AI_TASK', label: 'AI Scribe & Drug Interaction Check', assignedRole: 'AI_AGENT', aiTaskType: 'DRUG_INTERACTION', position: { x: 850, y: 150 } },
      { id: 'n6', type: 'EXCLUSIVE_GATEWAY', label: 'Investigations Ordered?', position: { x: 1050, y: 150 } },
      { id: 'n7', type: 'USER_TASK', label: 'Pharmacy Medicine Dispense', assignedRole: 'PHARMACY', slaMinutes: 20, position: { x: 1250, y: 80 } },
      { id: 'n8', type: 'USER_TASK', label: 'Billing Counter Settlement', assignedRole: 'BILLING', slaMinutes: 15, position: { x: 1250, y: 220 } },
      { id: 'n9', type: 'END', label: 'Consultation Completed', position: { x: 1450, y: 150 } }
    ],
    transitions: [
      { id: 't1', sourceNodeId: 'n1', targetNodeId: 'n2' },
      { id: 't2', sourceNodeId: 'n2', targetNodeId: 'n3' },
      { id: 't3', sourceNodeId: 'n3', targetNodeId: 'n4' },
      { id: 't4', sourceNodeId: 'n4', targetNodeId: 'n5' },
      { id: 't5', sourceNodeId: 'n5', targetNodeId: 'n6' },
      { id: 't6', sourceNodeId: 'n6', targetNodeId: 'n7', conditionLabel: 'No Labs / Prescribed Only' },
      { id: 't7', sourceNodeId: 'n6', targetNodeId: 'n8', conditionLabel: 'Labs Required' },
      { id: 't8', sourceNodeId: 'n7', targetNodeId: 'n9' },
      { id: 't9', sourceNodeId: 'n8', targetNodeId: 'n9' }
    ]
  },
  {
    id: 'tmpl-er-02',
    key: 'emergency-trauma',
    name: 'Emergency Room (ER) & Sepsis Protocol',
    category: 'EMERGENCY',
    description: 'High-acuity triage (ESI Level 1-5), Sepsis 1-hour bundle execution, and rapid ICU bed allocation.',
    version: 1,
    status: 'PUBLISHED',
    updatedAt: '2026-07-25',
    nodes: [
      { id: 'n10', type: 'START', label: 'Ambulance / Walk-in Trauma Triage', position: { x: 50, y: 150 } },
      { id: 'n11', type: 'DECISION', label: 'Evaluate ESI Triage Level (1-5)', conditionExpression: 'patient.esiLevel <= 2', position: { x: 250, y: 150 } },
      { id: 'n12', type: 'SLA_MONITOR', label: 'Sepsis 1-Hour Bundle Timer', slaMinutes: 60, position: { x: 450, y: 80 } },
      { id: 'n13', type: 'USER_TASK', label: 'Resuscitation & STAT Blood Gas', assignedRole: 'DOCTOR', slaMinutes: 15, position: { x: 650, y: 150 } },
      { id: 'n14', type: 'END', label: 'Admitted to ICU / OT', position: { x: 850, y: 150 } }
    ],
    transitions: [
      { id: 't10', sourceNodeId: 'n10', targetNodeId: 'n11' },
      { id: 't11', sourceNodeId: 'n11', targetNodeId: 'n12', conditionLabel: 'Emergent (ESI 1-2)' },
      { id: 't12', sourceNodeId: 'n12', targetNodeId: 'n13' },
      { id: 't13', sourceNodeId: 'n13', targetNodeId: 'n14' }
    ]
  }
];

class LowCodeWorkflowService {
  private definitions: WorkflowDefinition[] = [...WORKFLOW_TEMPLATES];
  private instances: WorkflowInstance[] = [
    {
      id: 'WFI-88210',
      definitionId: 'tmpl-opd-01',
      definitionName: 'OPD Consultation & EMR Workflow',
      patientId: 'PT-0001234',
      patientName: 'Rohit Sharma',
      status: 'IN_PROGRESS',
      currentNodeId: 'n4',
      assignedRole: 'DOCTOR',
      assignedUser: 'Dr. Raj Sharma',
      startedAt: new Date(Date.now() - 20 * 60000).toISOString(),
      updatedAt: new Date().toISOString(),
      slaDueAt: new Date(Date.now() + 10 * 60000).toISOString(),
      variables: { esiLevel: 3, age: 32, specialty: 'Cardiology' },
      auditTrail: [
        {
          id: 'aud-w1',
          timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
          nodeId: 'n1',
          nodeLabel: 'Patient Arrival & Token Generated',
          action: 'STARTED',
          performedBy: 'Self Kiosk',
          digitalSignature: 'SIG-SHA256-INIT9981'
        },
        {
          id: 'aud-w2',
          timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
          nodeId: 'n3',
          nodeLabel: 'Nurse Station Vitals Entry',
          action: 'COMPLETED',
          performedBy: 'Nurse Desk',
          digitalSignature: 'SIG-SHA256-NURSE441'
        }
      ]
    }
  ];

  public getTemplates(): WorkflowDefinition[] {
    return this.definitions;
  }

  public getDefinitions(): WorkflowDefinition[] {
    return this.definitions;
  }

  public getDefinitionById(id: string): WorkflowDefinition | undefined {
    return this.definitions.find(d => d.id === id);
  }

  public saveDefinition(def: WorkflowDefinition): WorkflowDefinition {
    const existingIndex = this.definitions.findIndex(d => d.id === def.id);
    const updated = { ...def, updatedAt: new Date().toISOString().split('T')[0] };
    if (existingIndex !== -1) {
      this.definitions[existingIndex] = updated;
    } else {
      this.definitions.push(updated);
    }
    return updated;
  }

  public publishDefinition(id: string): WorkflowDefinition | null {
    const def = this.getDefinitionById(id);
    if (!def) return null;
    def.status = 'PUBLISHED';
    def.version += 1;
    return def;
  }

  public validateWorkflow(def: WorkflowDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const hasStart = def.nodes.some(n => n.type === 'START');
    const hasEnd = def.nodes.some(n => n.type === 'END');

    if (!hasStart) errors.push('Workflow must contain a START node.');
    if (!hasEnd) errors.push('Workflow must contain an END node.');
    if (def.nodes.length < 3) errors.push('Workflow should have at least 3 nodes.');

    return { valid: errors.length === 0, errors };
  }

  public getInstances(): WorkflowInstance[] {
    return this.instances;
  }

  public startWorkflow(definitionId: string, patientId: string, patientName: string): WorkflowInstance | null {
    const def = this.getDefinitionById(definitionId);
    if (!def) return null;

    const startNode = def.nodes.find(n => n.type === 'START');
    const nextTransition = def.transitions.find(t => t.sourceNodeId === startNode?.id);
    const nextNode = def.nodes.find(n => n.id === nextTransition?.targetNodeId);

    const instance: WorkflowInstance = {
      id: `WFI-${Math.floor(10000 + Math.random() * 90000)}`,
      definitionId: def.id,
      definitionName: def.name,
      patientId,
      patientName,
      status: 'IN_PROGRESS',
      currentNodeId: nextNode ? nextNode.id : (startNode?.id || 'n1'),
      assignedRole: nextNode?.assignedRole || 'RECEPTIONIST',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slaDueAt: new Date(Date.now() + (nextNode?.slaMinutes || 15) * 60000).toISOString(),
      variables: {},
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          nodeId: startNode?.id || 'n1',
          nodeLabel: startNode?.label || 'Workflow Triggered',
          action: 'INITIATED',
          performedBy: 'System Orchestrator',
          digitalSignature: `SIG-SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        }
      ]
    };

    this.instances.push(instance);
    return instance;
  }

  public getAnalyticsSummary() {
    return {
      activeWorkflows: this.instances.filter(i => i.status === 'IN_PROGRESS').length,
      slaCompliancePct: 94.8,
      avgCompletionTimeMins: 22.4,
      pendingTasksByRole: {
        DOCTOR: 14,
        NURSE: 8,
        LABORATORY: 5,
        PHARMACY: 9,
        BILLING: 3
      },
      escalationCount: 2
    };
  }
}

export const lowCodeWorkflowService = new LowCodeWorkflowService();
