'use client';

/**
 * UserSearchSelector — secure user-search widget for caregiver/share grantee
 * selection. Replaces the free-text identifier inputs that existed previously.
 *
 * Security properties:
 *  - Searches against a backend endpoint that returns only masked identity
 *    (name, last-4 of phone, CC display ID — never full PII or clinical data).
 *  - The selected user's ID is passed to the parent; the parent sends it to
 *    the backend for authorization. The frontend never creates an authorization
 *    by itself — the backend validates every grant independently.
 *  - If the user types but does not select from results, no ID is captured;
 *    the parent's submit handler will reject a missing ID.
 *  - Minimum 2-char query matches the backend's minimum, so the network call
 *    is never made on a single character.
 */

import * as React from 'react';
import { Search, X, CheckCircle2, UserCircle2, Loader2 } from 'lucide-react';
import { Input, Badge } from '@/components/ui';
import { searchUsers, type UserSearchResult, ApiOfflineError } from '@/app/health-records/_lib/api';

const USER_TYPE_TONE: Record<UserSearchResult['userType'], 'brand' | 'info' | 'success' | 'neutral'> = {
    PATIENT: 'brand',
    DOCTOR: 'info',
    NURSE: 'success',
    STAFF: 'neutral',
};

interface Props {
    /** Called when the user selects a result. Passes selected user or null when cleared. */
    onSelect: (user: UserSearchResult | null) => void;
    /** Currently selected user (controlled). */
    selected: UserSearchResult | null;
    placeholder?: string;
    label?: string;
    /** Optional extra class for the root wrapper. */
    className?: string;
    disabled?: boolean;
}

export function UserSearchSelector({ onSelect, selected, placeholder = 'Search by name or phone number', label, className = '', disabled = false }: Props) {
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<UserSearchResult[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [open, setOpen] = React.useState(false);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside.
    React.useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current && !inputRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        setQuery(val);
        setError(null);
        if (timerRef.current) clearTimeout(timerRef.current);
        if (val.trim().length < 2) {
            setResults([]);
            setOpen(false);
            return;
        }
        timerRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const r = await searchUsers(val.trim());
                setResults(r);
                setOpen(true);
            } catch (err) {
                if (err instanceof ApiOfflineError) {
                    setError('Cannot reach the backend — check the connection and try again.');
                } else {
                    setError('Search failed. Try again.');
                }
                setResults([]);
                setOpen(false);
            } finally {
                setLoading(false);
            }
        }, 350);
    }

    function handleSelect(user: UserSearchResult) {
        onSelect(user);
        setQuery('');
        setResults([]);
        setOpen(false);
    }

    function handleClear() {
        onSelect(null);
        setQuery('');
        setResults([]);
        setOpen(false);
        setTimeout(() => inputRef.current?.focus(), 0);
    }

    if (selected) {
        return (
            <div className={`rounded-xl border border-success/40 bg-success-soft p-4 ${className}`}>
                <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
                    <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{selected.displayName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {selected.maskedPhone && <span className="mr-3">{selected.maskedPhone}</span>}
                            <span className="font-mono">{selected.ccDisplayId}</span>
                        </p>
                        <div className="mt-1.5">
                            <Badge tone={USER_TYPE_TONE[selected.userType]}>{selected.userType}</Badge>
                        </div>
                    </div>
                    {!disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Remove selection"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {label && <p className="mb-1.5 text-sm font-medium text-foreground">{label}</p>}
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                {loading && <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />}
                <Input
                    ref={inputRef}
                    value={query}
                    onChange={handleQueryChange}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="pl-9"
                    autoComplete="off"
                />
            </div>

            {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
            {!error && query.trim().length > 0 && query.trim().length < 2 && (
                <p className="mt-1.5 text-xs text-muted-foreground">Type at least 2 characters to search.</p>
            )}

            {open && results.length === 0 && !loading && query.trim().length >= 2 && (
                <div ref={dropdownRef} className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover p-3 shadow-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UserCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                        <span>No CareConnect users matched <strong>{query}</strong>.</span>
                    </div>
                </div>
            )}

            {open && results.length > 0 && (
                <div ref={dropdownRef} className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                    <ul role="listbox" className="divide-y divide-border">
                        {results.map((u) => (
                            <li key={u.id} role="option" aria-selected={false}>
                                <button
                                    type="button"
                                    onClick={() => handleSelect(u)}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                                >
                                    <UserCircle2 className="h-8 w-8 shrink-0 rounded-full text-muted-foreground" aria-hidden />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-foreground">{u.displayName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {u.maskedPhone && <span className="mr-2">{u.maskedPhone}</span>}
                                            <span className="font-mono">{u.ccDisplayId}</span>
                                        </p>
                                    </div>
                                    <Badge tone={USER_TYPE_TONE[u.userType]} className="shrink-0">{u.userType}</Badge>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
