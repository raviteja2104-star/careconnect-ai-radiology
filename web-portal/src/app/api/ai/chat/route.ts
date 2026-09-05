import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(`${BACKEND}/api/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'AI service unavailable' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to reach AI backend' }, { status: 503 });
  }
}
