import { NextResponse } from 'next/server';
import { aiPlatformService } from '@/services/aiPlatformService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: aiPlatformService.getAnalytics()
  });
}
