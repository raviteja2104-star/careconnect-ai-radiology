'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Download, Eye,
  Image as ImageIcon, Clock, CheckCircle2, AlertCircle, Share2, ScanLine
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Badge, Button, Input, Select, DataTable, EmptyState, Skeleton, type Column, useToast,
} from '@/components/ui';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'}/api`;

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Scan {
  id: string;
  type: string;
  date: string;
  status: string;
  doctor: string;
  facility: string;
  findings: string;
  images: number | null;
  fileUrl?: string;
  finalReport?: { findings?: string; impression?: string; recommendations?: string[] };
}

interface ApiScan {
  _id: string;
  scanId?: string;
  scanType?: string;
  bodyPart?: string;
  status?: string;
  imageCount?: number;
  finalReport?: { findings?: string; impression?: string; recommendations?: string[] };
  aiReport?: { findings?: string; riskLevel?: string };
  requestedBy?: { firstName?: string; lastName?: string; specialization?: string } | string;
  createdAt?: string;
  fileUrl?: string;
}

function toUiScan(s: ApiScan): Scan {
  const doctor = typeof s.requestedBy === 'object' && s.requestedBy
    ? `Dr. ${s.requestedBy.firstName ?? ''} ${s.requestedBy.lastName ?? ''}`.trim()
    : '—';
  const findings = s.finalReport?.findings
    ?? (s.aiReport?.riskLevel === 'low' ? 'Normal' : s.aiReport?.riskLevel === 'critical' || s.aiReport?.riskLevel === 'high' ? 'Abnormal' : 'Pending');
  const statusMap: Record<string, string> = {
    approved: 'COMPLETED', ai_completed: 'COMPLETED', radiologist_review: 'PENDING',
    pending: 'PENDING', rejected: 'COMPLETED',
  };
  const hasFile = s.fileUrl && !s.fileUrl.startsWith('demo://');
  return {
    id: s.scanId ?? s._id,
    type: [s.scanType, s.bodyPart].filter(Boolean).join(' ') || '—',
    date: s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    status: statusMap[s.status?.toLowerCase() ?? ''] ?? 'PENDING',
    doctor,
    facility: 'Imaging Center',
    findings,
    images: typeof s.imageCount === 'number' ? s.imageCount : (hasFile ? 1 : null),
    fileUrl: s.fileUrl,
    finalReport: s.finalReport,
  };
}

function printReport(scan: Scan) {
  const win = window.open('', '_blank', 'width=700,height=900');
  if (!win) return;
  const lines = [
    `<tr><td>Scan ID</td><td>${scan.id}</td></tr>`,
    `<tr><td>Scan Type</td><td>${scan.type}</td></tr>`,
    `<tr><td>Date</td><td>${scan.date}</td></tr>`,
    `<tr><td>Status</td><td>${scan.status}</td></tr>`,
    `<tr><td>Doctor</td><td>${scan.doctor}</td></tr>`,
    `<tr><td>Facility</td><td>${scan.facility}</td></tr>`,
    `<tr><td>Findings</td><td>${scan.finalReport?.findings ?? scan.findings}</td></tr>`,
    scan.finalReport?.impression ? `<tr><td>Impression</td><td>${scan.finalReport.impression}</td></tr>` : '',
    scan.finalReport?.recommendations?.length
      ? `<tr><td>Recommendations</td><td>${scan.finalReport.recommendations.join('; ')}</td></tr>` : '',
  ].filter(Boolean).join('');
  win.document.write(`<!doctype html><html><head><title>Radiology Report — ${scan.id}</title>
<style>
  body{font-family:system-ui,sans-serif;margin:40px;color:#111}
  h1{font-size:1.25rem;margin-bottom:4px}
  p.sub{color:#666;font-size:.85rem;margin-bottom:24px}
  table{border-collapse:collapse;width:100%}
  td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:.9rem}
  td:first-child{width:180px;font-weight:600;color:#374151}
  @media print{body{margin:20px}}
</style></head><body>
<h1>Radiology Report</h1>
<p class="sub">CareConnect Medical Center</p>
<table>${lines}</table>
<p style="margin-top:32px;font-size:.75rem;color:#9ca3af">
  Generated ${new Date().toLocaleString('en-IN')} · CareConnect Healthcare OS
</p>
<script>window.onload=()=>{window.print();window.close();}<\/script>
</body></html>`);
  win.document.close();
}

async function shareReport(scan: Scan, toast: (tone: 'success' | 'error' | 'info' | 'warning', title: string, desc?: string) => void) {
  const text = `Radiology Report — ${scan.type}\nDate: ${scan.date}\nStatus: ${scan.status}\nFindings: ${scan.findings}\nFacility: ${scan.facility}\nDoctor: ${scan.doctor}`;
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: `Radiology Report — ${scan.type}`, text });
      return;
    } catch {
      // user cancelled or unsupported — fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast('success', 'Copied to clipboard', 'Report summary copied. Paste to share.');
  } catch {
    toast('error', 'Share failed', 'Could not copy to clipboard.');
  }
}

export default function RadiologyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [findingsFilter, setFindingsFilter] = useState('all');

  const { data: apiScans = [], isLoading } = useQuery<ApiScan[]>({
    queryKey: ['patient-scans'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/radiology/patient-scans`, { headers: authHeaders() });
      if (!res.ok) return [];
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  const scans: Scan[] = apiScans.map(toUiScan);

  const filteredScans = scans.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (findingsFilter !== 'all' && s.findings !== findingsFilter) return false;
    if (search && !s.type.toLowerCase().includes(search.toLowerCase()) && !s.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const completedCount = scans.filter(s => s.status === 'COMPLETED').length;
  const pendingCount = scans.filter(s => s.status === 'PENDING').length;
  const abnormalCount = scans.filter(s => s.findings === 'Abnormal').length;
  const normalCount = scans.filter(s => s.findings === 'Normal').length;

  const columns: Column<Scan>[] = [
    {
      key: 'type',
      header: 'Scan Details',
      sortable: true,
      accessor: (row) => `${row.type} ${row.id}`,
      cell: (row) => (
        <div className="flex items-center gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <ImageIcon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{row.type}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{row.id}</span>
              <span className="h-1 w-1 rounded-full bg-border" aria-hidden />
              <span className="text-xs text-muted-foreground">{row.date}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'facility',
      header: 'Facility / Doctor',
      sortable: true,
      accessor: (row) => row.facility,
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.facility}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{row.doctor}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (row) => row.status,
      cell: (row) =>
        row.status === 'COMPLETED' ? (
          <Badge tone="success"><CheckCircle2 className="h-3 w-3" aria-hidden /> Ready</Badge>
        ) : (
          <Badge tone="warning"><Clock className="h-3 w-3" aria-hidden /> Pending</Badge>
        ),
    },
    {
      key: 'findings',
      header: 'Findings',
      sortable: true,
      accessor: (row) => row.findings,
      cell: (row) =>
        row.findings === 'Abnormal' ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-danger">
            <AlertCircle className="h-4 w-4" aria-hidden /> Attention Needed
          </span>
        ) : row.findings === 'Normal' ? (
          <span className="text-sm text-muted-foreground">Unremarkable</span>
        ) : (
          <span className="text-sm text-subtle-foreground">Awaiting Report</span>
        ),
    },
    {
      key: 'images',
      header: 'Images',
      sortable: true,
      align: 'right',
      accessor: (row) => row.images ?? -1,
      cell: (row) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.images !== null ? row.images : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Radiology & Imaging"
        description="Access your DICOM images, MRI, CT, X-Ray scans and radiologist reports."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Radiology' }]}
        actions={
          <>
            <div className="w-56 sm:w-64">
              <Input
                icon={<Search />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search scans..."
                aria-label="Search scans"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
            </Select>
            <Select
              value={findingsFilter}
              onChange={(e) => setFindingsFilter(e.target.value)}
              aria-label="Filter by findings"
            >
              <option value="all">All Findings</option>
              <option value="Normal">Normal</option>
              <option value="Abnormal">Abnormal</option>
              <option value="Pending">Awaiting Report</option>
            </Select>
          </>
        }
      />

      <StatGrid>
        <StatCard label="Total Scans" value={isLoading ? '—' : scans.length} icon={ScanLine} tone="brand" delay={0} sub="Across all facilities" />
        <StatCard label="Pending Results" value={isLoading ? '—' : pendingCount} icon={Clock} tone="amber" delay={0.05} sub="Awaiting radiologist report" />
        <StatCard label="Normal Findings" value={isLoading ? '—' : normalCount} icon={CheckCircle2} tone="emerald" delay={0.1} sub="No follow-up needed" />
        <StatCard label="Action Required" value={isLoading ? '—' : abnormalCount} icon={AlertCircle} tone="rose" delay={0.15} sub="Review with your doctor" />
      </StatGrid>

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : scans.length === 0 && !search ? (
        <EmptyState
          icon={ScanLine}
          title="No radiology reports yet"
          description="Imaging studies will appear here once available."
        />
      ) : (
        <DataTable<Scan>
          columns={columns}
          data={filteredScans}
          rowKey={(row) => row.id}
          searchable={false}
          pageSize={10}
          emptyTitle="No scans found"
          emptyDescription={search ? `No results for "${search}".` : 'No scans match the current filters.'}
          rowActions={(scan) => (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={scan.status !== 'COMPLETED'}
                title="View DICOM Images"
                aria-label="View DICOM Images"
                onClick={() => router.push('/teleradiology/worklist')}
              >
                <Eye className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Share Report"
                title="Share Report"
                onClick={() => shareReport(scan, toast)}
              >
                <Share2 className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Download PDF"
                title="Download PDF"
                onClick={() => printReport(scan)}
              >
                <Download className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          )}
        />
      )}
    </div>
  );
}
