import { NextResponse } from 'next/server';
import { INITIAL_PEDIATRIC_VACCINES } from '@/services/specialtyService';

let vaccineDb = [...INITIAL_PEDIATRIC_VACCINES];

export async function GET() {
  return NextResponse.json({
    success: true,
    patientId: 'PT-0001234',
    patientName: 'Rohit Sharma (Child)',
    vaccines: vaccineDb
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vaccineId, status, givenDate, batchNo } = body;

    vaccineDb = vaccineDb.map(v => {
      if (v.id === vaccineId) {
        return {
          ...v,
          status,
          givenDate: givenDate || new Date().toISOString().split('T')[0],
          batchNo: batchNo || `LOT-${Math.floor(1000 + Math.random() * 9000)}`
        };
      }
      return v;
    });

    return NextResponse.json({
      success: true,
      message: 'Vaccination record updated successfully',
      vaccines: vaccineDb
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
