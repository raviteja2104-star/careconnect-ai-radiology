'use client';
import { LayoutDashboard } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function FormsDashboardPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={LayoutDashboard}
        title="eForms Dashboard"
        description="An overview of all active forms — submission counts, completion rates, pending signatures, and forms expiring soon. The dashboard populates once published forms begin receiving responses."
      />
    </div>
  );
}
