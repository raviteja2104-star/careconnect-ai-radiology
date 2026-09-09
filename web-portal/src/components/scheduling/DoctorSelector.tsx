'use client';
import React, { useState, useMemo } from 'react';
import { Search, Check, Users, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent,
         Input, Select, Skeleton, Avatar, EmptyState, Button, Badge } from '@/components/ui';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: 'Bearer ' + token } : {};
}

type Doctor = {
  _id: string;
  name: string;
  specialty: string;
  department: string;
  hospital: string;
  isActive: boolean;
  image: string | null;
  experienceYears: number;
};

export const DoctorSelector = ({
  selected,
  onSelect,
  onAddDoctor,
}: {
  selected: string;
  onSelect: (id: string) => void;
  onAddDoctor?: () => void;
}) => {
  const [search, setSearch] = useState('');
  const [hospital, setHospital] = useState('');
  const [department, setDepartment] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const params = new URLSearchParams();
  if (hospital) params.set('hospital', hospital);
  if (department) params.set('department', department);
  if (statusFilter) params.set('status', statusFilter);

  const { data, isLoading } = useQuery({
    queryKey: ['admin_doctors', hospital, department, statusFilter],
    queryFn: () =>
      fetch(`${API}/api/admin/doctors?${params.toString()}`, { headers: authHeaders() })
        .then(res => res.json()),
    staleTime: 30_000,
  });

  const allDoctors: Doctor[] = data?.data ?? [];

  const doctors = useMemo(() => {
    if (!search.trim()) return allDoctors;
    const q = search.toLowerCase();
    return allDoctors.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q) ||
      d.department?.toLowerCase().includes(q)
    );
  }, [allDoctors, search]);

  return (
    <Card className="flex max-h-[calc(100vh-14rem)] flex-col overflow-hidden">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Resource Planner</CardTitle>
          {onAddDoctor && (
            <Button size="sm" variant="secondary" onClick={onAddDoctor} className="h-7 gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add Doctor
            </Button>
          )}
        </div>
        <CardDescription>Pick a doctor to edit their weekly template.</CardDescription>

        <div className="flex gap-2 pt-2">
          <Select
            aria-label="Filter by hospital"
            className="h-9 text-xs"
            value={hospital}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setHospital(e.target.value)}
          >
            <option value="">All Hospitals</option>
            <option value="CareConnect Main Hospital">Main Campus</option>
            <option value="CareConnect North">North Branch</option>
            <option value="CareConnect South">South Branch</option>
          </Select>
          <Select
            aria-label="Filter by status"
            className="h-9 text-xs"
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        <Input
          icon={<Search />}
          type="text"
          placeholder="Search doctor, specialty…"
          aria-label="Search doctor"
          className="h-9"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        />
      </CardHeader>

      <CardContent className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-2 pt-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-transparent p-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-2.5 w-20 rounded" />
              </div>
            </div>
          ))
        ) : doctors.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No doctors found"
            description={search ? 'Try a different search term.' : 'Add the first doctor to get started.'}
          />
        ) : (
          doctors.map((doc) => (
            <button
              key={doc._id}
              onClick={() => onSelect(doc._id)}
              aria-current={selected === doc._id ? 'true' : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-150',
                selected === doc._id
                  ? 'border-primary/40 bg-primary/5 shadow-soft'
                  : 'border-transparent hover:bg-muted'
              )}
            >
              <Avatar name={doc.name} src={doc.image ?? undefined} size="md" status={doc.isActive ? 'online' : 'offline'} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-foreground">{doc.name}</h3>
                <p className="truncate text-xs text-muted-foreground">
                  {doc.specialty}{doc.department ? ` · ${doc.department}` : ''}
                </p>
                {!doc.isActive && (
                  <Badge tone="neutral" className="mt-0.5 text-[10px]">Inactive</Badge>
                )}
              </div>
              {selected === doc._id && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
};
