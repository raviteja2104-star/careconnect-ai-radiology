'use client';

import * as React from 'react';
import { Button, Dialog, FieldHint, Input, Label, Switch } from '@/components/ui';
import type { Provider } from '../_lib/api';

export interface EditProviderDialogProps {
    open: boolean;
    onClose: () => void;
    provider: Provider | null;
    saving?: boolean;
    onSave: (patch: Partial<Provider>) => void;
}

export function EditProviderDialog({ open, onClose, provider, saving, onSave }: EditProviderDialogProps) {
    const [name, setName] = React.useState('');
    const [type, setType] = React.useState('');
    const [subtype, setSubtype] = React.useState('');
    const [locality, setLocality] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [address, setAddress] = React.useState('');
    const [appointmentEnabled, setAppointmentEnabled] = React.useState(false);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        if (!open) return;
        setName(provider?.name ?? '');
        setType(provider?.type ?? '');
        setSubtype(provider?.subtype ?? '');
        setLocality(provider?.locality ?? '');
        setPhone(provider?.phone ?? '');
        setAddress(provider?.address ?? '');
        setAppointmentEnabled(provider?.appointmentEnabled ?? false);
        setError('');
    }, [open, provider]);

    const submit = () => {
        if (!name.trim() || !locality.trim()) { setError('Name and locality are required.'); return; }
        onSave({ name: name.trim(), type: type.trim(), subtype: subtype.trim() || undefined, locality: locality.trim(), phone: phone.trim() || undefined, address: address.trim() || undefined, appointmentEnabled });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={provider ? `Edit ${provider.name}` : 'Edit provider'}
            description="Core directory fields. Verification status changes happen from the Verification Queue."
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={submit} loading={saving}>Save changes</Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="ep-name">Name</Label>
                        <Input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} error={!!error && !name.trim()} />
                    </div>
                    <div>
                        <Label htmlFor="ep-type">Type</Label>
                        <Input id="ep-type" value={type} onChange={(e) => setType(e.target.value)} placeholder="clinic / hospital / diagnostic_lab / pharmacy" />
                    </div>
                    <div>
                        <Label htmlFor="ep-subtype">Subtype</Label>
                        <Input id="ep-subtype" value={subtype} onChange={(e) => setSubtype(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="ep-locality">Locality</Label>
                        <Input id="ep-locality" value={locality} onChange={(e) => setLocality(e.target.value)} error={!!error && !locality.trim()} />
                    </div>
                    <div>
                        <Label htmlFor="ep-phone">Phone</Label>
                        <Input id="ep-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                </div>
                <div>
                    <Label htmlFor="ep-address">Address</Label>
                    <Input id="ep-address" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                {error && <FieldHint error>{error}</FieldHint>}
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                    <div>
                        <p className="text-sm font-medium text-foreground">Appointments enabled</p>
                        <p className="text-xs text-muted-foreground">Whether patients can currently book online at this provider.</p>
                    </div>
                    <Switch checked={appointmentEnabled} onCheckedChange={setAppointmentEnabled} label="Appointments enabled" />
                </div>
            </div>
        </Dialog>
    );
}
