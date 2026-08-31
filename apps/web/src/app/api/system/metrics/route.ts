import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    metrics: {
      activeWorkflows: 42,
      messagesProcessed24h: 18420,
      activeWebSocketConnections: 142,
      cacheHitRatePct: 98.4,
      avgDatabaseQueryTimeMs: 4.2
    }
  });
}
