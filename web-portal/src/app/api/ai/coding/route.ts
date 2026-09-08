import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { clinicalText } = await req.json();
    return NextResponse.json({
      success: true,
      data: {
        icd10: [
          { code: 'I10', description: 'Essential (primary) hypertension', confidencePct: 98 },
          { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', confidencePct: 94 }
        ],
        cpt: [
          { code: '99214', description: 'Office consultation established patient moderate complexity', confidencePct: 96 }
        ]
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
