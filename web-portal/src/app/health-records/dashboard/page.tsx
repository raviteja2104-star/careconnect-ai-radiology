'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ClipboardCheck, Stethoscope, AlertTriangle, FileClock, ExternalLink, WifiOff, ShieldAlert,
} from 'lucide-react';
import {
    PageHeader, StatCard, StatGrid, Badge, Button, DataTable, EmptyState, ErrorState,
    SkeletonCard, SkeletonTable, type Column,
} from '@/components/ui';
import { useSession } from '@/components/providers/SessionProvider';
import { CLINICAL_ROLES } from '@/lib/navigation';
import {
    fetchDashboard, actorIsDoctor,
    formatDateTime, documentTypeLabel,
    DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_TONE,
    type DashboardData, type HealthDocument, type LowConfidenceExtraction,
} from '../_lib/api';
import { ClinicalReviewActions } from '../_components/ClinicalReviewActions';

function patientLabel(patientId: HealthDocument['patientId']): string {
    if (typeof patientId === 'string') return patientId.slice(-8);
    return patientId.name || [patientId.firstName, patientId.lastName].filter(Boolean).join(' ') || patientId._id.slice(-8);
}

export default function HealthRecordsDashboardPage() {
    const { session, hydrated } = useSession();
    const router = useRouter();
    const isDoctor = actorIsDoctor(session);
    const allowed = !hydrated || CLINICAL_ROLES.includes(session.role);

    const [data, setData] = React.useState<DashboardData | null>(null);
    const [demo, setDemo] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [refreshKey, setRefreshKey] = React.useState(0);
    const refresh = React.useCallback(() => setRefreshKey((k) => k + 1), []);

    React.useEffect(() => {
        if (!allowed) { setLoading(false); return; }
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetchDashboard()
            .then((res) => { if (!cancelled) { setData(res.data); setDemo(res.demo); } })
            .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load the dashboard'))
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [allowed, refreshKey]);

    const removeFromClinicianQueue = (docId: string) => {
        setData((prev) => prev ? { ...prev, clinicianReviewRequired: prev.clinicianReviewRequired.filter((d) => d._id !== docId) } : prev);
    };

    const docColumns = (): Column<HealthDocument>[] => [
        {
            key: 'documentType', header: 'Document', sortable: true,
            cell: (d) => (
                <div className="min-w-0">
                    <p className="font-medium text-foreground">{documentTypeLabel(d.documentType)}</p>
                    <p className="text-xs text-muted-foreground">Patient {patientLabel(d.patientId)}</p>
                </div>
            ),
        },
        { key: 'status', header: 'Status', cell: (d) => <Badge tone={DOCUMENT_STATUS_TONE[d.status]}>{DOCUMENT_STATUS_LABELS[d.status]}</Badge> },
        { key: 'capturedBy', header: 'Captured by', cell: (d) => <span className="text-muted-foreground">{d.capturedBy?.role ?? '—'}</span> },
        { key: 'createdAt', header: 'Captured', sortable: true, accessor: (d) => d.createdAt, cell: (d) => formatDateTime(d.createdAt) },
    ];

    if (!allowed) {
        return (
            <div className="space-y-6">
                <PageHeader title="Review Dashboard" crumbs={[{ label: 'Home', href: '/' }, { label: 'Health Records', href: '/health-records' }, { label: 'Review Dashboard' }]} />
                <EmptyState icon={ShieldAlert} title="Staff access only" description="The Health Record Capture review dashboard is available to clinical and admin staff. You'll be redirected shortly." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Health Record Capture — Review Dashboard"
                description="Documents captured from paper records, awaiting first-pass review or doctor clinical verification."
                crumbs={[{ label: 'Home', href: '/' }, { label: 'Health Records', href: '/health-records' }, { label: 'Review Dashboard' }]}
                actions={demo ? <Badge tone="warning" dot pulse><WifiOff className="h-3.5 w-3.5" aria-hidden /> Backend offline</Badge> : undefined}
            />

            {error ? (
                <ErrorState onRetry={refresh} description={error} />
            ) : loading ? (
                <div className="space-y-6">
                    <StatGrid>{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}</StatGrid>
                    <SkeletonTable rows={5} />
                </div>
            ) : demo && (!data || (data.awaitingReview.length === 0 && data.clinicianReviewRequired.length === 0 && data.recentDocuments.length === 0)) ? (
                <EmptyState
                    icon={WifiOff}
                    title="Requires a live backend connection"
                    description="The review dashboard reads real captured documents only. Start the backend at localhost:5000 and reload."
                    action={{ label: 'Retry', onClick: refresh }}
                />
            ) : (
                <>
                    <StatGrid>
                        <StatCard label="Awaiting review" value={data?.awaitingReview.length ?? 0} icon={FileClock} tone="amber" delay={0} />
                        <StatCard label="Clinician review required" value={data?.clinicianReviewRequired.length ?? 0} icon={Stethoscope} tone="rose" delay={0.05} />
                        <StatCard label="Low-confidence extractions" value={data?.lowConfidenceExtractions.length ?? 0} icon={AlertTriangle} tone="violet" delay={0.1} />
                        <StatCard label="Recently added" value={data?.recentDocuments.length ?? 0} icon={ClipboardCheck} tone="brand" delay={0.15} />
                    </StatGrid>

                    <div className="rounded-2xl border-2 border-rose-300/60 bg-rose-50/40 p-1 dark:border-rose-500/30 dark:bg-rose-500/5">
                        <div className="rounded-xl bg-card p-4">
                            <div className="mb-3 flex items-center gap-2">
                                <Stethoscope className="h-4.5 w-4.5 text-danger" aria-hidden />
                                <h2 className="text-base font-semibold text-foreground">Clinician Review Required</h2>
                                <span className="text-xs text-muted-foreground">— needs a doctor&apos;s clinical sign-off</span>
                            </div>
                            {(data?.clinicianReviewRequired.length ?? 0) === 0 ? (
                                <EmptyState icon={Stethoscope} title="Nothing pending" description="No documents are currently waiting on a doctor's clinical verification." />
                            ) : (
                                <div className="space-y-3">
                                    {data!.clinicianReviewRequired.map((doc) => (
                                        <div key={doc._id} className="rounded-xl border border-border p-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <p className="font-medium text-foreground">{documentTypeLabel(doc.documentType)}</p>
                                                    <p className="text-xs text-muted-foreground">Patient {patientLabel(doc.patientId)} · Captured {formatDateTime(doc.createdAt)} by {doc.capturedBy?.role ?? '—'}</p>
                                                </div>
                                                <Link href={`/health-records/documents/${doc._id}`}>
                                                    <Button size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5" aria-hidden /> Open document</Button>
                                                </Link>
                                            </div>
                                            {doc.structuredRecord?.model && doc.structuredRecord?.id && (
                                                <div className="mt-3 border-t border-border pt-3">
                                                    <ClinicalReviewActions
                                                        model={doc.structuredRecord.model}
                                                        id={doc.structuredRecord.id}
                                                        status="CLINICIAN_REVIEW_REQUIRED"
                                                        isDoctor={isDoctor}
                                                        dense
                                                        onReviewed={() => removeFromClinicianQueue(doc._id)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h2 className="mb-3 text-base font-semibold text-foreground">Awaiting Review</h2>
                        {(data?.awaitingReview.length ?? 0) === 0 ? (
                            <EmptyState icon={FileClock} title="Queue is clear" description="No documents are waiting on first-pass review." />
                        ) : (
                            <DataTable<HealthDocument>
                                columns={docColumns()}
                                data={data!.awaitingReview}
                                rowKey={(d) => d._id}
                                exportName="health-records-awaiting-review"
                                onRowClick={(d) => router.push(`/health-records/documents/${d._id}`)}
                                emptyTitle="Queue is clear"
                            />
                        )}
                    </div>

                    <div>
                        <h2 className="mb-3 text-base font-semibold text-foreground">Low-Confidence Extractions</h2>
                        {(data?.lowConfidenceExtractions.length ?? 0) === 0 ? (
                            <EmptyState icon={AlertTriangle} title="No low-confidence fields" description="Nothing the AI extracted with low confidence right now." />
                        ) : (
                            <DataTable<LowConfidenceExtraction>
                                columns={[
                                    { key: 'classification', header: 'Document type', cell: (e) => e.classification ? documentTypeLabel(e.classification) : '—' },
                                    { key: 'createdAt', header: 'Extracted', sortable: true, accessor: (e) => e.createdAt, cell: (e) => formatDateTime(e.createdAt) },
                                ]}
                                data={data!.lowConfidenceExtractions}
                                rowKey={(e, i) => `${e.documentId}-${i}`}
                                exportName="health-records-low-confidence"
                                onRowClick={(e) => router.push(`/health-records/documents/${e.documentId}`)}
                                rowActions={(e) => (
                                    <Link href={`/health-records/documents/${e.documentId}`}>
                                        <Button size="sm" variant="ghost"><ExternalLink className="h-3.5 w-3.5" aria-hidden /> Open</Button>
                                    </Link>
                                )}
                                emptyTitle="No low-confidence fields"
                            />
                        )}
                    </div>

                    <div>
                        <h2 className="mb-3 text-base font-semibold text-foreground">Recently Added</h2>
                        <DataTable<HealthDocument>
                            columns={docColumns()}
                            data={data?.recentDocuments ?? []}
                            rowKey={(d) => d._id}
                            exportName="health-records-recent"
                            onRowClick={(d) => window.open(`/health-records/documents/${d._id}`, '_self')}
                            emptyTitle="No documents captured yet"
                        />
                    </div>
                </>
            )}
        </div>
    );
}
