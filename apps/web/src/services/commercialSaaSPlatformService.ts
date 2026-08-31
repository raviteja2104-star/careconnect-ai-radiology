/**
 * CareConnect Enterprise Commercial Platform & SaaS Monetization Service (Phase 19)
 * Multi-tenant SaaS provisioning, subscription & licensing tiers, revenue platform (MRR/ARR),
 * partner commissions, marketplace commerce, & executive commercial intelligence.
 */

export interface TenantAccountRecord {
  tenantId: string;
  hospitalName: string;
  planTier: 'ENTERPRISE_UNLIMITED' | 'HOSPITAL_CORE' | 'CLINIC_STARTER' | 'SANDBOX_TRIAL';
  status: 'ACTIVE_PRODUCTION' | 'TRIAL_EXPIRING' | 'SUSPENDED';
  monthlySubscriptionUsd: number;
  activeDoctorsLimit: number;
  aiTokenQuotaMonthly: number;
  whiteLabelBranding: boolean;
  classification: 'LIVE_IMPLEMENTED' | 'DEMO_SIMULATED' | 'TARGET_PRODUCTION_METRIC';
}

export interface FinancialMetricRecord {
  mrrUsd: number;
  arrUsd: number;
  cacUsd: number;
  ltvUsd: number;
  grrPct: number;
  nrrPct: number;
  churnRatePct: number;
  expansionMrrUsd: number;
  classification: 'DEMO_SIMULATED';
}

export interface PartnerEcosystemRecord {
  id: string;
  partnerName: string;
  type: 'IMPLEMENTATION_SI' | 'RESELLER' | 'DEVICE_ISV' | 'AI_VENDOR';
  tier: 'GOLD_PARTNER' | 'SILVER_PARTNER' | 'STRATEGIC';
  revenueSharePct: number;
  activeDeployments: number;
}

export const INITIAL_TENANTS: TenantAccountRecord[] = [
  { tenantId: 'tenant-apollo-main', hospitalName: 'Apollo Super Specialty Main', planTier: 'ENTERPRISE_UNLIMITED', status: 'ACTIVE_PRODUCTION', monthlySubscriptionUsd: 14500, activeDoctorsLimit: 500, aiTokenQuotaMonthly: 10000000, whiteLabelBranding: true, classification: 'LIVE_IMPLEMENTED' },
  { tenantId: 'tenant-fortis-jh', hospitalName: 'Fortis Healthcare Jubilee Hills', planTier: 'HOSPITAL_CORE', status: 'ACTIVE_PRODUCTION', monthlySubscriptionUsd: 8200, activeDoctorsLimit: 150, aiTokenQuotaMonthly: 3000000, whiteLabelBranding: true, classification: 'LIVE_IMPLEMENTED' },
  { tenantId: 'tenant-manipal-amc', hospitalName: 'Manipal Academic Medical Centre', planTier: 'SANDBOX_TRIAL', status: 'TRIAL_EXPIRING', monthlySubscriptionUsd: 0, activeDoctorsLimit: 50, aiTokenQuotaMonthly: 500000, whiteLabelBranding: false, classification: 'DEMO_SIMULATED' }
];

export const INITIAL_FINANCIAL_METRICS: FinancialMetricRecord = {
  mrrUsd: 142500,
  arrUsd: 1710000,
  cacUsd: 12400,
  ltvUsd: 184000,
  grrPct: 98.4,
  nrrPct: 114.2,
  churnRatePct: 0.8,
  expansionMrrUsd: 18200,
  classification: 'DEMO_SIMULATED'
};

export const INITIAL_PARTNERS: PartnerEcosystemRecord[] = [
  { id: 'part-101', partnerName: 'TechMahindra Healthcare SI', type: 'IMPLEMENTATION_SI', tier: 'GOLD_PARTNER', revenueSharePct: 20, activeDeployments: 4 },
  { id: 'part-102', partnerName: 'Orthanc Cloud PACS ISV', type: 'DEVICE_ISV', tier: 'STRATEGIC', revenueSharePct: 15, activeDeployments: 8 }
];

class CommercialSaaSPlatformService {
  private tenants: TenantAccountRecord[] = [...INITIAL_TENANTS];
  private financial: FinancialMetricRecord = { ...INITIAL_FINANCIAL_METRICS };
  private partners: PartnerEcosystemRecord[] = [...INITIAL_PARTNERS];

  public getTenants() { return this.tenants; }
  public getFinancials() { return this.financial; }
  public getPartners() { return this.partners; }

  public createTenant(hospitalName: string, planTier: any) {
    const tenant: TenantAccountRecord = {
      tenantId: `tenant-${Date.now()}`,
      hospitalName: hospitalName || 'New Hospital Partner',
      planTier: planTier || 'HOSPITAL_CORE',
      status: 'ACTIVE_PRODUCTION',
      monthlySubscriptionUsd: 8200,
      activeDoctorsLimit: 150,
      aiTokenQuotaMonthly: 3000000,
      whiteLabelBranding: true,
      classification: 'LIVE_IMPLEMENTED'
    };
    this.tenants.unshift(tenant);
    return tenant;
  }
}

export const commercialSaaSPlatformService = new CommercialSaaSPlatformService();
