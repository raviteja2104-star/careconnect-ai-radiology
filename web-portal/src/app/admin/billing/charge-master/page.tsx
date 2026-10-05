'use client';
import { ListOrdered } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function ChargeMasterPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={ListOrdered}
        title="Charge Master"
        description="Maintain the hospital's master price list — procedure codes, service rates, package bundles, and payer-specific pricing overrides. Charge master entries drive invoice line items and claim amounts. Seed the charge master from the billing configuration."
      />
    </div>
  );
}
