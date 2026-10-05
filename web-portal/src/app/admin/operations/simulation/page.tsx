'use client';
import { FlaskConical } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function SimulationPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={FlaskConical}
        title="What-If Simulator"
        description="Model the operational impact of proposed changes before you make them — a new OT slot, an adjusted triage protocol, a change to bed allocation policy. The simulator runs discrete-event models against your hospital's historical flow data and requires the AI operations engine to be active."
      />
    </div>
  );
}
