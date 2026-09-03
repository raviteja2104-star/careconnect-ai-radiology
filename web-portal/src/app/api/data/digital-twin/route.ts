import { NextResponse } from 'next/server';
import { enterpriseDataPlatformService } from '@/services/enterpriseDataPlatformService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: enterpriseDataPlatformService.getDigitalTwinState()
  });
}
