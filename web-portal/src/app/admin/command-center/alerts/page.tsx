'use client';
import { BellRing } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function AlertCenterPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={BellRing}
        title="Alert Center"
        description="A consolidated feed of system-wide operational and clinical alerts — escalation timers, unacknowledged criticals, and SLA breach warnings — with routing, snooze, and assignment controls. Alert routing rules are configured once the notification module is set up."
      />
    </div>
  );
}
