import { NextResponse } from 'next/server';
import { masterDataService } from '@/services/masterDataService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || undefined;

  return NextResponse.json({
    success: true,
    data: {
      hierarchy: masterDataService.getHierarchy(),
      masters: masterDataService.getMasterItems(category),
      branding: masterDataService.getBranding(),
      languages: masterDataService.getLanguages()
    }
  });
}

export async function POST(req: Request) {
  try {
    const item = await req.json();
    const created = masterDataService.addMasterItem(item);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
