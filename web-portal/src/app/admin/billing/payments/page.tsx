'use client';
import { CreditCard } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function PaymentsPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={CreditCard}
        title="Payment Gateway"
        description="View and reconcile payment transactions across cash, card, UPI, and online channels. Supports refund initiation, payment link generation, and settlement reports. Payment gateway credentials must be configured before transactions appear here."
      />
    </div>
  );
}
