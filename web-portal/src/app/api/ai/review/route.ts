import { NextResponse } from 'next/server';
import { aiPlatformService } from '@/services/aiPlatformService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: aiPlatformService.getReviews()
  });
}

export async function POST(req: Request) {
  try {
    const { reviewId, status, notes } = await req.json();
    const updated = aiPlatformService.submitReviewDecision(reviewId, status, notes);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
