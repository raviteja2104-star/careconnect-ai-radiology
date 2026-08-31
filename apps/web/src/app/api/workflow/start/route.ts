import { NextResponse } from 'next/server';
import { lowCodeWorkflowService } from '@/services/lowCodeWorkflowService';

export async function POST(req: Request) {
  try {
    const { definitionId, patientId, patientName } = await req.json();
    const instance = lowCodeWorkflowService.startWorkflow(
      definitionId || 'tmpl-opd-01', 
      patientId || 'PT-0001234', 
      patientName || 'Rohit Sharma'
    );
    return NextResponse.json({ success: true, data: instance });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
