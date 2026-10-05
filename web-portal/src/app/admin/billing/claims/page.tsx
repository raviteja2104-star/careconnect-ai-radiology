'use client';
import { ShieldCheck } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function ClaimsPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={ShieldCheck}
        title="Insurance Claims"
        description="Submit, track, and reconcile TPA and cashless insurance claims. Manages pre-authorisation requests, claim status tracking, denial management, and payer-wise reconciliation. Configure your TPA integrations to activate claims processing."
      />
    </div>
  );
}
