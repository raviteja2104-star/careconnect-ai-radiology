'use client';

import * as React from 'react';
import { HeartHandshake, Plus, ShieldCheck, ShieldX, WifiOff } from 'lucide-react';
import {
    PageHeader, StatGrid, StatCard, Badge, Button, Card, CardContent, DataTable, Dialog,
    EmptyState, ErrorState, Label, Select, Switch, Textarea, SkeletonTable, FieldHint, type Column,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useSession } from '@/components/providers/SessionProvider';
import { UserSearchSelector } from '@/components/health-records/UserSearchSelector';
import {
    fetchCaregivers, grantCaregiverAuthorization, revokeCaregiverAuthorization,
    ApiOfflineError, ApiHttpError, formatDate,
    DEFAULT_PERMISSION_SCOPE, CAREGIVER_RELATIONSHIP_LABELS, CAREGIVER_STATUS_TONE,
    type CaregiverAuthorization, type CaregiverRelationship, type PermissionScope, type UserSearchResult,
} from '../_lib/api';

const PERMISSION_LABELS: Array<{ key: keyof PermissionScope; label: string; hint: string }> = [
    { key: 'canUploadDocuments', label: 'Upload documents', hint: "Capture/photograph documents on the patient's behalf." },
    { key: 'canViewRecords', label: 'View records', hint: "See the patient's timeline, documents and extracted records." },
    { key: 'canManageAppointments', label: 'Manage appointments', hint: 'Book, reschedule or cancel appointments for the patient.' },
    { key: 'canViewBilling', label: 'View billing', hint: 'See invoices and payment history.' },
];

function PermissionBadges({ scope }: { scope: PermissionScope }) {
    const granted = PERMISSION_LABELS.filter((p) => scope[p.key]);
    if (granted.length === 0) return <span className="text-xs text-muted-foreground">No permissions granted</span>;
    return (
        <div className="flex flex-wrap gap-1">
            {granted.map((p) => <Badge key={p.key} tone="info">{p.label}</Badge>)}
        </div>
    );
}

export default function CaregiversPage() {
    const { session } = useSession();
    const patientId = session.userId;
    const { toast } = useToast();

    const [authorizations, setAuthorizations] = React.useState<CaregiverAuthorization[]>([]);
    const [demo, setDemo] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [refreshKey, setRefreshKey] = React.useState(0);
    const refresh = React.useCallback(() => setRefreshKey((k) => k + 1), []);

    const [grantOpen, setGrantOpen] = React.useState(false);
    const [granting, setGranting] = React.useState(false);

    // Search-selected caregiver — replaces the old free-text ID input.
    const [selectedCaregiver, setSelectedCaregiver] = React.useState<UserSearchResult | null>(null);
    const [relationship, setRelationship] = React.useState<CaregiverRelationship>('SPOUSE');
    const [relationshipNote, setRelationshipNote] = React.useState('');
    const [permissionScope, setPermissionScope] = React.useState<PermissionScope>({ ...DEFAULT_PERMISSION_SCOPE });
    const [endDate, setEndDate] = React.useState('');

    // Confirmation step — shown before the write goes to the backend.
    const [confirming, setConfirming] = React.useState(false);

    const [revokeTarget, setRevokeTarget] = React.useState<CaregiverAuthorization | null>(null);
    const [revokeReason, setRevokeReason] = React.useState('');
    const [revoking, setRevoking] = React.useState(false);

    React.useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetchCaregivers(patientId)
            .then((res) => { if (!cancelled) { setAuthorizations(res.data); setDemo(res.demo); } })
            .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load caregivers'))
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [patientId, refreshKey]);

    const resetGrantForm = () => {
        setSelectedCaregiver(null);
        setRelationship('SPOUSE');
        setRelationshipNote('');
        setPermissionScope({ ...DEFAULT_PERMISSION_SCOPE });
        setEndDate('');
        setConfirming(false);
    };

    // Step 1: collect details and advance to the identity-confirmation step.
    const handleReviewAndConfirm = () => {
        if (!selectedCaregiver) {
            toast('warning', 'Select a caregiver', 'Search for the person you want to grant access to.');
            return;
        }
        setConfirming(true);
    };

    // Step 2: confirmed — send the write to the backend.
    const submitGrant = async () => {
        if (!selectedCaregiver) return;
        setGranting(true);
        try {
            const created = await grantCaregiverAuthorization(patientId, {
                caregiverUserId: selectedCaregiver.id,
                relationship,
                relationshipNote: relationshipNote.trim() || undefined,
                permissionScope,
                endDate: endDate || undefined,
            });
            setAuthorizations((prev) => [created, ...prev]);
            toast('success', 'Caregiver access granted', `${selectedCaregiver.displayName} — ${CAREGIVER_RELATIONSHIP_LABELS[relationship]}`);
            setGrantOpen(false);
            resetGrantForm();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                toast('error', 'Backend unreachable', 'Could not grant caregiver access — this is a real authorization, not something we simulate offline.');
            } else if (err instanceof ApiHttpError) {
                toast('error', 'Could not grant access', err.message);
            } else {
                toast('error', 'Could not grant access', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setGranting(false);
        }
    };

    const submitRevoke = async () => {
        if (!revokeTarget) return;
        setRevoking(true);
        try {
            const updated = await revokeCaregiverAuthorization(revokeTarget._id, revokeReason.trim() || undefined);
            setAuthorizations((prev) => prev.map((a) => a._id === updated._id ? updated : a));
            toast('success', 'Caregiver access revoked');
            setRevokeTarget(null);
            setRevokeReason('');
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                toast('error', 'Backend unreachable', 'Could not revoke access right now.');
            } else if (err instanceof ApiHttpError) {
                toast('error', 'Could not revoke access', err.message);
            } else {
                toast('error', 'Could not revoke access', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setRevoking(false);
        }
    };

    const active = authorizations.filter((a) => a.status === 'ACTIVE');

    const columns: Column<CaregiverAuthorization>[] = [
        {
            key: 'caregiverUserId', header: 'Caregiver', sortable: true,
            cell: (a) => <span className="font-mono text-xs text-foreground">{a.caregiverUserId}</span>,
        },
        { key: 'relationship', header: 'Relationship', cell: (a) => (
            <div>
                <Badge tone="brand">{CAREGIVER_RELATIONSHIP_LABELS[a.relationship]}</Badge>
                {a.relationshipNote && <p className="mt-1 text-xs text-muted-foreground">{a.relationshipNote}</p>}
            </div>
        ) },
        { key: 'permissions', header: 'Permissions', cell: (a) => <PermissionBadges scope={a.permissionScope} /> },
        { key: 'status', header: 'Status', cell: (a) => <Badge tone={CAREGIVER_STATUS_TONE[a.status]}>{a.status}</Badge> },
        {
            key: 'window', header: 'Window',
            cell: (a) => <span className="text-xs text-muted-foreground">{formatDate(a.startDate)} – {a.endDate ? formatDate(a.endDate) : 'ongoing'}</span>,
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Caregivers & Attendants"
                description="Grant a family member or attendant scoped, revocable access to your health records — never blanket family access."
                crumbs={[{ label: 'Home', href: '/' }, { label: 'Health Records', href: '/health-records' }, { label: 'Caregivers' }]}
                actions={
                    <>
                        {demo && <Badge tone="warning" dot pulse><WifiOff className="h-3.5 w-3.5" aria-hidden /> Backend offline</Badge>}
                        <Button onClick={() => setGrantOpen(true)}><Plus className="h-4 w-4" aria-hidden /> Grant caregiver access</Button>
                    </>
                }
            />

            {error ? (
                <ErrorState onRetry={refresh} description={error} />
            ) : loading ? (
                <SkeletonTable rows={4} />
            ) : demo && authorizations.length === 0 ? (
                <EmptyState
                    icon={WifiOff}
                    title="Requires a live backend connection"
                    description="Caregiver authorizations are real, revocable grants — nothing here is simulated. Start the backend at localhost:5000 and reload."
                    action={{ label: 'Retry', onClick: refresh }}
                />
            ) : (
                <>
                    <StatGrid>
                        <StatCard label="Active authorizations" value={active.length} icon={ShieldCheck} tone="emerald" delay={0} />
                        <StatCard label="Total granted (all time)" value={authorizations.length} icon={HeartHandshake} tone="brand" delay={0.05} />
                    </StatGrid>

                    <DataTable<CaregiverAuthorization>
                        columns={columns}
                        data={authorizations}
                        rowKey={(a) => a._id}
                        exportName="caregiver-authorizations"
                        emptyTitle="No caregivers yet"
                        emptyDescription="Grant a family member or attendant scoped access using the button above."
                        rowActions={(a) => a.status === 'ACTIVE' ? (
                            <Button size="sm" variant="danger" onClick={() => setRevokeTarget(a)}>
                                <ShieldX className="h-3.5 w-3.5" aria-hidden /> Revoke
                            </Button>
                        ) : null}
                    />
                </>
            )}

            {/* Grant dialog — two-step: select + configure → confirm → write */}
            <Dialog
                open={grantOpen}
                onClose={() => { if (!granting) { setGrantOpen(false); resetGrantForm(); } }}
                title={confirming ? 'Confirm caregiver access' : 'Grant caregiver access'}
                description={
                    confirming
                        ? 'Verify this is the correct person before granting access to your health records.'
                        : 'Search for the person you want to grant access to, then choose exactly what they can do.'
                }
                size="lg"
                footer={
                    confirming ? (
                        <>
                            <Button variant="outline" onClick={() => setConfirming(false)} disabled={granting}>Back</Button>
                            <Button loading={granting} onClick={submitGrant}>Confirm — grant access</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => { setGrantOpen(false); resetGrantForm(); }}>Cancel</Button>
                            <Button onClick={handleReviewAndConfirm} disabled={!selectedCaregiver}>Review &amp; confirm</Button>
                        </>
                    )
                }
            >
                {confirming && selectedCaregiver ? (
                    /* ── Confirmation step ── */
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="pt-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">You are granting access to</p>
                                <p className="mt-2 text-lg font-semibold text-foreground">{selectedCaregiver.displayName}</p>
                                <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                                    {selectedCaregiver.maskedPhone && <p>Mobile: <span className="font-mono">{selectedCaregiver.maskedPhone}</span></p>}
                                    {selectedCaregiver.maskedEmail && <p>Email: <span className="font-mono">{selectedCaregiver.maskedEmail}</span></p>}
                                    <p>CareConnect ID: <span className="font-mono">{selectedCaregiver.ccDisplayId}</span></p>
                                    <p>Account type: <Badge tone="brand">{selectedCaregiver.userType}</Badge></p>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="rounded-xl border border-border p-4 text-sm">
                            <p className="font-medium text-foreground">Relationship: {CAREGIVER_RELATIONSHIP_LABELS[relationship]}</p>
                            {relationshipNote && <p className="mt-1 text-muted-foreground">{relationshipNote}</p>}
                        </div>
                        <div className="space-y-1.5 rounded-xl border border-border p-4 text-sm">
                            <p className="font-medium text-foreground">Permissions being granted</p>
                            <PermissionBadges scope={permissionScope} />
                        </div>
                        {endDate && (
                            <p className="text-sm text-muted-foreground">
                                Access expires: <span className="font-medium text-foreground">{formatDate(endDate)}</span>
                            </p>
                        )}
                    </div>
                ) : (
                    /* ── Search + configure step ── */
                    <div className="space-y-4">
                        <div>
                            <Label>Caregiver</Label>
                            <UserSearchSelector
                                selected={selectedCaregiver}
                                onSelect={setSelectedCaregiver}
                                placeholder="Search by name or phone number"
                                className="mt-1.5"
                            />
                            <FieldHint>Search returns name, masked phone and a CareConnect ID — enough to confirm the right person without exposing full contact details.</FieldHint>
                        </div>
                        <div>
                            <Label htmlFor="relationship">Relationship</Label>
                            <Select id="relationship" value={relationship} onChange={(e) => setRelationship(e.target.value as CaregiverRelationship)}>
                                {Object.entries(CAREGIVER_RELATIONSHIP_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="relationshipNote">Note (optional)</Label>
                            <Textarea id="relationshipNote" value={relationshipNote} onChange={(e) => setRelationshipNote(e.target.value)} rows={2} placeholder="e.g. Managing records while I recover from surgery" />
                        </div>
                        <div className="space-y-3 rounded-xl border border-border p-4">
                            <p className="text-sm font-medium text-foreground">Permissions</p>
                            {PERMISSION_LABELS.map((p) => (
                                <div key={p.key} className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm text-foreground">{p.label}</p>
                                        <p className="text-xs text-muted-foreground">{p.hint}</p>
                                    </div>
                                    <Switch
                                        checked={permissionScope[p.key]}
                                        onCheckedChange={(checked) => setPermissionScope((prev) => ({ ...prev, [p.key]: checked }))}
                                        label={p.label}
                                    />
                                </div>
                            ))}
                        </div>
                        <div>
                            <Label htmlFor="endDate">End date (optional)</Label>
                            <input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <FieldHint>Leave blank for an open-ended authorization — you can revoke it anytime.</FieldHint>
                        </div>
                    </div>
                )}
            </Dialog>

            {/* Revoke dialog */}
            <Dialog
                open={!!revokeTarget}
                onClose={() => { if (!revoking) { setRevokeTarget(null); setRevokeReason(''); } }}
                title="Revoke caregiver access"
                description={revokeTarget ? `This immediately ends ${revokeTarget.caregiverUserId}'s access to your health records.` : undefined}
                footer={
                    <>
                        <Button variant="outline" onClick={() => { setRevokeTarget(null); setRevokeReason(''); }} disabled={revoking}>Cancel</Button>
                        <Button variant="danger" loading={revoking} onClick={submitRevoke}>Revoke access</Button>
                    </>
                }
            >
                <Label htmlFor="revokeReason">Reason (optional)</Label>
                <Textarea id="revokeReason" value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} rows={3} placeholder="e.g. No longer needed" />
            </Dialog>
        </div>
    );
}
