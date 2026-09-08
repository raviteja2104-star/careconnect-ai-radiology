import { NextResponse } from 'next/server';
import { lowCodeWorkflowService } from '@/services/lowCodeWorkflowService';

export async function POST(req: Request) {
  try {
    const definition = await req.json();
    const result = lowCodeWorkflowService.validateWorkflow(definition);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
