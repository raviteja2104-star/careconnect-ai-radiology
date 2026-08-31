import { NextResponse } from 'next/server';
import { CLINICAL_CALCULATORS } from '@/services/specialtyService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const specialtyId = searchParams.get('specialtyId');

  let list = Object.values(CLINICAL_CALCULATORS);
  if (specialtyId) {
    list = list.filter(c => c.specialtyId === specialtyId);
  }

  return NextResponse.json({
    success: true,
    calculators: list.map(c => ({
      id: c.id,
      name: c.name,
      specialtyId: c.specialtyId,
      description: c.description,
      inputs: c.inputs
    }))
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { calculatorId, inputs } = body;

    const calc = CLINICAL_CALCULATORS[calculatorId];
    if (!calc) {
      return NextResponse.json({ success: false, error: 'Calculator not found' }, { status: 404 });
    }

    const result = calc.calculate(inputs || {});
    return NextResponse.json({
      success: true,
      calculatorId,
      result
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
