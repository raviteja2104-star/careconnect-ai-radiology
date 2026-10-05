'use client';
import { Stethoscope } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function ClinicalCommandPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={Stethoscope}
        title="Clinical Command"
        description="A unified clinical overview surface aggregating active care plans, pending orders, deteriorating patients, and pending lab criticals across all wards. Integration with the CareConnect clinical module is required before this view can display live data."
      />
    </div>
  );
}
