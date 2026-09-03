import { NextResponse } from 'next/server';
import { ALL_SPECIALTIES } from '@/services/specialtyService';

export async function GET() {
  return NextResponse.json({
    success: true,
    total: ALL_SPECIALTIES.length,
    specialties: ALL_SPECIALTIES
  });
}
