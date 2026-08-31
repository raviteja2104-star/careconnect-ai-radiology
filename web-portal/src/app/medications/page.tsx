'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Pill, Search, CheckCircle2, AlertTriangle, Clock, Plus, RefreshCw, Info,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  StatGrid,
  Badge,
  Button,
  Input,
  DataTable,
  type Column,
} from '@/components/ui';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  dateStarted: string;
  refillsLeft: number | null;
  status: string;
  type: string;
  instructions: string;
}

export default function MedicationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const medications: Medication[] = [
    {
      id: "MED-001",
      name: "Atorvastatin",
      dosage: "40 mg",
      frequency: "Once daily at bedtime",
      prescribedBy: "Dr. Sarah Jenkins",
      dateStarted: "15 Jan 2026",
      refillsLeft: 2,
      status: "ACTIVE",
      type: "Prescription",
      instructions: "Take with or without food. Avoid grapefruit juice."
    },
    {
      id: "MED-002",
      name: "Lisinopril",
      dosage: "10 mg",
      frequency: "Once daily in the morning",
      prescribedBy: "Dr. Michael Chen",
      dateStarted: "03 Mar 2026",
      refillsLeft: 0,
      status: "REFILL_NEEDED",
      type: "Prescription",
      instructions: "May cause dry cough. Take at same time each day."
    },
    {
      id: "MED-003",
      name: "Vitamin D3",
      dosage: "2000 IU",
      frequency: "Once daily",
      prescribedBy: "Self",
      dateStarted: "10 Feb 2026",
      refillsLeft: null,
      status: "ACTIVE",
      type: "Supplement",
      instructions: "Take with a meal containing fat for better absorption."
    },
    {
      id: "MED-004",
      name: "Amoxicillin",
      dosage: "500 mg",
      frequency: "Three times daily for 7 days",
      prescribedBy: "Dr. Emily Smith",
      dateStarted: "28 Jul 2026",
      refillsLeft: 0,
      status: "ACTIVE",
      type: "Antibiotic",
      instructions: "Complete entire course. Take with food if stomach upset occurs."
    }
  ];

  const filtered = medications.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<Medication>[] = [
    {
      key: 'name',
      header: 'Medication',
      sortable: true,
      accessor: (m) => m.name,
      cell: (m) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <Pill className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-base font-bold text-foreground">{m.name}</p>
            <Badge tone="outline" className="mt-1">{m.type}</Badge>
          </div>
        </div>
      ),
    },
    {
      key: 'dosage',
      header: 'Dosage & Frequency',
      accessor: (m) => `${m.dosage} ${m.frequency}`,
      cell: (m) => (
        <div className="max-w-xs">
          <p className="font-semibold text-foreground">{m.dosage}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{m.frequency}</p>
          <p className="mt-1 flex items-start gap-1 text-xs text-subtle-foreground">
            <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden /> {m.instructions}
          </p>
        </div>
      ),
    },
    {
      key: 'prescribedBy',
      header: 'Prescriber',
      sortable: true,
      accessor: (m) => m.prescribedBy,
      cell: (m) => (
        <div>
          <p className="font-medium text-foreground">{m.prescribedBy}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarIcon className="h-3 w-3" aria-hidden /> Since {m.dateStarted}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (m) => m.status,
      cell: (m) => (
        <div>
          {m.status === 'ACTIVE' ? (
            <Badge tone="success">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Active
            </Badge>
          ) : (
            <Badge tone="warning">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Refill Needed
            </Badge>
          )}
          {m.refillsLeft !== null && (
            <p className="mt-1.5 text-xs font-medium text-muted-foreground">{m.refillsLeft} refills remaining</p>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Medications"
        description="Manage your active prescriptions, supplements, and request refills easily."
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
            <Button variant="primary" disabled title="Coming soon">
              <Plus className="h-4 w-4" aria-hidden /> Add Medication
            </Button>
          </>
        }
      />

      <StatGrid>
        <StatCard label="Active Meds" value="3" icon={CheckCircle2} tone="emerald" delay={0} sub="Currently taking" />
        <StatCard label="Refills Needed" value="1" icon={AlertTriangle} tone="amber" delay={0.05} sub="Action required" />
        <StatCard label="Supplements" value="1" icon={Pill} tone="violet" delay={0.1} sub="Self-administered" />
        <StatCard label="Upcoming Doses" value="4" icon={Clock} tone="brand" delay={0.15} sub="Due today" />
      </StatGrid>

      <DataTable<Medication>
        columns={columns}
        data={filtered}
        rowKey={(m) => m.id}
        searchable={false}
        exportName="medications"
        emptyTitle="No medications found"
        emptyDescription={search ? `No medications match “${search}”.` : 'Add a medication to start tracking your doses.'}
        rowActions={(m) => (
          <Button variant="outline" size="sm" title="Request Refill" aria-label={`Request refill for ${m.name}`} onClick={() => router.push('/prescriptions')}>
            <RefreshCw className="h-4 w-4" aria-hidden /> Refill
          </Button>
        )}
      />
    </div>
  );
}
