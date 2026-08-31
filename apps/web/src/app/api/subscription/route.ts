import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    plans: [
      { name: 'ENTERPRISE_UNLIMITED', priceUsd: 14500, doctors: 'UNLIMITED', aiTokens: '10M/mo' },
      { name: 'HOSPITAL_CORE', priceUsd: 8200, doctors: 150, aiTokens: '3M/mo' },
      { name: 'CLINIC_STARTER', priceUsd: 2400, doctors: 25, aiTokens: '500k/mo' }
    ]
  });
}
