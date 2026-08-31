import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [
      { id: 'prompt-soap-01', name: 'SOAP Clinical Scribe System Prompt', version: 3, category: 'EMR' },
      { id: 'prompt-icd10-02', name: 'ICD-10 Coding & Medical Necessity Prompt', version: 2, category: 'BILLING' },
      { id: 'prompt-cds-03', name: 'Drug Interaction & Sepsis Alert Guardrail', version: 4, category: 'CLINICAL' }
    ]
  });
}
