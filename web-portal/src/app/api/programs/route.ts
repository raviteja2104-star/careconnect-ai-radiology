import { NextResponse } from 'next/server';
import { enterpriseProgramService } from '@/services/enterpriseProgramService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: enterpriseProgramService.getInitiatives()
  });
}
