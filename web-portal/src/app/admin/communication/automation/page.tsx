'use client';
import { Zap } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function CommunicationAutomationPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={Zap}
        title="Automations"
        description="Build trigger-based communication flows — appointment reminders 24 hours before, discharge follow-up at day 3, prescription refill nudges, and feedback requests. Automations run against live patient data once communication channels and event triggers are configured."
      />
    </div>
  );
}
