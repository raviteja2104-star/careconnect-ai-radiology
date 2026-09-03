import { NextResponse } from 'next/server';
import { commercialSaaSPlatformService } from '@/services/commercialSaaSPlatformService';

export async function GET() {
  return NextResponse.json({
    success: true,
    financials: commercialSaaSPlatformService.getFinancials(),
    activeTenantsCount: commercialSaaSPlatformService.getTenants().length,
    partnersCount: commercialSaaSPlatformService.getPartners().length
  });
}
