// @careconnect/types — Shared Domain Type Definitions (DTOs)

// ─── Patient ─────────────────────────────────────────────────────────────────
export interface PatientDTO {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  displayName: string;
  dob: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | 'Unknown';
  bloodGroup?: string;
  phone?: string;
  email?: string;
  address?: AddressDTO;
  emergencyContact?: EmergencyContactDTO;
  allergies?: AllergyDTO[];
  insurances?: InsuranceDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface AddressDTO {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface EmergencyContactDTO {
  name: string;
  relationship: string;
  phone: string;
}

export interface AllergyDTO {
  id: string;
  allergen: string;
  type: 'Drug' | 'Food' | 'Environmental' | 'Other';
  reaction?: string;
  severity: 'mild' | 'moderate' | 'severe';
  recordedAt: string;
}

export interface InsuranceDTO {
  id: string;
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  validity: string;
  type: 'Primary' | 'Secondary';
}

// ─── Encounter ───────────────────────────────────────────────────────────────
export interface EncounterDTO {
  id: string;
  patientId: string;
  type: 'Outpatient' | 'Inpatient' | 'Emergency' | 'Virtual' | 'Procedure';
  status: 'planned' | 'arrived' | 'in-progress' | 'finished' | 'cancelled';
  startedAt: string;
  endedAt?: string;
  attendingPhysicianId: string;
  departmentId: string;
  chiefComplaint?: string;
  diagnoses?: DiagnosisDTO[];
}

export interface DiagnosisDTO {
  id: string;
  icdCode: string;
  description: string;
  type: 'primary' | 'secondary' | 'comorbidity';
  confirmedAt?: string;
}

// ─── Doctor / User ───────────────────────────────────────────────────────────
export interface DoctorDTO {
  id: string;
  name: string;
  displayName: string;
  specialty: string;
  subSpecialty?: string;
  registrationNumber: string;
  qualifications: string[];
  departmentId?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  isAvailable: boolean;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  departmentId?: string;
  avatarUrl?: string;
  lastLoginAt?: string;
}

export type UserRole = 
  | 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PHARMACIST' 
  | 'LAB_TECHNICIAN' | 'RADIOLOGIST' | 'BILLING_STAFF' | 'RECEPTIONIST'
  | 'WARD_COORDINATOR' | 'ICU_STAFF' | 'OT_STAFF' | 'EMS_STAFF' | 'PATIENT';

// ─── Lab ─────────────────────────────────────────────────────────────────────
export interface LabOrderDTO {
  id: string;
  patientId: string;
  encounterId: string;
  orderedById: string;
  panels: LabPanelDTO[];
  status: 'pending' | 'specimen-collected' | 'in-process' | 'partial' | 'final';
  priority: 'routine' | 'urgent' | 'stat';
  orderedAt: string;
  reportedAt?: string;
}

export interface LabPanelDTO {
  id: string;
  name: string;
  loincCode?: string;
  results: LabResultDTO[];
  status: 'pending' | 'final';
}

export interface LabResultDTO {
  test: string;
  loincCode?: string;
  value: string | number;
  unit: string;
  referenceRange?: string;
  status: 'normal' | 'low' | 'high' | 'critical-low' | 'critical-high';
}

// ─── Medication ───────────────────────────────────────────────────────────────
export interface MedicationOrderDTO {
  id: string;
  patientId: string;
  encounterId: string;
  drugName: string;
  genericName?: string;
  rxnormCode?: string;
  dose: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'discontinued' | 'on-hold';
  prescribedById: string;
  isHighAlert: boolean;
}

// ─── Bed & Ward ───────────────────────────────────────────────────────────────
export interface WardDTO {
  id: string;
  name: string;
  type: string;
  floor: string;
  totalBeds: number;
  availableBeds: number;
  occupancyPercent: number;
}

export interface BedDTO {
  id: string;
  bedNumber: string;
  wardId: string;
  roomNumber?: string;
  type: 'General' | 'ICU' | 'Semi-private' | 'Private' | 'HDU';
  status: 'available' | 'occupied' | 'cleaning' | 'reserved' | 'maintenance';
  currentPatientId?: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  timestamp: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface NotificationDTO {
  id: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
}
