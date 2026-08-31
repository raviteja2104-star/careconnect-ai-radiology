import { NextRequest, NextResponse } from 'next/server';
import { SUPPORTED_LANGUAGES } from '@/services/prescriptionTranslationService';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({
    success: true,
    patientId: id,
    preferredLanguage: 'te', // Default mock: Telugu
    languageDetails: SUPPORTED_LANGUAGES.find(l => l.code === 'te')
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { preferredLanguage } = body;

    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === preferredLanguage);
    if (!langObj) {
      return NextResponse.json(
        { success: false, error: 'Unsupported language code' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      patientId: id,
      updatedPreferredLanguage: preferredLanguage,
      languageDetails: langObj,
      updatedAt: new Date().toISOString()
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid payload' },
      { status: 400 }
    );
  }
}
