'use client';
import { Receipt } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function InvoicesPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={Receipt}
        title="Invoices & Estimates"
        description="Generate, preview, and send patient invoices and advance estimates. Supports line-item breakdowns, GST computations, partial payment tracking, and PDF export. Connect the billing engine to begin issuing invoices."
      />
    </div>
  );
}
