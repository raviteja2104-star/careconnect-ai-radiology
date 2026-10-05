'use client';
import { Workflow } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function PatientFlowPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={Workflow}
        title="Patient Flow"
        description="End-to-end journey analytics from triage to discharge — wait times, throughput rates, bottleneck identification, and length-of-stay trends across all departments. This view will be available once the patient journey tracking module is connected."
      />
    </div>
  );
}
