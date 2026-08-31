import { NextResponse } from 'next/server';
import { enterpriseOperationsService } from '@/services/enterpriseOperationsService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: enterpriseOperationsService.getProjects()
  });
}
