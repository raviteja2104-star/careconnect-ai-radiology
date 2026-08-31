import { NextResponse } from 'next/server';
import { SUPPORTED_LANGUAGES } from '@/services/prescriptionTranslationService';

export async function GET() {
  return NextResponse.json({
    success: true,
    count: SUPPORTED_LANGUAGES.length,
    languages: SUPPORTED_LANGUAGES
  });
}
