'use client';
import { BarChart3 } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function SchedulingAnalyticsPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={BarChart3}
        title="Scheduling Analytics"
        description="Utilisation reports for OT time, clinic slots, and bed days — showing unfilled slots, overtime trends, and department-level coverage ratios over rolling periods. Publish at least one schedule week to begin generating analytics."
      />
    </div>
  );
}
