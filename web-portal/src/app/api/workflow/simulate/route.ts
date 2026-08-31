import { NextResponse } from 'next/server';
import { bpmWorkflowStudioService } from '@/services/bpmWorkflowStudioService';

export async function POST(req: Request) {
  try {
    const { definitionId } = await req.json();
    const result = bpmWorkflowStudioService.simulateWorkflow(definitionId || 'tmpl-opd-01');
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
