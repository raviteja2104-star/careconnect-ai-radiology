import { NextResponse } from 'next/server';
import { integrationHubService } from '@/services/integrationHubService';

export async function POST(req: Request) {
  try {
    const { rawMessage, messageType } = await req.json();
    const processed = integrationHubService.processHL7Message(rawMessage, messageType || 'ADT_A01');
    return NextResponse.json({ success: true, data: processed });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
