import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    dashboards: [
      { id: 'dash-exec', name: 'Executive Operational & Financial Intelligence', widgetsCount: 12 },
      { id: 'dash-pop-health', name: 'Population Disease Management & Outcomes', widgetsCount: 8 },
      { id: 'dash-icu-twin', name: 'Hospital Digital Twin & Bed Flow Simulation', widgetsCount: 6 }
    ]
  });
}
