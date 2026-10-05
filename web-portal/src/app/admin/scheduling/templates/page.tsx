'use client';
import { LayoutTemplate } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function ScheduleTemplatesPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={LayoutTemplate}
        title="Schedule Templates"
        description="Save and reuse repeating shift patterns as named templates — ICU night rotation, OPD weekday block, weekend skeleton crew. Templates can be applied to any future date range and overridden per-day before publishing."
      />
    </div>
  );
}
