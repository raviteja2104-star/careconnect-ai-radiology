'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search, Plus, ChevronRight, Users, UserCheck, UserX,
  AlertTriangle, CheckCircle, LayoutGrid, Rows3, Droplet, FileText,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Button, Badge, Input, Select, Label,
  Avatar, DataTable, type Column, Dialog, Card,
} from '@/components/ui';

// ─── Types ────────────────────────────────────────────────────────────────────
type Gender = 'Male' | 'Female' | 'Other';
type PatientStatus = 'Active' | 'Admitted' | 'Discharged' | 'Critical';
type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

interface Patient {
  id: string; mrn: string; name: string; age: number; gender: Gender;
  dob: string; phone: string; email?: string; bloodGroup: BloodGroup;
  status: PatientStatus; lastVisit: string; diagnosis: string;
  allergies: string[]; ward?: string; doctor: string; initials: string;
}

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INITIAL_PATIENTS: Patient[] = [
  { id: '1', mrn: 'MRN-2024-08742', name: 'Ravi Kumar Sharma', age: 54, gender: 'Male', dob: '1970-03-15', phone: '+91 98765 43210', email: 'ravi.sharma@email.com', bloodGroup: 'B+', status: 'Admitted', lastVisit: '24 Jul 2026', diagnosis: 'Acute Myocardial Infarction (STEMI)', allergies: ['Penicillin', 'Aspirin'], ward: 'ICU Bed 2', doctor: 'Dr. Priya Mehta', initials: 'RK' },
  { id: '2', mrn: 'MRN-2024-09133', name: 'Ananya Krishnamurthy', age: 67, gender: 'Female', dob: '1957-11-22', phone: '+91 87654 32109', bloodGroup: 'O+', status: 'Critical', lastVisit: '23 Jul 2026', diagnosis: 'Septic Shock — Post-operative', allergies: ['Sulfa'], ward: 'ICU Bed 7', doctor: 'Dr. Rajesh Iyer', initials: 'AK' },
  { id: '3', mrn: 'MRN-2024-07391', name: 'Mohan Das', age: 32, gender: 'Male', dob: '1994-06-08', phone: '+91 76543 21098', email: 'mohan.das@email.com', bloodGroup: 'A+', status: 'Active', lastVisit: '20 Jul 2026', diagnosis: 'Type 2 Diabetes Mellitus', allergies: [], doctor: 'Dr. Suresh Gupta', initials: 'MD' },
  { id: '4', mrn: 'MRN-2024-06520', name: 'Deepa Nair', age: 29, gender: 'Female', dob: '1997-02-14', phone: '+91 65432 10987', bloodGroup: 'AB-', status: 'Active', lastVisit: '22 Jul 2026', diagnosis: 'Iron Deficiency Anaemia', allergies: ['Latex'], doctor: 'Dr. Priya Mehta', initials: 'DN' },
  { id: '5', mrn: 'MRN-2024-05188', name: 'Suresh Venkataraman', age: 71, gender: 'Male', dob: '1953-09-30', phone: '+91 54321 09876', bloodGroup: 'O-', status: 'Discharged', lastVisit: '18 Jul 2026', diagnosis: 'COPD Exacerbation', allergies: ['Ibuprofen'], doctor: 'Dr. K. Venkatesh', initials: 'SV' },
  { id: '6', mrn: 'MRN-2024-04877', name: 'Mohammed Ali Khan', age: 63, gender: 'Male', dob: '1961-05-17', phone: '+91 43210 98765', email: 'ali.khan@email.com', bloodGroup: 'B-', status: 'Admitted', lastVisit: '24 Jul 2026', diagnosis: 'Ischaemic Stroke', allergies: ['Warfarin'], ward: 'Neurology Ward B-4', doctor: 'Dr. Rao Srinivas', initials: 'MA' },
  { id: '7', mrn: 'MRN-2024-03612', name: 'Kavitha Rajan', age: 45, gender: 'Female', dob: '1979-12-05', phone: '+91 32109 87654', bloodGroup: 'A-', status: 'Active', lastVisit: '21 Jul 2026', diagnosis: 'Hypertension, Grade II', allergies: [], doctor: 'Dr. Priya Mehta', initials: 'KR' },
  { id: '8', mrn: 'MRN-2024-02445', name: 'Priya Patel', age: 39, gender: 'Female', dob: '1985-08-12', phone: '+91 21098 76543', email: 'priya.patel@email.com', bloodGroup: 'O+', status: 'Active', lastVisit: '19 Jul 2026', diagnosis: 'Gestational Diabetes', allergies: ['Penicillin'], doctor: 'Dr. Suresh Gupta', initials: 'PP' },
];

const STATUS_TONE: Record<PatientStatus, { tone: 'success' | 'info' | 'neutral' | 'danger'; pulse?: boolean }> = {
  Active:     { tone: 'success' },
  Admitted:   { tone: 'info' },
  Discharged: { tone: 'neutral' },
  Critical:   { tone: 'danger', pulse: true },
};

/* Soft accent tints for blood-group badges (allowed for badges per design system). */
const BLOOD_GROUP_COLOR: Record<BloodGroup, string> = {
  'O+':  'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  'O-':  'bg-red-100 text-red-800 dark:bg-red-500/25 dark:text-red-300',
  'A+':  'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  'A-':  'bg-blue-100 text-blue-800 dark:bg-blue-500/25 dark:text-blue-300',
  'B+':  'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  'B-':  'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-300',
  'AB+': 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  'AB-': 'bg-violet-100 text-violet-800 dark:bg-violet-500/25 dark:text-violet-300',
};

function StatusBadge({ status }: { status: PatientStatus }) {
  const cfg = STATUS_TONE[status];
  return <Badge tone={cfg.tone} dot pulse={cfg.pulse}>{status}</Badge>;
}

function BloodBadge({ group }: { group: BloodGroup }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold ${BLOOD_GROUP_COLOR[group]}`}>
      <Droplet className="h-3 w-3" aria-hidden /> {group}
    </span>
  );
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PatientStatus>('All');
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<Gender>('Male');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [phone, setPhone] = useState('+91 98000 12345');
  const [diagnosis, setDiagnosis] = useState('');

  const filtered = useMemo(() =>
    patients.filter(p => {
      const matchSearch = [p.name, p.mrn, p.diagnosis, p.doctor].some(f =>
        f.toLowerCase().includes(search.toLowerCase())
      );
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchStatus;
    }), [patients, search, statusFilter]);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'NP';
    const newPatient: Patient = {
      id: `${Date.now()}`,
      mrn: `MRN-2024-0${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      age,
      gender,
      dob: '1994-01-01',
      phone,
      bloodGroup,
      status: 'Active',
      lastVisit: 'Today',
      diagnosis: diagnosis || 'General Health Examination',
      allergies: [],
      doctor: 'Dr. Priya Mehta',
      initials
    };
    setPatients([newPatient, ...patients]);
    setIsRegisterModalOpen(false);
    setName('');
    setDiagnosis('');
  };

  const columns: Column<Patient>[] = [
    {
      key: 'name',
      header: 'Patient',
      sortable: true,
      accessor: p => p.name,
      cell: p => (
        <div className="flex items-center gap-3">
          <Avatar name={p.name} size="sm" />
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{p.name}</p>
            {p.allergies.length > 0 && (
              <p className="flex items-center gap-1 text-xs text-danger">
                <AlertTriangle className="h-3 w-3" aria-hidden /> {p.allergies.join(', ')}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'mrn',
      header: 'MRN',
      sortable: true,
      accessor: p => p.mrn,
      cell: p => <span className="font-mono text-xs text-muted-foreground">{p.mrn}</span>,
    },
    {
      key: 'age',
      header: 'Age / Gender',
      sortable: true,
      accessor: p => p.age,
      cell: p => <span className="whitespace-nowrap text-muted-foreground">{p.age}y · {p.gender[0]}</span>,
    },
    {
      key: 'bloodGroup',
      header: 'Blood',
      accessor: p => p.bloodGroup,
      cell: p => <BloodBadge group={p.bloodGroup} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: p => p.status,
      cell: p => <StatusBadge status={p.status} />,
    },
    {
      key: 'ward',
      header: 'Ward / Doctor',
      accessor: p => `${p.ward ?? ''} ${p.doctor}`,
      cell: p => (
        <div>
          <p className="text-sm text-foreground">{p.ward ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{p.doctor}</p>
        </div>
      ),
    },
    {
      key: 'lastVisit',
      header: 'Last Visit',
      accessor: p => p.lastVisit,
      cell: p => <span className="whitespace-nowrap text-xs text-muted-foreground">{p.lastVisit}</span>,
    },
    {
      key: 'diagnosis',
      header: 'Diagnosis',
      accessor: p => p.diagnosis,
      cell: p => <p className="max-w-[200px] truncate text-sm text-foreground">{p.diagnosis}</p>,
    },
  ];

  const summaryStats = [
    { label: 'Total Patients', value: patients.length, icon: Users, tone: 'brand' as const, sub: 'All registered records' },
    { label: 'Admitted Today', value: patients.filter(p => p.status === 'Admitted').length, icon: UserCheck, tone: 'teal' as const, sub: 'Currently in-patient' },
    { label: 'Critical Cases', value: patients.filter(p => p.status === 'Critical').length, icon: AlertTriangle, tone: 'rose' as const, sub: 'Needs close monitoring' },
    { label: 'Discharged Today', value: patients.filter(p => p.status === 'Discharged').length, icon: UserX, tone: 'emerald' as const, sub: 'Completed care episodes' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Manage and view patient records"
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Patients' }]}
        actions={
          <Button onClick={() => setIsRegisterModalOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Register Patient
          </Button>
        }
      />

      {/* KPI row */}
      <StatGrid>
        {summaryStats.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} icon={s.icon} tone={s.tone} delay={i * 0.05} />
        ))}
      </StatGrid>

      {/* Search + status filters + view toggle */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-3 lg:flex-row lg:items-center"
      >
        <div className="flex-1">
          <Input
            icon={<Search />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, MRN, diagnosis, or doctor..."
            aria-label="Search patients"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Active', 'Admitted', 'Critical', 'Discharged'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              aria-pressed={statusFilter === f}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                statusFilter === f
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'border border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {f}
            </button>
          ))}
          <div className="ml-1 flex items-center gap-1 rounded-xl border border-border bg-card p-1">
            <button
              onClick={() => setView('table')}
              aria-label="Table view"
              aria-pressed={view === 'table'}
              className={`rounded-lg p-1.5 transition-colors ${view === 'table' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <Rows3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('cards')}
              aria-label="Card view"
              aria-pressed={view === 'cards'}
              className={`rounded-lg p-1.5 transition-colors ${view === 'cards' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Patient table / cards */}
      {view === 'table' ? (
        <DataTable<Patient>
          columns={columns}
          data={filtered}
          rowKey={p => p.id}
          searchable={false}
          exportName="patients"
          emptyTitle="No patients found"
          emptyDescription="Try adjusting your search or status filter, or register a new patient."
          toolbar={<span className="text-sm text-muted-foreground tabular-nums">{filtered.length} patients</span>}
          rowActions={p => (
            <Link
              key={p.id}
              href="/emr"
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <FileText className="h-3 w-3" aria-hidden /> View Chart
            </Link>
          )}
        />
      ) : filtered.length === 0 ? (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-7 w-7" aria-hidden />
            </div>
            <h3 className="text-base font-semibold text-foreground">No patients found</h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">Try adjusting your search or status filter, or register a new patient.</p>
            <Button className="mt-5" size="sm" onClick={() => setIsRegisterModalOpen(true)}>Register Patient</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
            >
              <Card variant="interactive" className="h-full p-4">
                <div className="mb-3 flex items-start justify-between">
                  <Avatar name={p.name} size="md" />
                  <StatusBadge status={p.status} />
                </div>
                <h4 className="text-sm font-semibold text-foreground">{p.name}</h4>
                <p className="mb-2 text-xs text-muted-foreground">{p.mrn} · {p.age}y · {p.gender}</p>
                <p className="mb-3 truncate text-xs text-muted-foreground">{p.diagnosis}</p>
                {p.allergies.length > 0 && (
                  <p className="mb-3 flex items-center gap-1 text-xs text-danger">
                    <AlertTriangle className="h-3 w-3" aria-hidden /> {p.allergies.join(', ')}
                  </p>
                )}
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <BloodBadge group={p.bloodGroup} />
                  <Link href="/emr" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    Chart <ChevronRight className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Register patient dialog */}
      <Dialog
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register New Patient"
        description="Create a new patient record in the directory"
        size="md"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patient-name">Full Name</Label>
            <Input
              id="patient-name"
              type="text"
              required
              placeholder="Patient full name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="patient-age">Age</Label>
              <Input
                id="patient-age"
                type="number"
                value={age}
                onChange={e => setAge(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="patient-gender">Gender</Label>
              <Select
                id="patient-gender"
                value={gender}
                onChange={e => setGender(e.target.value as Gender)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="patient-blood">Blood</Label>
              <Select
                id="patient-blood"
                value={bloodGroup}
                onChange={e => setBloodGroup(e.target.value as BloodGroup)}
              >
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <option key={b} value={b}>{b}</option>)}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="patient-phone">Phone Number</Label>
            <Input
              id="patient-phone"
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="patient-diagnosis">Initial Diagnosis / Reason</Label>
            <Input
              id="patient-diagnosis"
              type="text"
              placeholder="Chief complaint or diagnosis"
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <CheckCircle className="h-4 w-4" aria-hidden /> Save Patient
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
