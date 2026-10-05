'use client';
import { Clock } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function ShiftsPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={Clock}
        title="Shift Management"
        description="Create and publish shift schedules for nursing staff, residents, and support teams. Supports rolling 4-week blocks, auto-fill from templates, and conflict detection when a staff member is double-booked or below minimum rest hours."
      />
    </div>
  );
}
