'use client';
import React from 'react';
import {
  FileText, Download, Eye, Clock, CheckCircle2, AlertTriangle, FlaskConical,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  StatGrid,
  Badge,
  Button,
  DataTable,
  type Column,
} from '@/components/ui';

interface LabReport {
  id: string;
  testName: string;
  date: string;
  status: string;
  doctor: string;
  lab: string;
  hasFlags: boolean;
}

export default function LabReportsPage() {
  const reports: LabReport[] = [
    {
      id: "LR-2026-8812",
      testName: "Complete Blood Count (CBC)",
      date: "28 Jul 2026",
      status: "COMPLETED",
      doctor: "Dr. Sarah Jenkins",
      lab: "Central Pathology",
      hasFlags: false
    },
    {
      id: "LR-2026-8811",
      testName: "Lipid Panel",
      date: "15 Jun 2026",
      status: "COMPLETED",
      doctor: "Dr. Michael Chen",
      lab: "Central Pathology",
      hasFlags: true
    },
    {
      id: "LR-2026-8790",
      testName: "Thyroid Function Test",
      date: "10 Apr 2026",
      status: "COMPLETED",
      doctor: "Dr. Sarah Jenkins",
      lab: "Endocrinology Lab",
      hasFlags: false
    },
    {
      id: "LR-2026-8825",
      testName: "Metabolic Panel (BMP)",
      date: "29 Jul 2026",
      status: "PENDING",
      doctor: "Dr. Emily Smith",
      lab: "Central Pathology",
      hasFlags: false
    }
  ];

  const completed = reports.filter(r => r.status === 'COMPLETED').length;
  const pending = reports.filter(r => r.status === 'PENDING').length;
  const flagged = reports.filter(r => r.hasFlags).length;

  const columns: Column<LabReport>[] = [
    {
      key: 'id',
      header: 'Report ID & Date',
      sortable: true,
      accessor: (r) => r.id,
      cell: (r) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <FileText className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="font-mono text-sm font-semibold text-foreground">{r.id}</p>
            <p className="text-xs text-muted-foreground">{r.date}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'testName',
      header: 'Test Name',
      sortable: true,
      accessor: (r) => r.testName,
      cell: (r) => (
        <div>
          <p className="flex items-center gap-2 font-semibold text-foreground">
            {r.testName}
            {r.hasFlags && (
              <span title="Abnormal values detected">
                <AlertTriangle className="h-3.5 w-3.5 text-danger" aria-label="Abnormal values detected" />
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{r.lab}</p>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: 'Referred By',
      sortable: true,
      accessor: (r) => r.doctor,
      cell: (r) => <span className="text-sm font-medium text-muted-foreground">{r.doctor}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (r) => r.status,
      cell: (r) =>
        r.status === 'COMPLETED' ? (
          <Badge tone="success">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Ready
          </Badge>
        ) : (
          <Badge tone="warning" pulse dot>
            <Clock className="h-3.5 w-3.5" aria-hidden /> Processing
          </Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laboratory Reports"
        description="Access and download all your pathology, microbiology, and clinical lab results."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Lab Reports' }]}
      />

      <StatGrid>
        <StatCard label="Total Reports" value={reports.length} icon={FlaskConical} tone="brand" delay={0} sub="All time" />
        <StatCard label="Ready to View" value={completed} icon={CheckCircle2} tone="emerald" delay={0.05} sub="Completed results" />
        <StatCard label="Processing" value={pending} icon={Clock} tone="amber" delay={0.1} sub="Awaiting lab results" />
        <StatCard label="Flagged Results" value={flagged} icon={AlertTriangle} tone="rose" delay={0.15} sub="Abnormal values detected" />
      </StatGrid>

      <DataTable<LabReport>
        columns={columns}
        data={reports}
        rowKey={(r) => r.id}
        searchPlaceholder="Search reports…"
        exportName="lab-reports"
        emptyTitle="No lab reports found"
        emptyDescription="Reports will appear here once your lab results are ready."
        rowActions={(r) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled
              title="Report viewer coming soon"
              aria-label={`View report ${r.id}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={r.status !== 'COMPLETED'}
              onClick={() => {
                const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${r.id}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              aria-label={`Download report ${r.id}`}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}
      />
    </div>
  );
}
