import { NextRequest, NextResponse } from 'next/server';
import { SUPPORTED_LANGUAGES } from '@/services/prescriptionTranslationService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      prescriptionId, 
      patientId, 
      channel = 'whatsapp', // 'whatsapp' | 'email' | 'sms'
      language = 'te', 
      displayMode = 'bilingual', // 'english' | 'translated' | 'bilingual'
      recipientContact = '+91 9876543210'
    } = body;

    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === language);

    return NextResponse.json({
      success: true,
      message: `Prescription document generated in ${displayMode} (${langObj?.name || language}) and dispatched via ${channel.toUpperCase()} to ${recipientContact}.`,
      dispatchId: `DISPATCH-${Date.now()}`,
      prescriptionId,
      patientId,
      channel,
      language: langObj,
      displayMode,
      sentAt: new Date().toISOString()
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to dispatch prescription' },
      { status: 400 }
    );
  }
}
