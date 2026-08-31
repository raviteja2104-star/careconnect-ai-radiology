import { NextResponse } from 'next/server';
import { commercialSaaSPlatformService } from '@/services/commercialSaaSPlatformService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: commercialSaaSPlatformService.getPartners()
  });
}
