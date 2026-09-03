import { NextResponse } from 'next/server';
import { bpmWorkflowStudioService } from '@/services/bpmWorkflowStudioService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      forms: bpmWorkflowStudioService.getForms(),
      rules: bpmWorkflowStudioService.getRules(),
      approvalChains: bpmWorkflowStudioService.getApprovalChains(),
      notifications: bpmWorkflowStudioService.getNotifications(),
      integrations: bpmWorkflowStudioService.getIntegrations(),
      marketplace: bpmWorkflowStudioService.getMarketplaceItems()
    }
  });
}
