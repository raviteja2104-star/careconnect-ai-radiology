'use client';
import { Lightbulb } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function RecommendationsPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={Lightbulb}
        title="Action Center"
        description="AI-generated operational recommendations surfaced from anomaly detection — overstaffed shifts, underutilised OT blocks, high-readmission discharge cohorts, and supply reorder triggers. Recommendations appear once the AI operations engine has processed at least 30 days of operational data."
      />
    </div>
  );
}
