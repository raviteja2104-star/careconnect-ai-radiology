import { NextResponse } from 'next/server';
import { lowCodeWorkflowService } from '@/services/lowCodeWorkflowService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: lowCodeWorkflowService.getDefinitions()
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const saved = lowCodeWorkflowService.saveDefinition(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
