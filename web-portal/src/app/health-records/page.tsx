'use client';

import * as React from 'react';
import Link from 'next/link';
import {
    FileText, Pill, FlaskConical, ScanLine, Stethoscope, Calendar, User as UserIcon,
    AlertTriangle, HeartPulse, Scissors, Users2, ChevronDown, ChevronRight, ExternalLink, WifiOff,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription, CardContent,
    Badge, Button, Timeline, TimelineItem, EmptyState, ErrorState, SkeletonCard, SkeletonTable,
} from '@/components/ui';
import { useSession } from '@/components/providers/SessionProvider';
import {
    fetchSummary, fetchTimeline, ApiHttpError, actorIsDoctor,
    formatDate, formatDateTime, toClinicalReviewModel,
    RECORD_STATUS_TONE,
    type PatientSummary, type TimelineEntry, type TimelineRecordType,
    type PrescriptionRecord, type LabReportRecord, type DiagnosticReportRecord,
} from './_lib/api';
import { ClinicalReviewActions } from './_components/ClinicalReviewActions';

const RECORD_TYPE_META: Record<TimelineRecordType, { icon: LucideIcon; label: string; tone: 'brand' | 'success' | 'warning' | 'danger' | 'neutral' }> = {
    HEALTH_DOCUMENT: { icon: FileText, label: 'Captured document', tone: 'brand' },
    PRESCRIPTION: { icon: Pill, label: 'Prescription', tone: 'success' },
    LAB_REPORT: { icon: FlaskConical, label: 'Lab report', tone: 'warning' },
    DIAGNOSTIC_REPORT: { icon: ScanLine, label: 'Diagnostic report', tone: 'neutral' },
    CONSULTATION: { icon: Stethoscope, label: 'Consultation', tone: 'brand' },
};

function statusTone(status: string | null): 'success' | 'warning' | 'neutral' | 'danger' | 'info' {
    if (!status) return 'neutral';
    return (RECORD_STATUS_TONE as Record<string, 'success' | 'warning' | 'neutral' | 'danger' | 'info'>)[status] ?? 'neutral';
}

type StructuredRecord = PrescriptionRecord | LabReportRecord | DiagnosticReportRecord;

function findStructuredRecord(summary: PatientSummary | null, recordType: TimelineRecordType, recordId: string): StructuredRecord | null {
    if (!summary) return null;
    if (recordType === 'PRESCRIPTION') return summary.prescriptions.find((r) => r._id === recordId) ?? null;
    if (recordType === 'LAB_REPORT') return summary.labReports.find((r) => r._id === recordId) ?? null;
    if (recordType === 'DIAGNOSTIC_REPORT') return summary.diagnosticReports.find((r) => r._id === recordId) ?? null;
    return null;
}

function Chips({ items, tone = 'neutral' }: { items: string[]; tone?: 'neutral' | 'danger' | 'info' }) {
    if (items.length === 0) return <p className="text-sm text-muted-foreground">None on record.</p>;
    return (
        <div className="flex flex-wrap gap-1.5">
            {items.map((item, i) => <Badge key={`${item}-${i}`} tone={tone}>{item}</Badge>)}
        </div>
    );
}

function StructuredRecordDetail({ record, recordType }: { record: StructuredRecord; recordType: TimelineRecordType }) {
    if (recordType === 'PRESCRIPTION') {
        const rx = record as PrescriptionRecord;
        return (
            <div className="space-y-2 text-sm">
                {rx.doctorName && <p><span className="text-muted-foreground">Doctor: </span>{rx.doctorName}</p>}
                {rx.diagnosis.length > 0 && <p><span className="text-muted-foreground">Diagnosis: </span>{rx.diagnosis.join(', ')}</p>}
                <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs text-muted-foreground">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium">Medication</th>
                                <th className="px-3 py-2 text-left font-medium">Strength</th>
                                <th className="px-3 py-2 text-left font-medium">Frequency</th>
                                <th className="px-3 py-2 text-left font-medium">Duration</th>
                                <th className="px-3 py-2 text-left font-medium">Confidence</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rx.medications.map((m, i) => (
                                <tr key={i}>
                                    <td className="px-3 py-2 font-medium text-foreground">{m.name ?? '—'}</td>
                                    <td className="px-3 py-2 text-muted-foreground">{m.strength ?? '—'}</td>
                                    <td className="px-3 py-2 text-muted-foreground">{m.frequency ?? '—'}</td>
                                    <td className="px-3 py-2 text-muted-foreground">{m.duration ?? '—'}</td>
                                    <td className="px-3 py-2">{m.confidenceLevel ? <Badge tone={statusTone(m.confidenceLevel)}>{m.confidenceLevel}</Badge> : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
    if (recordType === 'LAB_REPORT') {
        const lr = record as LabReportRecord;
        return (
            <div className="space-y-2 text-sm">
                {lr.labName && <p><span className="text-muted-foreground">Lab: </span>{lr.labName}</p>}
                <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs text-muted-foreground">
                            <tr>
                                <th className="px-3 py-2 text-left font-medium">Test</th>
                                <th className="px-3 py-2 text-left font-medium">Result</th>
                                <th className="px-3 py-2 text-left font-medium">Reference range</th>
                                <th className="px-3 py-2 text-left font-medium">Flag</th>
                                <th className="px-3 py-2 text-left font-medium">Confidence</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {lr.results.map((r, i) => (
                                <tr key={i}>
                                    <td className="px-3 py-2 font-medium text-foreground">{r.testName ?? '—'}</td>
                                    <td className="px-3 py-2 text-muted-foreground">{r.result ?? '—'} {r.unit ?? ''}</td>
                                    <td className="px-3 py-2 text-muted-foreground">{r.referenceRange ?? '—'}</td>
                                    <td className="px-3 py-2">{r.flag ? <Badge tone="warning">{r.flag}</Badge> : '—'}</td>
                                    <td className="px-3 py-2">{r.confidenceLevel ? <Badge tone={statusTone(r.confidenceLevel)}>{r.confidenceLevel}</Badge> : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
    const dr = record as DiagnosticReportRecord;
    return (
        <div className="space-y-1.5 text-sm">
            {dr.modality && <p><span className="text-muted-foreground">Modality: </span>{dr.modality}</p>}
            {dr.findings && <p><span className="text-muted-foreground">Findings: </span>{dr.findings}</p>}
            {dr.impression && <p><span className="text-muted-foreground">Impression: </span>{dr.impression}</p>}
        </div>
    );
}

export default function HealthRecordsPage() {
    const { session } = useSession();
    const patientId = session.userId;
    const isDoctor = actorIsDoctor(session);

    const [summary, setSummary] = React.useState<PatientSummary | null>(null);
    const [timeline, setTimeline] = React.useState<TimelineEntry[]>([]);
    const [demo, setDemo] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [refreshKey, setRefreshKey] = React.useState(0);
    const refresh = React.useCallback(() => setRefreshKey((k) => k + 1), []);

    const [expanded, setExpanded] = React.useState<string | null>(null);

    React.useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        Promise.all([fetchSummary(patientId), fetchTimeline(patientId)])
            .then(([summaryRes, timelineRes]) => {
                if (cancelled) return;
                setSummary(summaryRes.data);
                setTimeline(timelineRes.data);
                setDemo(summaryRes.demo || timelineRes.demo);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err instanceof ApiHttpError ? err.message : err instanceof Error ? err.message : 'Failed to load health records');
            })
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [patientId, refreshKey]);

    const applyReviewedRecord = (recordType: TimelineRecordType, updated: StructuredRecord) => {
        setSummary((prev) => {
            if (!prev) return prev;
            if (recordType === 'PRESCRIPTION') return { ...prev, prescriptions: prev.prescriptions.map((r) => r._id === updated._id ? { ...r, ...updated } as PrescriptionRecord : r) };
            if (recordType === 'LAB_REPORT') return { ...prev, labReports: prev.labReports.map((r) => r._id === updated._id ? { ...r, ...updated } as LabReportRecord : r) };
            if (recordType === 'DIAGNOSTIC_REPORT') return { ...prev, diagnosticReports: prev.diagnosticReports.map((r) => r._id === updated._id ? { ...r, ...updated } as DiagnosticReportRecord : r) };
            return prev;
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Health Records"
                description="Every document a doctor, nurse or receptionist has captured for you, plus AI-extracted prescriptions, lab reports and diagnostics — each shown with its human review status."
                crumbs={[{ label: 'Home', href: '/' }, { label: 'Health Records' }]}
                actions={demo ? <Badge tone="warning" dot pulse><WifiOff className="h-3.5 w-3.5" aria-hidden /> Backend offline</Badge> : undefined}
            />

            {error ? (
                <ErrorState onRetry={refresh} description={error} />
            ) : loading ? (
                <div className="space-y-6">
                    <StatGrid>{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}</StatGrid>
                    <SkeletonTable rows={5} />
                </div>
            ) : demo && !summary ? (
                <EmptyState
                    icon={WifiOff}
                    title="Requires a live backend connection"
                    description="Health Record Capture reads real medical data only — nothing here is simulated. Start the backend at localhost:5000 and reload to see your timeline, documents and extracted records."
                    action={{ label: 'Retry', onClick: refresh }}
                />
            ) : (
                <>
                    <StatGrid>
                        <StatCard label="Documents captured" value={summary?.documentCounts.total ?? 0} icon={FileText} tone="brand" delay={0} />
                        <StatCard label="Awaiting review" value={summary?.documentCounts.reviewRequired ?? 0} icon={AlertTriangle} tone="amber" delay={0.05} />
                        <StatCard label="Active medications" value={summary?.medications.length ?? 0} icon={Pill} tone="emerald" delay={0.1} />
                        <StatCard label="Known allergies" value={summary?.allergies.length ?? 0} icon={HeartPulse} tone="rose" delay={0.15} />
                    </StatGrid>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base"><UserIcon className="h-4 w-4" aria-hidden /> Demographics</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1.5 pt-0 text-sm">
                                    <p className="font-semibold text-foreground">{summary?.demographics.name ?? '—'}</p>
                                    <p className="text-muted-foreground">DOB: {summary?.demographics.dateOfBirth ? formatDate(summary.demographics.dateOfBirth) : '—'}</p>
                                    <p className="text-muted-foreground">Gender: {summary?.demographics.gender ?? '—'}</p>
                                    {summary?.demographics.bloodGroup && <Badge tone="danger">{summary.demographics.bloodGroup}</Badge>}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-danger" aria-hidden /> Allergies</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0"><Chips items={summary?.allergies ?? []} tone="danger" /></CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base"><HeartPulse className="h-4 w-4" aria-hidden /> Chronic conditions</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0"><Chips items={summary?.chronicDiseases ?? []} tone="info" /></CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base"><Pill className="h-4 w-4" aria-hidden /> Current medications</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0"><Chips items={summary?.medications ?? []} /></CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base"><Scissors className="h-4 w-4" aria-hidden /> Surgeries</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0"><Chips items={summary?.surgeries ?? []} /></CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base"><Users2 className="h-4 w-4" aria-hidden /> Family history</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0"><Chips items={summary?.familyHistory ?? []} /></CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Timeline</CardTitle>
                                    <CardDescription>Newest first — every captured document and extracted record, with its human review status.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {timeline.length === 0 ? (
                                        <EmptyState icon={FileText} title="No health records yet" description="Once a document is captured (by you, a caregiver, or clinical staff), it will show up here." />
                                    ) : (
                                        <Timeline>
                                            {timeline.map((entry, i) => {
                                                const meta = RECORD_TYPE_META[entry.recordType];
                                                const Icon = meta.icon;
                                                const key = `${entry.recordType}-${entry.recordId}-${i}`;
                                                const isExpandable = entry.recordType !== 'HEALTH_DOCUMENT' && entry.recordType !== 'CONSULTATION';
                                                const isOpen = expanded === key;
                                                const structured = isExpandable ? findStructuredRecord(summary, entry.recordType, entry.recordId) : null;
                                                const reviewModel = toClinicalReviewModel(entry.recordType);

                                                return (
                                                    <TimelineItem
                                                        key={key}
                                                        icon={Icon}
                                                        tone={meta.tone}
                                                        title={entry.summary || meta.label}
                                                        meta={
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <Calendar className="h-3 w-3" aria-hidden />
                                                                {formatDateTime(entry.date)}
                                                            </span>
                                                        }
                                                    >
                                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                                            <Badge tone="outline">{meta.label}</Badge>
                                                            {entry.verificationStatus && <Badge tone={statusTone(entry.verificationStatus)}>{entry.verificationStatus}</Badge>}
                                                            {entry.uploadedBy && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    by {entry.uploadedBy}{entry.uploadedByRole ? ` (${entry.uploadedByRole})` : ''}
                                                                </span>
                                                            )}
                                                            {entry.source && <span className="text-xs text-subtle-foreground">· {entry.source}</span>}
                                                        </div>

                                                        <div className="mt-2">
                                                            {entry.recordType === 'HEALTH_DOCUMENT' ? (
                                                                <Link href={`/health-records/documents/${entry.recordId}`}>
                                                                    <Button size="sm" variant="outline">
                                                                        <ExternalLink className="h-3.5 w-3.5" aria-hidden /> View document
                                                                    </Button>
                                                                </Link>
                                                            ) : isExpandable ? (
                                                                <Button size="sm" variant="ghost" onClick={() => setExpanded(isOpen ? null : key)}>
                                                                    {isOpen ? <ChevronDown className="h-3.5 w-3.5" aria-hidden /> : <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
                                                                    {isOpen ? 'Hide details' : 'View details'}
                                                                </Button>
                                                            ) : null}
                                                        </div>

                                                        {isOpen && (
                                                            <div className="mt-3 space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                                                                {structured ? (
                                                                    <>
                                                                        <StructuredRecordDetail record={structured} recordType={entry.recordType} />
                                                                        {reviewModel && (
                                                                            <div className="border-t border-border pt-3">
                                                                                <ClinicalReviewActions
                                                                                    model={reviewModel}
                                                                                    id={structured._id}
                                                                                    status={structured.status}
                                                                                    isDoctor={isDoctor}
                                                                                    onReviewed={(rec) => applyReviewedRecord(entry.recordType, rec)}
                                                                                    dense
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <p className="text-sm text-muted-foreground">Structured record detail isn&apos;t available in your current summary — try refreshing.</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </TimelineItem>
                                                );
                                            })}
                                        </Timeline>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
