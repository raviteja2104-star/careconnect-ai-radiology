'use client';

import * as React from 'react';
import {
    CalendarCheck, CalendarClock, XCircle, UserX, Stethoscope, Package, CalendarDays,
    Settings as SettingsIcon, Plus, ShieldCheck, Building2, Phone, Mail, MapPin,
} from 'lucide-react';
import {
    Badge, Button, Card, CardContent, CardHeader, CardTitle, DataTable, Dialog, EmptyState, ErrorState,
    FieldHint, Input, Label, Select, SkeletonCard, SkeletonTable, StatCard, StatGrid, Switch,
    Tabs, TabsContent, TabsList, TabsTrigger, PageHeader, type Column,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
    ApiOfflineError, checkInAppointment, claimProvider, createDoctor, createException, createService,
    deleteDoctor, deleteService, demoApplyCheckIn, demoApplyClaim, demoApplyDoctorRemove, demoApplyDoctorUpsert,
    demoApplyExceptionAdd, demoApplyExceptionRemove, demoApplyProviderUpdate, demoApplySchedule,
    demoApplyServiceRemove, demoApplyServiceUpsert, deleteException, fetchDoctors, fetchExceptions,
    fetchMyProviders, fetchProviderDashboard, fetchSchedules, fetchServices, formatDate, formatINR, isToday,
    putSchedule, updateDoctor, updateProvider, updateService, DAY_LABELS, VERIFICATION_LABELS,
    type Appointment, type AvailabilityException, type Doctor, type DoctorSchedule, type Provider,
    type ProviderDashboard, type Service, type ScheduleDay, type WorkingHoursDay,
} from '../_lib/api';
import { DoctorDialog } from './_components/doctor-dialog';
import { ServiceDialog } from './_components/service-dialog';
import { ExceptionDialog } from './_components/exception-dialog';

type ConfirmState = {
    title: string;
    description: string;
    confirmLabel: string;
    tone?: 'danger';
    onConfirm: () => void | Promise<void>;
};

const STATUS_TONE: Record<Appointment['status'], 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'> = {
    BOOKED: 'info',
    CONFIRMED: 'brand',
    CHECKED_IN: 'success',
    COMPLETED: 'neutral',
    CANCELLED: 'danger',
    NO_SHOW: 'warning',
};

const emptyWorkingHours = (): WorkingHoursDay[] =>
    [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, open: '09:00', close: '18:00', closed: d === 0 }));

export default function ProviderDashboardPage() {
    const { toast } = useToast();

    const [providers, setProviders] = React.useState<Provider[]>([]);
    const [providersLoading, setProvidersLoading] = React.useState(true);
    const [providersDemo, setProvidersDemo] = React.useState(false);
    const [providersError, setProvidersError] = React.useState<string | null>(null);
    const [selectedId, setSelectedId] = React.useState<string>('');

    const [board, setBoard] = React.useState<ProviderDashboard | null>(null);
    const [boardLoading, setBoardLoading] = React.useState(true);
    const [boardError, setBoardError] = React.useState<string | null>(null);
    const [demoAny, setDemoAny] = React.useState(false);

    const [doctors, setDoctors] = React.useState<Doctor[]>([]);
    const [doctorsLoading, setDoctorsLoading] = React.useState(true);
    const [services, setServices] = React.useState<Service[]>([]);
    const [servicesLoading, setServicesLoading] = React.useState(true);
    const [schedules, setSchedules] = React.useState<DoctorSchedule[]>([]);
    const [schedulesLoading, setSchedulesLoading] = React.useState(true);
    const [exceptions, setExceptions] = React.useState<AvailabilityException[]>([]);
    const [exceptionsLoading, setExceptionsLoading] = React.useState(true);

    const [refreshKey, setRefreshKey] = React.useState(0);
    const refresh = React.useCallback(() => setRefreshKey((k) => k + 1), []);

    const [checkingInId, setCheckingInId] = React.useState<string | null>(null);

    const [doctorDialogOpen, setDoctorDialogOpen] = React.useState(false);
    const [editingDoctor, setEditingDoctor] = React.useState<Doctor | null>(null);
    const [savingDoctor, setSavingDoctor] = React.useState(false);

    const [serviceDialogOpen, setServiceDialogOpen] = React.useState(false);
    const [editingService, setEditingService] = React.useState<Service | null>(null);
    const [savingService, setSavingService] = React.useState(false);

    const [exceptionDialogOpen, setExceptionDialogOpen] = React.useState(false);
    const [savingException, setSavingException] = React.useState(false);

    const [confirm, setConfirm] = React.useState<ConfirmState | null>(null);
    const [confirmLoading, setConfirmLoading] = React.useState(false);

    // Settings form
    const [profile, setProfile] = React.useState<Partial<Provider>>({});
    const [workingHours, setWorkingHours] = React.useState<WorkingHoursDay[]>(emptyWorkingHours());
    const [savingProfile, setSavingProfile] = React.useState(false);

    /* Load "my providers" */
    React.useEffect(() => {
        let cancelled = false;
        setProvidersLoading(true);
        setProvidersError(null);
        fetchMyProviders()
            .then((res) => {
                if (cancelled) return;
                setProviders(res.data);
                setProvidersDemo(res.demo);
                setSelectedId((prev) => prev && res.data.some((p) => p._id === prev) ? prev : (res.data[0]?._id ?? ''));
            })
            .catch((err) => !cancelled && setProvidersError(err instanceof Error ? err.message : 'Failed to load providers'))
            .finally(() => !cancelled && setProvidersLoading(false));
        return () => { cancelled = true; };
    }, [refreshKey]);

    const selectedProvider = providers.find((p) => p._id === selectedId) ?? null;

    React.useEffect(() => {
        if (selectedProvider) {
            setProfile({ ...selectedProvider });
            setWorkingHours(selectedProvider.workingHours && selectedProvider.workingHours.length ? selectedProvider.workingHours.map((d) => ({ ...d })) : emptyWorkingHours());
        }
    }, [selectedProvider]);

    /* Dashboard + doctors + services + schedules + exceptions for selected provider */
    React.useEffect(() => {
        if (!selectedId) { setBoard(null); setBoardLoading(false); return; }
        let cancelled = false;
        setBoardLoading(true);
        setBoardError(null);
        fetchProviderDashboard(selectedId)
            .then((res) => { if (!cancelled) { setBoard(res.data); setDemoAny((d) => d || res.demo); } })
            .catch((err) => !cancelled && setBoardError(err instanceof Error ? err.message : 'Failed to load dashboard'))
            .finally(() => !cancelled && setBoardLoading(false));
        return () => { cancelled = true; };
    }, [selectedId, refreshKey]);

    React.useEffect(() => {
        if (!selectedId) { setDoctors([]); setDoctorsLoading(false); return; }
        let cancelled = false;
        setDoctorsLoading(true);
        fetchDoctors(selectedId)
            .then((res) => { if (!cancelled) { setDoctors(res.data); setDemoAny((d) => d || res.demo); } })
            .catch(() => !cancelled && setDoctors([]))
            .finally(() => !cancelled && setDoctorsLoading(false));
        return () => { cancelled = true; };
    }, [selectedId, refreshKey]);

    React.useEffect(() => {
        if (!selectedId) { setServices([]); setServicesLoading(false); return; }
        let cancelled = false;
        setServicesLoading(true);
        fetchServices(selectedId)
            .then((res) => { if (!cancelled) { setServices(res.data); setDemoAny((d) => d || res.demo); } })
            .catch(() => !cancelled && setServices([]))
            .finally(() => !cancelled && setServicesLoading(false));
        return () => { cancelled = true; };
    }, [selectedId, refreshKey]);

    React.useEffect(() => {
        if (!selectedId) { setSchedules([]); setSchedulesLoading(false); return; }
        let cancelled = false;
        setSchedulesLoading(true);
        fetchSchedules(selectedId)
            .then((res) => { if (!cancelled) { setSchedules(res.data); setDemoAny((d) => d || res.demo); } })
            .catch(() => !cancelled && setSchedules([]))
            .finally(() => !cancelled && setSchedulesLoading(false));
        return () => { cancelled = true; };
    }, [selectedId, refreshKey]);

    React.useEffect(() => {
        if (!selectedId) { setExceptions([]); setExceptionsLoading(false); return; }
        let cancelled = false;
        setExceptionsLoading(true);
        fetchExceptions(selectedId)
            .then((res) => { if (!cancelled) { setExceptions(res.data); setDemoAny((d) => d || res.demo); } })
            .catch(() => !cancelled && setExceptions([]))
            .finally(() => !cancelled && setExceptionsLoading(false));
        return () => { cancelled = true; };
    }, [selectedId, refreshKey]);

    const isDemo = providersDemo || demoAny;
    const doctorName = (id?: string) => doctors.find((d) => d._id === id)?.name ?? '—';

    /* ── Check-in ── */
    const handleCheckIn = async (appt: Appointment) => {
        setCheckingInId(appt._id);
        try {
            await checkInAppointment(appt._id);
            toast('success', 'Checked in', appt.patientDetails.name);
            refresh();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                demoApplyCheckIn(selectedId, appt._id);
                setBoard((prev) => prev && {
                    ...prev,
                    todayAppointments: prev.todayAppointments.map((a) => (a._id === appt._id ? { ...a, status: 'CHECKED_IN' } : a)),
                });
                toast('info', 'Checked in (offline demo)', 'Backend unreachable — recorded locally for this session only.');
            } else {
                toast('error', 'Check-in failed', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setCheckingInId(null);
        }
    };

    /* ── Doctors ── */
    const scheduleForDoctor = (doctorId: string) => schedules.find((s) => s.doctorId === doctorId)?.days ?? null;

    const saveDoctor = async (patch: Partial<Doctor>, days: ScheduleDay[]) => {
        setSavingDoctor(true);
        try {
            let saved: Doctor;
            if (editingDoctor) saved = await updateDoctor(selectedId, editingDoctor._id, patch);
            else saved = await createDoctor(selectedId, patch);
            await putSchedule(selectedId, saved._id, { days });
            toast('success', editingDoctor ? 'Doctor updated' : 'Doctor added', saved.name);
            setDoctorDialogOpen(false);
            refresh();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                const saved = demoApplyDoctorUpsert(selectedId, { ...(editingDoctor ? { _id: editingDoctor._id } : {}), ...patch });
                demoApplySchedule(selectedId, saved._id, days);
                setDoctors((prev) => {
                    const idx = prev.findIndex((d) => d._id === saved._id);
                    return idx >= 0 ? prev.map((d) => (d._id === saved._id ? saved : d)) : [saved, ...prev];
                });
                toast('info', 'Saved to demo data', 'Backend offline — this change is session-only.');
                setDoctorDialogOpen(false);
            } else {
                toast('error', 'Save failed', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setSavingDoctor(false);
        }
    };

    const toggleDoctorActive = async (doctor: Doctor, next: boolean) => {
        try {
            await updateDoctor(selectedId, doctor._id, { active: next });
            toast('success', next ? 'Doctor activated' : 'Doctor deactivated', doctor.name);
            refresh();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                demoApplyDoctorUpsert(selectedId, { _id: doctor._id, active: next });
                setDoctors((prev) => prev.map((d) => (d._id === doctor._id ? { ...d, active: next } : d)));
                toast('info', 'Applied to demo data', 'Backend offline — session-only change.');
            } else {
                toast('error', 'Update failed', err instanceof Error ? err.message : undefined);
            }
        }
    };

    const confirmDeactivateDoctor = (doctor: Doctor) => {
        setConfirm({
            title: 'Deactivate doctor',
            description: `${doctor.name} will be hidden from patient booking immediately. You can reactivate them later.`,
            confirmLabel: 'Deactivate',
            tone: 'danger',
            onConfirm: async () => {
                try {
                    await deleteDoctor(selectedId, doctor._id);
                    toast('success', 'Doctor deactivated', doctor.name);
                    refresh();
                } catch (err) {
                    if (err instanceof ApiOfflineError) {
                        demoApplyDoctorRemove(selectedId, doctor._id);
                        setDoctors((prev) => prev.filter((d) => d._id !== doctor._id));
                        toast('info', 'Applied to demo data', 'Backend offline — session-only change.');
                    } else {
                        toast('error', 'Deactivation failed', err instanceof Error ? err.message : undefined);
                    }
                }
            },
        });
    };

    /* ── Services ── */
    const saveService = async (patch: Partial<Service>) => {
        setSavingService(true);
        try {
            const saved = editingService
                ? await updateService(selectedId, editingService._id, patch)
                : await createService(selectedId, patch);
            toast('success', editingService ? 'Service updated' : 'Service added', saved.name);
            setServiceDialogOpen(false);
            refresh();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                const saved = demoApplyServiceUpsert(selectedId, { ...(editingService ? { _id: editingService._id } : {}), ...patch });
                setServices((prev) => {
                    const idx = prev.findIndex((s) => s._id === saved._id);
                    return idx >= 0 ? prev.map((s) => (s._id === saved._id ? saved : s)) : [saved, ...prev];
                });
                toast('info', 'Saved to demo data', 'Backend offline — this change is session-only.');
                setServiceDialogOpen(false);
            } else {
                toast('error', 'Save failed', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setSavingService(false);
        }
    };

    const toggleServiceActive = async (service: Service, next: boolean) => {
        try {
            await updateService(selectedId, service._id, { active: next });
            toast('success', next ? 'Service activated' : 'Service deactivated', service.name);
            refresh();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                demoApplyServiceUpsert(selectedId, { _id: service._id, active: next });
                setServices((prev) => prev.map((s) => (s._id === service._id ? { ...s, active: next } : s)));
                toast('info', 'Applied to demo data', 'Backend offline — session-only change.');
            } else {
                toast('error', 'Update failed', err instanceof Error ? err.message : undefined);
            }
        }
    };

    const confirmDeactivateService = (service: Service) => {
        setConfirm({
            title: 'Deactivate service',
            description: `${service.name} will be hidden from patient booking immediately.`,
            confirmLabel: 'Deactivate',
            tone: 'danger',
            onConfirm: async () => {
                try {
                    await deleteService(selectedId, service._id);
                    toast('success', 'Service deactivated', service.name);
                    refresh();
                } catch (err) {
                    if (err instanceof ApiOfflineError) {
                        demoApplyServiceRemove(selectedId, service._id);
                        setServices((prev) => prev.filter((s) => s._id !== service._id));
                        toast('info', 'Applied to demo data', 'Backend offline — session-only change.');
                    } else {
                        toast('error', 'Deactivation failed', err instanceof Error ? err.message : undefined);
                    }
                }
            },
        });
    };

    /* ── Exceptions ── */
    const saveException = async (body: Partial<AvailabilityException>) => {
        setSavingException(true);
        try {
            const saved = await createException(selectedId, body);
            toast('success', 'Exception added', formatDate(saved.date));
            setExceptionDialogOpen(false);
            refresh();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                const saved = demoApplyExceptionAdd(selectedId, body);
                setExceptions((prev) => [saved, ...prev]);
                toast('info', 'Saved to demo data', 'Backend offline — this change is session-only.');
                setExceptionDialogOpen(false);
            } else {
                toast('error', 'Save failed', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setSavingException(false);
        }
    };

    const removeException = async (exception: AvailabilityException) => {
        try {
            await deleteException(selectedId, exception._id);
            toast('success', 'Exception removed');
            refresh();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                demoApplyExceptionRemove(selectedId, exception._id);
                setExceptions((prev) => prev.filter((e) => e._id !== exception._id));
                toast('info', 'Applied to demo data', 'Backend offline — session-only change.');
            } else {
                toast('error', 'Remove failed', err instanceof Error ? err.message : undefined);
            }
        }
    };

    /* ── Settings / profile / claim ── */
    const saveProfile = async () => {
        setSavingProfile(true);
        const body: Partial<Provider> = { ...profile, workingHours };
        try {
            await updateProvider(selectedId, body);
            toast('success', 'Profile saved', selectedProvider?.name);
            refresh();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                const saved = demoApplyProviderUpdate(selectedId, body);
                setProviders((prev) => prev.map((p) => (p._id === selectedId ? saved : p)));
                toast('info', 'Saved to demo data', 'Backend offline — this change is session-only.');
            } else {
                toast('error', 'Save failed', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setSavingProfile(false);
        }
    };

    const doClaim = async () => {
        try {
            const saved = await claimProvider(selectedId);
            setProviders((prev) => prev.map((p) => (p._id === selectedId ? saved : p)));
            toast('success', 'Profile claim submitted', 'Status set to Claimed — pending admin review.');
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                const saved = demoApplyClaim(selectedId);
                setProviders((prev) => prev.map((p) => (p._id === selectedId ? saved : p)));
                toast('info', 'Claimed in demo data', 'Backend offline — this change is session-only.');
            } else {
                toast('error', 'Claim failed', err instanceof Error ? err.message : undefined);
            }
        }
    };

    const confirmClaim = () => {
        setConfirm({
            title: 'Claim this profile',
            description: `Claiming ${selectedProvider?.name} links it to your account and moves it into the admin verification queue. This is a real state change, not an automatic approval — the CareConnect team still reviews it.`,
            confirmLabel: 'Claim profile',
            onConfirm: doClaim,
        });
    };

    /* ── Appointment table columns ── */
    const apptColumns: Column<Appointment>[] = [
        {
            key: 'patient', header: 'Patient', sortable: true,
            cell: (a) => (
                <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{a.patientDetails.name}</p>
                    <p className="text-xs text-muted-foreground">{[a.patientDetails.age && `${a.patientDetails.age}y`, a.patientDetails.gender].filter(Boolean).join(' · ') || '—'}</p>
                </div>
            ),
            accessor: (a) => a.patientDetails.name,
        },
        { key: 'time', header: 'Time', sortable: true, cell: (a) => <span className="tabular-nums">{a.startTime}–{a.endTime}</span>, accessor: (a) => a.startTime },
        { key: 'doctor', header: 'Doctor', cell: (a) => doctorName(a.doctorId), accessor: (a) => doctorName(a.doctorId) },
        { key: 'type', header: 'Type', cell: (a) => <span className="capitalize text-muted-foreground">{a.type}</span> },
        { key: 'status', header: 'Status', cell: (a) => <Badge tone={STATUS_TONE[a.status]}>{a.status.replace('_', ' ')}</Badge> },
        { key: 'code', header: 'Code', cell: (a) => <span className="font-mono text-xs text-muted-foreground">{a.confirmationCode}</span> },
    ];

    const upcomingColumns: Column<Appointment>[] = [
        { key: 'date', header: 'Date', sortable: true, cell: (a) => formatDate(a.date), accessor: (a) => a.date },
        ...apptColumns,
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Provider Dashboard"
                description="Manage doctors, services, availability and today's appointments for your CareConnect Nearby listing."
                crumbs={[{ label: 'Nearby', href: '/nearby/provider/dashboard' }, { label: 'Provider Dashboard' }]}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        {isDemo && <Badge tone="warning" dot pulse>Demo data — backend offline</Badge>}
                        {providers.length > 0 && (
                            <Select
                                value={selectedId}
                                onChange={(e) => setSelectedId(e.target.value)}
                                aria-label="Select provider"
                                className="h-9 w-auto min-w-56"
                            >
                                {providers.map((p) => (
                                    <option key={p._id} value={p._id}>{p.name} — {p.locality}</option>
                                ))}
                            </Select>
                        )}
                    </div>
                }
            />

            {providersError ? (
                <ErrorState onRetry={refresh} description={providersError} />
            ) : providersLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
                </div>
            ) : providers.length === 0 ? (
                <EmptyState
                    icon={Building2}
                    title="No providers linked to your account yet"
                    description="Once you claim or are added to a provider listing, it will appear here."
                />
            ) : (
                <>
                    {selectedProvider && (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                                        <Building2 className="h-5 w-5" aria-hidden />
                                    </span>
                                    <div>
                                        <p className="font-semibold text-foreground">{selectedProvider.name}</p>
                                        <p className="text-xs text-muted-foreground">{selectedProvider.locality} · {selectedProvider.type}</p>
                                    </div>
                                </div>
                                <Badge tone={selectedProvider.verificationStatus === 'VERIFIED' ? 'success' : selectedProvider.verificationStatus === 'UNVERIFIED' ? 'neutral' : selectedProvider.verificationStatus === 'CLOSED' ? 'danger' : 'warning'}>
                                    {VERIFICATION_LABELS[selectedProvider.verificationStatus]}
                                </Badge>
                            </CardContent>
                        </Card>
                    )}

                    {boardError ? (
                        <ErrorState onRetry={refresh} description={boardError} />
                    ) : boardLoading ? (
                        <StatGrid>{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}</StatGrid>
                    ) : (
                        <StatGrid>
                            <StatCard label="Today's appointments" value={board?.todayAppointments.length ?? 0} icon={CalendarCheck} tone="brand" delay={0} />
                            <StatCard label="Upcoming" value={board?.upcoming.length ?? 0} icon={CalendarClock} tone="violet" delay={0.05} />
                            <StatCard label="Cancelled" value={board?.cancelled.length ?? 0} icon={XCircle} tone="rose" delay={0.1} />
                            <StatCard label="No-shows" value={board?.noShows.length ?? 0} icon={UserX} tone="amber" delay={0.15} />
                        </StatGrid>
                    )}

                    <Tabs defaultValue="today">
                        <div className="overflow-x-auto no-scrollbar">
                            <TabsList>
                                <TabsTrigger value="today"><CalendarCheck className="h-4 w-4" aria-hidden /> Today&apos;s Schedule</TabsTrigger>
                                <TabsTrigger value="doctors"><Stethoscope className="h-4 w-4" aria-hidden /> Doctors</TabsTrigger>
                                <TabsTrigger value="services"><Package className="h-4 w-4" aria-hidden /> Services</TabsTrigger>
                                <TabsTrigger value="availability"><CalendarDays className="h-4 w-4" aria-hidden /> Availability</TabsTrigger>
                                <TabsTrigger value="settings"><SettingsIcon className="h-4 w-4" aria-hidden /> Settings</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="today" className="space-y-3">
                            {boardLoading ? <SkeletonTable rows={4} /> : (
                                <DataTable<Appointment>
                                    columns={apptColumns}
                                    data={board?.todayAppointments ?? []}
                                    rowKey={(a) => a._id}
                                    exportName={`appointments-today-${selectedId}`}
                                    emptyTitle="No appointments today"
                                    emptyDescription="Bookings for today will show up here as patients confirm slots."
                                    rowActions={(a) => (
                                        <Button
                                            size="sm"
                                            variant={a.status === 'CHECKED_IN' || a.status === 'COMPLETED' ? 'outline' : 'primary'}
                                            disabled={a.status === 'CHECKED_IN' || a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'NO_SHOW'}
                                            loading={checkingInId === a._id}
                                            onClick={() => handleCheckIn(a)}
                                        >
                                            {a.status === 'CHECKED_IN' ? 'Checked in' : 'Check in'}
                                        </Button>
                                    )}
                                />
                            )}

                            <Card>
                                <CardHeader><CardTitle className="text-base">Cancelled &amp; no-shows</CardTitle></CardHeader>
                                <CardContent className="space-y-4 pt-0">
                                    <DataTable<Appointment>
                                        columns={upcomingColumns}
                                        data={[...(board?.cancelled ?? []), ...(board?.noShows ?? [])]}
                                        rowKey={(a) => a._id}
                                        searchable={false}
                                        emptyTitle="Nothing cancelled or missed recently"
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="doctors" className="space-y-3">
                            <div className="flex justify-end">
                                <Button size="sm" onClick={() => { setEditingDoctor(null); setDoctorDialogOpen(true); }}>
                                    <Plus className="h-3.5 w-3.5" aria-hidden /> Add doctor
                                </Button>
                            </div>
                            {doctorsLoading ? <SkeletonTable rows={4} /> : (
                                <DataTable<Doctor>
                                    columns={[
                                        { key: 'name', header: 'Name', sortable: true, cell: (d) => <span className="font-medium text-foreground">{d.name}</span> },
                                        { key: 'specialty', header: 'Specialty', cell: (d) => d.specialty ?? '—' },
                                        { key: 'qualification', header: 'Qualification', cell: (d) => <span className="text-muted-foreground">{d.qualification ?? '—'}</span> },
                                        { key: 'experience', header: 'Exp.', align: 'right', cell: (d) => d.experienceYears != null ? `${d.experienceYears} yrs` : '—' },
                                        { key: 'fee', header: 'Fee', align: 'right', cell: (d) => formatINR(d.consultationFee) },
                                        {
                                            key: 'active', header: 'Active', align: 'center',
                                            cell: (d) => (
                                                <span onClick={(e) => e.stopPropagation()} className="inline-flex">
                                                    <Switch checked={d.active} onCheckedChange={(v) => void toggleDoctorActive(d, v)} label={`Toggle ${d.name} active`} />
                                                </span>
                                            ),
                                        },
                                    ]}
                                    data={doctors}
                                    rowKey={(d) => d._id}
                                    onRowClick={(d) => { setEditingDoctor(d); setDoctorDialogOpen(true); }}
                                    emptyTitle="No doctors added yet"
                                    emptyDescription="Add your first doctor to start accepting bookings."
                                    rowActions={(d) => (
                                        <Button size="sm" variant="ghost" onClick={() => confirmDeactivateDoctor(d)} disabled={!d.active}>
                                            Deactivate
                                        </Button>
                                    )}
                                />
                            )}
                        </TabsContent>

                        <TabsContent value="services" className="space-y-3">
                            <div className="flex justify-end">
                                <Button size="sm" onClick={() => { setEditingService(null); setServiceDialogOpen(true); }}>
                                    <Plus className="h-3.5 w-3.5" aria-hidden /> Add service
                                </Button>
                            </div>
                            {servicesLoading ? <SkeletonTable rows={4} /> : (
                                <DataTable<Service>
                                    columns={[
                                        { key: 'name', header: 'Name', sortable: true, cell: (s) => <span className="font-medium text-foreground">{s.name}</span> },
                                        { key: 'category', header: 'Category', cell: (s) => s.category ?? '—' },
                                        { key: 'price', header: 'Price', align: 'right', sortable: true, cell: (s) => formatINR(s.price), accessor: (s) => s.price },
                                        { key: 'duration', header: 'Duration', align: 'right', cell: (s) => `${s.durationMinutes} min` },
                                        { key: 'flags', header: 'Flags', cell: (s) => (
                                            <div className="flex flex-wrap gap-1">
                                                {s.homeCollection && <Badge tone="info">Home collection</Badge>}
                                                {s.onlineBooking && <Badge tone="brand">Online booking</Badge>}
                                            </div>
                                        ) },
                                        {
                                            key: 'active', header: 'Active', align: 'center',
                                            cell: (s) => (
                                                <span onClick={(e) => e.stopPropagation()} className="inline-flex">
                                                    <Switch checked={s.active} onCheckedChange={(v) => void toggleServiceActive(s, v)} label={`Toggle ${s.name} active`} />
                                                </span>
                                            ),
                                        },
                                    ]}
                                    data={services}
                                    rowKey={(s) => s._id}
                                    onRowClick={(s) => { setEditingService(s); setServiceDialogOpen(true); }}
                                    emptyTitle="No services added yet"
                                    emptyDescription="Add consultations, tests or procedures patients can book."
                                    rowActions={(s) => (
                                        <Button size="sm" variant="ghost" onClick={() => confirmDeactivateService(s)} disabled={!s.active}>
                                            Deactivate
                                        </Button>
                                    )}
                                />
                            )}
                        </TabsContent>

                        <TabsContent value="availability" className="space-y-4">
                            <Card>
                                <CardHeader><CardTitle className="text-base">Weekly availability</CardTitle></CardHeader>
                                <CardContent className="pt-0">
                                    {schedulesLoading ? <SkeletonTable rows={doctors.length || 3} /> : doctors.length === 0 ? (
                                        <EmptyState icon={CalendarDays} title="Add a doctor first" description="Weekly hours are set per doctor in the Doctors tab." />
                                    ) : (
                                        <div className="overflow-x-auto scrollbar-thin">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-border">
                                                        <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Doctor</th>
                                                        {DAY_LABELS.map((d) => (
                                                            <th key={d} scope="col" className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">{d}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {doctors.map((doc) => {
                                                        const days = scheduleForDoctor(doc._id) ?? [];
                                                        return (
                                                            <tr key={doc._id}>
                                                                <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">{doc.name}</td>
                                                                {DAY_LABELS.map((_, dow) => {
                                                                    const day = days.find((d) => d.dayOfWeek === dow);
                                                                    return (
                                                                        <td key={dow} className="px-3 py-2.5 text-center">
                                                                            {day?.active ? (
                                                                                <span className="text-xs tabular-nums text-foreground">{day.startTime}–{day.endTime}</span>
                                                                            ) : (
                                                                                <span className="text-xs text-subtle-foreground">Off</span>
                                                                            )}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-base">Holidays &amp; exceptions</CardTitle>
                                    <Button size="sm" variant="outline" onClick={() => setExceptionDialogOpen(true)}>
                                        <Plus className="h-3.5 w-3.5" aria-hidden /> Add exception
                                    </Button>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    {exceptionsLoading ? <SkeletonTable rows={2} /> : exceptions.length === 0 ? (
                                        <EmptyState icon={CalendarDays} title="No holidays or exceptions set" description="Add a date to override the regular weekly schedule." />
                                    ) : (
                                        <ul className="divide-y divide-border">
                                            {exceptions.map((exc) => (
                                                <li key={exc._id} className="flex items-center justify-between py-3">
                                                    <div>
                                                        <p className="font-medium text-foreground">{formatDate(exc.date)} <span className="ml-2 text-xs font-normal text-muted-foreground capitalize">{exc.type.replace('_', ' ').toLowerCase()}</span></p>
                                                        {exc.reason && <p className="text-xs text-muted-foreground">{exc.reason}</p>}
                                                        {exc.type === 'CUSTOM_HOURS' && <p className="text-xs text-muted-foreground tabular-nums">{exc.startTime}–{exc.endTime}</p>}
                                                    </div>
                                                    <Button size="sm" variant="ghost" onClick={() => removeException(exc)}>Remove</Button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-4">
                            {!selectedProvider?.claimedByUserId && (
                                <Card className="border-warning/40 bg-warning-soft/40">
                                    <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="h-5 w-5 text-warning" aria-hidden />
                                            <div>
                                                <p className="font-semibold text-foreground">This profile is unclaimed</p>
                                                <p className="text-xs text-muted-foreground">Claim it to manage doctors, services and appointments as its owner.</p>
                                            </div>
                                        </div>
                                        <Button onClick={confirmClaim}>Claim this profile</Button>
                                    </CardContent>
                                </Card>
                            )}

                            <Card>
                                <CardHeader><CardTitle className="text-base">Profile details</CardTitle></CardHeader>
                                <CardContent className="space-y-4 pt-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="p-name">Name</Label>
                                            <Input id="p-name" value={profile.name ?? ''} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
                                        </div>
                                        <div>
                                            <Label htmlFor="p-type">Type</Label>
                                            <Input id="p-type" value={profile.type ?? ''} onChange={(e) => setProfile((p) => ({ ...p, type: e.target.value }))} />
                                        </div>
                                        <div>
                                            <Label htmlFor="p-subtype">Subtype</Label>
                                            <Input id="p-subtype" value={profile.subtype ?? ''} onChange={(e) => setProfile((p) => ({ ...p, subtype: e.target.value }))} />
                                        </div>
                                        <div>
                                            <Label htmlFor="p-locality">Locality</Label>
                                            <Input id="p-locality" icon={<MapPin />} value={profile.locality ?? ''} onChange={(e) => setProfile((p) => ({ ...p, locality: e.target.value }))} />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <Label htmlFor="p-address">Address</Label>
                                            <Input id="p-address" value={profile.address ?? ''} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} />
                                        </div>
                                        <div>
                                            <Label htmlFor="p-phone">Phone</Label>
                                            <Input id="p-phone" icon={<Phone />} value={profile.phone ?? ''} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
                                        </div>
                                        <div>
                                            <Label htmlFor="p-email">Email</Label>
                                            <Input id="p-email" icon={<Mail />} value={profile.email ?? ''} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Accept online appointments</p>
                                            <p className="text-xs text-muted-foreground">Turn off to pause new bookings without deactivating the listing.</p>
                                        </div>
                                        <Switch
                                            checked={profile.appointmentEnabled ?? false}
                                            onCheckedChange={(v) => setProfile((p) => ({ ...p, appointmentEnabled: v }))}
                                            label="Accept online appointments"
                                        />
                                    </div>

                                    <div>
                                        <p className="mb-2 text-sm font-semibold text-foreground">Working hours</p>
                                        <div className="space-y-2">
                                            {workingHours.map((d, idx) => (
                                                <div key={d.dayOfWeek} className="flex flex-wrap items-center gap-3 rounded-xl border border-border px-3 py-2">
                                                    <Switch
                                                        checked={!d.closed}
                                                        onCheckedChange={(v) => setWorkingHours((prev) => prev.map((x, i) => (i === idx ? { ...x, closed: !v } : x)))}
                                                        label={`${DAY_LABELS[d.dayOfWeek]} open`}
                                                    />
                                                    <span className="w-9 text-sm font-semibold text-foreground">{DAY_LABELS[d.dayOfWeek]}</span>
                                                    <Input
                                                        type="time" className="h-8 w-28" disabled={d.closed}
                                                        value={d.open ?? ''}
                                                        onChange={(e) => setWorkingHours((prev) => prev.map((x, i) => (i === idx ? { ...x, open: e.target.value } : x)))}
                                                        aria-label={`${DAY_LABELS[d.dayOfWeek]} open time`}
                                                    />
                                                    <span className="text-xs text-muted-foreground">to</span>
                                                    <Input
                                                        type="time" className="h-8 w-28" disabled={d.closed}
                                                        value={d.close ?? ''}
                                                        onChange={(e) => setWorkingHours((prev) => prev.map((x, i) => (i === idx ? { ...x, close: e.target.value } : x)))}
                                                        aria-label={`${DAY_LABELS[d.dayOfWeek]} close time`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <FieldHint>Changes save to the backend when it&apos;s reachable; otherwise they apply to this session&apos;s demo data only.</FieldHint>

                                    <div className="flex justify-end">
                                        <Button onClick={saveProfile} loading={savingProfile}>Save changes</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}

            <DoctorDialog
                open={doctorDialogOpen}
                onClose={() => setDoctorDialogOpen(false)}
                doctor={editingDoctor}
                schedule={editingDoctor ? scheduleForDoctor(editingDoctor._id) : null}
                saving={savingDoctor}
                onSave={saveDoctor}
            />
            <ServiceDialog
                open={serviceDialogOpen}
                onClose={() => setServiceDialogOpen(false)}
                service={editingService}
                saving={savingService}
                onSave={saveService}
            />
            <ExceptionDialog
                open={exceptionDialogOpen}
                onClose={() => setExceptionDialogOpen(false)}
                saving={savingException}
                onSave={saveException}
            />

            <Dialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                title={confirm?.title}
                description={confirm?.description}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
                        <Button
                            variant={confirm?.tone === 'danger' ? 'danger' : 'primary'}
                            loading={confirmLoading}
                            onClick={async () => {
                                if (!confirm) return;
                                setConfirmLoading(true);
                                try {
                                    await confirm.onConfirm();
                                } finally {
                                    setConfirmLoading(false);
                                    setConfirm(null);
                                }
                            }}
                        >
                            {confirm?.confirmLabel}
                        </Button>
                    </>
                }
            />
        </div>
    );
}
