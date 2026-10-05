'use client';
import { Layers } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function DigitalTwinPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={Layers}
        title="Digital Twin"
        description="A live simulation layer mirroring the hospital's physical footprint — beds, equipment, staff locations, and real-time patient positions — is under development. When connected to the ward management system it will project occupancy heatmaps, bottleneck alerts, and capacity forecasts onto an interactive floor plan."
      />
    </div>
  );
}
