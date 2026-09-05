'use client';

import * as React from 'react';
import {
    Check, ChevronLeft, ChevronRight, Download, FileUp, FlaskConical, Info,
    ListChecks, Plus, Search, ShieldCheck, Syringe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Badge, Button, Card, CardContent, DataTable, ErrorState, Input, PageHeader,
    Select, SkeletonTable, StatCard, StatGrid, Switch, Tabs, TabsContent, TabsList, TabsTrigger,
    type Column,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
    ApiOfflineError, demoUpsert, exportBillablesCsv, fetchBillables, fetchCategories,
    fetchStats, formatINR, updateBillable, TYPE_LABELS,
    type BillableItem, type BillablesPage, type BillableType, type CategoryCount, type HeadlineStats,
} from './_lib/api';
import { EditDialog } from './_components/edit-dialog';
import { ImportDialog } from './_components/import-dialog';
import { BulkBar } from './_components/bulk-bar';

const TABS: BillableType[] = ['lab_test', 'panel', 'imaging', 'consumable', 'ivd_kit', 'blood_bank'];
const PAGE_SIZE = 10;

type ActiveFilter = 'all' | 'active' | 'inactive';

/* Small square checkbox built from tokens (no ui primitive exists for it). */
function CheckBox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-label={label}
            onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
            className={cn(
                'flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-colors',
                checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card hover:border-primary/60'
            )}
        >
            {checked && <Check className="h-3 w-3" aria-hidden />}
        </button>
    );
}

export default function BillablesMasterPage() {
    const { toast } = useToast();

    const [tab, setTab] = React.useState<BillableType>('lab_test');
    const [category, setCategory] = React.useState('');
    const [searchInput, setSearchInput] = React.useState('');
    const [q, setQ] = React.useState('');
    const [activeFilter, setActiveFilter] = React.useState<ActiveFilter>('all');
    const [page, setPage] = React.useState(1);

    const [pageData, setPageData] = React.useState<BillablesPage | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [loadError, setLoadError] = React.useState<string | null>(null);
    const [demo, setDemo] = React.useState(false);
    const [stats, setStats] = React.useState<HeadlineStats | null>(null);
    const [cats, setCats] = React.useState<CategoryCount[]>([]);
    const [refreshKey, setRefreshKey] = React.useState(0);

    const [selected, setSelected] = React.useState<string[]>([]);
    const [editOpen, setEditOpen] = React.useState(false);
    const [editItem, setEditItem] = React.useState<BillableItem | null>(null);
    const [importOpen, setImportOpen] = React.useState(false);
    const [exporting, setExporting] = React.useState(false);

    const refresh = React.useCallback(() => setRefreshKey((k) => k + 1), []);

    /* Debounced server-side search */
    React.useEffect(() => {
        const t = setTimeout(() => {
            setQ(searchInput.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(t);
    }, [searchInput]);

    /* Main list */
    React.useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(null);
        fetchBillables({
            type: tab,
            category: category || undefined,
            q: q || undefined,
            active: activeFilter === 'all' ? undefined : activeFilter === 'active',
            page,
            limit: PAGE_SIZE,
        })
            .then((res) => {
                if (cancelled) return;
                setPageData(res.data);
                setDemo(res.demo);
            })
            .catch((err) => {
                if (cancelled) return;
                setLoadError(err instanceof Error ? err.message : 'Failed to load items');
            })
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [tab, category, q, activeFilter, page, refreshKey]);

    /* Categories per tab */
    React.useEffect(() => {
        let cancelled = false;
        fetchCategories(tab)
            .then((res) => !cancelled && setCats(res.data))
            .catch(() => !cancelled && setCats([]));
        return () => { cancelled = true; };
    }, [tab, refreshKey]);

    /* Headline stats */
    React.useEffect(() => {
        let cancelled = false;
        fetchStats()
            .then((res) => {
                if (cancelled) return;
                setStats(res.data);
                setDemo((d) => d || res.demo);
            })
            .catch(() => !cancelled && setStats(null));
        return () => { cancelled = true; };
    }, [refreshKey]);

    const onTabChange = (v: string) => {
        setTab(v as BillableType);
        setCategory('');
        setSearchInput('');
        setQ('');
        setActiveFilter('all');
        setPage(1);
        setSelected([]);
    };

    const toggleActive = async (row: BillableItem, next: boolean) => {
        try {
            await updateBillable(row._id, { active: next });
            toast('success', next ? 'Item activated' : 'Item deactivated', row.itemCode);
            refresh();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                demoUpsert({ ...row, active: next });
                toast('info', 'Applied to demo data', `${row.itemCode} — backend offline, session-only.`);
                refresh();
            } else {
                toast('error', 'Update failed', err instanceof Error ? err.message : undefined);
            }
        }
    };

    const exportCsv = async () => {
        setExporting(true);
        try {
            const res = await exportBillablesCsv(tab);
            const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `billables-${tab}.csv`;
            a.click();
            URL.revokeObjectURL(a.href);
            if (res.demo) toast('info', 'Exported demo data', 'Backend offline — CSV reflects the demo catalogue.');
            else toast('success', 'Export ready', `billables-${tab}.csv`);
        } catch (err) {
            toast('error', 'Export failed', err instanceof Error ? err.message : undefined);
        } finally {
            setExporting(false);
        }
    };

    const items = pageData?.items ?? [];
    const total = pageData?.total ?? 0;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const pageIds = items.map((i) => i._id);
    const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    const toggleAll = (v: boolean) =>
        setSelected((prev) => (v ? [...new Set([...prev, ...pageIds])] : prev.filter((id) => !pageIds.includes(id))));
    const toggleOne = (id: string, v: boolean) =>
        setSelected((prev) => (v ? [...prev, id] : prev.filter((x) => x !== id)));

    const columns = React.useMemo<Column<BillableItem>[]>(() => {
        const selectCol: Column<BillableItem> = {
            key: '_select',
            header: <CheckBox checked={allOnPageSelected} onChange={toggleAll} label="Select all rows on this page" />,
            cell: (row) => (
                <CheckBox
                    checked={selected.includes(row._id)}
                    onChange={(v) => toggleOne(row._id, v)}
                    label={`Select ${row.itemCode}`}
                />
            ),
            className: 'w-10',
        };
        const codeCol: Column<BillableItem> = {
            key: 'itemCode',
            header: 'Code',
            sortable: true,
            cell: (row) => <span className="font-mono text-xs font-semibold text-foreground">{row.itemCode}</span>,
            accessor: (row) => row.itemCode,
        };
        const nameCol: Column<BillableItem> = {
            key: 'name',
            header: 'Name',
            sortable: true,
            cell: (row) => (
                <div className="min-w-0 max-w-64">
                    <p className="truncate font-medium text-foreground">{row.name}</p>
                    {row.labExt?.testCode && <p className="text-xs text-muted-foreground">{row.labExt.testCode}</p>}
                </div>
            ),
            accessor: (row) => row.name,
        };
        const priceCol: Column<BillableItem> = {
            key: 'unitPrice',
            header: '₹ Price',
            align: 'right',
            sortable: true,
            cell: (row) => <span className="tabular-nums">{formatINR(row.unitPrice)}</span>,
            accessor: (row) => row.unitPrice ?? 0,
        };
        const gstCol: Column<BillableItem> = {
            key: 'gst',
            header: 'GST',
            align: 'right',
            cell: (row) => <span className="tabular-nums text-muted-foreground">{row.gst != null ? `${row.gst}%` : '—'}</span>,
            accessor: (row) => row.gst ?? 0,
        };
        const activeCol: Column<BillableItem> = {
            key: 'active',
            header: 'Active',
            align: 'center',
            cell: (row) => (
                <span onClick={(e) => e.stopPropagation()} className="inline-flex">
                    <Switch checked={row.active} onCheckedChange={(v) => void toggleActive(row, v)} label={`Toggle ${row.itemCode} active`} />
                </span>
            ),
            accessor: (row) => (row.active ? 1 : 0),
        };

        if (tab === 'consumable' || tab === 'ivd_kit') {
            const cols: Column<BillableItem>[] = [
                selectCol,
                codeCol,
                nameCol,
                { key: 'category', header: 'Category', sortable: true, cell: (row) => row.category ?? '—', accessor: (row) => row.category ?? '' },
                {
                    key: 'unit',
                    header: 'Unit / Pack',
                    cell: (row) => (
                        <span className="text-muted-foreground">
                            {row.unit ?? '—'}
                            {row.ivdExt?.packSize ? ` · ${row.ivdExt.packSize}` : ''}
                        </span>
                    ),
                    accessor: (row) => row.unit ?? '',
                },
                priceCol,
                gstCol,
            ];
            if (tab === 'ivd_kit') {
                cols.push({
                    key: 'stock',
                    header: 'Stock',
                    align: 'right',
                    cell: (row) => {
                        const stock = row.ivdExt?.currentStock;
                        if (stock == null) return <span className="text-muted-foreground">—</span>;
                        const low = row.ivdExt?.reorderLevel != null && stock <= row.ivdExt.reorderLevel;
                        return (
                            <Badge tone={low ? 'warning' : 'neutral'} dot={low}>
                                {stock} {row.unit ?? ''}
                            </Badge>
                        );
                    },
                    accessor: (row) => row.ivdExt?.currentStock ?? 0,
                });
            }
            cols.push(activeCol);
            return cols;
        }

        if (tab === 'imaging') {
            return [
                selectCol,
                codeCol,
                nameCol,
                { key: 'category', header: 'Modality', sortable: true, cell: (row) => row.category ?? '—', accessor: (row) => row.category ?? '' },
                { key: 'department', header: 'Department', cell: (row) => <span className="text-muted-foreground">{row.department ?? '—'}</span>, accessor: (row) => row.department ?? '' },
                { key: 'unit', header: 'Unit', cell: (row) => <span className="text-muted-foreground">{row.unit ?? '—'}</span>, accessor: (row) => row.unit ?? '' },
                priceCol,
                gstCol,
                activeCol,
            ];
        }

        /* lab_test / panel / blood_bank */
        return [
            selectCol,
            codeCol,
            nameCol,
            {
                key: 'category',
                header: 'Category / Sub',
                sortable: true,
                cell: (row) => (
                    <div className="min-w-0">
                        <p className="text-foreground">{row.category ?? '—'}</p>
                        {row.subcategory && <p className="text-xs text-muted-foreground">{row.subcategory}</p>}
                    </div>
                ),
                accessor: (row) => row.category ?? '',
            },
            { key: 'specimen', header: 'Specimen', cell: (row) => <span className="text-muted-foreground">{row.labExt?.specimen ?? '—'}</span>, accessor: (row) => row.labExt?.specimen ?? '' },
            {
                key: 'tat',
                header: 'TAT',
                align: 'right',
                sortable: true,
                cell: (row) => <span className="tabular-nums text-muted-foreground">{row.labExt?.tatHours != null ? `${row.labExt.tatHours} h` : '—'}</span>,
                accessor: (row) => row.labExt?.tatHours ?? 0,
            },
            { key: 'unit', header: 'Unit', cell: (row) => <span className="text-muted-foreground">{row.unit ?? '—'}</span>, accessor: (row) => row.unit ?? '' },
            priceCol,
            gstCol,
            activeCol,
        ];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, selected, allOnPageSelected, items]);

    const filterBar = (
        <div className="flex flex-wrap items-center gap-3">
            <div className="w-full max-w-xs">
                <Input
                    icon={<Search />}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search code, name, HSN…"
                    aria-label="Search billable items"
                    className="h-9"
                />
            </div>
            <Select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                aria-label="Filter by category"
                className="h-9 w-auto min-w-44"
            >
                <option value="">All categories</option>
                {cats.map((c) => (
                    <option key={c.category} value={c.category}>
                        {c.category} ({c.count})
                    </option>
                ))}
            </Select>
            <div className="flex items-center gap-1 rounded-xl bg-muted p-1" role="group" aria-label="Active filter">
                {(['all', 'active', 'inactive'] as ActiveFilter[]).map((f) => (
                    <button
                        key={f}
                        type="button"
                        onClick={() => { setActiveFilter(f); setPage(1); }}
                        aria-pressed={activeFilter === f}
                        className={cn(
                            'rounded-lg px-3 py-1 text-xs font-medium capitalize transition-all',
                            activeFilter === f ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>
        </div>
    );

    const tableSection = loadError ? (
        <ErrorState onRetry={refresh} />
    ) : loading && !pageData ? (
        <SkeletonTable rows={6} />
    ) : (
        <>
            <DataTable<BillableItem>
                columns={columns}
                data={items}
                rowKey={(row) => row._id}
                searchable={false}
                pageSize={PAGE_SIZE}
                onRowClick={(row) => { setEditItem(row); setEditOpen(true); }}
                emptyTitle={`No ${TYPE_LABELS[tab].toLowerCase()} items`}
                emptyDescription={q || category ? 'Try clearing the search or category filter.' : 'Add your first item or import a CSV to get started.'}
                className={cn(loading && 'opacity-60 transition-opacity')}
            />
            {total > PAGE_SIZE && (
                <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
                    <span className="tabular-nums">
                        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="px-2 text-xs font-medium tabular-nums">{page} / {pageCount}</span>
                        <Button variant="ghost" size="icon-sm" aria-label="Next page" disabled={page >= pageCount || loading} onClick={() => setPage((p) => p + 1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Billable Items Master"
                description="A configurable starter catalogue of lab tests, panels, imaging studies, consumables and IVD kits — explicitly not a universal national list. Review every code, price and GST rate against your own facility before use."
                crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Billable Items' }]}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        {demo && <Badge tone="warning" dot pulse>Demo data — backend offline</Badge>}
                        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                            <FileUp className="h-3.5 w-3.5" aria-hidden /> Import CSV
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportCsv} loading={exporting}>
                            <Download className="h-3.5 w-3.5" aria-hidden /> Export CSV
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => { setEditItem(null); setEditOpen(true); }}>
                            <Plus className="h-3.5 w-3.5" aria-hidden /> New item
                        </Button>
                    </div>
                }
            />

            <StatGrid>
                <StatCard label="Total items" value={stats?.total ?? '—'} icon={ListChecks} tone="brand" sub="Across all types" delay={0} />
                <StatCard label="Active" value={stats?.active ?? '—'} icon={ShieldCheck} tone="emerald" sub="Currently billable" delay={0.05} />
                <StatCard label="Lab tests" value={stats?.labTests ?? '—'} icon={FlaskConical} tone="violet" sub="Individual assays" delay={0.1} />
                <StatCard label="Consumables" value={stats?.consumables ?? '—'} icon={Syringe} tone="amber" sub="Stocked supplies" delay={0.15} />
            </StatGrid>

            <Tabs value={tab} onValueChange={onTabChange}>
                <div className="overflow-x-auto no-scrollbar">
                    <TabsList>
                        {TABS.map((t) => (
                            <TabsTrigger key={t} value={t}>
                                {TYPE_LABELS[t]}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
                {TABS.map((t) => (
                    <TabsContent key={t} value={t} className="space-y-3">
                        {filterBar}
                        <BulkBar selectedIds={selected} onClear={() => setSelected([])} onDone={() => { setSelected([]); refresh(); }} />
                        {tableSection}
                    </TabsContent>
                ))}
            </Tabs>

            <Card className="border-dashed">
                <CardContent className="flex gap-3 py-4">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                        <Info className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="text-xs leading-relaxed text-muted-foreground">
                        <p className="font-semibold text-foreground">India-ready metadata, not compliance claims</p>
                        <p className="mt-1">
                            NABL-scope flags, HSN/SAC codes, regulatory-class fields and future LOINC / SNOMED CT / ICD mappings on this page are
                            configurable metadata only. They do not constitute accreditation, tax or regulatory compliance. Validate every entry
                            against your NABL scope of accreditation, current GST notifications and CDSCO classifications before production billing.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <EditDialog
                open={editOpen}
                onClose={() => setEditOpen(false)}
                item={editItem}
                defaultType={tab}
                onSaved={refresh}
            />
            <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={refresh} />
        </div>
    );
}
