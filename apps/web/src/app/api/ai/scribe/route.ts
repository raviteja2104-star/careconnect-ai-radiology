import { NextResponse } from 'next/server';
import { aiPlatformService } from '@/services/aiPlatformService';

export async function POST(req: Request) {
  try {
    const { dictationText } = await req.json();
    const result = aiPlatformService.generateSOAPScribe(dictationText);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
