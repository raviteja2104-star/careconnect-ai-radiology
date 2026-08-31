/**
 * CareConnect Healthcare Platform Ecosystem (Developer Platform, SDK & Marketplace) Service (Phase 8)
 * Enables HPaaS ecosystem: App Marketplace, SDK Downloads, Public APIs, Webhooks, OAuth 2.1, Event Bus & Certification.
 */

export interface MarketplaceAppListing {
  id: string;
  name: string;
  category: 'CLINICAL' | 'AI' | 'INTEGRATION' | 'BILLING' | 'TELEMEDICINE';
  publisher: string;
  version: string;
  rating: number;
  installCount: number;
  description: string;
  isVerified: boolean;
  status: 'INSTALLED' | 'AVAILABLE';
  icon: string;
}

export interface SDKReleaseItem {
  id: string;
  language: 'TypeScript' | 'Python' | 'Java' | 'Kotlin' | 'Swift' | 'Flutter' | 'Go' | '.NET';
  version: string;
  packageName: string;
  downloadsCount: number;
  documentationUrl: string;
}

export interface WebhookSubscriptionRecord {
  id: string;
  targetUrl: string;
  events: string[];
  signingSecret: string;
  status: 'ACTIVE' | 'PAUSED';
  successPct: number;
  lastDelivery: string;
}

export interface EventBusMessage {
  id: string;
  eventTopic: 'patient.registered' | 'appointment.created' | 'lab.result.ready' | 'prescription.signed' | 'invoice.paid';
  sourceModule: string;
  timestamp: string;
  status: 'DELIVERED' | 'RETRY' | 'DEAD_LETTER';
  payload: Record<string, any>;
}

export interface DeveloperOAuthApp {
  clientId: string;
  appName: string;
  developerEmail: string;
  redirectUris: string[];
  allowedScopes: string[];
  rateLimitPerMin: number;
  status: 'ACTIVE' | 'REVOKED';
}

export const INITIAL_MARKETPLACE_APPS: MarketplaceAppListing[] = [
  {
    id: 'app-cardio-pack',
    name: 'Apollo Cardiology & ECG Intelligence Pack',
    category: 'CLINICAL',
    publisher: 'Apollo Clinical Technologies',
    version: 'v3.2',
    rating: 4.9,
    installCount: 142,
    description: 'CHA2DS2-VASc stroke scoring, automatic 12-lead ECG telemetry widget, and AHA hypertension pathway.',
    isVerified: true,
    status: 'INSTALLED',
    icon: 'Heart'
  },
  {
    id: 'app-ai-scribe-pro',
    name: 'Ambient AI Scribe & SOAP Generator',
    category: 'AI',
    publisher: 'CareConnect AI Labs',
    version: 'v2.8',
    rating: 4.95,
    installCount: 380,
    description: 'Real-time ambient consultation dictation scribe with automatic ICD-10 coding and bilingual translation.',
    isVerified: true,
    status: 'INSTALLED',
    icon: 'Sparkles'
  },
  {
    id: 'app-whatsapp-hub',
    name: 'WhatsApp Business Patient Engagement Hub',
    category: 'INTEGRATION',
    publisher: 'Infobip Enterprise',
    version: 'v4.0',
    rating: 4.8,
    installCount: 520,
    description: 'Automated appointment reminders, lab PDF dispatches, and WhatsApp prescription notifications.',
    isVerified: true,
    status: 'INSTALLED',
    icon: 'MessageSquare'
  },
  {
    id: 'app-pacs-orthanc',
    name: 'Orthanc DICOM PACS Cloud Bridge',
    category: 'INTEGRATION',
    publisher: 'Radiology Open Source Foundation',
    version: 'v1.9',
    rating: 4.7,
    installCount: 94,
    description: 'Zero-footprint web DICOM viewer integration with automated HL7 ORU result signoff.',
    isVerified: true,
    status: 'AVAILABLE',
    icon: 'Film'
  }
];

export const INITIAL_SDKS: SDKReleaseItem[] = [
  { id: 'sdk-ts', language: 'TypeScript', version: '2.4.0', packageName: '@careconnect/sdk-node', downloadsCount: 18400, documentationUrl: 'https://developer.careconnect.hospital/sdk/typescript' },
  { id: 'sdk-py', language: 'Python', version: '2.3.1', packageName: 'careconnect-py', downloadsCount: 24200, documentationUrl: 'https://developer.careconnect.hospital/sdk/python' },
  { id: 'sdk-java', language: 'Java', version: '2.1.0', packageName: 'com.careconnect.sdk', downloadsCount: 12100, documentationUrl: 'https://developer.careconnect.hospital/sdk/java' },
  { id: 'sdk-flutter', language: 'Flutter', version: '1.8.0', packageName: 'careconnect_flutter', downloadsCount: 9800, documentationUrl: 'https://developer.careconnect.hospital/sdk/flutter' }
];

export const INITIAL_WEBHOOKS: WebhookSubscriptionRecord[] = [
  {
    id: 'wh-101',
    targetUrl: 'https://api.apollohospitals.com/careconnect/webhooks/lab-results',
    events: ['lab.result.ready', 'prescription.signed'],
    signingSecret: 'whsec_88492019481029384710',
    status: 'ACTIVE',
    successPct: 99.8,
    lastDelivery: '2 mins ago'
  },
  {
    id: 'wh-102',
    targetUrl: 'https://integrations.starhealth.in/claims/notify',
    events: ['invoice.paid', 'patient.discharged'],
    signingSecret: 'whsec_99182374619283746192',
    status: 'ACTIVE',
    successPct: 99.4,
    lastDelivery: '14 mins ago'
  }
];

export const INITIAL_EVENTS: EventBusMessage[] = [
  {
    id: 'evt-901',
    eventTopic: 'lab.result.ready',
    sourceModule: 'LIS_LABORATORY',
    timestamp: '2026-07-25T12:30:00Z',
    status: 'DELIVERED',
    payload: { labOrderId: 'LAB-9012', testName: 'Fasting HbA1c', resultValue: '9.2%', patientId: 'P-90214' }
  },
  {
    id: 'evt-902',
    eventTopic: 'patient.registered',
    sourceModule: 'PATIENT_REGISTRATION',
    timestamp: '2026-07-25T12:40:00Z',
    status: 'DELIVERED',
    payload: { patientId: 'P-90217', name: 'Ananya Sharma', abhaAddress: 'ananya@abdm', phone: '+919876543210' }
  }
];

class DeveloperPlatformService {
  private apps: MarketplaceAppListing[] = [...INITIAL_MARKETPLACE_APPS];
  private sdks: SDKReleaseItem[] = [...INITIAL_SDKS];
  private webhooks: WebhookSubscriptionRecord[] = [...INITIAL_WEBHOOKS];
  private events: EventBusMessage[] = [...INITIAL_EVENTS];
  private oauthApps: DeveloperOAuthApp[] = [
    {
      clientId: 'client_apollo_emr_v1',
      appName: 'Apollo Super Specialty Mobile Integration',
      developerEmail: 'devops@apollohospitals.com',
      redirectUris: ['https://apollo.hospital/oauth/callback'],
      allowedScopes: ['read:patient', 'read:emr', 'write:prescriptions'],
      rateLimitPerMin: 1000,
      status: 'ACTIVE'
    }
  ];

  public getMarketplaceApps() { return this.apps; }
  public getSDKs() { return this.sdks; }
  public getWebhooks() { return this.webhooks; }
  public getEvents() { return this.events; }
  public getOAuthApps() { return this.oauthApps; }

  public installApp(id: string) {
    const app = this.apps.find(a => a.id === id);
    if (app) app.status = 'INSTALLED';
    return app;
  }

  public registerWebhook(targetUrl: string, events: string[]) {
    const created: WebhookSubscriptionRecord = {
      id: `wh-${Date.now()}`,
      targetUrl,
      events,
      signingSecret: `whsec_${Date.now()}`,
      status: 'ACTIVE',
      successPct: 100,
      lastDelivery: 'Just now'
    };
    this.webhooks.push(created);
    return created;
  }

  public getAnalytics() {
    return {
      totalApiRequestsToday: 184200,
      activeDevelopersCount: 420,
      installedPluginsCount: 18,
      webhookDeliveryRatePct: 99.8,
      avgLatencyMs: 24,
      sandboxActiveSessions: 45
    };
  }
}

export const developerPlatformService = new DeveloperPlatformService();
