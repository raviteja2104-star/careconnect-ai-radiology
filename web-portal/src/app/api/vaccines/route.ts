import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_PEDIATRIC_VACCINES } from '@/services/specialtyService';

type Vaccine = (typeof INITIAL_PEDIATRIC_VACCINES)[number];

// Per-user in-memory map — resets on server restart.
// TODO: Replace with a real VaccineRecord MongoDB model.
const userVaccineMap = new Map<string, Vaccine[]>();

function decodeJwtPayload(token: string): { id?: string; _id?: string; name?: string } | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

function getUser(request: NextRequest): { id: string; name: string } | null {
  const auth = request.headers.get('Authorization') || request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const decoded = decodeJwtPayload(auth.slice(7));
  if (!decoded) return null;
  const id = decoded.id || decoded._id;
  if (!id) return null;
  return { id, name: decoded.name || 'Patient' };
}

export async function GET(request: NextRequest) {
  const user = getUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!userVaccineMap.has(user.id)) {
    userVaccineMap.set(user.id, [...INITIAL_PEDIATRIC_VACCINES]);
  }

  return NextResponse.json({
    success: true,
    patientId: user.id,
    patientName: user.name,
    vaccines: userVaccineMap.get(user.id),
  });
}

export async function POST(request: NextRequest) {
  const user = getUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { vaccineId, status, givenDate, batchNo } = body;

    if (!userVaccineMap.has(user.id)) {
      userVaccineMap.set(user.id, [...INITIAL_PEDIATRIC_VACCINES]);
    }

    const vaccines = userVaccineMap.get(user.id)!.map(v => {
      if (v.id === vaccineId) {
        return {
          ...v,
          status,
          givenDate: givenDate || new Date().toISOString().split('T')[0],
          batchNo: batchNo || `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
        };
      }
      return v;
    });

    userVaccineMap.set(user.id, vaccines);

    return NextResponse.json({
      success: true,
      message: 'Vaccination record updated successfully',
      vaccines,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
