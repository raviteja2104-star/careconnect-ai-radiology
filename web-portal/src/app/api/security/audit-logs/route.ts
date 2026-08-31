import { NextResponse } from 'next/server';
import { securityAuditService } from '@/services/securityAuditService';

export async function GET() {
  // Server-side there is no browser token, so this resolves to the labeled
  // demo dataset; the real trail lives at the backend's GET /api/audit.
  const logs = await securityAuditService.getAuditLogs();
  return NextResponse.json({
    success: true,
    data: logs.data,
    demo: logs.demo,
    kms: securityAuditService.getKMSStatus()
  });
}
