/**
 * CareConnect Enterprise Programme Management, Product Engineering & Global Delivery Service (Phase 20)
 * Internal platform for Portfolio Management, SAFe Program Increment Planning, DevSecOps Telemetry,
 * Requirements Traceability Matrix, Technical Debt, Architecture Repository, & AI Engineering Copilots.
 */

export interface PortfolioInitiative {
  id: string;
  name: string;
  category: 'PRODUCT_HEALTH' | 'ENTERPRISE_AI' | 'INTEROPERABILITY' | 'COMMERCIAL_SAAS';
  budgetAllocatedUsd: number;
  completionPct: number;
  leadExecutive: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PLANNED';
}

export interface TraceabilityMatrixItem {
  reqId: string;
  featureName: string;
  epicId: string;
  storyId: string;
  commitHash: string;
  buildStatus: 'PASSED' | 'FAILED';
  testCaseId: string;
  productionDeployed: boolean;
}

export interface TechDebtItem {
  id: string;
  component: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  description: string;
  estimatedRefactorHours: number;
  assignedEngineer: string;
}

export interface ArchitectureRecord {
  adrId: string;
  title: string;
  status: 'APPROVED' | 'PROPOSED' | 'DEPRECATED';
  author: string;
  date: string;
}

export const INITIAL_INITIATIVES: PortfolioInitiative[] = [
  { id: 'init-101', name: 'Phase 11-17 Production Hardening & Compliance', category: 'PRODUCT_HEALTH', budgetAllocatedUsd: 450000, completionPct: 100, leadExecutive: 'CTO Office', status: 'COMPLETED' },
  { id: 'init-102', name: 'Phase 18 Delivery & Operations OS', category: 'ENTERPRISE_AI', budgetAllocatedUsd: 320000, completionPct: 100, leadExecutive: 'VP Customer Success', status: 'COMPLETED' },
  { id: 'init-103', name: 'Phase 19 Commercial SaaS Platform', category: 'COMMERCIAL_SAAS', budgetAllocatedUsd: 280000, completionPct: 100, leadExecutive: 'Chief Commercial Officer', status: 'COMPLETED' },
  { id: 'init-104', name: 'Phase 20 Enterprise Program Management & DevSecOps', category: 'INTEROPERABILITY', budgetAllocatedUsd: 220000, completionPct: 100, leadExecutive: 'VP Product Engineering', status: 'COMPLETED' }
];

export const INITIAL_TRACEABILITY: TraceabilityMatrixItem[] = [
  { reqId: 'REQ-EMR-01', featureName: 'Smart Specialty EMR & Ambient AI Scribe', epicId: 'EPIC-AI-101', storyId: 'STORY-402', commitHash: 'a89c42f', buildStatus: 'PASSED', testCaseId: 'TC-E2E-901', productionDeployed: true },
  { reqId: 'REQ-SEC-02', featureName: 'OAuth 2.1 PKCE & SHA-256 Audit Trails', epicId: 'EPIC-SEC-202', storyId: 'STORY-510', commitHash: 'f412e8b', buildStatus: 'PASSED', testCaseId: 'TC-SEC-104', productionDeployed: true },
  { reqId: 'REQ-OPS-03', featureName: 'Multi-Tenant SaaS Provisioning & MRR Engine', epicId: 'EPIC-COMM-303', storyId: 'STORY-614', commitHash: 'c7710a3', buildStatus: 'PASSED', testCaseId: 'TC-COMM-201', productionDeployed: true }
];

export const INITIAL_TECH_DEBT: TechDebtItem[] = [
  { id: 'td-101', component: 'workflowEngineService.ts', severity: 'MINOR', description: 'Refactor inline simulation rules into dynamic BPMN JSON schemas', estimatedRefactorHours: 12, assignedEngineer: 'Lead Architect' },
  { id: 'td-102', component: 'authService.ts', severity: 'MINOR', description: 'Add WebAuthn FIDO2 hardware passkey fallback hooks', estimatedRefactorHours: 8, assignedEngineer: 'Security Team' }
];

export const INITIAL_ADRS: ArchitectureRecord[] = [
  { adrId: 'ADR-001', title: 'Adoption of Next.js 16 App Router & Turbopack', status: 'APPROVED', author: 'Principal Architect', date: '2026-07-01' },
  { adrId: 'ADR-002', title: 'FHIR R4 & HL7 MLLP Event Driven Kafka Pipeline', status: 'APPROVED', author: 'Integration Lead', date: '2026-07-10' },
  { adrId: 'ADR-003', title: 'ClickHouse OLAP & Apache Iceberg Lakehouse Topology', status: 'APPROVED', author: 'Data Platform Architect', date: '2026-07-18' }
];

class EnterpriseProgramService {
  private initiatives: PortfolioInitiative[] = [...INITIAL_INITIATIVES];
  private matrix: TraceabilityMatrixItem[] = [...INITIAL_TRACEABILITY];
  private techDebt: TechDebtItem[] = [...INITIAL_TECH_DEBT];
  private adrs: ArchitectureRecord[] = [...INITIAL_ADRS];

  public getInitiatives() { return this.initiatives; }
  public getMatrix() { return this.matrix; }
  public getTechDebt() { return this.techDebt; }
  public getADRs() { return this.adrs; }

  public getEngineeringDevSecOpsMetrics() {
    return {
      ciBuildSuccessRatePct: 99.8,
      sonarQubeCodeQualityGrade: 'A+',
      openSecurityVulnerabilitiesCount: 0,
      sprintVelocityStoryPoints: 142,
      codeCoveragePct: 94.6,
      openPullRequestsCount: 4
    };
  }
}

export const enterpriseProgramService = new EnterpriseProgramService();
