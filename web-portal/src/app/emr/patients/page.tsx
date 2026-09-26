'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, UserPlus, WifiOff } from 'lucide-react';
import {
    PageHeader, Badge, Card, CardContent, Avatar, EmptyState, ErrorState,
    Input, Skeleton,
} from '@/components/ui';
import { API_BASE, getToken, ApiOfflineError, patientDisplayName, ageOf, type PatientRecord } from '../_lib/api';

const DEMO_PATIENTS: PatientRecord[] = [
    {
        _id: 'demo-p1',
        firstName: 'Priya', lastName: 'Sharma',
        email: 'priya.sharma@example.com', phone: '+91 98765 43210',
        dateOfBirth: '1985-06-12', gender: 'female', bloodGroup: 'B+',
        uhid: 'UHID-2024-0001', allergies: ['Penicillin'],
    },
    {
        _id: 'demo-p2',
        firstName: 'Rahul', lastName: 'Verma',
        email: 'rahul.verma@example.com', phone: '+91 99123 45678',
        dateOfBirth: '1972-11-03', gender: 'male', bloodGroup: 'O+',
        uhid: 'UHID-2024-0002', allergies: [],
    },
    {
        _id: 'demo-p3',
        firstName: 'Anjali', lastName: 'Patel',
        email: 'anjali.patel@example.com', phone: '+91 87654 32109',
        dateOfBirth: '1990-02-28', gender: 'female', bloodGroup: 'A+',
        uhid: 'UHID-2024-0003', allergies: ['Aspirin', 'Sulfa drugs'],
    },
];

async function fetchPatients(): Promise<{ data: PatientRecord[]; demo: boolean }> {
    const token = getToken();
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${API_BASE}/api/doctor/patients`, {
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        clearTimeout(timer);
        if (!res.ok) throw new ApiOfflineError();
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
            return { data: json.data as PatientRecord[], demo: false };
        }
        throw new ApiOfflineError();
    } catch {
        return { data: DEMO_PATIENTS, demo: true };
    }
}

export default function ClinicalPatientsPage() {
    const [search, setSearch] = React.useState('');

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['emr', 'patients-list'],
        queryFn: fetchPatients,
    });

    const patients = data?.data ?? [];
    const demo = data?.demo ?? false;

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return patients;
        return patients.filter((p) => {
            const name = patientDisplayName(p).toLowerCase();
            return (
                name.includes(q) ||
                (p.phone || '').includes(q) ||
                (p.email || '').toLowerCase().includes(q) ||
                (p.uhid || '').toLowerCase().includes(q)
            );
        });
    }, [patients, search]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Patients"
                description="Search and view your patient records."
                crumbs={[{ label: 'Clinical', href: '/dashboard' }, { label: 'Patients' }]}
                actions={
                    demo ? (
                        <Badge tone="warning" dot pulse>
                            <WifiOff className="h-3 w-3" aria-hidden /> Demo data — backend offline
                        </Badge>
                    ) : undefined
                }
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="w-full sm:max-w-sm">
                    <Input
                        icon={<Search />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, phone, UHID…"
                        aria-label="Search patients"
                    />
                </div>
                <p className="text-sm text-muted-foreground">
                    {patients.length} patient{patients.length !== 1 ? 's' : ''} found
                </p>
            </div>

            {isLoading && (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-3 w-64" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {isError && !isLoading && (
                <ErrorState onRetry={() => refetch()} />
            )}

            {!isLoading && filtered.length === 0 && (
                <EmptyState
                    icon={Users}
                    title={search ? 'No matching patients' : 'No patients yet'}
                    description={
                        search
                            ? 'Try a different name, phone, or UHID.'
                            : 'Patients will appear here after their first consultation.'
                    }
                    action={
                        search
                            ? { label: 'Clear search', onClick: () => setSearch('') }
                            : undefined
                    }
                />
            )}

            {!isLoading && filtered.length > 0 && (
                <div className="space-y-3">
                    {filtered.map((patient) => {
                        const name = patientDisplayName(patient);
                        const age = ageOf(patient.dateOfBirth);
                        return (
                            <Link key={patient._id} href={`/emr/patients/${patient._id}`} className="block no-underline">
                                <Card className="transition-colors hover:border-primary/30 hover:bg-primary/5">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar name={name} src={patient.avatar || undefined} size="md" />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-sm font-semibold text-foreground">{name}</h3>
                                                    {patient.uhid && (
                                                        <span className="font-mono text-xs text-muted-foreground">{patient.uhid}</span>
                                                    )}
                                                    {patient.criticalAlert && (
                                                        <Badge tone="danger" dot pulse className="text-[10px]">
                                                            {patient.criticalAlert}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {[
                                                        age != null ? `${age} Y` : null,
                                                        patient.gender ? patient.gender[0].toUpperCase() + patient.gender.slice(1) : null,
                                                        patient.bloodGroup,
                                                        patient.phone,
                                                    ].filter(Boolean).join(' · ')}
                                                </p>
                                            </div>
                                            {(patient.allergies?.length ?? 0) > 0 && (
                                                <div className="hidden shrink-0 sm:flex flex-wrap gap-1">
                                                    {(patient.allergies || []).slice(0, 2).map((a) => (
                                                        <Badge key={a} tone="danger" className="text-[10px]">{a}</Badge>
                                                    ))}
                                                    {(patient.allergies?.length ?? 0) > 2 && (
                                                        <Badge tone="neutral" className="text-[10px]">+{(patient.allergies?.length ?? 0) - 2}</Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-4">
                <UserPlus className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <p className="text-xs text-muted-foreground">
                    To register a new patient, go to{' '}
                    <Link href="/reception/walkin" className="font-semibold text-primary hover:underline">
                        Walk-in Registration
                    </Link>{' '}
                    (requires Receptionist or Admin access).
                </p>
            </div>
        </div>
    );
}
