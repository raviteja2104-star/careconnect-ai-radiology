import { NextResponse } from 'next/server';
import { securityAuditService } from '@/services/securityAuditService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: securityAuditService.getAuditLogs(),
    kms: securityAuditService.getKMSStatus()
  });
}
