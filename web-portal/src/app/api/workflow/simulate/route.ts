import { bpmWorkflowStudioService } from '@/services/bpmWorkflowStudioService';

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try { body = await request.json(); } catch { /* empty body */ }

  const definitionId = typeof body.definitionId === 'string' ? body.definitionId : '';
  if (!definitionId) {
    return Response.json({ success: false, message: 'definitionId is required.' }, { status: 400 });
  }

  const result = bpmWorkflowStudioService.simulateWorkflow(definitionId);
  return Response.json({ success: true, data: result });
}
