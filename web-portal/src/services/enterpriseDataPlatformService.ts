/**
 * CareConnect Enterprise Data Platform (EDP), Lakehouse, BI & Digital Twin Service (Phase 10)
 * Central data nervous system orchestrating Data Lakehouse, EMPI Master Patient Index,
 * Clinical Data Repository (CDR), BI Studio, Population Health, Predictive AI Models,
 * ML Feature Store, & Live Hospital Digital Twin Simulation.
 */

export interface MasterPatientIndexRecord {
  empiId: string;
  patientName: string;
  gender: string;
  dob: string;
  abhaAddress: string;
  nationalId: string;
  matchedHospitals: string[];
  confidenceScorePct: number;
  status: 'VERIFIED' | 'MERGED_PENDING';
}

export interface DataAssetRecord {
  id: string;
  name: string;
  category: 'LAKEHOUSE' | 'CDR' | 'EMPI' | 'WAREHOUSE' | 'FEATURE_STORE';
  format: 'PARQUET' | 'POSTGRES' | 'CLICKHOUSE' | 'ICEBERG' | 'PGVECTOR';
  recordCount: number;
  sizeBytes: number;
  qualityScorePct: number;
  lastIngested: string;
}

export interface PopulationHealthMetric {
  condition: 'DIABETES' | 'HYPERTENSION' | 'CARDIOLOGY' | 'ONCOLOGY' | 'MATERNAL_CARE' | 'CHRONIC_KIDNEY';
  cohortSize: number;
  prevalencePct: number;
  controlledPct: number;
  readmissionRate30d: number;
  screeningCompliancePct: number;
}

export interface PredictiveModelInsight {
  id: string;
  modelName: 'ICU_DETERIORATION_SOFA' | 'READMISSION_RISK_30D' | 'SEPSIS_1HR_ALERT' | 'BED_DEMAND_FORECAST' | 'OPD_CHURN_PREDICTOR';
  targetPatientId?: string;
  patientName?: string;
  riskScorePct: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  keyFactors: string[];
  recommendation: string;
}

export interface DigitalTwinHospitalState {
  timestamp: string;
  activePatients: number;
  opdTriageQueue: number;
  consultationActive: number;
  labSpecimensInQueue: number;
  radiologyScansActive: number;
  pharmacyDispenseQueue: number;
  ipdBedsOccupied: number;
  icuBedsOccupied: number;
  otSurgeriesActive: number;
  bottleneckAlert?: string;
}

export const INITIAL_EMPI_RECORDS: MasterPatientIndexRecord[] = [
  {
    empiId: 'EMPI-901824',
    patientName: 'Rajesh Rao',
    gender: 'Male',
    dob: '1984-05-14',
    abhaAddress: 'rajesh.rao@abdm',
    nationalId: 'IND-9018-2948-1092',
    matchedHospitals: ['Apollo CareConnect Main', 'CareConnect Jubilee Hills OPD', 'CareConnect Telehealth'],
    confidenceScorePct: 99.4,
    status: 'VERIFIED'
  },
  {
    empiId: 'EMPI-901825',
    patientName: 'Sunita Patel',
    gender: 'Female',
    dob: '1979-11-22',
    abhaAddress: 'sunita.patel@abdm',
    nationalId: 'IND-8812-9012-4412',
    matchedHospitals: ['Apollo CareConnect Main', 'CareConnect Cardiology Clinic'],
    confidenceScorePct: 98.8,
    status: 'VERIFIED'
  }
];

export const INITIAL_DATA_ASSETS: DataAssetRecord[] = [
  { id: 'da-101', name: 'Clinical Data Repository (CDR) - Longitudinal EHR', category: 'CDR', format: 'POSTGRES', recordCount: 1420000, sizeBytes: 8420000000, qualityScorePct: 99.2, lastIngested: '1 min ago' },
  { id: 'da-102', name: 'Data Lakehouse - DICOM PACS & Audio Scribe Embeddings', category: 'LAKEHOUSE', format: 'ICEBERG', recordCount: 842000, sizeBytes: 142000000000, qualityScorePct: 98.4, lastIngested: '3 mins ago' },
  { id: 'da-103', name: 'ML Feature Store - Vitals, NEWS2 & Lab Time Series', category: 'FEATURE_STORE', format: 'CLICKHOUSE', recordCount: 8900000, sizeBytes: 4200000000, qualityScorePct: 99.6, lastIngested: '30 secs ago' }
];

export const INITIAL_POPULATION_HEALTH: PopulationHealthMetric[] = [
  { condition: 'DIABETES', cohortSize: 4250, prevalencePct: 18.4, controlledPct: 76.2, readmissionRate30d: 4.1, screeningCompliancePct: 92.0 },
  { condition: 'HYPERTENSION', cohortSize: 6800, prevalencePct: 24.8, controlledPct: 82.4, readmissionRate30d: 3.2, screeningCompliancePct: 94.5 },
  { condition: 'CARDIOLOGY', cohortSize: 1840, prevalencePct: 8.2, controlledPct: 88.0, readmissionRate30d: 6.4, screeningCompliancePct: 96.1 }
];

export const INITIAL_PREDICTIVE_INSIGHTS: PredictiveModelInsight[] = [
  {
    id: 'pred-101',
    modelName: 'SEPSIS_1HR_ALERT',
    targetPatientId: 'P-90214',
    patientName: 'Rajesh Rao (ICU Bed 04)',
    riskScorePct: 88,
    riskLevel: 'CRITICAL',
    keyFactors: ['Temp 39.2°C', 'WBC 16.4', 'HR 118', 'BP 92/60'],
    recommendation: 'Initiate Sepsis 1-Hour Protocol: Blood cultures, STAT IV Antibiotics, & 30ml/kg Crystalloid Bolus.'
  },
  {
    id: 'pred-102',
    modelName: 'READMISSION_RISK_30D',
    targetPatientId: 'P-90215',
    patientName: 'Sunita Patel (Cardiology Ward)',
    riskScorePct: 64,
    riskLevel: 'MODERATE',
    keyFactors: ['Age 47', 'HbA1c 9.2%', '2 Prior Admissions'],
    recommendation: 'Schedule Home Health Nurse follow-up visit on Day 3 post-discharge and prescribe CGM monitor.'
  }
];

class EnterpriseDataPlatformService {
  private empiRecords: MasterPatientIndexRecord[] = [...INITIAL_EMPI_RECORDS];
  private assets: DataAssetRecord[] = [...INITIAL_DATA_ASSETS];
  private popHealth: PopulationHealthMetric[] = [...INITIAL_POPULATION_HEALTH];
  private predictiveInsights: PredictiveModelInsight[] = [...INITIAL_PREDICTIVE_INSIGHTS];

  public getEMPI() { return this.empiRecords; }
  public getAssets() { return this.assets; }
  public getPopulationHealth() { return this.popHealth; }
  public getPredictiveInsights() { return this.predictiveInsights; }

  public getDigitalTwinState(): DigitalTwinHospitalState {
    return {
      timestamp: new Date().toISOString(),
      activePatients: 342,
      opdTriageQueue: 14,
      consultationActive: 28,
      labSpecimensInQueue: 18,
      radiologyScansActive: 4,
      pharmacyDispenseQueue: 22,
      ipdBedsOccupied: 112,
      icuBedsOccupied: 21,
      otSurgeriesActive: 6,
      bottleneckAlert: 'OPD Triage Desk 2 experiencing +12 min wait surge due to registration surge.'
    };
  }

  public runResearchQuery(cohortName: string, deIdentify: boolean) {
    return {
      queryId: `RESEARCH-${Date.now()}`,
      cohortName: cohortName || 'Type 2 Diabetes & Hypertension Dual Cohort',
      patientCount: 1240,
      deIdentified: deIdentify,
      matchedRecords: 1240,
      exportFormat: 'FHIR R4 Parquet / CSV',
      status: 'APPROVED_AND_READY'
    };
  }
}

export const enterpriseDataPlatformService = new EnterpriseDataPlatformService();
