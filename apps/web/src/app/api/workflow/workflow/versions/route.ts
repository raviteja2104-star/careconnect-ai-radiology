import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [
      { version: 3, status: 'PUBLISHED', publishedAt: '2026-07-25', publishedBy: 'Dr. Raj Sharma', changeLog: 'Added AI Drug Interaction check step.' },
      { version: 2, status: 'DEPRECATED', publishedAt: '2026-07-10', publishedBy: 'Anita Desai', changeLog: 'Added ABDM Insurance check gateway.' },
      { version: 1, status: 'ARCHIVED', publishedAt: '2026-06-01', publishedBy: 'SysAdmin', changeLog: 'Initial baseline OPD workflow.' }
    ]
  });
}
