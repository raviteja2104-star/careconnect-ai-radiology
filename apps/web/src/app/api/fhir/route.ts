import { NextResponse } from 'next/server';
import { integrationHubService } from '@/services/integrationHubService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const resourceType = searchParams.get('type') || undefined;

  return NextResponse.json({
    resourceType: 'Bundle',
    type: 'searchset',
    total: integrationHubService.getFHIRResources(resourceType).length,
    entry: integrationHubService.getFHIRResources(resourceType).map(r => ({
      fullUrl: `https://careconnect.hospital/api/fhir/${r.resourceType}/${r.id}`,
      resource: {
        resourceType: r.resourceType,
        id: r.id,
        meta: r.meta,
        ...r.data
      }
    }))
  });
}

export async function POST(req: Request) {
  try {
    const resource = await req.json();
    const created = integrationHubService.createFHIRResource({
      resourceType: resource.resourceType || 'Observation',
      id: `fhir-${Date.now()}`,
      meta: { versionId: '1', lastUpdated: new Date().toISOString() },
      status: 'active',
      data: resource
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
