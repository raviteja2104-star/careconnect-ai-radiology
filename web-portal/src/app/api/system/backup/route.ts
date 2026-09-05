import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Database backup is not yet implemented. Configure a backup service on the backend.' },
    { status: 501 }
  );
}
