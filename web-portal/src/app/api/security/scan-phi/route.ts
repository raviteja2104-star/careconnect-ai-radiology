import { NextResponse } from 'next/server';
import { securityAuditService } from '@/services/securityAuditService';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const result = securityAuditService.scanAndRedactPHI(text || '');
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
