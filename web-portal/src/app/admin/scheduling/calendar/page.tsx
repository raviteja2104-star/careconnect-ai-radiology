'use client';
import React, { useState } from 'react';
import { DoctorSelector } from '@/components/scheduling/DoctorSelector';
import { WeeklyPlanner } from '@/components/scheduling/WeeklyPlanner';
import { PageHeader } from '@/components/ui';

export default function SchedulingCalendarPage() {
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduling Calendar"
        description="Configure weekly shift templates, consultation slots and telemedicine availability per resource."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Scheduling' }, { label: 'Calendar' }]}
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <DoctorSelector selected={selectedDoctor || ''} onSelect={setSelectedDoctor} />

        <div className="min-w-0">
          <WeeklyPlanner doctorId={selectedDoctor} />
        </div>
      </div>
    </div>
  );
}
