'use client';
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { FlaskConical, CheckCircle2, AlertTriangle, Clock, FileText, ExternalLink, WifiOff } from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Badge, Button, DataTable,
  EmptyState, ErrorState, SkeletonCard, SkeletonTable, type Column,
} from '@/components/ui';
import { useSession } from '@/components/providers/SessionProvider';
import {
  fetchSummary, formatDate, RECORD_STATUS_TONE,
  type LabReportRecord,
} from '@/app/health-records/_lib/api';

const columns: Column<LabReportRecord>[] = [
  {
    key: '_id',
    header: 'Lab & Date',
    sortable: true,
    accessor: (r) => r.reportDate ?? r._id,
    cell: (r) => (
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <FlaskConical className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="font-semibold text-foreground">{r.labName ?? 'Lab Report'}</p>
          <p className="text-xs text-muted-foreground">{formatDate(r.reportDate)}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'tests',
    header: 'Tests',
    accessor: (r) => r.results.length,
    cell: (r) => (
      <div>
        <p className="font-medium text-foreground">
          {r.results.length} test{r.results.length !== 1 ? 's' : ''}
        </p>
        {r.results.slice(0, 2).map((res, i) => (
          <p key={i} className="text-xs text-muted-foreground">
            {res.testName ?? '—'}{res.flag ? ' ⚠' : ''}
          </p>
        ))}
        {r.results.length > 2 && (
          <p className="text-xs text-subtle-foreground">+{r.results.length - 2} more</p>
        )}
      </div>
    ),
  },
  {
    key: 'flags',
    header: 'Flags',
    accessor: (r) => (r.results.some((res) => !!res.flag) ? 'Abnormal' : 'Normal'),
    cell: (r) => {
      const flagCount = r.results.filter((res) => !!res.flag).length;
      return flagCount > 0 ? (
        <Badge tone="danger">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> {flagCount} abnormal
        </Badge>
      ) : (
        <Badge tone="neutral">Normal</Badge>
      );
    },
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    accessor: (r) => r.status,
    cell: (r) => (
      <Badge tone={RECORD_STATUS_TONE[r.status]}>
        {r.status === 'VERIFIED' ? (
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Clock className="h-3.5 w-3.5" aria-hidden />
        )}
        {r.status === 'VERIFIED'
          ? 'Verified'
          : r.status === 'REVIEW_REQUIRED'
            ? 'Review required'
            : r.status === 'CLINICIAN_REVIEW_REQUIRED'
              ? 'Clinician review'
              : 'Processing'}
      </Badge>
    ),
  },
];

export default function LabReportsPage() {
  const { session } = useSession();
  const patientId = session.userId;

  const { data: result, isLoading, isError, refetch } = useQuery({
    queryKey: ['health-summary', patientId],
    queryFn: () => fetchSummary(patientId),
    staleTime: 60_000,
  });

  const isOffline = result?.demo === true && !result?.data;
  const labReports = result?.data?.labReports ?? [];
  const flagged = labReports.filter((r) => r.results.some((res) => !!res.flag));
  const verified = labReports.filter((r) => r.status === 'VERIFIED');
  const pending = labReports.filter(
    (r) =>
      r.status === 'REVIEW_REQUIRED' ||
      r.status === 'CLINICIAN_REVIEW_REQUIRED' ||
      r.status === 'DRAFT_EXTRACTED',
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laboratory Reports"
        description="All your pathology and clinical lab results, extracted from captured documents."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Lab Reports' }]}
        actions={
          <Link href="/health-records/capture?type=LAB_REPORT">
            <Button size="sm" variant="outline">
              <FileText className="h-4 w-4" aria-hidden /> Add Lab Report
            </Button>
          </Link>
        }
      />

      {isError ? (
        <ErrorState
          description="Could not load lab reports. Check your connection and try again."
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
          description="Lab reports are read from your real health records — nothing here is simulated. Reload once the backend is reachable."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      ) : (
        <>
          <StatGrid>
            <StatCard label="Total Reports" value={labReports.length} icon={FlaskConical} tone="brand" delay={0} sub="All time" />
            <StatCard label="Verified" value={verified.length} icon={CheckCircle2} tone="emerald" delay={0.05} sub="Doctor confirmed" />
            <StatCard label="Pending Review" value={pending.length} icon={Clock} tone="amber" delay={0.1} sub="Awaiting confirmation" />
            <StatCard label="Flagged Results" value={flagged.length} icon={AlertTriangle} tone="rose" delay={0.15} sub="Abnormal values" />
          </StatGrid>

          {labReports.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="No lab reports yet"
              description="Upload a lab report document to have it read and indexed here."
              action={{ label: 'Capture a lab report', onClick: () => { window.location.href = '/health-records/capture?type=LAB_REPORT'; } }}
            />
          ) : (
            <DataTable<LabReportRecord>
              columns={columns}
              data={labReports}
              rowKey={(r) => r._id}
              searchPlaceholder="Search reports…"
              exportName="lab-reports"
              emptyTitle="No lab reports found"
              emptyDescription="Reports will appear here once lab documents are captured and processed."
              rowActions={() => (
                <Link href="/health-records">
                  <Button variant="ghost" size="icon-sm" aria-label="View in health records">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            />
          )}
        </>
      )}
    </div>
  );
}
