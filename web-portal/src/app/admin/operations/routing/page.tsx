'use client';
import { Navigation } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function SmartRoutingPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={Navigation}
        title="Smart Routing"
        description="Intelligent patient routing rules — auto-assign referrals to the best-matched consultant, balance diagnostic workloads across labs, and route emergency cases based on real-time unit capacity. Configure routing policies once the department directory and capacity feeds are connected."
      />
    </div>
  );
}
