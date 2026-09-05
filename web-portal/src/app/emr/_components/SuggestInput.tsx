'use client';

import * as React from 'react';
import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { fetchCatalogSuggestions, demoCatalogSearch, type CatalogKind, type CatalogSuggestion } from '../_lib/api';

export interface SuggestInputProps {
    id?: string;
    kind: CatalogKind;
    value: string;
    onChange: (value: string) => void;
    /** Fired when a suggestion is picked (after onChange with the new text). */
    onSelect?: (item: CatalogSuggestion) => void;
    placeholder?: string;
    /**
     * Comma mode: suggestions match only the fragment after the last comma and
     * selection replaces just that fragment — for multi-complaint fields.
     */
    commaSeparated?: boolean;
    disabled?: boolean;
    className?: string;
    error?: boolean;
}

/**
 * Typeahead input backed by the EMR clinical catalog (medications,
 * complaints, diagnoses, lab tests). Debounced fetch, keyboard navigation
 * (↑ ↓ Enter Esc), and graceful offline suggestions.
 */
export function SuggestInput({
    id, kind, value, onChange, onSelect, placeholder, commaSeparated, disabled, className, error,
}: SuggestInputProps) {
    const [items, setItems] = React.useState<CatalogSuggestion[]>([]);
    const [open, setOpen] = React.useState(false);
    const [active, setActive] = React.useState(0);
    const wrapRef = React.useRef<HTMLDivElement>(null);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const seqRef = React.useRef(0);

    const queryOf = React.useCallback(
        (text: string) => (commaSeparated ? text.split(',').pop() || '' : text).trim(),
        [commaSeparated]
    );

    // Close on outside click.
    React.useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, []);

    const search = React.useCallback((text: string) => {
        const q = queryOf(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (q.length < 1) {
            setItems([]);
            setOpen(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            const seq = ++seqRef.current;
            // Instant-first: local matches render immediately; the full catalog
            // response replaces them when it arrives (or on timeout fallback).
            const local = demoCatalogSearch(kind, q);
            if (local.length > 0) {
                setItems(local);
                setActive(0);
                setOpen(true);
            }
            const results = await fetchCatalogSuggestions(kind, q);
            if (seq !== seqRef.current) return; // stale response
            setItems(results);
            setActive(0);
            setOpen(results.length > 0);
        }, 180);
    }, [kind, queryOf]);

    const pick = (item: CatalogSuggestion) => {
        let next = item.label;
        if (commaSeparated) {
            const parts = value.split(',');
            parts[parts.length - 1] = (parts.length > 1 ? ' ' : '') + item.label;
            next = parts.join(',');
        }
        onChange(next);
        onSelect?.(item);
        setOpen(false);
        setItems([]);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (!open || items.length === 0) return;
        if (e.key === 'ArrowDown' || (chipMode && e.key === 'ArrowRight')) { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
        else if (e.key === 'ArrowUp' || (chipMode && e.key === 'ArrowLeft')) { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); pick(items[active]); }
        else if (e.key === 'Escape') setOpen(false);
    };

    // Medication suggestions render as wrapping pill chips with a dosage-form
    // prefix (Tab / Cap / Syr / Inj …), matching standard Indian Rx pickers.
    const chipMode = kind === 'medication';
    const FORM_ABBR: Record<string, string> = {
        Tablet: 'Tab', Capsule: 'Cap', Syrup: 'Syr', Injection: 'Inj', Inhaler: 'Inh',
        Cream: 'Cre', Gel: 'Gel', Drops: 'Dro', 'Eye Drops': 'Eye', 'Ear Drops': 'Ear',
        Ointment: 'Oin', Powder: 'Pow', Sachet: 'Sac', Spray: 'Spr', Suspension: 'Sus',
        Respules: 'Res', Lotion: 'Lot', Solution: 'Sol', Pen: 'Pen', Vial: 'Inj',
    };
    const formAbbr = (form?: string) => {
        if (!form) return 'Rx';
        return FORM_ABBR[form] || FORM_ABBR[Object.keys(FORM_ABBR).find((k) => form.toLowerCase().includes(k.toLowerCase())) || ''] || form.slice(0, 3);
    };
    const chipText = (item: CatalogSuggestion) => {
        const name = item.meta?.brand || item.meta?.generic || item.label;
        return item.meta?.strength ? `${name} (${item.meta.strength})` : name;
    };

    return (
        <div ref={wrapRef} className={cn('relative', className)}>
            <Input
                id={id}
                value={value}
                disabled={disabled}
                error={error}
                placeholder={placeholder}
                autoComplete="off"
                role="combobox"
                aria-expanded={open}
                aria-autocomplete="list"
                onChange={(e) => { onChange(e.target.value); search(e.target.value); }}
                onFocus={(e) => search(e.target.value)}
                onKeyDown={onKeyDown}
            />
            {open && chipMode && (
                <div
                    role="listbox"
                    className="absolute z-50 mt-1.5 flex max-h-72 w-max max-w-xl min-w-full flex-wrap gap-2 overflow-y-auto scrollbar-thin rounded-2xl border border-border bg-popover p-3 shadow-pop"
                >
                    {items.map((item, i) => (
                        <button
                            key={`${item.label}-${i}`}
                            type="button"
                            role="option"
                            aria-selected={i === active}
                            onMouseEnter={() => setActive(i)}
                            onMouseDown={(e) => { e.preventDefault(); pick(item); }}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors',
                                i === active
                                    ? 'border-primary/50 bg-primary/10 text-foreground'
                                    : 'border-border bg-card text-foreground hover:border-primary/40'
                            )}
                        >
                            <span className="text-[10px] font-semibold uppercase text-subtle-foreground">{formAbbr(item.meta?.form)}</span>
                            <span className="max-w-52 truncate font-medium">{chipText(item)}</span>
                        </button>
                    ))}
                </div>
            )}
            {open && !chipMode && (
                <ul
                    role="listbox"
                    className="absolute z-50 mt-1.5 max-h-64 w-full min-w-64 overflow-y-auto scrollbar-thin rounded-xl border border-border bg-popover p-1 shadow-pop"
                >
                    {items.map((item, i) => (
                        <li key={`${item.label}-${i}`} role="option" aria-selected={i === active}>
                            <button
                                type="button"
                                onMouseEnter={() => setActive(i)}
                                onMouseDown={(e) => { e.preventDefault(); pick(item); }}
                                className={cn(
                                    'flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                                    i === active ? 'bg-primary/10 text-foreground' : 'text-foreground'
                                )}
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">{item.label}</span>
                                    {item.meta?.brand && (
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {item.meta.brand}{item.meta.form ? ` · ${item.meta.form}` : ''}
                                        </span>
                                    )}
                                </span>
                                {item.code && (
                                    <span className="shrink-0 font-mono text-xs text-subtle-foreground">{item.code}</span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
