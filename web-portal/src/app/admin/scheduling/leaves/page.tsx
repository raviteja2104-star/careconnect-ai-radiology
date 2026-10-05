'use client';
import { CalendarOff } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function LeavesPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={CalendarOff}
        title="Leave Management"
        description="Approve or reject leave requests, view team-level absence calendars, and track leave balances by type — casual, earned, sick, and compensatory. The leave module will be active once staff accounts are provisioned."
      />
    </div>
  );
}
