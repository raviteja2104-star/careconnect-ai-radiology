'use client';
import { FileCheck } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function ConsentVaultPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={FileCheck}
        title="Consent Vault"
        description="A tamper-evident archive of all signed patient consents — surgical, anaesthesia, research, and data processing. Each record stores the signed document, signature metadata, and witness details. Signed consents will appear here as they are collected through the eForms workflow."
      />
    </div>
  );
}
