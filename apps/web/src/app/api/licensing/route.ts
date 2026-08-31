import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    entitlements: [
      { key: 'SMART_EMR_SPECIALTIES', enabled: true },
      { bg: 'BPM_WORKFLOW_STUDIO', enabled: true },
      { key: 'ENTERPRISE_AI_PLATFORM', enabled: true },
      { key: 'FHIR_HL7_INTEGRATION', enabled: true }
    ]
  });
}
