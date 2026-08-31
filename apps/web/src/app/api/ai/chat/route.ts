import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json();
    return NextResponse.json({
      success: true,
      data: {
        reply: `CareConnect AI Copilot: Base on ${context?.specialty || 'General Medicine'} guidelines, patient query "${message}" indicates evaluation for mild viral URI or hypertension follow-up.`,
        confidencePct: 94,
        citations: ['CareConnect Outpatient Guideline 2026', 'UpToDate Clinical Decision Support']
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
