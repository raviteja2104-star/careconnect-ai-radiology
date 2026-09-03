'use client';

import * as React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight, Download, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';
import { EmptyState } from './empty-state';

export interface Column<T> {
    key: string;
    header: React.ReactNode;
    /** Renders the cell. Defaults to reading row[key]. */
    cell?: (row: T, index: number) => React.ReactNode;
    /** Value accessor used for sorting/searching; defaults to row[key]. */
    accessor?: (row: T) => string | number;
    sortable?: boolean;
    align?: 'left' | 'right' | 'center';
    className?: string;
}

export interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    rowKey: (row: T, index: number) => string;
    searchable?: boolean;
    searchPlaceholder?: string;
    pageSize?: number;
    onRowClick?: (row: T) => void;
    rowActions?: (row: T) => React.ReactNode;
    exportName?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    toolbar?: React.ReactNode;
    className?: string;
    dense?: boolean;
}

function defaultAccessor<T>(row: T, key: string): string | number {
    const v = (row as Record<string, unknown>)[key];
    return typeof v === 'number' ? v : String(v ?? '');
}

export function DataTable<T>({
    columns, data, rowKey, searchable = true, searchPlaceholder = 'Search…', pageSize = 10,
    onRowClick, rowActions, exportName, emptyTitle = 'No records found', emptyDescription,
    toolbar, className, dense,
}: DataTableProps<T>) {
    const [query, setQuery] = React.useState('');
    const [sort, setSort] = React.useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
    const [page, setPage] = React.useState(0);

    const filtered = React.useMemo(() => {
        if (!query.trim()) return data;
        const q = query.toLowerCase();
        return data.filter((row) =>
            columns.some((c) => String(c.accessor ? c.accessor(row) : defaultAccessor(row, c.key)).toLowerCase().includes(q))
        );
    }, [data, query, columns]);

    const sorted = React.useMemo(() => {
        if (!sort) return filtered;
        const col = columns.find((c) => c.key === sort.key);
        if (!col) return filtered;
        const acc = (row: T) => (col.accessor ? col.accessor(row) : defaultAccessor(row, col.key));
        return [...filtered].sort((a, b) => {
            const av = acc(a), bv = acc(b);
            const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
            return sort.dir === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sort, columns]);

    const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
    const safePage = Math.min(page, pageCount - 1);
    const pageRows = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

    const toggleSort = (key: string) => {
        setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null));
    };

    const exportCsv = () => {
        const header = columns.map((c) => JSON.stringify(String(typeof c.header === 'string' ? c.header : c.key))).join(',');
        const body = sorted
            .map((row) => columns.map((c) => JSON.stringify(String(c.accessor ? c.accessor(row) : defaultAccessor(row, c.key)))).join(','))
            .join('\n');
        const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${exportName || 'export'}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <div className={cn('rounded-2xl border border-border bg-card shadow-soft overflow-hidden', className)}>
            {(searchable || toolbar || exportName) && (
                <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
                    {searchable && (
                        <div className="w-full max-w-xs">
                            <Input
                                icon={<Search />}
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                                placeholder={searchPlaceholder}
                                aria-label="Search table"
                                className="h-9"
                            />
                        </div>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                        {toolbar}
                        {exportName && (
                            <Button variant="outline" size="sm" onClick={exportCsv}>
                                <Download className="h-3.5 w-3.5" aria-hidden /> Export
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur-sm">
                        <tr className="border-b border-border">
                            {columns.map((c) => (
                                <th
                                    key={c.key}
                                    scope="col"
                                    className={cn(
                                        'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap',
                                        c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                                        c.className
                                    )}
                                >
                                    {c.sortable ? (
                                        <button
                                            onClick={() => toggleSort(c.key)}
                                            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                                        >
                                            {c.header}
                                            {sort?.key === c.key
                                                ? sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                                : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                                        </button>
                                    ) : c.header}
                                </th>
                            ))}
                            {rowActions && <th scope="col" className="px-4 py-3" aria-label="Actions" />}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {pageRows.map((row, i) => (
                            <tr
                                key={rowKey(row, i)}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                className={cn(
                                    'transition-colors hover:bg-muted/40',
                                    onRowClick && 'cursor-pointer'
                                )}
                            >
                                {columns.map((c) => (
                                    <td
                                        key={c.key}
                                        className={cn(
                                            'px-4', dense ? 'py-2' : 'py-3.5',
                                            c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                                            'text-foreground'
                                        )}
                                    >
                                        {c.cell ? c.cell(row, i) : String(defaultAccessor(row, c.key))}
                                    </td>
                                ))}
                                {rowActions && (
                                    <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                                        {rowActions(row)}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {pageRows.length === 0 && (
                    <div className="p-6">
                        <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription ?? (query ? `No results for “${query}”.` : undefined)} />
                    </div>
                )}
            </div>

            {sorted.length > pageSize && (
                <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
                    <span className="tabular-nums">
                        {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} of {sorted.length}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label="Previous page" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="px-2 text-xs font-medium tabular-nums">{safePage + 1} / {pageCount}</span>
                        <Button variant="ghost" size="icon-sm" aria-label="Next page" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
