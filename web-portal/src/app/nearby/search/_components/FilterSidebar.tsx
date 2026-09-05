'use client';

import * as React from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Switch, Label, Select, Input, Button } from '@/components/ui';
import { ALL_SPECIALTIES, PROVIDER_TYPE_LABELS, type ProviderType } from '../../_lib/api';

export interface FilterState {
    radiusKm: number;
    type: ProviderType | '';
    specialties: string[];
    openNow: boolean;
    availableToday: boolean;
    appointmentAvailable: boolean;
    emergency: boolean;
    teleconsultation: boolean;
    homeCollection: boolean;
    verifiedOnly: boolean;
    maxFee: number;
    insurance: string;
}

export const DEFAULT_FILTERS: FilterState = {
    radiusKm: 25,
    type: '',
    specialties: [],
    openNow: false,
    availableToday: false,
    appointmentAvailable: false,
    emergency: false,
    teleconsultation: false,
    homeCollection: false,
    verifiedOnly: false,
    maxFee: 2000,
    insurance: '',
};

export function FilterSidebar({
    filters,
    onChange,
    onReset,
}: {
    filters: FilterState;
    onChange: (next: Partial<FilterState>) => void;
    onReset: () => void;
}) {
    function toggleSpecialty(s: string) {
        const set = new Set(filters.specialties);
        if (set.has(s)) set.delete(s); else set.add(s);
        onChange({ specialties: Array.from(set) });
    }

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                    <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filters
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={onReset}>
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
                </Button>
            </CardHeader>
            <CardContent className="space-y-5">
                <div>
                    <Label htmlFor="radius">Distance — within {filters.radiusKm} km</Label>
                    <input
                        id="radius"
                        type="range"
                        min={1}
                        max={50}
                        step={1}
                        value={filters.radiusKm}
                        onChange={(e) => onChange({ radiusKm: Number(e.target.value) })}
                        className="w-full accent-[var(--color-primary,theme(colors.blue.600))]"
                    />
                </div>

                <div>
                    <Label htmlFor="type">Provider type</Label>
                    <Select id="type" value={filters.type} onChange={(e) => onChange({ type: e.target.value as ProviderType | '' })}>
                        <option value="">All types</option>
                        {(Object.keys(PROVIDER_TYPE_LABELS) as ProviderType[]).map((t) => (
                            <option key={t} value={t}>{PROVIDER_TYPE_LABELS[t]}</option>
                        ))}
                    </Select>
                </div>

                <div>
                    <Label>Specialty</Label>
                    <div className="flex flex-wrap gap-1.5">
                        {ALL_SPECIALTIES.map((s) => {
                            const active = filters.specialties.includes(s);
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => toggleSpecialty(s)}
                                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                                        active
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                                    }`}
                                    aria-pressed={active}
                                >
                                    {s}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <Label htmlFor="maxFee">Max consultation fee — ₹{filters.maxFee}</Label>
                    <input
                        id="maxFee"
                        type="range"
                        min={0}
                        max={2000}
                        step={50}
                        value={filters.maxFee}
                        onChange={(e) => onChange({ maxFee: Number(e.target.value) })}
                        className="w-full"
                    />
                </div>

                <div className="space-y-3">
                    <ToggleRow label="Open now" checked={filters.openNow} onChange={(v) => onChange({ openNow: v })} />
                    <ToggleRow label="Available today" checked={filters.availableToday} onChange={(v) => onChange({ availableToday: v })} />
                    <ToggleRow
                        label="Appointment available"
                        checked={filters.appointmentAvailable}
                        onChange={(v) => onChange({ appointmentAvailable: v })}
                        hint="Best-effort — based on listed consultation fee / teleconsult support"
                    />
                    <ToggleRow label="Emergency care" checked={filters.emergency} onChange={(v) => onChange({ emergency: v })} />
                    <ToggleRow label="Online consult" checked={filters.teleconsultation} onChange={(v) => onChange({ teleconsultation: v })} />
                    <ToggleRow label="Home collection" checked={filters.homeCollection} onChange={(v) => onChange({ homeCollection: v })} />
                    <ToggleRow label="Verified only" checked={filters.verifiedOnly} onChange={(v) => onChange({ verifiedOnly: v })} />
                </div>

                <div>
                    <Label htmlFor="insurance">Insurance accepted</Label>
                    <Input
                        id="insurance"
                        placeholder="e.g. Star Health"
                        value={filters.insurance}
                        onChange={(e) => onChange({ insurance: e.target.value })}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function ToggleRow({
    label, checked, onChange, hint,
}: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
                <span className="text-sm text-foreground">{label}</span>
                {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
            </div>
            <Switch checked={checked} onCheckedChange={onChange} label={label} />
        </div>
    );
}
