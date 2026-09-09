'use client';
import React, { useState } from 'react';
import { DoctorSelector } from '@/components/scheduling/DoctorSelector';
import { WeeklyPlanner } from '@/components/scheduling/WeeklyPlanner';
import { LeaveManager } from '@/components/scheduling/LeaveManager';
import { AddDoctorModal } from '@/components/scheduling/AddDoctorModal';
import { PageHeader } from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { CalendarDays, Calendar, ClipboardList } from 'lucide-react';

export default function SchedulingCalendarPage() {
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduling Calendar"
        description="Configure weekly shift templates, consultation slots, and leave management per resource."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Scheduling' }, { label: 'Calendar' }]}
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <DoctorSelector
          selected={selectedDoctor ?? ''}
          onSelect={setSelectedDoctor}
          onAddDoctor={() => setShowAddDoctor(true)}
        />

        <div className="min-w-0">
          {!selectedDoctor ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-center">
              <CalendarDays className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">Select a doctor to manage their schedule</p>
              <p className="mt-1 text-xs text-subtle-foreground">Configure shifts, leaves, and time slots</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="schedule" className="gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Weekly Schedule
                </TabsTrigger>
                <TabsTrigger value="leave" className="gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" /> Leave &amp; Time Off
                </TabsTrigger>
              </TabsList>

              <TabsContent value="schedule">
                <WeeklyPlanner doctorId={selectedDoctor} />
              </TabsContent>

              <TabsContent value="leave">
                <LeaveManager doctorId={selectedDoctor} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {showAddDoctor && (
        <AddDoctorModal
          onClose={() => setShowAddDoctor(false)}
          onCreated={() => setShowAddDoctor(false)}
        />
      )}
    </div>
  );
}
