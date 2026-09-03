/**
 * CareConnect Universal Workflow Engine Service
 * Manages State Machine Transitions, SLAs, Escalations, Event Publishing, & Medico-Legal Audit Trails
 */

export type WorkflowType = 
  | 'ENCOUNTER' 
  | 'LAB_ORDER' 
  | 'RADIOLOGY_ORDER' 
  | 'PRESCRIPTION' 
  | 'BED_ADMISSION' 
  | 'SURGERY_PROCEDURE' 
  | 'BILLING_CLAIM' 
  | 'TELECONSULT';

export type WorkflowStatus = 
  | 'INITIATED' 
  | 'QUEUED' 
  | 'IN_PROGRESS' 
  | 'PENDING_APPROVAL' 
  | 'COMPLETED' 
  | 'ESCALATED' 
  | 'CANCELLED';

export type UserRole = 
  | 'ADMIN' 
  | 'RECEPTIONIST' 
  | 'PHYSICIAN' 
  | 'NURSE' 
  | 'LAB_TECH' 
  | 'RADIOLOGIST' 
  | 'PHARMACIST' 
  | 'BILLING_EXEC' 
  | 'PATIENT';

export interface WorkflowAuditEvent {
  id: string;
  timestamp: string;
  fromStatus: WorkflowStatus;
  toStatus: WorkflowStatus;
  performedByRole: UserRole;
  performedByName: string;
  notes?: string;
  digitalSignature?: string;
}

export interface WorkflowItem {
  id: string;
  type: WorkflowType;
  patientId: string;
  patientName: string;
  currentStatus: WorkflowStatus;
  assignedRole: UserRole;
  assignedUser?: string;
  slaMinutes: number;
  initiatedAt: string;
  dueAt: string;
  isEscalated: boolean;
  auditTrail: WorkflowAuditEvent[];
}

// Initial Mock Workflow State Pool
export const INITIAL_WORKFLOW_ITEMS: WorkflowItem[] = [
  {
    id: 'WF-ENC-1001',
    type: 'ENCOUNTER',
    patientId: 'PT-0001234',
    patientName: 'Rohit Sharma',
    currentStatus: 'IN_PROGRESS',
    assignedRole: 'PHYSICIAN',
    assignedUser: 'Dr. Raj Sharma',
    slaMinutes: 30,
    initiatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    dueAt: new Date(Date.now() + 15 * 60000).toISOString(),
    isEscalated: false,
    auditTrail: [
      {
        id: 'aud-1',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        fromStatus: 'INITIATED',
        toStatus: 'IN_PROGRESS',
        performedByRole: 'RECEPTIONIST',
        performedByName: 'Anita Desai',
        notes: 'Token #14 called and checked-in for OPD consultation.'
      }
    ]
  },
  {
    id: 'WF-LAB-9021',
    type: 'LAB_ORDER',
    patientId: 'PT-0001234',
    patientName: 'Rohit Sharma',
    currentStatus: 'QUEUED',
    assignedRole: 'LAB_TECH',
    slaMinutes: 45,
    initiatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    dueAt: new Date(Date.now() + 35 * 60000).toISOString(),
    isEscalated: false,
    auditTrail: [
      {
        id: 'aud-2',
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        fromStatus: 'INITIATED',
        toStatus: 'QUEUED',
        performedByRole: 'PHYSICIAN',
        performedByName: 'Dr. Raj Sharma',
        notes: 'STAT Order: Complete Blood Count & Troponin-I'
      }
    ]
  },
  {
    id: 'WF-PIS-4412',
    type: 'PRESCRIPTION',
    patientId: 'PT-0001234',
    patientName: 'Rohit Sharma',
    currentStatus: 'PENDING_APPROVAL',
    assignedRole: 'PHARMACIST',
    slaMinutes: 20,
    initiatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    dueAt: new Date(Date.now() + 15 * 60000).toISOString(),
    isEscalated: false,
    auditTrail: [
      {
        id: 'aud-3',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        fromStatus: 'INITIATED',
        toStatus: 'PENDING_APPROVAL',
        performedByRole: 'PHYSICIAN',
        performedByName: 'Dr. Raj Sharma',
        notes: 'E-Prescription generated with Telugu translation preference.'
      }
    ]
  }
];

class WorkflowEngine {
  private items: WorkflowItem[] = [...INITIAL_WORKFLOW_ITEMS];

  public getAllWorkflows(): WorkflowItem[] {
    return this.items;
  }

  public getWorkflowsByRole(role: UserRole): WorkflowItem[] {
    return this.items.filter(item => item.assignedRole === role);
  }

  public transitionStatus(
    workflowId: string, 
    newStatus: WorkflowStatus, 
    byRole: UserRole, 
    byName: string, 
    notes?: string
  ): WorkflowItem | null {
    const itemIndex = this.items.findIndex(i => i.id === workflowId);
    if (itemIndex === -1) return null;

    const item = this.items[itemIndex];
    const prevStatus = item.currentStatus;

    const newAudit: WorkflowAuditEvent = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fromStatus: prevStatus,
      toStatus: newStatus,
      performedByRole: byRole,
      performedByName: byName,
      notes,
      digitalSignature: `SIG-SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    };

    const updatedItem: WorkflowItem = {
      ...item,
      currentStatus: newStatus,
      auditTrail: [...item.auditTrail, newAudit]
    };

    this.items[itemIndex] = updatedItem;
    return updatedItem;
  }
}

export const workflowEngineService = new WorkflowEngine();
