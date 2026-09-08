import { NextResponse } from 'next/server';
import { enterpriseDataPlatformService } from '@/services/enterpriseDataPlatformService';

export async function POST(req: Request) {
  try {
    const { cohortName, deIdentify } = await req.json();
    const result = enterpriseDataPlatformService.runResearchQuery(cohortName, deIdentify);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
