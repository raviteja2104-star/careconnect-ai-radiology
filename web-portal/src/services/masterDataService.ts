/**
 * CareConnect Enterprise Master Data Management (MDM) & Hospital Configuration Service
 * Provides central configuration management for organizations, departments, clinical masters,
 * pricing charge masters, branding, feature flags, language resources, and integrations.
 */

export interface MasterDataItem {
  id: string;
  category: 'PATIENT' | 'CLINICAL' | 'PHARMACY' | 'LABORATORY' | 'RADIOLOGY' | 'BILLING';
  subCategory: string;
  code: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  metadata?: Record<string, any>;
}

export interface HospitalHierarchyNode {
  id: string;
  name: string;
  type: 'ORGANIZATION' | 'HOSPITAL' | 'CAMPUS' | 'BUILDING' | 'FLOOR' | 'DEPARTMENT' | 'WARD' | 'ROOM' | 'BED';
  parentId?: string;
  status: 'ACTIVE' | 'INACTIVE';
  childrenCount?: number;
}

export interface BrandingProfile {
  hospitalName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  prescriptionHeaderLayout: 'HEADER_FULL' | 'HEADER_COMPACT' | 'LETTERHEAD_PREPRINTED';
  nabhRegistrationNo: string;
  gstinNo: string;
  address: string;
  phone: string;
  email: string;
}

export interface FeatureFlagConfig {
  id: string;
  key: string;
  name: string;
  description: string;
  category: 'CLINICAL' | 'MODULE' | 'INTEGRATION' | 'AI';
  isEnabled: boolean;
}

export interface LanguageResourceConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  isDefaultPrescriptionLanguage: boolean;
  translatedCount: number;
}

export interface ConfigurationVersionRecord {
  version: number;
  publishedAt: string;
  publishedBy: string;
  changeSummary: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
}

// Default Data Seed
export const INITIAL_HIERARCHY: HospitalHierarchyNode[] = [
  { id: 'org-1', name: 'CareConnect Health Network', type: 'ORGANIZATION', status: 'ACTIVE', childrenCount: 3 },
  { id: 'hosp-1', name: 'Apollo CareConnect Super Specialty Hospital', type: 'HOSPITAL', parentId: 'org-1', status: 'ACTIVE', childrenCount: 2 },
  { id: 'camp-1', name: 'Main City Campus', type: 'CAMPUS', parentId: 'hosp-1', status: 'ACTIVE', childrenCount: 4 },
  { id: 'dept-1', name: 'Cardiology & Cardiothoracic Surgery', type: 'DEPARTMENT', parentId: 'camp-1', status: 'ACTIVE', childrenCount: 12 },
  { id: 'ward-1', name: 'Coronary Care Unit (CCU)', type: 'WARD', parentId: 'dept-1', status: 'ACTIVE', childrenCount: 15 },
  { id: 'bed-101', name: 'Bed CCU-01 (Ventilator Capable)', type: 'BED', parentId: 'ward-1', status: 'ACTIVE' }
];

export const INITIAL_MASTER_ITEMS: MasterDataItem[] = [
  // Patient Masters
  { id: 'm-pat-1', category: 'PATIENT', subCategory: 'Blood Group', code: 'BG-OPOS', name: 'O Positive (O+)', status: 'ACTIVE' },
  { id: 'm-pat-2', category: 'PATIENT', subCategory: 'Blood Group', code: 'BG-ONEG', name: 'O Negative (O-)', status: 'ACTIVE' },
  { id: 'm-pat-3', category: 'PATIENT', subCategory: 'Referral Source', code: 'REF-DOC', name: 'Referring Doctor / Consultant', status: 'ACTIVE' },
  
  // Clinical Masters
  { id: 'm-clin-1', category: 'CLINICAL', subCategory: 'Specialty', code: 'SPEC-CARD', name: 'Cardiology & Electrophysiology', status: 'ACTIVE' },
  { id: 'm-clin-2', category: 'CLINICAL', subCategory: 'Diagnosis', code: 'ICD10-I21.9', name: 'Acute Myocardial Infarction, Unspecified', status: 'ACTIVE' },
  { id: 'm-clin-3', category: 'CLINICAL', subCategory: 'Allergy', code: 'ALG-PEN', name: 'Penicillin Hypersensitivity', status: 'ACTIVE' },

  // Pharmacy Masters
  { id: 'm-rx-1', category: 'PHARMACY', subCategory: 'Generic Medicine', code: 'GEN-TELM', name: 'Telmisartan', description: 'Angiotensin II Receptor Blocker', status: 'ACTIVE' },
  { id: 'm-rx-2', category: 'PHARMACY', subCategory: 'Dosage Form', code: 'FORM-TAB', name: 'Oral Tablet', status: 'ACTIVE' },

  // Laboratory Masters
  { id: 'm-lab-1', category: 'LABORATORY', subCategory: 'Test Catalogue', code: 'LAB-CBC', name: 'Complete Blood Count with Differential', status: 'ACTIVE', metadata: { sample: 'EDTA Blood', unit: 'x10^3/uL', refRange: '4.5-11.0' } },
  { id: 'm-lab-2', category: 'LABORATORY', subCategory: 'Test Catalogue', code: 'LAB-HBA1C', name: 'Glycated Hemoglobin (HbA1c)', status: 'ACTIVE', metadata: { sample: 'Venous Whole Blood', unit: '%', refRange: '< 5.7%' } },

  // Radiology Masters
  { id: 'm-rad-1', category: 'RADIOLOGY', subCategory: 'Modality', code: 'RAD-CT', name: 'Computed Tomography (CT 128-Slice)', status: 'ACTIVE' },
  { id: 'm-rad-2', category: 'RADIOLOGY', subCategory: 'Modality', code: 'RAD-MRI', name: 'Magnetic Resonance Imaging (3.0 Tesla MRI)', status: 'ACTIVE' },

  // Billing Masters
  { id: 'm-bill-1', category: 'BILLING', subCategory: 'Charge Master', code: 'CHG-OPD-CONS', name: 'Super Specialist OPD Consultation Fee', status: 'ACTIVE', metadata: { priceINR: 800, taxPct: 0 } },
  { id: 'm-bill-2', category: 'BILLING', subCategory: 'Charge Master', code: 'CHG-ICU-DAY', name: 'ICU Per-Day Bed & Monitoring Charge', status: 'ACTIVE', metadata: { priceINR: 6500, taxPct: 0 } }
];

export const INITIAL_FEATURE_FLAGS: FeatureFlagConfig[] = [
  { id: 'ff-1', key: 'telemedicine_enabled', name: 'Tele-Consultation & Video Calls', description: 'Enable remote video consultations and digital patient queueing.', category: 'MODULE', isEnabled: true },
  { id: 'ff-2', key: 'ai_copilot_enabled', name: 'AI Clinical Copilot & SOAP Scribe', description: 'Enable real-time AI clinical documentation and ICD-10 suggestions.', category: 'AI', isEnabled: true },
  { id: 'ff-3', key: 'multilingual_rx_enabled', name: 'Multi-Language Patient Prescriptions', description: 'Generate bilingual prescriptions in Telugu, Hindi, Tamil, Arabic, etc.', category: 'CLINICAL', isEnabled: true },
  { id: 'ff-4', key: 'abdm_abha_sync_enabled', name: 'ABDM ABHA Health Stack Sync', description: 'Connect with National Health Authority ABHA ID verification & FHIR payloads.', category: 'INTEGRATION', isEnabled: true },
  { id: 'ff-5', key: 'icu_telemetry_stream', name: 'Live ICU Telemetry & SOFA Monitor', description: 'Stream continuous ventilator and vital monitor waveforms to Nurse Station.', category: 'CLINICAL', isEnabled: true }
];

export const SUPPORTED_LANGUAGES: LanguageResourceConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', isDefaultPrescriptionLanguage: true, translatedCount: 1250 },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr', isDefaultPrescriptionLanguage: false, translatedCount: 1180 },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', isDefaultPrescriptionLanguage: false, translatedCount: 1210 },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr', isDefaultPrescriptionLanguage: false, translatedCount: 1150 },
  { code: 'kn', name: 'Kannada', nativeName: 'కన్నడ', direction: 'ltr', isDefaultPrescriptionLanguage: false, translatedCount: 1100 },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', direction: 'ltr', isDefaultPrescriptionLanguage: false, translatedCount: 1080 },
  { code: 'mr', name: 'Marathi', nativeName: 'मరాఠీ', direction: 'ltr', isDefaultPrescriptionLanguage: false, translatedCount: 1090 },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', isDefaultPrescriptionLanguage: false, translatedCount: 1050 }
];

class MasterDataService {
  private hierarchy: HospitalHierarchyNode[] = [...INITIAL_HIERARCHY];
  private masters: MasterDataItem[] = [...INITIAL_MASTER_ITEMS];
  private featureFlags: FeatureFlagConfig[] = [...INITIAL_FEATURE_FLAGS];
  private languages: LanguageResourceConfig[] = [...SUPPORTED_LANGUAGES];
  private branding: BrandingProfile = {
    hospitalName: 'Apollo CareConnect Super Specialty Hospital',
    tagline: 'Precision Medicine & Compassionate Care',
    logoUrl: 'https://careconnect.hospital/logo.png',
    primaryColor: '#4f46e5',
    secondaryColor: '#06b6d4',
    prescriptionHeaderLayout: 'HEADER_FULL',
    nabhRegistrationNo: 'NABH-2026-HYD-9912',
    gstinNo: '36AAACA1234B1Z5',
    address: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana – 500033',
    phone: '+91 40 2360 7777',
    email: 'contact@careconnect.hospital'
  };
  private versions: ConfigurationVersionRecord[] = [
    { version: 4, publishedAt: '2026-07-25', publishedBy: 'Dr. Raj Sharma', changeSummary: 'Updated Cardiology Charge Master & Added Multi-language Telugu Rx defaults.', status: 'PUBLISHED' },
    { version: 3, publishedAt: '2026-07-10', publishedBy: 'Anita Desai', changeSummary: 'Enabled ABDM ABHA Feature Flag.', status: 'ARCHIVED' }
  ];

  public getHierarchy() { return this.hierarchy; }
  public getMasterItems(category?: string) {
    if (!category) return this.masters;
    return this.masters.filter(m => m.category === category);
  }
  public getFeatureFlags() { return this.featureFlags; }
  public getLanguages() { return this.languages; }
  public getBranding() { return this.branding; }
  public getVersions() { return this.versions; }

  public addMasterItem(item: MasterDataItem) {
    this.masters.push(item);
    return item;
  }

  public toggleFeatureFlag(key: string): FeatureFlagConfig | undefined {
    const flag = this.featureFlags.find(f => f.key === key);
    if (flag) {
      flag.isEnabled = !flag.isEnabled;
    }
    return flag;
  }

  public updateBranding(newBranding: Partial<BrandingProfile>) {
    this.branding = { ...this.branding, ...newBranding };
    return this.branding;
  }

  public publishConfiguration(summary: string): ConfigurationVersionRecord {
    const nextVer = this.versions[0].version + 1;
    const newVer: ConfigurationVersionRecord = {
      version: nextVer,
      publishedAt: new Date().toISOString().split('T')[0],
      publishedBy: 'System Administrator',
      changeSummary: summary,
      status: 'PUBLISHED'
    };
    this.versions.unshift(newVer);
    return newVer;
  }
}

export const masterDataService = new MasterDataService();
