/**
 * CareConnect Hospital Data Migration & Go-Live Toolkit Service (Phase 17)
 * Automated Excel/CSV Legacy HIS Import Wizard, PACS DICOM migration queue, & LMS User Training.
 */

export interface MigrationJobRecord {
  id: string;
  sourceSystem: 'EPIC_EHR' | 'CERNER' | 'LOCAL_EXCEL' | 'ORTHANC_PACS' | 'LEGACY_LIS';
  dataType: 'PATIENTS' | 'EMR_ENCOUNTERS' | 'LAB_RESULTS' | 'DICOM_IMAGES' | 'BILLING_MASTERS';
  recordCount: number;
  processedCount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt?: string;
}

export const INITIAL_MIGRATION_JOBS: MigrationJobRecord[] = [
  {
    id: 'mig-101',
    sourceSystem: 'LOCAL_EXCEL',
    dataType: 'PATIENTS',
    recordCount: 14200,
    processedCount: 14200,
    status: 'COMPLETED',
    startedAt: '2026-07-25T14:00:00Z',
    completedAt: '2026-07-25T14:15:00Z'
  },
  {
    id: 'mig-102',
    sourceSystem: 'ORTHANC_PACS',
    dataType: 'DICOM_IMAGES',
    recordCount: 8400,
    processedCount: 6200,
    status: 'PROCESSING',
    startedAt: '2026-07-25T18:00:00Z'
  }
];

class HospitalMigrationService {
  private jobs: MigrationJobRecord[] = [...INITIAL_MIGRATION_JOBS];

  public getJobs() { return this.jobs; }

  public uploadAndMigrate(sourceSystem: any, dataType: any, recordCount: number) {
    const job: MigrationJobRecord = {
      id: `mig-${Date.now()}`,
      sourceSystem: sourceSystem || 'LOCAL_EXCEL',
      dataType: dataType || 'PATIENTS',
      recordCount: recordCount || 1200,
      processedCount: recordCount || 1200,
      status: 'COMPLETED',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };
    this.jobs.unshift(job);
    return job;
  }
}

export const hospitalMigrationService = new HospitalMigrationService();
