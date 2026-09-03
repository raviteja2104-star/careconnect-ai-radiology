'use client';

import * as React from 'react';
import Link from 'next/link';
import {
    AlertTriangle, Activity, Pill, HeartPulse, MessageSquareText, Gauge, Wind,
    Thermometer, Weight, Ruler, Plus,
} from 'lucide-react';
import {
    Badge, Button, Card, CardHeader, CardTitle, CardContent, Input, Label, Avatar,
} from '@/components/ui';
import {
    patientDisplayName, ageOf, formatWhen,
    type EncounterRecord, type Patient360, type DiagnosisEntry, type VitalsEntry,
} from '../../_lib/api';

interface ContextRailProps {
    encounter: EncounterRecord;
    p360?: Patient360;
    diagnoses: DiagnosisEntry[];
    vitals: VitalsEntry[];
    onSubmitVitals: (v: VitalsEntry) => Promise<void>;
}

const EMPTY_VITALS = {
    systolicBp: '', diastolicBp: '', pulse: '', respiratoryRate: '',
    temperatureC: '', spo2: '', heightCm: '', weightKg: '', painScore: '',
};

export function ContextRail({ encounter, p360, diagnoses, vitals, onSubmitVitals }: ContextRailProps) {
    const patient = p360?.patient;
    const name = patientDisplayName(patient);
    const age = ageOf(patient?.dateOfBirth);
    const latest = vitals[0];

    const [form, setForm] = React.useState<Record<keyof typeof EMPTY_VITALS, string>>({ ...EMPTY_VITALS });
    const [saving, setSaving] = React.useState(false);
    const set = (k: keyof typeof EMPTY_VITALS) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const hasAny = Object.values(form).some((v) => v !== '');

    const submit = async () => {
        setSaving(true);
        const num = (v: string) => (v === '' ? undefined : Number(v));
        try {
            await onSubmitVitals({
                systolicBp: num(form.systolicBp),
                diastolicBp: num(form.diastolicBp),
                pulse: num(form.pulse),
                respiratoryRate: num(form.respiratoryRate),
                temperatureC: num(form.temperatureC),
                spo2: num(form.spo2),
                heightCm: num(form.heightCm),
                weightKg: num(form.weightKg),
                painScore: num(form.painScore),
            });
            setForm({ ...EMPTY_VITALS });
        } catch {
            /* toast handled by caller */
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* Patient card */}
            <Card className="animate-fade-up">
                <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                        <Avatar name={name} src={patient?.avatar || undefined} size="lg" />
                        <div className="min-w-0">
                            <Link
                                href={patient?._id ? `/emr/patients/${patient._id}` : '#'}
                                className="block truncate text-sm font-bold text-foreground hover:text-primary"
                            >
                                {name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                                {age != null ? `${age} Y` : '—'} · {patient?.gender ? patient.gender[0].toUpperCase() + patient.gender.slice(1) : '—'} · {patient?.bloodGroup || '—'}
                            </p>
                        </div>
                    </div>

                    {(patient?.allergies?.length ?? 0) > 0 && (
                        <div className="mt-4 rounded-xl border border-danger/30 bg-danger-soft p-3">
                            <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-danger">
                                <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Allergies
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {patient!.allergies!.map((a) => <Badge key={a} tone="danger" className="text-[10px]">{a}</Badge>)}
                            </div>
                        </div>
                    )}

                    <div className="mt-4">
                        <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-subtle-foreground">
                            <MessageSquareText className="h-3.5 w-3.5" aria-hidden /> Chief Complaint
                        </h4>
                        <p className="text-xs leading-relaxed text-foreground">
                            {encounter.chiefComplaint || <span className="text-muted-foreground">Not recorded yet.</span>}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Previous diagnoses */}
            <Card className="animate-fade-up">
                <CardHeader className="p-5 pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <HeartPulse className="h-4 w-4 text-primary" aria-hidden /> Diagnoses
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-5 pt-0">
                    {[...(p360?.diagnoses || []), ...diagnoses.filter((d) => !(p360?.diagnoses || []).some((p) => p._id && p._id === d._id))].length === 0 && (
                        <p className="text-xs text-muted-foreground">No prior diagnoses on record.</p>
                    )}
                    {[...(p360?.diagnoses || []), ...diagnoses.filter((d) => !(p360?.diagnoses || []).some((p) => p._id && p._id === d._id))].map((dx, i) => (
                        <div key={dx._id || i} className="flex items-start justify-between gap-2 rounded-lg bg-muted/50 px-2.5 py-2">
                            <span className="text-xs font-medium text-foreground">{dx.term}</span>
                            {dx.code && <span className="font-mono text-[10px] text-subtle-foreground">{dx.code}</span>}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Active medications */}
            <Card className="animate-fade-up">
                <CardHeader className="p-5 pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <Pill className="h-4 w-4 text-primary" aria-hidden /> Active Medications
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-5 pt-0">
                    {(p360?.activeMedications?.length ?? 0) === 0 && (
                        <p className="text-xs text-muted-foreground">No active medications.</p>
                    )}
                    {(p360?.activeMedications || []).map((m, i) => (
                        <div key={`${m.name}-${i}`} className="rounded-lg bg-muted/50 px-2.5 py-2">
                            <p className="text-xs font-semibold text-foreground">{m.name} <span className="font-normal text-muted-foreground">{m.dose}</span></p>
                            <p className="text-[11px] text-muted-foreground">{[m.frequency, m.instructions].filter(Boolean).join(' · ')}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Recent vitals + quick entry */}
            <Card className="animate-fade-up">
                <CardHeader className="p-5 pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-primary" aria-hidden /> Vitals
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                    {latest ? (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <VitalTile icon={Gauge} label="BP" value={latest.systolicBp && latest.diastolicBp ? `${latest.systolicBp}/${latest.diastolicBp}` : '—'} unit="mmHg" />
                                <VitalTile icon={HeartPulse} label="Pulse" value={latest.pulse ?? '—'} unit="bpm" />
                                <VitalTile icon={Wind} label="SpO2" value={latest.spo2 ?? '—'} unit="%" />
                                <VitalTile icon={Thermometer} label="Temp" value={latest.temperatureC ?? '—'} unit="°C" />
                                <VitalTile icon={Weight} label="Weight" value={latest.weightKg ?? '—'} unit="kg" />
                                <VitalTile icon={Ruler} label="Height" value={latest.heightCm ?? '—'} unit="cm" />
                            </div>
                            <p className="mt-2 text-[10px] text-subtle-foreground">Recorded {formatWhen(latest.recordedAt)}</p>
                        </>
                    ) : (
                        <p className="text-xs text-muted-foreground">No vitals recorded for this encounter yet.</p>
                    )}

                    {/* Quick entry */}
                    <form
                        className="mt-4 border-t border-border pt-4"
                        onSubmit={(e) => { e.preventDefault(); void submit(); }}
                    >
                        <h4 className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-subtle-foreground">Quick Vitals Entry</h4>
                        <div className="grid grid-cols-2 gap-2.5">
                            <MiniField id="v-sys" label="Sys BP" value={form.systolicBp} onChange={set('systolicBp')} placeholder="120" />
                            <MiniField id="v-dia" label="Dia BP" value={form.diastolicBp} onChange={set('diastolicBp')} placeholder="80" />
                            <MiniField id="v-pulse" label="Pulse" value={form.pulse} onChange={set('pulse')} placeholder="72" />
                            <MiniField id="v-rr" label="Resp rate" value={form.respiratoryRate} onChange={set('respiratoryRate')} placeholder="16" />
                            <MiniField id="v-temp" label="Temp °C" value={form.temperatureC} onChange={set('temperatureC')} placeholder="37.0" step="0.1" />
                            <MiniField id="v-spo2" label="SpO2 %" value={form.spo2} onChange={set('spo2')} placeholder="98" />
                            <MiniField id="v-ht" label="Height cm" value={form.heightCm} onChange={set('heightCm')} placeholder="172" />
                            <MiniField id="v-wt" label="Weight kg" value={form.weightKg} onChange={set('weightKg')} placeholder="72" step="0.1" />
                            <MiniField id="v-pain" label="Pain 0–10" value={form.painScore} onChange={set('painScore')} placeholder="0" />
                        </div>
                        <Button type="submit" variant="secondary" size="sm" className="mt-3 w-full" disabled={!hasAny} loading={saving}>
                            <Plus className="h-3.5 w-3.5" aria-hidden /> Record Vitals
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </>
    );
}

function VitalTile({ icon: Icon, label, value, unit }: { icon: React.ElementType; label: string; value: React.ReactNode; unit: string }) {
    return (
        <div className="rounded-xl border border-border bg-muted/40 p-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-subtle-foreground">
                <Icon className="h-3 w-3" aria-hidden /> {label}
            </div>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
                {value} <span className="text-[10px] font-medium text-muted-foreground">{unit}</span>
            </p>
        </div>
    );
}

function MiniField({ id, label, value, onChange, placeholder, step }: {
    id: string; label: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string; step?: string;
}) {
    return (
        <div>
            <Label htmlFor={id} className="mb-1 text-[11px]">{label}</Label>
            <Input id={id} type="number" inputMode="decimal" step={step} value={value} onChange={onChange} placeholder={placeholder} className="h-8 px-2.5 text-xs" />
        </div>
    );
}
