import { NextResponse } from 'next/server';
import { commercialSaaSPlatformService } from '@/services/commercialSaaSPlatformService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: commercialSaaSPlatformService.getTenants()
  });
}

export async function POST(req: Request) {
  try {
    const { hospitalName, planTier } = await req.json();
    const created = commercialSaaSPlatformService.createTenant(hospitalName, planTier);
    return NextResponse.json({ success: true, data: created });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
