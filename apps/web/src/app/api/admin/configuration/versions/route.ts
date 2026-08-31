import { NextResponse } from 'next/server';
import { masterDataService } from '@/services/masterDataService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: masterDataService.getVersions()
  });
}
