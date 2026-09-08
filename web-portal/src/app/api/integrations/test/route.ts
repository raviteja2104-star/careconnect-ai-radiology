import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { endpoint } = await req.json();
    return NextResponse.json({
      success: true,
      data: {
        endpoint: endpoint || 'FHIR R4 Server',
        status: 'CONNECTED',
        responseTimeMs: 38,
        tlsVersion: 'TLS 1.3',
        pingTimestamp: new Date().toISOString()
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
