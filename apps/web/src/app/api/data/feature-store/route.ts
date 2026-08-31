import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    features: [
      { name: 'news2_score', type: 'INTEGER', description: 'National Early Warning Score 2 (0-20)' },
      { name: 'sofa_score', type: 'INTEGER', description: 'Sequential Organ Failure Assessment' },
      { name: 'hba1c_latest', type: 'FLOAT', description: 'Most recent HbA1c lab percentage' },
      { name: 'readmissions_30d', type: 'INTEGER', description: 'Count of readmissions within 30 days' }
    ]
  });
}
