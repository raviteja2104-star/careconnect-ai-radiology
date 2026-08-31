import { NextResponse } from 'next/server';
import { integrationHubService } from '@/services/integrationHubService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: integrationHubService.getCommandCenterData()
  });
}
