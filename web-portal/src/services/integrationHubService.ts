/**
 * CareConnect Enterprise Integration Hub, FHIR R4, HL7 Engine & Command Center Service (Phase 6)
 * Orchestrates external health integrations (FHIR, HL7, DICOM, ABDM), live IoT device telemetry,
 * AI gateway metrics, and executive Command Center operations.
 */

export interface FHIRResourceRecord {
  resourceType: 'Patient' | 'Practitioner' | 'Encounter' | 'Observation' | 'Condition' | 'Procedure' | 'MedicationRequest' | 'DiagnosticReport' | 'ImagingStudy' | 'AllergyIntolerance' | 'Organization';
  id: string;
  meta: { versionId: string; lastUpdated: string };
  status: string;
  data: Record<string, any>;
}

export interface HL7MessageRecord {
  id: string;
  messageType: 'ADT_A01' | 'ADT_A08' | 'ORM_O01' | 'ORU_R01' | 'SIU_S12' | 'DFT_P03';
  controlId: string;
  sendingFacility: string;
  receivingFacility: string;
  timestamp: string;
  status: 'PROCESSED' | 'QUEUED' | 'RETRY' | 'FAILED';
  rawMessage: string;
}

export interface DeviceTelemetryRecord {
  id: string;
  deviceName: string;
  deviceType: 'VENTILATOR' | 'PATIENT_MONITOR' | 'ECG_TELEMETRY' | 'INFUSION_PUMP' | 'LAB_ANALYSER' | 'CT_SCANNER';
  location: string;
  batteryPct: number;
  status: 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
  lastPing: string;
  readings: Record<string, any>;
}

export interface CommandCenterData {
  hospital: {
    totalPatientsToday: number;
    opdActiveCount: number;
    ipdOccupiedBeds: number;
    icuOccupancyPct: number;
    otUtilisationPct: number;
    emergencyLoadCount: number;
    waitingPatientsAvgMins: number;
  };
  clinicalAlerts: {
    codeBlueCount: number;
    sepsisRiskAlerts: number;
    strokeAlerts: number;
    highNews2Count: number;
    criticalLabValues: number;
  };
  operations: {
    availableBeds: number;
    pharmacyStockHealthPct: number;
    labTurnaroundAvgMins: number;
    radiologyTurnaroundAvgMins: number;
    activeAmbulances: number;
    onDutyDoctors: number;
  };
  financial: {
    revenueTodayINR: number;
    pendingInsuranceClaimsINR: number;
    cashFlowINR: number;
    outstandingInvoicesCount: number;
  };
  aiGateway: {
    aiConsultationsCount: number;
    acceptedRecommendationsPct: number;
    overrideCount: number;
    translationDispatches: number;
    avgLatencyMs: number;
  };
}

export const INITIAL_FHIR_RESOURCES: FHIRResourceRecord[] = [
  {
    resourceType: 'Patient',
    id: 'fhir-pat-101',
    meta: { versionId: '1', lastUpdated: '2026-07-25T10:00:00Z' },
    status: 'active',
    data: {
      identifier: [{ system: 'https://abdm.gov.in/abha', value: '91-8829-1092-3841' }],
      name: [{ family: 'Rao', given: ['Rajesh'] }],
      gender: 'male',
      birthDate: '1984-05-14',
      telecom: [{ system: 'phone', value: '+919876543210' }]
    }
  },
  {
    resourceType: 'Observation',
    id: 'fhir-obs-201',
    meta: { versionId: '1', lastUpdated: '2026-07-25T11:15:00Z' },
    status: 'final',
    data: {
      code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }] },
      subject: { reference: 'Patient/fhir-pat-101' },
      component: [
        { code: { coding: [{ code: '8480-6', display: 'Systolic blood pressure' }] }, valueQuantity: { value: 128, unit: 'mmHg' } },
        { code: { coding: [{ code: '8462-4', display: 'Diastolic blood pressure' }] }, valueQuantity: { value: 84, unit: 'mmHg' } }
      ]
    }
  }
];

export const INITIAL_HL7_MESSAGES: HL7MessageRecord[] = [
  {
    id: 'hl7-msg-001',
    messageType: 'ADT_A01',
    controlId: 'MSG20260725001',
    sendingFacility: 'EMERGENCY_DESK',
    receivingFacility: 'HIS_BED_MANAGEMENT',
    timestamp: '2026-07-25T11:30:00Z',
    status: 'PROCESSED',
    rawMessage: 'MSH|^~\\&|EMERGENCY|CARECONNECT|HIS|BED_MGMT|20260725113000||ADT^A01|MSG20260725001|P|2.5\rPID|1||P1009283||Rao^Rajesh||19840514|M\rPV1|1|I|ICU^BED-04||||1092^Dr Sharma'
  },
  {
    id: 'hl7-msg-002',
    messageType: 'ORU_R01',
    controlId: 'MSG20260725002',
    sendingFacility: 'ROCHE_LAB_ANALYSER',
    receivingFacility: 'LIS_CORE',
    timestamp: '2026-07-25T11:45:00Z',
    status: 'PROCESSED',
    rawMessage: 'MSH|^~\\&|ROCHE_LAB|LAB|LIS|CARECONNECT|20260725114500||ORU^R01|MSG20260725002|P|2.5\rOBX|1|NM|HbA1c^Glycated Hemoglobin||9.2|%|< 5.7|H|||F'
  }
];

export const INITIAL_DEVICES: DeviceTelemetryRecord[] = [
  {
    id: 'dev-vent-01',
    deviceName: 'Hamilton C6 ICU Ventilator',
    deviceType: 'VENTILATOR',
    location: 'ICU Bed 02',
    batteryPct: 98,
    status: 'ONLINE',
    lastPing: '2s ago',
    readings: { tidalVolumeMl: 480, FiO2Pct: 40, PEEP: 8, respRate: 16, peakPressure: 22 }
  },
  {
    id: 'dev-mon-04',
    deviceName: 'Mindray BeneVision N22 Patient Monitor',
    deviceType: 'PATIENT_MONITOR',
    location: 'CCU Bed 04',
    batteryPct: 85,
    status: 'ONLINE',
    lastPing: '1s ago',
    readings: { heartRateBpm: 78, SpO2Pct: 98, sysBP: 124, diaBP: 82, tempC: 36.8 }
  },
  {
    id: 'dev-pacs-ct',
    deviceName: 'Siemens Somatom 128-Slice CT Scanner',
    deviceType: 'CT_SCANNER',
    location: 'Radiology Suite 01',
    batteryPct: 100,
    status: 'ONLINE',
    lastPing: '5s ago',
    readings: { dicomSeriesCount: 42, activeStudyId: 'CT-2026-901', tubeTempC: 42 }
  }
];

class IntegrationHubService {
  private fhirResources: FHIRResourceRecord[] = [...INITIAL_FHIR_RESOURCES];
  private hl7Messages: HL7MessageRecord[] = [...INITIAL_HL7_MESSAGES];
  private devices: DeviceTelemetryRecord[] = [...INITIAL_DEVICES];

  public getFHIRResources(type?: string) {
    if (!type) return this.fhirResources;
    return this.fhirResources.filter(r => r.resourceType.toLowerCase() === type.toLowerCase());
  }

  public createFHIRResource(resource: FHIRResourceRecord) {
    this.fhirResources.push(resource);
    return resource;
  }

  public getHL7Messages() { return this.hl7Messages; }

  public processHL7Message(rawMessage: string, messageType: HL7MessageRecord['messageType']) {
    const record: HL7MessageRecord = {
      id: `hl7-msg-${Date.now()}`,
      messageType,
      controlId: `MSG${Date.now()}`,
      sendingFacility: 'EXTERNAL_GATEWAY',
      receivingFacility: 'CARECONNECT_HIS',
      timestamp: new Date().toISOString(),
      status: 'PROCESSED',
      rawMessage
    };
    this.hl7Messages.unshift(record);
    return record;
  }

  public getDevices() { return this.devices; }

  public getCommandCenterData(): CommandCenterData {
    return {
      hospital: {
        totalPatientsToday: 342,
        opdActiveCount: 184,
        ipdOccupiedBeds: 112,
        icuOccupancyPct: 91,
        otUtilisationPct: 84,
        emergencyLoadCount: 28,
        waitingPatientsAvgMins: 14
      },
      clinicalAlerts: {
        codeBlueCount: 0,
        sepsisRiskAlerts: 2,
        strokeAlerts: 1,
        highNews2Count: 5,
        criticalLabValues: 3
      },
      operations: {
        availableBeds: 18,
        pharmacyStockHealthPct: 96,
        labTurnaroundAvgMins: 35,
        radiologyTurnaroundAvgMins: 42,
        activeAmbulances: 6,
        onDutyDoctors: 48
      },
      financial: {
        revenueTodayINR: 1485000,
        pendingInsuranceClaimsINR: 3850000,
        cashFlowINR: 9200000,
        outstandingInvoicesCount: 24
      },
      aiGateway: {
        aiConsultationsCount: 124,
        acceptedRecommendationsPct: 94.2,
        overrideCount: 7,
        translationDispatches: 68,
        avgLatencyMs: 380
      }
    };
  }

  public getSystemHealth() {
    return {
      status: 'HEALTHY',
      cpuUsagePct: 24.5,
      memoryUsagePct: 48.2,
      databaseConnections: 84,
      kafkaQueueLength: 12,
      uptimePct: 99.99,
      services: [
        { name: 'FHIR R4 Interoperability Engine', status: 'OPERATIONAL', latencyMs: 42 },
        { name: 'HL7 v2.x Interface Parser', status: 'OPERATIONAL', latencyMs: 18 },
        { name: 'Orthanc DICOM PACS Listener', status: 'OPERATIONAL', latencyMs: 65 },
        { name: 'ABDM ABHA Health Stack Sync', status: 'OPERATIONAL', latencyMs: 120 },
        { name: 'AI Copilot LLM Gateway', status: 'OPERATIONAL', latencyMs: 340 }
      ]
    };
  }
}

export const integrationHubService = new IntegrationHubService();
