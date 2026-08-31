import { NextResponse } from 'next/server';
import { authService } from '@/services/authService';

export async function GET() {
  return NextResponse.json({
    success: true,
    user: authService.getCurrentSession(),
    policy: authService.getSecurityPolicy()
  });
}
