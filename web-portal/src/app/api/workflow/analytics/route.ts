import { NextResponse } from 'next/server';
import { lowCodeWorkflowService } from '@/services/lowCodeWorkflowService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: lowCodeWorkflowService.getAnalyticsSummary()
  });
}
