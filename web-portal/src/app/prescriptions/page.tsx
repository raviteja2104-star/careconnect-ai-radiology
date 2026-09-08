'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, CheckCircle2, AlertTriangle, Clock, Pill,
  Calendar as CalendarIcon, WifiOff, Filter,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Badge, Button, DataTable,
  EmptyState, ErrorState, SkeletonCard, SkeletonTable, Tabs, TabsList, TabsTrigger,
  type Column,
} from '@/components/ui';
import { useSession } from '@/components/providers/SessionProvider';
import {
  fetchSummary, formatDate, RECORD_STATUS_TONE, RECORD_STATUS_LABELS,
  type PrescriptionRecord, type RecordStatus,
} from '@/app/health-records/_lib/api';

type FilterTab = 'ALL' | 'VERIFIED' | 'REVIEW_REQUIRED' | 'DRAFT_EXTRACTED';

const columns: Column<PrescriptionRecord>[] = [
  {
    key: '_id',
    header: 'Prescription',
    sortable: true,
    accessor: (rx) => rx.doctorName ?? rx._id,
    cell: (rx) => (
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <FileText className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="font-semibold text-foreground">{rx.doctorName ?? 'Unknown doctor'}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarIcon className="h-3 w-3" aria-hidden /> {formatDate(rx.prescriptionDate)}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: 'diagnosis',
    header: 'Diagnosis',
    accessor: (rx) => rx.diagnosis.join(', ') || '—',
    cell: (rx) => (
      <div className="flex flex-wrap gap-1">
        {rx.diagnosis.length === 0 ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          rx.diagnosis.slice(0, 3).map((d, i) => (
            <Badge key={i} tone="outline" className="text-xs">{d}</Badge>
          ))
        )}
        {rx.diagnosis.length > 3 && (
          <Badge tone="neutral" className="text-xs">+{rx.diagnosis.length - 3}</Badge>
        )}
      </div>
    ),
  },
  {
    key: 'medications',
    header: 'Medications',
    accessor: (rx) => rx.medications.length,
    cell: (rx) => (
      <div>
        {rx.medications.length === 0 ? (
          <span className="text-xs text-muted-foreground">None extracted</span>
        ) : (
          <>
            {rx.medications.slice(0, 3).map((med, i) => (
              <p key={i} className="flex items-center gap-1 text-xs text-foreground">
                <Pill className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                {med.name}
              </p>
            ))}
            {rx.medications.length > 3 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                +{rx.medications.length - 3} more
              </p>
            )}
          </>
        )}
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    accessor: (rx) => rx.status,
    cell: (rx) => {
      const tone = RECORD_STATUS_TONE[rx.status];
      const label = RECORD_STATUS_LABELS[rx.status] ?? rx.status;
      const Icon =
        rx.status === 'VERIFIED'
          ? CheckCircle2
          : rx.status === 'REVIEW_REQUIRED' || rx.status === 'CLINICIAN_REVIEW_REQUIRED'
            ? AlertTriangle
            : Clock;
      return (
        <Badge tone={tone}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {label}
        </Badge>
      );
    },
  },
];

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REVIEW_REQUIRED', label: 'Needs Review' },
  { value: 'DRAFT_EXTRACTED', label: 'Draft' },
];

export default function PrescriptionsPage() {
  const { session } = useSession();
  const patientId = session.userId;
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const { data: result, isLoading, isError, refetch } = useQuery({
    queryKey: ['health-summary', patientId],
    queryFn: () => fetchSummary(patientId),
    staleTime: 60_000,
  });

  const isOffline = result?.demo === true && !result?.data;
  const prescriptions = result?.data?.prescriptions ?? [];

  const filtered = useMemo<PrescriptionRecord[]>(() => {
    if (activeTab === 'ALL') return prescriptions;
    if (activeTab === 'REVIEW_REQUIRED') {
      return prescriptions.filter(
        (rx) => rx.status === 'REVIEW_REQUIRED' || rx.status === 'CLINICIAN_REVIEW_REQUIRED',
      );
    }
    return prescriptions.filter((rx) => rx.status === (activeTab as RecordStatus));
  }, [prescriptions, activeTab]);

  const verified = prescriptions.filter((rx) => rx.status === 'VERIFIED').length;
  const needsReview = prescriptions.filter(
    (rx) => rx.status === 'REVIEW_REQUIRED' || rx.status === 'CLINICIAN_REVIEW_REQUIRED',
  ).length;
  const draft = prescriptions.filter((rx) => rx.status === 'DRAFT_EXTRACTED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prescriptions"
        description="Your prescription records, extracted and indexed from captured documents."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Prescriptions' }]}
        actions={
          <Link href="/health-records/capture">
            <Button size="sm" variant="outline">
              <FileText className="h-4 w-4" aria-hidden /> Capture Prescription
            </Button>
          </Link>
        }
      />

      {isError ? (
        <ErrorState
          description="Could not load prescriptions. Check your connection and try again."
          onRetry={refetch}
        />
      ) : isLoading ? (
        <div className="space-y-6">
          <StatGrid>{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}</StatGrid>
          <SkeletonTable rows={4} />
        </div>
      ) : isOffline ? (
        <EmptyState
          icon={WifiOff}
          title="Requires a live backend connection"
          description="Prescription data is read from your real health records — nothing here is simulated."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      ) : (
        <>
          <StatGrid>
            <StatCard label="Total" value={prescriptions.length} icon={FileText} tone="brand" delay={0} sub="All prescriptions" />
            <StatCard label="Verified" value={verified} icon={CheckCircle2} tone="emerald" delay={0.05} sub="Confirmed correct" />
            <StatCard label="Needs Review" value={needsReview} icon={AlertTriangle} tone="amber" delay={0.1} sub="Awaiting check" />
            <StatCard label="Draft" value={draft} icon={Clock} tone="neutral" delay={0.15} sub="Awaiting processing" />
          </StatGrid>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" aria-hidden />
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
              <TabsList>
                {FILTER_TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {prescriptions.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No prescriptions found"
              description="Upload a prescription document to have it read and indexed here."
              action={{
                label: 'Capture a prescription',
                onClick: () => { window.location.href = '/health-records/capture'; },
              }}
            />
          ) : (
            <DataTable<PrescriptionRecord>
              columns={columns}
              data={filtered}
              rowKey={(rx) => rx._id}
              searchPlaceholder="Search prescriptions…"
              exportName="prescriptions"
              emptyTitle="No prescriptions found"
              emptyDescription={
                activeTab !== 'ALL'
                  ? `No prescriptions with status "${FILTER_TABS.find((t) => t.value === activeTab)?.label}".`
                  : 'Prescriptions will appear here once documents are captured and processed.'
              }
            />
          )}
        </>
      )}
    </div>
  );
}
