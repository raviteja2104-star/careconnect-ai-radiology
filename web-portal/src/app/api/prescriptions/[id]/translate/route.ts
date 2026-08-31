import { NextRequest, NextResponse } from 'next/server';
import { translateMedicalText, SUPPORTED_LANGUAGES } from '@/services/prescriptionTranslationService';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { targetLanguage = 'hi', prescriptions = [], diagnosis = '' } = body;

    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage);
    if (!langObj) {
      return NextResponse.json(
        { success: false, error: 'Unsupported target language' },
        { status: 400 }
      );
    }

    const translatedPrescriptions = prescriptions.map((p: { id: string; name: string; dose: string; frequency: string; duration: string; instructions: string }) => ({
      ...p,
      // Generic & brand names stay English as medical source of truth
      translatedName: p.name,
      translatedDose: p.dose,
      translatedFrequency: translateMedicalText(p.frequency, targetLanguage),
      translatedDuration: translateMedicalText(p.duration, targetLanguage),
      translatedInstructions: translateMedicalText(p.instructions, targetLanguage)
    }));

    const translatedDiagnosis = translateMedicalText(diagnosis, targetLanguage);

    return NextResponse.json({
      success: true,
      prescriptionId: id,
      targetLanguage,
      languageDetails: langObj,
      isCached: true,
      translatedDiagnosis,
      translatedPrescriptions,
      translatedAt: new Date().toISOString()
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to process translation request' },
      { status: 500 }
    );
  }
}
