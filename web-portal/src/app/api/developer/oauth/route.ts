import { NextResponse } from 'next/server';
import { developerPlatformService } from '@/services/developerPlatformService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: developerPlatformService.getOAuthApps()
  });
}

export async function POST(req: Request) {
  try {
    const { appName, developerEmail, redirectUris, allowedScopes } = await req.json();
    const created = {
      clientId: `client_${Date.now()}`,
      clientSecret: `sec_${Date.now()}_secretkey`,
      appName,
      developerEmail,
      redirectUris: redirectUris || [],
      allowedScopes: allowedScopes || ['read:patient'],
      rateLimitPerMin: 1000,
      status: 'ACTIVE'
    };
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
