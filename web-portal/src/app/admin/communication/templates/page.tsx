'use client';
import { MessageSquareDiff } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function CommunicationTemplatesPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={MessageSquareDiff}
        title="Template Builder"
        description="Create and manage message templates for SMS, WhatsApp, email, and push channels. Templates support dynamic variables, multi-language versions, and regulatory approval tracking for promotional content. Set up your communication channel credentials to activate template publishing."
      />
    </div>
  );
}
