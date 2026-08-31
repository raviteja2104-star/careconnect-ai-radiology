'use client';

import React, { useState } from 'react';
import {
  Plus, Search, AlertTriangle, CheckCircle, Clock, RefreshCw,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  StatGrid,
  Badge,
  type BadgeProps,
  Button,
  Input,
  DataTable,
  type Column,
} from '@/components/ui';

type RxStatus = 'Active' | 'Completed' | 'Discontinued' | 'On Hold' | 'Pending';
type RxRoute  = 'Oral' | 'IV' | 'IM' | 'Topical' | 'Inhaled' | 'Subcutaneous';

interface Prescription {
  id: string; mrn: string; patientName: string; patientAge: number; patientGender: string;
  drugName: string; genericName: string; dose: string; frequency: string; route: RxRoute;
  duration: string; startDate: string; endDate?: string;
  status: RxStatus; prescribedBy: string; department: string;
  isHighAlert: boolean; indication: string; dispensed: boolean;
  refillsRemaining?: number;
}

const PRESCRIPTIONS: Prescription[] = [
  { id: 'rx1', mrn: 'MRN-2024-07241', patientName: 'Rohit Sharma', patientAge: 32, patientGender: 'M', drugName: 'Aspirin', genericName: 'Aspirin', dose: '75mg', frequency: 'Once daily', route: 'Oral', duration: '90 days', startDate: '24 Jul 2026', status: 'Active', prescribedBy: 'Dr. Priya Mehta', department: 'Cardiology', isHighAlert: false, indication: 'Secondary prevention — Antiplatelet', dispensed: true, refillsRemaining: 2 },
  { id: 'rx2', mrn: 'MRN-2024-07241', patientName: 'Rohit Sharma', patientAge: 32, patientGender: 'M', drugName: 'Clopidogrel', genericName: 'Clopidogrel', dose: '75mg', frequency: 'Once daily', route: 'Oral', duration: '12 months', startDate: '24 Jul 2026', status: 'Active', prescribedBy: 'Dr. Priya Mehta', department: 'Cardiology', isHighAlert: false, indication: 'DAPT — Post PCI', dispensed: true, refillsRemaining: 3 },
  { id: 'rx3', mrn: 'MRN-2024-07241', patientName: 'Rohit Sharma', patientAge: 32, patientGender: 'M', drugName: 'Heparin', genericName: 'Heparin Sodium', dose: '5000 IU', frequency: '8 hourly', route: 'Subcutaneous', duration: '5 days', startDate: '24 Jul 2026', status: 'Active', prescribedBy: 'Dr. Priya Mehta', department: 'Cardiology', isHighAlert: true, indication: 'Anticoagulation — DVT prophylaxis', dispensed: false },
  { id: 'rx4', mrn: 'MRN-2024-06133', patientName: 'Anil Kumar', patientAge: 58, patientGender: 'M', drugName: 'Metformin', genericName: 'Metformin HCl', dose: '1000mg', frequency: 'Twice daily with meals', route: 'Oral', duration: 'Ongoing', startDate: '01 Jan 2026', status: 'Active', prescribedBy: 'Dr. Suresh Gupta', department: 'Endocrinology', isHighAlert: false, indication: 'Type 2 Diabetes Mellitus', dispensed: true, refillsRemaining: 1 },
  { id: 'rx5', mrn: 'MRN-2024-06133', patientName: 'Anil Kumar', patientAge: 58, patientGender: 'M', drugName: 'Glipizide', genericName: 'Glipizide', dose: '5mg', frequency: 'Before breakfast', route: 'Oral', duration: 'Ongoing', startDate: '15 Mar 2026', status: 'On Hold', prescribedBy: 'Dr. Suresh Gupta', department: 'Endocrinology', isHighAlert: false, indication: 'HbA1c uncontrolled — Add-on', dispensed: false },
  { id: 'rx6', mrn: 'MRN-2024-09133', patientName: 'Ananya Krishnamurthy', patientAge: 67, patientGender: 'F', drugName: 'Noradrenaline', genericName: 'Norepinephrine', dose: '0.1 mcg/kg/min', frequency: 'Continuous infusion', route: 'IV', duration: 'Until haemodynamically stable', startDate: '23 Jul 2026', status: 'Active', prescribedBy: 'Dr. Rajesh Iyer', department: 'ICU', isHighAlert: true, indication: 'Septic Shock — Vasopressor support', dispensed: true },
  { id: 'rx7', mrn: 'MRN-2024-05188', patientName: 'Suresh Venkataraman', patientAge: 71, patientGender: 'M', drugName: 'Tiotropium', genericName: 'Tiotropium Bromide', dose: '18mcg', frequency: 'Once daily via inhaler', route: 'Inhaled', duration: 'Ongoing', startDate: '10 Jun 2026', status: 'Completed', prescribedBy: 'Dr. K. Venkatesh', department: 'Pulmonology', isHighAlert: false, indication: 'COPD Maintenance', dispensed: true, endDate: '10 Jul 2026' },
  { id: 'rx8', mrn: 'MRN-2024-03612', patientName: 'Kavitha Rajan', patientAge: 45, patientGender: 'F', drugName: 'Amlodipine', genericName: 'Amlodipine Besylate', dose: '5mg', frequency: 'Once daily', route: 'Oral', duration: 'Ongoing', startDate: '01 Feb 2026', status: 'Active', prescribedBy: 'Dr. Priya Mehta', department: 'Cardiology', isHighAlert: false, indication: 'Hypertension Grade II', dispensed: true, refillsRemaining: 0 },
];

const STATUS_TONE: Record<RxStatus, BadgeProps['tone']> = {
  Active: 'success',
  Completed: 'neutral',
  Discontinued: 'danger',
  'On Hold': 'warning',
  Pending: 'info',
};

/** Soft accent tints — allowed for badges only. */
const ROUTE_CFG: Record<RxRoute, string> = {
  Oral:          'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  IV:            'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  IM:            'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  Topical:       'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
  Inhaled:       'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  Subcutaneous:  'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
};

const FILTERS = ['All', 'Active', 'On Hold', 'Completed', 'Discontinued'] as const;

export default function PrescriptionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | RxStatus>('All');

  const filtered = PRESCRIPTIONS.filter(rx => {
    const matchSearch = [rx.patientName, rx.drugName, rx.genericName, rx.mrn, rx.indication].some(f =>
      f.toLowerCase().includes(search.toLowerCase())
    );
    const matchStatus = statusFilter === 'All' || rx.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: Column<Prescription>[] = [
    {
      key: 'drugName',
      header: 'Drug',
      sortable: true,
      accessor: (rx) => rx.drugName,
      cell: (rx) => (
        <div className="flex items-center gap-2">
          {rx.isHighAlert && (
            <Badge tone="danger" className="shrink-0 text-[10px] uppercase tracking-wider">
              <AlertTriangle className="h-2.5 w-2.5" aria-hidden /> High Alert
            </Badge>
          )}
          <div>
            <p className="font-bold text-foreground">{rx.drugName}</p>
            <p className="text-xs italic text-muted-foreground">{rx.genericName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient',
      sortable: true,
      accessor: (rx) => rx.patientName,
      cell: (rx) => (
        <div>
          <p className="font-semibold text-foreground">{rx.patientName}</p>
          <p className="font-mono text-xs text-muted-foreground">{rx.mrn}</p>
        </div>
      ),
    },
    {
      key: 'dose',
      header: 'Dose / Frequency',
      accessor: (rx) => `${rx.dose} ${rx.frequency}`,
      cell: (rx) => (
        <div>
          <p className="font-semibold text-foreground">{rx.dose}</p>
          <p className="text-xs text-muted-foreground">{rx.frequency}</p>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Route',
      sortable: true,
      accessor: (rx) => rx.route,
      cell: (rx) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROUTE_CFG[rx.route]}`}>
          {rx.route}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      accessor: (rx) => rx.duration,
      cell: (rx) => <span className="text-xs text-muted-foreground">{rx.duration}</span>,
    },
    {
      key: 'prescribedBy',
      header: 'Prescribed By',
      sortable: true,
      accessor: (rx) => rx.prescribedBy,
      cell: (rx) => (
        <div>
          <p className="text-sm text-foreground">{rx.prescribedBy}</p>
          <p className="text-xs text-subtle-foreground">{rx.department}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (rx) => rx.status,
      cell: (rx) => <Badge tone={STATUS_TONE[rx.status]} dot>{rx.status}</Badge>,
    },
    {
      key: 'dispensed',
      header: 'Dispensed',
      accessor: (rx) => (rx.dispensed ? 'Yes' : 'Pending'),
      cell: (rx) =>
        rx.dispensed ? (
          <CheckCircle className="h-5 w-5 text-success" aria-label="Dispensed" />
        ) : (
          <Badge tone="warning">Pending</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prescriptions"
        description="Medication orders and dispensing status"
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Prescriptions' }]}
        actions={
          <Button variant="primary" disabled title="Coming soon">
            <Plus className="h-4 w-4" aria-hidden /> New Prescription
          </Button>
        }
      />

      <StatGrid>
        <StatCard
          label="Active Orders"
          value={PRESCRIPTIONS.filter(r => r.status === 'Active').length}
          icon={CheckCircle}
          tone="emerald"
          delay={0}
          sub="Currently running"
        />
        <StatCard
          label="High-Alert Drugs"
          value={PRESCRIPTIONS.filter(r => r.isHighAlert).length}
          icon={AlertTriangle}
          tone="rose"
          delay={0.05}
          sub="Require double-check"
        />
        <StatCard
          label="Pending Dispense"
          value={PRESCRIPTIONS.filter(r => !r.dispensed && r.status === 'Active').length}
          icon={Clock}
          tone="amber"
          delay={0.1}
          sub="Awaiting pharmacy"
        />
        <StatCard
          label="Refill Needed"
          value={PRESCRIPTIONS.filter(r => r.refillsRemaining === 0).length}
          icon={RefreshCw}
          tone="brand"
          delay={0.15}
          sub="Zero refills remaining"
        />
      </StatGrid>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            icon={<Search />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search drug, patient, or indication…"
            aria-label="Search prescriptions"
          />
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter prescriptions by status"
        >
          {FILTERS.map(f => (
            <Button
              key={f}
              size="sm"
              variant={statusFilter === f ? 'primary' : 'outline'}
              onClick={() => setStatusFilter(f as typeof statusFilter)}
              aria-pressed={statusFilter === f}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <DataTable<Prescription>
        columns={columns}
        data={filtered}
        rowKey={(rx) => rx.id}
        searchable={false}
        exportName="prescriptions"
        emptyTitle="No prescriptions found"
        emptyDescription={
          search || statusFilter !== 'All'
            ? 'Try adjusting your search or status filter.'
            : 'New prescriptions will appear here once ordered.'
        }
      />
    </div>
  );
}
