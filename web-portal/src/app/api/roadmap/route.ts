import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    roadmap: [
      { quarter: '2026-Q3', milestone: 'v1.1 Production Hardening & Security Compliance', status: 'COMPLETED' },
      { quarter: '2026-Q4', milestone: 'v1.2 Pilot Deployments & Hospital LMS Training', status: 'IN_PROGRESS' },
      { quarter: '2027-Q1', milestone: 'v2.0 Commercial Multi-Region SaaS Scaling', status: 'PLANNED' }
    ]
  });
}
