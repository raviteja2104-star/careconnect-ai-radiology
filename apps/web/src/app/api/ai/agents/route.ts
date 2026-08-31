import { NextResponse } from 'next/server';
import { aiPlatformService } from '@/services/aiPlatformService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: aiPlatformService.getAgents()
  });
}

export async function POST(req: Request) {
  try {
    const agent = await req.json();
    const created = aiPlatformService.addAgent(agent);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
