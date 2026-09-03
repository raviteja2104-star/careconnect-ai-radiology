import { NextResponse } from 'next/server';
import { enterpriseOperationsService } from '@/services/enterpriseOperationsService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: enterpriseOperationsService.getTickets()
  });
}

export async function POST(req: Request) {
  try {
    const { hospitalName, title, severity } = await req.json();
    const created = enterpriseOperationsService.createTicket(hospitalName, title, severity);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
