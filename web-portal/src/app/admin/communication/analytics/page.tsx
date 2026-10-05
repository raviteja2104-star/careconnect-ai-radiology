'use client';
import { LineChart } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function CommunicationAnalyticsPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={LineChart}
        title="Performance"
        description="Delivery rates, open rates, click-through rates, and opt-out trends across all communication channels. Breaks down by template, audience segment, and time window. Analytics populate once outbound messages are dispatched through the platform."
      />
    </div>
  );
}
