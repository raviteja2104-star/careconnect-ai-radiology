'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, Plus, ChevronRight, Users, UserCheck, UserX,
  AlertTriangle, CheckCircle, LayoutGrid, Rows3, Droplet, FileText,
  Loader2,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Button, Badge, Input, Select, Label,
  Avatar, DataTable, type Column, Dialog, Card,
} from '@/components/ui';
import { AUTH_API_BASE, TOKEN_STORAGE_KEY } from '@/services/authService';

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

// ─── API Helpers ──────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function ageFromDob(dob?: string | Date): number {
  if (!dob) return 0;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBackendPatient(u: any): Patient {
  const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ');
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'PT';
  const bloodGroup = (u.bloodGroup || 'O+') as BloodGroup;
  const gender = u.gender
    ? ((u.gender.charAt(0).toUpperCase() + u.gender.slice(1)) as Gender)
    : 'Other';
  const diagnosis = u.medicalHistory?.[0]?.condition || u.chronicDiseases?.[0] || 'General Health';

  return {
    id: String(u._id),
    mrn: u.mrn || `MRN-${String(u._id).slice(-8).toUpperCase()}`,
    name: fullName || 'Unknown',
    age: ageFromDob(u.dateOfBirth),
    gender,
    dob: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().split('T')[0] : '',
    phone: u.phone || '—',
    email: u.email,
    bloodGroup,
    status: 'Active',
    lastVisit: u.updatedAt
      ? new Date(u.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—',
    diagnosis,
    allergies: u.allergies || [],
    doctor: '—',
    initials,
  };
}

async function fetchPatients(search: string): Promise<Patient[]> {
  const url = new URL(`${AUTH_API_BASE}/api/patients`);
  if (search) url.searchParams.set('search', search);
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Failed to load patients (${res.status})`);
  }
  const json = await res.json();
  return ((json.data || []) as unknown[]).map(mapBackendPatient);
}

interface CreatePatientInput {
  firstName: string;
  lastName: string;
  phone?: string;
  gender: string;
  bloodGroup: string;
  dateOfBirth?: string;
  diagnosis?: string;
}

async function createPatientApi(input: CreatePatientInput): Promise<Patient> {
  const res = await fetch(`${AUTH_API_BASE}/api/patients`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok) throw new Error((json as { message?: string }).message || `Create failed (${res.status})`);
  return mapBackendPatient((json as { data: unknown }).data);
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

const STATUS_TONE: Record<PatientStatus, { tone: 'success' | 'info' | 'neutral' | 'danger'; pulse?: boolean }> = {
  Active:     { tone: 'success' },
  Admitted:   { tone: 'info' },
  Discharged: { tone: 'neutral' },
  Critical:   { tone: 'danger', pulse: true },
};

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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PatientsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PatientStatus>('All');
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [phone, setPhone] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  const { data: patients = [], isLoading, isError, error } = useQuery<Patient[], Error>({
    queryKey: ['patients', search],
    queryFn: () => fetchPatients(search),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: createPatientApi,
    onSuccess: (newPatient) => {
      queryClient.setQueryData<Patient[]>(['patients', search], prev => [newPatient, ...(prev ?? [])]);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsRegisterModalOpen(false);
      resetForm();
      router.push(`/emr/patients/${newPatient.id}`);
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  function resetForm() {
    setFirstName('');
    setLastName('');
    setDateOfBirth('');
    setGender('Male');
    setBloodGroup('O+');
    setPhone('');
    setDiagnosis('');
    setFormError('');
  }

  function handleOpenModal() {
    resetForm();
    setIsRegisterModalOpen(true);
  }

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!firstName.trim() || !lastName.trim()) {
      setFormError('First name and last name are required.');
      return;
    }
    createMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      gender,
      bloodGroup,
      dateOfBirth: dateOfBirth || undefined,
      diagnosis: diagnosis.trim() || undefined,
    });
  };

  const filtered = useMemo(() =>
    patients.filter(p => {
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchStatus;
    }), [patients, statusFilter]);

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
      cell: p => <span className="whitespace-nowrap text-muted-foreground">{p.age > 0 ? `${p.age}y` : '—'} · {p.gender[0]}</span>,
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
          <Button onClick={handleOpenModal}>
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
            placeholder="Search by name, phone, or email..."
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

      {/* Loading / error states */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading patients…
        </div>
      )}

      {isError && (
        <Card className="p-6">
          <div className="flex flex-col items-center py-8 text-center">
            <AlertTriangle className="mb-3 h-8 w-8 text-danger" />
            <h3 className="font-semibold text-foreground">Failed to load patients</h3>
            <p className="mt-1 text-sm text-muted-foreground">{error?.message}</p>
          </div>
        </Card>
      )}

      {/* Patient table / cards */}
      {!isLoading && !isError && view === 'table' && (
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
              href={`/emr/patients/${p.id}`}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <FileText className="h-3 w-3" aria-hidden /> View Chart
            </Link>
          )}
        />
      )}

      {!isLoading && !isError && view === 'cards' && (
        filtered.length === 0 ? (
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Users className="h-7 w-7" aria-hidden />
              </div>
              <h3 className="text-base font-semibold text-foreground">No patients found</h3>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">Try adjusting your search or status filter, or register a new patient.</p>
              <Button className="mt-5" size="sm" onClick={handleOpenModal}>Register Patient</Button>
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
                  <p className="mb-2 text-xs text-muted-foreground">{p.mrn} · {p.age > 0 ? `${p.age}y` : '—'} · {p.gender}</p>
                  <p className="mb-3 truncate text-xs text-muted-foreground">{p.diagnosis}</p>
                  {p.allergies.length > 0 && (
                    <p className="mb-3 flex items-center gap-1 text-xs text-danger">
                      <AlertTriangle className="h-3 w-3" aria-hidden /> {p.allergies.join(', ')}
                    </p>
                  )}
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <BloodBadge group={p.bloodGroup} />
                    <Link href={`/emr/patients/${p.id}`} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                      Chart <ChevronRight className="h-3 w-3" aria-hidden />
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="patient-first-name">First Name</Label>
              <Input
                id="patient-first-name"
                type="text"
                required
                placeholder="First name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="patient-last-name">Last Name</Label>
              <Input
                id="patient-last-name"
                type="text"
                required
                placeholder="Last name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="patient-dob">Date of Birth</Label>
              <Input
                id="patient-dob"
                type="date"
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
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
            <Label htmlFor="patient-phone">Phone Number <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="patient-phone"
              type="tel"
              placeholder="+91 98000 12345"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="patient-diagnosis">Initial Diagnosis / Reason <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="patient-diagnosis"
              type="text"
              placeholder="Chief complaint or diagnosis"
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
            />
          </div>

          {formError && (
            <p className="flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              ) : (
                <><CheckCircle className="h-4 w-4" aria-hidden /> Save Patient</>
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
