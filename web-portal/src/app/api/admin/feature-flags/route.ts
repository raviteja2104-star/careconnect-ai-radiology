import { NextResponse } from 'next/server';
import { masterDataService } from '@/services/masterDataService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: masterDataService.getFeatureFlags()
  });
}

export async function PUT(req: Request) {
  try {
    const { key } = await req.json();
    const updated = masterDataService.toggleFeatureFlag(key);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
