'use client';

import * as React from 'react';
import { Button, Dialog, FieldHint, Input, Label, Select } from '@/components/ui';
import type { AvailabilityException } from '../../_lib/api';

export interface ExceptionDialogProps {
    open: boolean;
    onClose: () => void;
    saving?: boolean;
    onSave: (exception: Partial<AvailabilityException>) => void;
}

export function ExceptionDialog({ open, onClose, saving, onSave }: ExceptionDialogProps) {
    const [date, setDate] = React.useState('');
    const [type, setType] = React.useState<AvailabilityException['type']>('HOLIDAY');
    const [reason, setReason] = React.useState('');
    const [start, setStart] = React.useState('09:00');
    const [end, setEnd] = React.useState('13:00');
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        if (!open) return;
        setDate('');
        setType('HOLIDAY');
        setReason('');
        setStart('09:00');
        setEnd('13:00');
        setError('');
    }, [open]);

    const submit = () => {
        if (!date) { setError('Pick a date.'); return; }
        onSave({
            date,
            type,
            reason: reason.trim() || undefined,
            ...(type === 'CUSTOM_HOURS' ? { startTime: start, endTime: end } : {}),
        });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="Add holiday / exception"
            description="Overrides the regular weekly schedule for a single date."
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={submit} loading={saving}>Add exception</Button>
                </>
            }
        >
            <div className="space-y-4">
                <div>
                    <Label htmlFor="exc-date">Date</Label>
                    <Input id="exc-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} error={!!error && !date} />
                </div>
                <div>
                    <Label htmlFor="exc-type">Type</Label>
                    <Select id="exc-type" value={type} onChange={(e) => setType(e.target.value as AvailabilityException['type'])}>
                        <option value="HOLIDAY">Holiday (fully closed)</option>
                        <option value="CLOSED">Closed (ad hoc)</option>
                        <option value="CUSTOM_HOURS">Custom hours</option>
                    </Select>
                </div>
                {type === 'CUSTOM_HOURS' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="exc-start">Open</Label>
                            <Input id="exc-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="exc-end">Close</Label>
                            <Input id="exc-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
                        </div>
                    </div>
                )}
                <div>
                    <Label htmlFor="exc-reason">Reason (optional)</Label>
                    <Input id="exc-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Public holiday, staff leave" />
                </div>
                {error && <FieldHint error>{error}</FieldHint>}
            </div>
        </Dialog>
    );
}
