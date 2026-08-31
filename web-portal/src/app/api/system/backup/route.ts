import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    success: true,
    data: {
      backupId: `BKUP-${Date.now()}`,
      status: 'COMPLETED',
      sizeBytes: 148204910,
      timestamp: new Date().toISOString(),
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    }
  });
}
