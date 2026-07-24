// @careconnect/events — Typed Event Definitions
// All system events are defined here. No string literals in application code.

// ─── Patient Events ─────────────────────────────────────────────────────────
export const PATIENT_CREATED     = 'PATIENT_CREATED'     as const;
export const PATIENT_UPDATED     = 'PATIENT_UPDATED'     as const;
export const PATIENT_MERGED      = 'PATIENT_MERGED'      as const;
export const PATIENT_DECEASED    = 'PATIENT_DECEASED'    as const;

// ─── Encounter Events ────────────────────────────────────────────────────────
export const ENCOUNTER_STARTED   = 'ENCOUNTER_STARTED'   as const;
export const ENCOUNTER_CLOSED    = 'ENCOUNTER_CLOSED'    as const;
export const SOAP_SAVED          = 'SOAP_SAVED'          as const;

// ─── Admission & Flow Events ─────────────────────────────────────────────────
export const PATIENT_ADMITTED    = 'PATIENT_ADMITTED'    as const;
export const PATIENT_TRANSFERRED = 'PATIENT_TRANSFERRED' as const;
export const PATIENT_DISCHARGED  = 'PATIENT_DISCHARGED'  as const;
export const BED_ASSIGNED        = 'BED_ASSIGNED'        as const;
export const BED_RELEASED        = 'BED_RELEASED'        as const;

// ─── Clinical Events ─────────────────────────────────────────────────────────
export const VITALS_RECORDED     = 'VITALS_RECORDED'     as const;
export const MEDICATION_ORDERED  = 'MEDICATION_ORDERED'  as const;
export const MEDICATION_DISPENSED= 'MEDICATION_DISPENSED'as const;
export const MEDICATION_ADMINISTERED = 'MEDICATION_ADMINISTERED' as const;
export const ALLERGY_UPDATED     = 'ALLERGY_UPDATED'     as const;

// ─── Orders ──────────────────────────────────────────────────────────────────
export const LAB_ORDERED         = 'LAB_ORDERED'         as const;
export const LAB_SPECIMEN_COLLECTED = 'LAB_SPECIMEN_COLLECTED' as const;
export const LAB_RESULT_READY    = 'LAB_RESULT_READY'    as const;
export const LAB_CRITICAL_VALUE  = 'LAB_CRITICAL_VALUE'  as const;
export const IMAGING_ORDERED     = 'IMAGING_ORDERED'     as const;
export const IMAGING_COMPLETED   = 'IMAGING_COMPLETED'   as const;
export const RADIOLOGY_REPORTED  = 'RADIOLOGY_REPORTED'  as const;

// ─── Surgical Events ─────────────────────────────────────────────────────────
export const SURGERY_SCHEDULED   = 'SURGERY_SCHEDULED'   as const;
export const SURGERY_STARTED     = 'SURGERY_STARTED'     as const;
export const SURGERY_COMPLETED   = 'SURGERY_COMPLETED'   as const;
export const ANESTHESIA_STARTED  = 'ANESTHESIA_STARTED'  as const;

// ─── ICU Events ──────────────────────────────────────────────────────────────
export const ICU_ADMITTED        = 'ICU_ADMITTED'        as const;
export const ICU_DISCHARGED      = 'ICU_DISCHARGED'      as const;
export const VENTILATOR_STARTED  = 'VENTILATOR_STARTED'  as const;
export const VENTILATOR_STOPPED  = 'VENTILATOR_STOPPED'  as const;

// ─── Emergency Events ────────────────────────────────────────────────────────
export const CODE_BLUE           = 'CODE_BLUE'           as const;
export const CODE_RED            = 'CODE_RED'            as const;
export const TRIAGE_COMPLETED    = 'TRIAGE_COMPLETED'    as const;

// ─── EMS Events ──────────────────────────────────────────────────────────────
export const EMS_DISPATCHED      = 'EMS_DISPATCHED'      as const;
export const EMS_ON_SCENE        = 'EMS_ON_SCENE'        as const;
export const EMS_TRANSPORTING    = 'EMS_TRANSPORTING'    as const;
export const EMS_HANDOVER        = 'EMS_HANDOVER'        as const;

// ─── Billing Events ──────────────────────────────────────────────────────────
export const CLAIM_SUBMITTED     = 'CLAIM_SUBMITTED'     as const;
export const PAYMENT_RECEIVED    = 'PAYMENT_RECEIVED'    as const;
export const INVOICE_GENERATED   = 'INVOICE_GENERATED'   as const;

// ─── System Events ───────────────────────────────────────────────────────────
export const USER_LOGGED_IN      = 'USER_LOGGED_IN'      as const;
export const SESSION_EXPIRED     = 'SESSION_EXPIRED'     as const;

// ─── All Events Union Type ───────────────────────────────────────────────────
export type CareConnectEventType =
  | typeof PATIENT_CREATED | typeof PATIENT_UPDATED | typeof PATIENT_MERGED | typeof PATIENT_DECEASED
  | typeof ENCOUNTER_STARTED | typeof ENCOUNTER_CLOSED | typeof SOAP_SAVED
  | typeof PATIENT_ADMITTED | typeof PATIENT_TRANSFERRED | typeof PATIENT_DISCHARGED
  | typeof BED_ASSIGNED | typeof BED_RELEASED
  | typeof VITALS_RECORDED | typeof MEDICATION_ORDERED | typeof MEDICATION_DISPENSED
  | typeof MEDICATION_ADMINISTERED | typeof ALLERGY_UPDATED
  | typeof LAB_ORDERED | typeof LAB_SPECIMEN_COLLECTED | typeof LAB_RESULT_READY | typeof LAB_CRITICAL_VALUE
  | typeof IMAGING_ORDERED | typeof IMAGING_COMPLETED | typeof RADIOLOGY_REPORTED
  | typeof SURGERY_SCHEDULED | typeof SURGERY_STARTED | typeof SURGERY_COMPLETED | typeof ANESTHESIA_STARTED
  | typeof ICU_ADMITTED | typeof ICU_DISCHARGED | typeof VENTILATOR_STARTED | typeof VENTILATOR_STOPPED
  | typeof CODE_BLUE | typeof CODE_RED | typeof TRIAGE_COMPLETED
  | typeof EMS_DISPATCHED | typeof EMS_ON_SCENE | typeof EMS_TRANSPORTING | typeof EMS_HANDOVER
  | typeof CLAIM_SUBMITTED | typeof PAYMENT_RECEIVED | typeof INVOICE_GENERATED
  | typeof USER_LOGGED_IN | typeof SESSION_EXPIRED;

// ─── Typed Event Envelope ────────────────────────────────────────────────────
export interface CareConnectEvent<T = unknown> {
  type: CareConnectEventType;
  payload: T;
  metadata: {
    eventId: string;
    timestamp: string;
    source: string;
    correlationId?: string;
    patientId?: string;
    encounterId?: string;
    userId?: string;
    tenantId?: string;
  };
}

// ─── Typed Payload Helpers ───────────────────────────────────────────────────
export interface PatientCreatedPayload { patientId: string; mrn: string; name: string; }
export interface PatientAdmittedPayload { patientId: string; encounterId: string; wardId: string; bedId: string; admitType: string; }
export interface LabResultReadyPayload { orderId: string; patientId: string; panelName: string; isCritical: boolean; results: { test: string; value: string; status: string }[]; }
export interface EMSHandoverPayload { ambulanceId: string; crewId: string; patientId?: string; chiefComplaint: string; vitals: Record<string, number>; interventions: string[]; eta?: string; }
export interface CodeBluePayload { location: string; initiatedBy: string; patientId?: string; }
