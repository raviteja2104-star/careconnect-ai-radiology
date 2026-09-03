import { NextResponse } from 'next/server';
import { developerPlatformService } from '@/services/developerPlatformService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: developerPlatformService.getAnalytics()
  });
}
