'use client';

/**
 * Page-local shared visual helpers for the teleradiology module.
 * (Shared UI primitives live in @/components/ui and are not modified.)
 */

import * as React from 'react';
import { CloudOff, Sparkles } from 'lucide-react';
import { Badge, Progress } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
    humanizeMin, isBreached, slaRemainingMin, studyAgeMin, topAiFinding,
    type Priority, type Study, type StudyStatus,
} from './api';

/* ───────────────────────── Demo-mode badge ───────────────────────── */

export function DemoBadge({ show }: { show: boolean }) {
    if (!show) return null;
    return (
        <Badge tone="warning" className="gap-1.5">
            <CloudOff className="h-3 w-3" aria-hidden />
            Demo data — backend offline
        </Badge>
    );
}

/* ───────────────────────── Priority / status ─────────────────────── */

const PRIORITY_META: Record<Priority, { label: string; tone: 'danger' | 'warning' | 'neutral'; pulse: boolean }> = {
    emergency: { label: 'Emergency', tone: 'danger', pulse: true },
    stat: { label: 'STAT', tone: 'danger', pulse: true },
    urgent: { label: 'Urgent', tone: 'warning', pulse: false },
    routine: { label: 'Routine', tone: 'neutral', pulse: false },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
    const meta = PRIORITY_META[priority] ?? PRIORITY_META.routine;
    return (
        <Badge tone={meta.tone} dot pulse={meta.pulse}>
            {meta.label}
        </Badge>
    );
}

const STATUS_META: Record<StudyStatus, { label: string; tone: 'neutral' | 'brand' | 'info' | 'warning' | 'success' | 'outline' }> = {
    ORDERED: { label: 'Ordered', tone: 'outline' },
    RECEIVED: { label: 'Received', tone: 'neutral' },
    UNREAD: { label: 'Unread', tone: 'info' },
    IN_PROGRESS: { label: 'In progress', tone: 'brand' },
    DRAFT: { label: 'Draft', tone: 'warning' },
    REVIEW: { label: 'Review', tone: 'warning' },
    SIGNED: { label: 'Signed', tone: 'success' },
    DELIVERED: { label: 'Delivered', tone: 'success' },
};

export function StatusBadge({ status }: { status: StudyStatus }) {
    const meta = STATUS_META[status] ?? { label: status, tone: 'neutral' as const };
    return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

/* ─────────────────────────── Table cells ─────────────────────────── */

export function StudyAgeCell({ study }: { study: Study }) {
    const age = studyAgeMin(study);
    const breached = isBreached(study);
    return (
        <span
            className={cn(
                'font-medium tabular-nums',
                breached ? 'text-danger' : age > 120 ? 'text-warning' : 'text-foreground'
            )}
        >
            {humanizeMin(age)}
        </span>
    );
}

export function AiFlagCell({ study }: { study: Study }) {
    if (!study.aiTriage?.flagged) {
        return <span className="text-xs text-subtle-foreground">—</span>;
    }
    const top = topAiFinding(study);
    const title = top
        ? `${top.finding} (${Math.round((top.confidence ?? 0) * 100)}% confidence)`
        : 'AI-flagged study';
    return (
        <Badge tone="brand" className="gap-1" title={title}>
            <Sparkles className="h-3 w-3" aria-hidden />
            AI
        </Badge>
    );
}

export function SlaCell({ study }: { study: Study }) {
    const remaining = slaRemainingMin(study);
    const sla = study.slaMinutes;
    if (remaining == null || !sla) return <span className="text-xs text-subtle-foreground">—</span>;
    const breached = remaining < 0;
    const pct = breached ? 100 : Math.max(0, Math.min(100, (remaining / sla) * 100));
    return (
        <div className="w-28">
            <div className="mb-1 flex items-center justify-between text-xs">
                <span className={cn('font-semibold tabular-nums', breached ? 'text-danger' : remaining < sla * 0.25 ? 'text-warning' : 'text-muted-foreground')}>
                    {breached ? `${humanizeMin(Math.abs(remaining))} over` : humanizeMin(remaining)}
                </span>
            </div>
            <Progress
                size="sm"
                value={pct}
                tone={breached ? 'danger' : remaining < sla * 0.25 ? 'warning' : 'success'}
            />
        </div>
    );
}

/* ─────────────────────────── Filter chip ─────────────────────────── */

export function FilterChip({
    active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
        >
            {children}
        </button>
    );
}
