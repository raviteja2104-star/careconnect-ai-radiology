import { NextResponse } from 'next/server';
import { hospitalMigrationService } from '@/services/hospitalMigrationService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: hospitalMigrationService.getJobs()
  });
}

export async function POST(req: Request) {
  try {
    const { sourceSystem, dataType, recordCount } = await req.json();
    const created = hospitalMigrationService.uploadAndMigrate(sourceSystem, dataType, recordCount);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
