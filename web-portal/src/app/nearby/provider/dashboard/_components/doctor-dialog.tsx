'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';
import { Button, Dialog, FieldHint, Input, Label, Select, Switch } from '@/components/ui';
import { cn } from '@/lib/utils';
import { DAY_LABELS, type Doctor, type ScheduleBreak, type ScheduleDay } from '../../_lib/api';

const emptyDays = (): ScheduleDay[] => [0, 1, 2, 3, 4, 5, 6].map((d) => ({
    dayOfWeek: d, active: d !== 0, startTime: '09:00', endTime: '18:00', slotDurationMinutes: 15, breaks: [],
}));

export interface DoctorDialogProps {
    open: boolean;
    onClose: () => void;
    doctor: Doctor | null;
    schedule: ScheduleDay[] | null;
    saving?: boolean;
    onSave: (doctor: Partial<Doctor>, days: ScheduleDay[]) => void;
}

export function DoctorDialog({ open, onClose, doctor, schedule, saving, onSave }: DoctorDialogProps) {
    const [name, setName] = React.useState('');
    const [specialty, setSpecialty] = React.useState('');
    const [qualification, setQualification] = React.useState('');
    const [regNo, setRegNo] = React.useState('');
    const [experience, setExperience] = React.useState('');
    const [fee, setFee] = React.useState('');
    const [active, setActive] = React.useState(true);
    const [days, setDays] = React.useState<ScheduleDay[]>(emptyDays());
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        if (!open) return;
        setName(doctor?.name ?? '');
        setSpecialty(doctor?.specialty ?? '');
        setQualification(doctor?.qualification ?? '');
        setRegNo(doctor?.registrationNumber ?? '');
        setExperience(doctor?.experienceYears != null ? String(doctor.experienceYears) : '');
        setFee(doctor?.consultationFee != null ? String(doctor.consultationFee) : '');
        setActive(doctor?.active ?? true);
        setDays(schedule && schedule.length ? schedule.map((d) => ({ ...d, breaks: d.breaks.map((b) => ({ ...b })) })) : emptyDays());
        setError('');
    }, [open, doctor, schedule]);

    const updateDay = (idx: number, patch: Partial<ScheduleDay>) => {
        setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
    };
    const addBreak = (idx: number) => {
        setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, breaks: [...d.breaks, { start: '13:00', end: '14:00', label: 'Break' }] } : d)));
    };
    const updateBreak = (idx: number, bi: number, patch: Partial<ScheduleBreak>) => {
        setDays((prev) => prev.map((d, i) => (i !== idx ? d : { ...d, breaks: d.breaks.map((b, j) => (j === bi ? { ...b, ...patch } : b)) })));
    };
    const removeBreak = (idx: number, bi: number) => {
        setDays((prev) => prev.map((d, i) => (i !== idx ? d : { ...d, breaks: d.breaks.filter((_, j) => j !== bi) })));
    };

    const submit = () => {
        if (!name.trim()) { setError('Doctor name is required.'); return; }
        onSave(
            {
                name: name.trim(),
                specialty: specialty.trim() || undefined,
                qualification: qualification.trim() || undefined,
                registrationNumber: regNo.trim() || undefined,
                experienceYears: experience ? Number(experience) : undefined,
                consultationFee: fee ? Number(fee) : undefined,
                active,
            },
            days
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={doctor ? `Edit ${doctor.name}` : 'Add doctor'}
            description="Core details plus a weekly working schedule used to generate booking slots."
            size="lg"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={submit} loading={saving}>{doctor ? 'Save changes' : 'Add doctor'}</Button>
                </>
            }
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="doc-name">Full name</Label>
                        <Input id="doc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Jane Doe" error={!!error && !name.trim()} />
                    </div>
                    <div>
                        <Label htmlFor="doc-spec">Specialty</Label>
                        <Input id="doc-spec" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="General Medicine" />
                    </div>
                    <div>
                        <Label htmlFor="doc-qual">Qualification</Label>
                        <Input id="doc-qual" value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="MBBS, MD" />
                    </div>
                    <div>
                        <Label htmlFor="doc-reg">Registration number</Label>
                        <Input id="doc-reg" value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="State Medical Council no." />
                    </div>
                    <div>
                        <Label htmlFor="doc-exp">Experience (years)</Label>
                        <Input id="doc-exp" type="number" min={0} value={experience} onChange={(e) => setExperience(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="doc-fee">Consultation fee (₹)</Label>
                        <Input id="doc-fee" type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} />
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                    <div>
                        <p className="text-sm font-medium text-foreground">Active</p>
                        <p className="text-xs text-muted-foreground">Inactive doctors are hidden from patient booking.</p>
                    </div>
                    <Switch checked={active} onCheckedChange={setActive} label="Doctor active" />
                </div>

                {error && <FieldHint error>{error}</FieldHint>}

                <div>
                    <p className="mb-2 text-sm font-semibold text-foreground">Weekly schedule</p>
                    <div className="space-y-2">
                        {days.map((d, idx) => (
                            <div key={d.dayOfWeek} className={cn('rounded-xl border border-border p-3', !d.active && 'opacity-60')}>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Switch checked={d.active} onCheckedChange={(v) => updateDay(idx, { active: v })} label={`${DAY_LABELS[d.dayOfWeek]} active`} />
                                    <span className="w-9 text-sm font-semibold text-foreground">{DAY_LABELS[d.dayOfWeek]}</span>
                                    <Input type="time" value={d.startTime ?? ''} disabled={!d.active} onChange={(e) => updateDay(idx, { startTime: e.target.value })} className="h-8 w-28" aria-label={`${DAY_LABELS[d.dayOfWeek]} start time`} />
                                    <span className="text-xs text-muted-foreground">to</span>
                                    <Input type="time" value={d.endTime ?? ''} disabled={!d.active} onChange={(e) => updateDay(idx, { endTime: e.target.value })} className="h-8 w-28" aria-label={`${DAY_LABELS[d.dayOfWeek]} end time`} />
                                    <Select
                                        value={String(d.slotDurationMinutes ?? 15)}
                                        disabled={!d.active}
                                        onChange={(e) => updateDay(idx, { slotDurationMinutes: Number(e.target.value) })}
                                        className="h-8 w-auto"
                                        aria-label={`${DAY_LABELS[d.dayOfWeek]} slot duration`}
                                    >
                                        {[10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min slots</option>)}
                                    </Select>
                                    <Button type="button" variant="ghost" size="sm" disabled={!d.active} onClick={() => addBreak(idx)}>
                                        <Plus className="h-3.5 w-3.5" aria-hidden /> Break
                                    </Button>
                                </div>
                                {d.breaks.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2 pl-14">
                                        {d.breaks.map((b, bi) => (
                                            <div key={bi} className="flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1">
                                                <Input type="time" value={b.start} onChange={(e) => updateBreak(idx, bi, { start: e.target.value })} className="h-7 w-24" aria-label="Break start" />
                                                <span className="text-xs text-muted-foreground">–</span>
                                                <Input type="time" value={b.end} onChange={(e) => updateBreak(idx, bi, { end: e.target.value })} className="h-7 w-24" aria-label="Break end" />
                                                <button type="button" onClick={() => removeBreak(idx, bi)} aria-label="Remove break" className="text-muted-foreground hover:text-danger">
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
