import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(`${BACKEND}/api/system/metrics`, { headers });
    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Metrics unavailable' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to reach backend' }, { status: 503 });
  }
}
