import { NextResponse } from 'next/server';
import { masterDataService } from '@/services/masterDataService';

export async function POST(req: Request) {
  try {
    const { summary } = await req.json();
    const published = masterDataService.publishConfiguration(summary || 'Published Master Data Configuration Update.');
    return NextResponse.json({ success: true, data: published });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
