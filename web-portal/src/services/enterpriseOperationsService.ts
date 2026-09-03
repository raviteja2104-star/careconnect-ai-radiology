/**
 * CareConnect Enterprise Delivery, Operations & Customer Success Platform Service (Phase 18)
 * Internal OS for implementation teams, customer success, hospital onboarding, device installation,
 * LMS training, UAT sign-off, support ticketing, & canary release management.
 */

export interface HospitalCustomerProject {
  id: string;
  hospitalName: string;
  stage: 'LEAD' | 'CONTRACT' | 'IMPLEMENTATION' | 'DATA_MIGRATION' | 'TRAINING' | 'UAT' | 'GO_LIVE' | 'HYPERCARE' | 'PRODUCTION';
  implementationPct: number;
  healthScorePct: number;
  targetGoLiveDate: string;
  assignedProjectManager: string;
  raidRiskCount: number;
}

export interface DeviceInstallationRecord {
  id: string;
  deviceName: string;
  category: 'PACS' | 'LIS_ANALYZER' | 'BARCODE_SCANNER' | 'BIOMETRIC' | 'ICU_MONITOR' | 'PRINTER';
  department: string;
  status: 'PENDING' | 'INSTALLED' | 'TESTED' | 'CERTIFIED';
  certifiedBy: string;
}

export interface SupportTicketRecord {
  id: string;
  hospitalName: string;
  title: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  slaExpiresInMins: number;
  assignedEngineer: string;
  createdAt: string;
}

export interface LMSTrainingCourse {
  id: string;
  role: 'DOCTOR' | 'NURSE' | 'RECEPTION' | 'BILLER' | 'PHARMACIST' | 'ADMINISTRATOR';
  courseName: string;
  completionPct: number;
  certifiedUsersCount: number;
  totalEnrolledCount: number;
}

export interface ReleaseEnvironmentStatus {
  environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION_CANARY' | 'PRODUCTION_MAIN';
  version: string;
  deployedAt: string;
  status: 'HEALTHY' | 'ROLLBACK_READY';
  activeTrafficPct: number;
}

export const INITIAL_HOSPITAL_PROJECTS: HospitalCustomerProject[] = [
  { id: 'proj-101', hospitalName: 'Apollo Super Specialty Hospital Main', stage: 'HYPERCARE', implementationPct: 98, healthScorePct: 96, targetGoLiveDate: '2026-07-20', assignedProjectManager: 'Vikram Mehta', raidRiskCount: 1 },
  { id: 'proj-102', hospitalName: 'Fortis Healthcare Jubilee Hills', stage: 'DATA_MIGRATION', implementationPct: 65, healthScorePct: 92, targetGoLiveDate: '2026-08-15', assignedProjectManager: 'Ananya Roy', raidRiskCount: 2 },
  { id: 'proj-103', hospitalName: 'Manipal Academic Medical Centre', stage: 'IMPLEMENTATION', implementationPct: 40, healthScorePct: 88, targetGoLiveDate: '2026-09-01', assignedProjectManager: 'Karan Malhotra', raidRiskCount: 3 }
];

export const INITIAL_DEVICE_INSTALLATIONS: DeviceInstallationRecord[] = [
  { id: 'dev-inst-01', deviceName: 'Orthanc PACS DICOM Gateway 01', category: 'PACS', department: 'Radiology', status: 'CERTIFIED', certifiedBy: 'Eng. Ramesh' },
  { id: 'dev-inst-02', deviceName: 'Beckman Coulter LIS Analyzer 02', category: 'LIS_ANALYZER', department: 'Central Lab', status: 'TESTED', certifiedBy: 'Eng. Sneha' },
  { id: 'dev-inst-03', deviceName: 'Mindray ICU Monitor Bed 04-12', category: 'ICU_MONITOR', department: 'ICU Ward', status: 'INSTALLED', certifiedBy: 'Pending Certification' }
];

export const INITIAL_SUPPORT_TICKETS: SupportTicketRecord[] = [
  { id: 'tkt-901', hospitalName: 'Apollo Super Specialty Hospital Main', title: 'Barcode scanner latency on Pharmacy Counter 02', severity: 'MINOR', status: 'IN_PROGRESS', slaExpiresInMins: 45, assignedEngineer: 'Dev. Amit', createdAt: '30 mins ago' },
  { id: 'tkt-902', hospitalName: 'Fortis Healthcare Jubilee Hills', title: 'HL7 MLLP Lab result mapping verification request', severity: 'MAJOR', status: 'OPEN', slaExpiresInMins: 120, assignedEngineer: 'Dev. Priya', createdAt: '10 mins ago' }
];

export const INITIAL_LMS_COURSES: LMSTrainingCourse[] = [
  { id: 'lms-101', role: 'DOCTOR', courseName: 'Smart Specialty EMR & Ambient AI Scribe Workflow', completionPct: 94, certifiedUsersCount: 142, totalEnrolledCount: 150 },
  { id: 'lms-102', role: 'NURSE', courseName: 'Nurse Station Vitals & ICU Monitor Flow', completionPct: 98, certifiedUsersCount: 280, totalEnrolledCount: 285 },
  { id: 'lms-103', role: 'BILLER', courseName: 'RCM Billing Masters & ABDM Claims Claims Engine', completionPct: 90, certifiedUsersCount: 45, totalEnrolledCount: 50 }
];

export const INITIAL_RELEASES: ReleaseEnvironmentStatus[] = [
  { environment: 'PRODUCTION_MAIN', version: 'v1.1.0-hardened', deployedAt: '2026-07-25T18:00:00Z', status: 'HEALTHY', activeTrafficPct: 90 },
  { environment: 'PRODUCTION_CANARY', version: 'v1.1.1-canary', deployedAt: '2026-07-25T19:00:00Z', status: 'HEALTHY', activeTrafficPct: 10 },
  { environment: 'STAGING', version: 'v1.2.0-rc1', deployedAt: '2026-07-25T19:30:00Z', status: 'HEALTHY', activeTrafficPct: 0 }
];

class EnterpriseOperationsService {
  private projects: HospitalCustomerProject[] = [...INITIAL_HOSPITAL_PROJECTS];
  private devices: DeviceInstallationRecord[] = [...INITIAL_DEVICE_INSTALLATIONS];
  private tickets: SupportTicketRecord[] = [...INITIAL_SUPPORT_TICKETS];
  private lms: LMSTrainingCourse[] = [...INITIAL_LMS_COURSES];
  private releases: ReleaseEnvironmentStatus[] = [...INITIAL_RELEASES];

  public getProjects() { return this.projects; }
  public getDevices() { return this.devices; }
  public getTickets() { return this.tickets; }
  public getLMS() { return this.lms; }
  public getReleases() { return this.releases; }

  public createTicket(hospitalName: string, title: string, severity: any) {
    const ticket: SupportTicketRecord = {
      id: `tkt-${Date.now()}`,
      hospitalName: hospitalName || 'Apollo Main',
      title: title || 'Support Inquiry',
      severity: severity || 'MINOR',
      status: 'OPEN',
      slaExpiresInMins: 60,
      assignedEngineer: 'Unassigned',
      createdAt: 'Just now'
    };
    this.tickets.unshift(ticket);
    return ticket;
  }

  public getCustomerAdoptionMetrics() {
    return {
      activeMonthlyUsers: 24200,
      dailyActiveClinicians: 1840,
      aiScribeAdoptionPct: 88.4,
      emrPrescriptionVolume30d: 142000,
      customerSatisfactionCSAT: 4.85
    };
  }
}

export const enterpriseOperationsService = new EnterpriseOperationsService();
