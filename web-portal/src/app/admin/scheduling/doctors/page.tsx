'use client';
import { UserRound } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function DoctorsSchedulingPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={UserRound}
        title="Doctor Roster"
        description="Manage consultant and resident rosters — availability windows, speciality assignments, consultation caps, and on-call rotations. Populate the doctor directory first to begin scheduling assignments."
      />
    </div>
  );
}
