import { NextResponse } from 'next/server';
import { productionHardeningService } from '@/services/productionHardeningService';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: productionHardeningService.getGoLiveChecklist()
  });
}
