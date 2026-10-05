'use client';
import { BarChart2 } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function BillingReportsPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={BarChart2}
        title="Financial Reports"
        description="Revenue cycle reports — daily collections, outstanding receivables, payer mix, bad debt write-offs, and departmental revenue splits. Reports are generated from posted billing transactions; at least one billing period must be closed to produce data."
      />
    </div>
  );
}
