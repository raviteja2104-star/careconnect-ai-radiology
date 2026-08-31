import { NextResponse } from 'next/server';
import { ALL_SPECIALTIES } from '@/services/specialtyService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const specialty = ALL_SPECIALTIES.find(s => s.id === id);

  if (!specialty) {
    return NextResponse.json(
      { success: false, error: 'Specialty template not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    specialtyId: specialty.id,
    specialtyName: specialty.name,
    category: specialty.category,
    defaultWidgets: specialty.defaultWidgets,
    aiPromptContext: specialty.aiPromptContext,
    layoutConfig: {
      gridCols: 3,
      themeColor: 'indigo',
      pinnedWidgets: specialty.defaultWidgets
    }
  });
}
