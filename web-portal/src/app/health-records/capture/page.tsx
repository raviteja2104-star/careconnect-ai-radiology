'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ScanLine } from 'lucide-react';
import { PageHeader, Card, CardContent } from '@/components/ui';
import { useSession } from '@/components/providers/SessionProvider';
import { DocumentScanner } from '@/components/health-records/DocumentScanner';
import type { DocumentType, DocumentAndExtraction } from '@/app/health-records/_lib/capture-api';
import { DOCUMENT_TYPE_LABELS } from '@/app/health-records/_lib/capture-api';

function CaptureContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { session } = useSession();

    const typeParam = searchParams.get('type');
    const defaultDocumentType: DocumentType | undefined =
        typeParam && typeParam in DOCUMENT_TYPE_LABELS ? (typeParam as DocumentType) : undefined;

    const handleUploaded = React.useCallback((result: DocumentAndExtraction) => {
        router.push(`/health-records/documents/${result.document._id}`);
    }, [router]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Add Health Record"
                description="Photograph or upload a paper medical document — a prescription, lab report, or discharge summary — and Claude will read it. You'll review every field before it becomes part of your record."
                crumbs={[{ label: 'Home', href: '/' }, { label: 'Health Records', href: '/health-records' }, { label: 'Add Health Record' }]}
            />

            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex items-start gap-3 p-5">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ScanLine className="h-4 w-4" aria-hidden />
                    </span>
                    <p className="text-sm text-muted-foreground">
                        AI-extracted fields are never treated as confirmed medical fact. After upload, you&apos;ll accept,
                        edit, or reject each field the AI read before it&apos;s saved as a structured record.
                    </p>
                </CardContent>
            </Card>

            <DocumentScanner
                patientId={session.userId}
                defaultDocumentType={defaultDocumentType}
                onUploaded={handleUploaded}
            />
        </div>
    );
}

export default function HealthRecordCapturePage() {
    return (
        <React.Suspense fallback={null}>
            <CaptureContent />
        </React.Suspense>
    );
}
