'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  User, Search, Phone, Droplets, AlertCircle, FileText,
  ChevronRight, Heart,
} from 'lucide-react';
import {
  PageHeader, Avatar, Badge, Button, Input,
  Card, CardContent, EmptyState, SkeletonTable, DataTable, type Column,
} from '@/components/ui';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type Patient = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  allergies?: string[];
  avatar?: string;
};

function age(dob?: string): string {
  if (!dob) return '—';
  const years = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
  return `${years}y`;
}

function fullName(p: Patient): string {
  return [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown Patient';
}

export default function DoctorPatientsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-patients'],
    queryFn: () =>
      fetch(`${API}/api/doctor/patients`, { headers: authHeaders() }).then(r => r.json()),
  });

  const patients: Patient[] = data?.data ?? [];

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    return (
      fullName(p).toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q) ||
      (p.phone ?? '').includes(q)
    );
  });

  const columns: Column<Patient>[] = [
    {
      key: 'name',
      header: 'Patient',
      sortable: true,
      accessor: p => fullName(p),
      cell: p => (
        <div className="flex items-center gap-3">
          <Avatar name={fullName(p)} size="sm" />
          <div>
            <p className="font-semibold text-foreground">{fullName(p)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{p.email || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      accessor: p => p.phone ?? '—',
      cell: p => (
        <span className="flex items-center gap-1.5 font-mono text-sm tabular-nums text-foreground">
          <Phone className="h-3.5 w-3.5 text-subtle-foreground" aria-hidden />
          {p.phone || '—'}
        </span>
      ),
    },
    {
      key: 'age',
      header: 'Age / Gender',
      accessor: p => age(p.dateOfBirth),
      cell: p => (
        <span className="text-sm text-foreground">
          {age(p.dateOfBirth)}{p.gender ? ` · ${p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}` : ''}
        </span>
      ),
    },
    {
      key: 'bloodGroup',
      header: 'Blood Group',
      accessor: p => p.bloodGroup ?? '—',
      cell: p => p.bloodGroup ? (
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Droplets className="h-3.5 w-3.5 text-danger" aria-hidden />
          {p.bloodGroup}
        </span>
      ) : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'allergies',
      header: 'Allergies',
      accessor: p => (p.allergies ?? []).join(', ') || 'None',
      cell: p => {
        const list = p.allergies ?? [];
        if (list.length === 0) return <span className="text-sm text-muted-foreground">None known</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {list.slice(0, 3).map(a => (
              <Badge key={a} tone="danger" className="text-xs">
                <AlertCircle className="h-3 w-3" aria-hidden /> {a}
              </Badge>
            ))}
            {list.length > 3 && (
              <Badge tone="neutral" className="text-xs">+{list.length - 3}</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      accessor: () => '',
      cell: p => (
        <Link href={`/emr?patientId=${p._id}`}>
          <Button size="sm" variant="ghost" aria-label={`View records for ${fullName(p)}`}>
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Records
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Patients"
        description="Everyone you have seen in a consultation."
        crumbs={[{ label: 'Doctor', href: '/dashboard' }, { label: 'Patients' }]}
        actions={
          <Input
            icon={<Search />}
            type="text"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64"
            aria-label="Search patients"
          />
        }
      />

      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : patients.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={Heart}
              title="No patients yet"
              description="Patients you see in a consultation will appear here."
            />
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={User}
              title="No results"
              description={`No patients match "${search}".`}
              action={{ label: 'Clear search', onClick: () => setSearch('') }}
            />
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={p => p._id}
          searchPlaceholder="Search patients…"
          exportName="my-patients"
        />
      )}
    </div>
  );
}
