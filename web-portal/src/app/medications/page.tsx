'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Pill, Search, CheckCircle2, AlertTriangle, Clock, FileText,
  Calendar as CalendarIcon, Info, WifiOff,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Badge, Button, Input, DataTable,
  EmptyState, ErrorState, SkeletonCard, SkeletonTable, type Column,
} from '@/components/ui';
import { useSession } from '@/components/providers/SessionProvider';
import { fetchSummary, formatDate } from '@/app/health-records/_lib/api';

interface FlatMedication {
  id: string;
  name: string;
  strength: string;
  frequency: string;
  duration: string;
  doctorName: string;
  prescriptionDate: string;
  diagnosis: string;
  confidenceLevel: string | null;
}

const columns: Column<FlatMedication>[] = [
  {
    key: 'name',
    header: 'Medication',
    sortable: true,
    accessor: (m) => m.name,
    cell: (m) => (
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Pill className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-base font-bold text-foreground">{m.name}</p>
          {m.strength !== '—' && (
            <p className="mt-0.5 text-xs text-muted-foreground">{m.strength}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'dosage',
    header: 'Dosage & Frequency',
    accessor: (m) => `${m.frequency} ${m.duration}`,
    cell: (m) => (
      <div className="max-w-xs">
        <p className="font-semibold text-foreground">{m.frequency}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" aria-hidden /> {m.duration}
        </p>
      </div>
    ),
  },
  {
    key: 'prescribedBy',
    header: 'Prescriber',
    sortable: true,
    accessor: (m) => m.doctorName,
    cell: (m) => (
      <div>
        <p className="font-medium text-foreground">{m.doctorName}</p>
        {m.prescriptionDate && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarIcon className="h-3 w-3" aria-hidden /> {formatDate(m.prescriptionDate)}
          </p>
        )}
        {m.diagnosis !== '—' && (
          <p className="mt-0.5 flex items-start gap-1 text-xs text-subtle-foreground">
            <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden /> {m.diagnosis}
          </p>
        )}
      </div>
    ),
  },
  {
    key: 'confidence',
    header: 'AI Confidence',
    accessor: (m) => m.confidenceLevel ?? 'UNKNOWN',
    cell: (m) => {
      if (!m.confidenceLevel) return <Badge tone="neutral">Unknown</Badge>;
      const tone =
        m.confidenceLevel === 'HIGH'
          ? 'success'
          : m.confidenceLevel === 'MEDIUM'
            ? 'warning'
            : 'danger';
      return <Badge tone={tone}>{m.confidenceLevel}</Badge>;
    },
  },
];

export default function MedicationsPage() {
  const { session } = useSession();
  const patientId = session.userId;
  const [search, setSearch] = useState('');

  const { data: result, isLoading, isError, refetch } = useQuery({
    queryKey: ['health-summary', patientId],
    queryFn: () => fetchSummary(patientId),
    staleTime: 60_000,
  });

  const isOffline = result?.demo === true && !result?.data;

  const medications = useMemo<FlatMedication[]>(() => {
    const prescriptions = result?.data?.prescriptions ?? [];
    const flat: FlatMedication[] = [];
    prescriptions.forEach((rx) => {
      rx.medications.forEach((med, i) => {
        if (!med.name) return;
        flat.push({
          id: `${rx._id}-${i}`,
          name: med.name,
          strength: med.strength ?? '—',
          frequency: med.frequency ?? '—',
          duration: med.duration ?? '—',
          doctorName: rx.doctorName ?? 'Unknown doctor',
          prescriptionDate: rx.prescriptionDate ?? '',
          diagnosis: rx.diagnosis.join(', ') || '—',
          confidenceLevel: med.confidenceLevel ?? null,
        });
      });
    });
    return flat;
  }, [result]);

  const filtered = useMemo(() => {
    if (!search.trim()) return medications;
    const q = search.toLowerCase();
    return medications.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.doctorName.toLowerCase().includes(q) ||
        m.diagnosis.toLowerCase().includes(q),
    );
  }, [medications, search]);

  const activeMeds = result?.data?.medications.length ?? 0;
  const prescriptionCount = result?.data?.prescriptions.length ?? 0;
  const lowConfidence = medications.filter((m) => m.confidenceLevel === 'LOW').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Medications"
        description="Medications extracted from your captured prescriptions and medical documents."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Medications' }]}
        actions={
          <>
            <div className="w-56">
              <Input
                icon={<Search />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medications…"
                aria-label="Search medications"
              />
            </div>
            <Link href="/health-records/capture">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4" aria-hidden /> Add Prescription
              </Button>
            </Link>
          </>
        }
      />

      {isError ? (
        <ErrorState
          description="Could not load medications. Check your connection and try again."
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
          description="Medication data is read from your real health records — nothing here is simulated."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      ) : (
        <>
          <StatGrid>
            <StatCard label="Active Medications" value={activeMeds} icon={CheckCircle2} tone="emerald" delay={0} sub="From health summary" />
            <StatCard label="Total Entries" value={medications.length} icon={Pill} tone="brand" delay={0.05} sub="Across all prescriptions" />
            <StatCard label="Prescriptions" value={prescriptionCount} icon={FileText} tone="violet" delay={0.1} sub="Source documents" />
            <StatCard label="Low Confidence" value={lowConfidence} icon={AlertTriangle} tone="rose" delay={0.15} sub="AI may have misread" />
          </StatGrid>

          {medications.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="No medications found"
              description="Upload a prescription to have your medications extracted and indexed here."
              action={{
                label: 'Capture a prescription',
                onClick: () => { window.location.href = '/health-records/capture'; },
              }}
            />
          ) : (
            <DataTable<FlatMedication>
              columns={columns}
              data={filtered}
              rowKey={(m) => m.id}
              searchable={false}
              exportName="medications"
              emptyTitle="No medications found"
              emptyDescription={
                search
                  ? `No medications match "${search}".`
                  : 'Medications will appear here once prescriptions are processed.'
              }
            />
          )}
        </>
      )}
    </div>
  );
}
