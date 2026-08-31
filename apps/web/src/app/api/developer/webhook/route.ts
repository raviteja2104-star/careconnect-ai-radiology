import { NextResponse } from 'next/server';
import { developerPlatformService } from '@/services/developerPlatformService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: developerPlatformService.getWebhooks()
  });
}

export async function POST(req: Request) {
  try {
    const { targetUrl, events } = await req.json();
    const created = developerPlatformService.registerWebhook(targetUrl, events);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
