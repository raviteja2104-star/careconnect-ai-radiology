import { NextResponse } from 'next/server';
import { integrationHubService } from '@/services/integrationHubService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      health: integrationHubService.getSystemHealth(),
      hl7Messages: integrationHubService.getHL7Messages(),
      devicesCount: integrationHubService.getDevices().length,
      fhirResourcesCount: integrationHubService.getFHIRResources().length
    }
  });
}
