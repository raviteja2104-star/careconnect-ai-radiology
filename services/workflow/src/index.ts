// @careconnect/workflow — Clinical Workflow & State Machine Engine

// ─── Core Types ──────────────────────────────────────────────────────────────
export type WorkflowStatus =
  | 'draft' | 'active' | 'paused' | 'completed' | 'cancelled' | 'failed';

export type TaskStatus =
  | 'pending' | 'in-progress' | 'completed' | 'skipped' | 'failed' | 'escalated';

export type TriggerType =
  | 'manual' | 'event' | 'schedule' | 'condition' | 'timeout';

// ─── State Machine ────────────────────────────────────────────────────────────
export interface State<TContext = unknown> {
  id: string;
  label: string;
  description?: string;
  isInitial?: boolean;
  isFinal?: boolean;
  onEnter?: (context: TContext) => void | Promise<void>;
  onExit?: (context: TContext) => void | Promise<void>;
  timeoutMs?: number;       // Auto-escalate if stuck in state beyond this
  escalateTo?: string;      // State to move to on timeout
}

export interface Transition<TContext = unknown> {
  from: string;
  to: string;
  trigger?: TriggerType;
  eventType?: string;        // For event-based transitions
  guard?: (context: TContext) => boolean;  // Conditional transition
  action?: (context: TContext) => void | Promise<void>;
  label?: string;
  requiresApproval?: boolean;
  approverRoles?: string[];
}

export interface StateMachineDefinition<TContext = unknown> {
  id: string;
  name: string;
  version: string;
  states: State<TContext>[];
  transitions: Transition<TContext>[];
  initialState: string;
}

// ─── Clinical Workflow Definitions ────────────────────────────────────────────

// Inpatient Admission Workflow
export const ADMISSION_WORKFLOW: StateMachineDefinition = {
  id: 'admission-workflow',
  name: 'Inpatient Admission',
  version: '1.0.0',
  initialState: 'registered',
  states: [
    { id: 'registered',      label: 'Patient Registered',       isInitial: true },
    { id: 'bed-requested',   label: 'Bed Request Submitted' },
    { id: 'bed-assigned',    label: 'Bed Assigned',             timeoutMs: 3600000, escalateTo: 'bed-escalated' },
    { id: 'bed-escalated',   label: 'Bed Escalated' },
    { id: 'admitted',        label: 'Patient Admitted' },
    { id: 'in-care',         label: 'Under Active Care' },
    { id: 'discharge-planned', label: 'Discharge Planned' },
    { id: 'discharge-approved', label: 'Discharge Approved',    timeoutMs: 7200000, escalateTo: 'discharge-delayed' },
    { id: 'discharge-delayed', label: 'Discharge Delayed' },
    { id: 'billing-clearance', label: 'Billing Clearance' },
    { id: 'discharged',      label: 'Patient Discharged',       isFinal: true },
    { id: 'transferred',     label: 'Patient Transferred',      isFinal: true },
    { id: 'expired',         label: 'Patient Expired',          isFinal: true },
  ],
  transitions: [
    { from: 'registered',         to: 'bed-requested',     trigger: 'manual',     label: 'Request Bed' },
    { from: 'bed-requested',      to: 'bed-assigned',      trigger: 'event',      eventType: 'BED_ASSIGNED' },
    { from: 'bed-assigned',       to: 'admitted',          trigger: 'event',      eventType: 'PATIENT_ADMITTED' },
    { from: 'admitted',           to: 'in-care',           trigger: 'manual',     label: 'Start Care' },
    { from: 'in-care',            to: 'discharge-planned', trigger: 'manual',     label: 'Plan Discharge', requiresApproval: true, approverRoles: ['DOCTOR'] },
    { from: 'discharge-planned',  to: 'discharge-approved', trigger: 'event',     eventType: 'DISCHARGE_APPROVED' },
    { from: 'discharge-approved', to: 'billing-clearance', trigger: 'event',     eventType: 'BILLING_INITIATED' },
    { from: 'billing-clearance',  to: 'discharged',        trigger: 'event',     eventType: 'BILLING_CLEARED' },
    { from: 'in-care',            to: 'transferred',       trigger: 'manual',     label: 'Transfer Patient' },
    { from: 'in-care',            to: 'expired',           trigger: 'event',      eventType: 'PATIENT_DECEASED' },
  ],
};

// Emergency Triage Workflow
export const ED_TRIAGE_WORKFLOW: StateMachineDefinition = {
  id: 'ed-triage-workflow',
  name: 'ED Triage',
  version: '1.0.0',
  initialState: 'arrived',
  states: [
    { id: 'arrived',       label: 'Patient Arrived',     isInitial: true },
    { id: 'triaged',       label: 'Triage Completed' },
    { id: 'waiting',       label: 'Waiting Room',        timeoutMs: 1800000, escalateTo: 'waiting-escalated' },
    { id: 'waiting-escalated', label: 'Wait Time Exceeded' },
    { id: 'in-resus',      label: 'Resuscitation Bay' },
    { id: 'in-treatment',  label: 'Under Treatment' },
    { id: 'observation',   label: 'Under Observation' },
    { id: 'admitted',      label: 'Admitted to Ward',    isFinal: true },
    { id: 'discharged',    label: 'Discharged from ED',  isFinal: true },
    { id: 'transferred',   label: 'Transferred Out',     isFinal: true },
    { id: 'absconded',     label: 'Patient Absconded',   isFinal: true },
  ],
  transitions: [
    { from: 'arrived',      to: 'triaged',        trigger: 'manual', label: 'Complete Triage' },
    { from: 'triaged',      to: 'in-resus',       trigger: 'condition', guard: (ctx: Record<string, unknown>) => (ctx['triageLevel'] as number) === 1, label: 'Resus Bay (P1)' },
    { from: 'triaged',      to: 'waiting',        trigger: 'condition', guard: (ctx: Record<string, unknown>) => (ctx['triageLevel'] as number) >= 2, label: 'Waiting Room' },
    { from: 'waiting',      to: 'in-treatment',   trigger: 'manual', label: 'Assign to Treatment Bay' },
    { from: 'in-resus',     to: 'in-treatment',   trigger: 'manual', label: 'Stabilized' },
    { from: 'in-treatment', to: 'observation',    trigger: 'manual', label: 'Move to Obs' },
    { from: 'in-treatment', to: 'admitted',       trigger: 'event',  eventType: 'PATIENT_ADMITTED' },
    { from: 'in-treatment', to: 'discharged',     trigger: 'manual', label: 'Discharge from ED' },
    { from: 'observation',  to: 'admitted',       trigger: 'event',  eventType: 'PATIENT_ADMITTED' },
    { from: 'observation',  to: 'discharged',     trigger: 'manual', label: 'Discharge from Obs' },
  ],
};

// Prescription → Dispensing Workflow
export const MEDICATION_WORKFLOW: StateMachineDefinition = {
  id: 'medication-workflow',
  name: 'Medication Order & Dispensing',
  version: '1.0.0',
  initialState: 'ordered',
  states: [
    { id: 'ordered',      label: 'Order Written',       isInitial: true },
    { id: 'verified',     label: 'Pharmacist Verified' },
    { id: 'on-hold',      label: 'On Hold' },
    { id: 'dispensed',    label: 'Dispensed to Ward' },
    { id: 'administered', label: 'Administered',        isFinal: true },
    { id: 'missed',       label: 'Dose Missed',         isFinal: true },
    { id: 'discontinued', label: 'Discontinued',        isFinal: true },
  ],
  transitions: [
    { from: 'ordered',    to: 'verified',     trigger: 'event',  eventType: 'PRESCRIPTION_VERIFIED', requiresApproval: true, approverRoles: ['PHARMACIST'] },
    { from: 'ordered',    to: 'on-hold',      trigger: 'manual', label: 'Put On Hold' },
    { from: 'verified',   to: 'dispensed',    trigger: 'event',  eventType: 'MEDICATION_DISPENSED' },
    { from: 'dispensed',  to: 'administered', trigger: 'event',  eventType: 'MEDICATION_ADMINISTERED' },
    { from: 'dispensed',  to: 'missed',       trigger: 'timeout', label: 'Dose Window Expired' },
    { from: 'verified',   to: 'discontinued', trigger: 'manual', label: 'Discontinue Order' },
  ],
};

// ─── Runtime Engine ───────────────────────────────────────────────────────────
export interface WorkflowInstance<TContext = unknown> {
  instanceId: string;
  definitionId: string;
  currentState: string;
  status: WorkflowStatus;
  context: TContext;
  history: WorkflowHistoryEntry[];
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface WorkflowHistoryEntry {
  fromState: string;
  toState: string;
  trigger: TriggerType;
  actorId?: string;
  timestamp: Date;
  notes?: string;
}

export interface WorkflowTask {
  taskId: string;
  instanceId: string;
  type: string;
  status: TaskStatus;
  assignedTo?: string;
  assignedRole?: string;
  dueAt?: Date;
  completedAt?: Date;
  slaBreachedAt?: Date;
  escalatedAt?: Date;
  notes?: string;
}

// Simple in-memory workflow engine
export class WorkflowEngine<TContext extends Record<string, unknown> = Record<string, unknown>> {
  private definition: StateMachineDefinition<TContext>;

  constructor(definition: StateMachineDefinition<TContext>) {
    this.definition = definition;
  }

  createInstance(context: TContext): WorkflowInstance<TContext> {
    const initial = this.definition.states.find(s => s.isInitial);
    if (!initial) throw new Error(`No initial state in definition ${this.definition.id}`);
    return {
      instanceId: `wf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      definitionId: this.definition.id,
      currentState: initial.id,
      status: 'active',
      context,
      history: [],
      startedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  canTransition(instance: WorkflowInstance<TContext>, targetState: string): boolean {
    const transition = this.definition.transitions.find(
      t => t.from === instance.currentState && t.to === targetState
    );
    if (!transition) return false;
    if (transition.guard && !transition.guard(instance.context)) return false;
    return true;
  }

  async transition(
    instance: WorkflowInstance<TContext>,
    targetState: string,
    actorId?: string,
    notes?: string
  ): Promise<WorkflowInstance<TContext>> {
    if (!this.canTransition(instance, targetState)) {
      throw new Error(`Cannot transition from '${instance.currentState}' to '${targetState}'`);
    }

    const transition = this.definition.transitions.find(
      t => t.from === instance.currentState && t.to === targetState
    )!;

    const fromState = this.definition.states.find(s => s.id === instance.currentState);
    const toState = this.definition.states.find(s => s.id === targetState);

    if (fromState?.onExit) await fromState.onExit(instance.context);
    if (transition.action) await transition.action(instance.context);
    if (toState?.onEnter) await toState.onEnter(instance.context);

    const updated: WorkflowInstance<TContext> = {
      ...instance,
      currentState: targetState,
      status: toState?.isFinal ? 'completed' : 'active',
      updatedAt: new Date(),
      completedAt: toState?.isFinal ? new Date() : undefined,
      history: [
        ...instance.history,
        {
          fromState: instance.currentState,
          toState: targetState,
          trigger: transition.trigger ?? 'manual',
          actorId,
          timestamp: new Date(),
          notes,
        },
      ],
    };

    return updated;
  }

  getAvailableTransitions(instance: WorkflowInstance<TContext>): Transition<TContext>[] {
    return this.definition.transitions.filter(
      t => t.from === instance.currentState &&
        (!t.guard || t.guard(instance.context))
    );
  }
}
