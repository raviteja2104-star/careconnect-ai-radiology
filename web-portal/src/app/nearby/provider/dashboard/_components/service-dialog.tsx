'use client';

import * as React from 'react';
import { Button, Dialog, FieldHint, Input, Label, Switch } from '@/components/ui';
import type { Service } from '../../_lib/api';

export interface ServiceDialogProps {
    open: boolean;
    onClose: () => void;
    service: Service | null;
    saving?: boolean;
    onSave: (service: Partial<Service>) => void;
}

export function ServiceDialog({ open, onClose, service, saving, onSave }: ServiceDialogProps) {
    const [name, setName] = React.useState('');
    const [category, setCategory] = React.useState('');
    const [price, setPrice] = React.useState('');
    const [duration, setDuration] = React.useState('15');
    const [homeCollection, setHomeCollection] = React.useState(false);
    const [onlineBooking, setOnlineBooking] = React.useState(true);
    const [active, setActive] = React.useState(true);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        if (!open) return;
        setName(service?.name ?? '');
        setCategory(service?.category ?? '');
        setPrice(service?.price != null ? String(service.price) : '');
        setDuration(service?.durationMinutes != null ? String(service.durationMinutes) : '15');
        setHomeCollection(service?.homeCollection ?? false);
        setOnlineBooking(service?.onlineBooking ?? true);
        setActive(service?.active ?? true);
        setError('');
    }, [open, service]);

    const submit = () => {
        if (!name.trim()) { setError('Service name is required.'); return; }
        if (price !== '' && Number.isNaN(Number(price))) { setError('Price must be a number.'); return; }
        onSave({
            name: name.trim(),
            category: category.trim() || undefined,
            price: price === '' ? 0 : Number(price),
            durationMinutes: Number(duration) || 15,
            homeCollection,
            onlineBooking,
            active,
        });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={service ? `Edit ${service.name}` : 'Add service'}
            size="md"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={submit} loading={saving}>{service ? 'Save changes' : 'Add service'}</Button>
                </>
            }
        >
            <div className="space-y-4">
                <div>
                    <Label htmlFor="svc-name">Service name</Label>
                    <Input id="svc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="General Consultation" error={!!error && !name.trim()} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="svc-cat">Category</Label>
                        <Input id="svc-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Consultation / Lab Test / Imaging" />
                    </div>
                    <div>
                        <Label htmlFor="svc-dur">Duration (minutes)</Label>
                        <Input id="svc-dur" type="number" min={5} step={5} value={duration} onChange={(e) => setDuration(e.target.value)} />
                    </div>
                </div>
                <div>
                    <Label htmlFor="svc-price">Price (₹, 0 = free)</Label>
                    <Input id="svc-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                {error && <FieldHint error>{error}</FieldHint>}
                <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-foreground">Home collection</p>
                            <p className="text-xs text-muted-foreground">Sample/service can be availed at the patient&apos;s home.</p>
                        </div>
                        <Switch checked={homeCollection} onCheckedChange={setHomeCollection} label="Home collection" />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-foreground">Online booking</p>
                            <p className="text-xs text-muted-foreground">Patients can book this service directly through CareConnect.</p>
                        </div>
                        <Switch checked={onlineBooking} onCheckedChange={setOnlineBooking} label="Online booking" />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-foreground">Active</p>
                            <p className="text-xs text-muted-foreground">Inactive services are hidden from patients.</p>
                        </div>
                        <Switch checked={active} onCheckedChange={setActive} label="Service active" />
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
