'use client';
import { TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function FormsAnalyticsPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={TrendingUp}
        title="Forms Analytics"
        description="Response-level analytics for every published form — drop-off rates by field, median completion time, device breakdown, and language usage distribution. Analytics will appear once submitted responses are collected."
      />
    </div>
  );
}
