'use client';

import * as React from 'react';
import { FileUp, CheckCircle2, RefreshCw, SkipForward, AlertTriangle } from 'lucide-react';
import { Badge, Button, Dialog, FieldHint, Label, Textarea } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { ApiOfflineError, demoImportCsv, importBillablesCsv, type ImportResult } from '../_lib/api';

const TEMPLATE_HEADER = 'itemCode,name,type,category,subcategory,department,unit,unitPrice,gst,hsnSac,active';

export interface ImportDialogProps {
    open: boolean;
    onClose: () => void;
    onImported: () => void;
}

export function ImportDialog({ open, onClose, onImported }: ImportDialogProps) {
    const { toast } = useToast();
    const [csv, setCsv] = React.useState('');
    const [fileName, setFileName] = React.useState<string | null>(null);
    const [busy, setBusy] = React.useState(false);
    const [result, setResult] = React.useState<{ res: ImportResult; demo: boolean } | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const fileRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (open) {
            setCsv('');
            setFileName(null);
            setResult(null);
            setError(null);
            setBusy(false);
        }
    }, [open]);

    const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setCsv(String(reader.result ?? ''));
            setFileName(file.name);
            setResult(null);
        };
        reader.onerror = () => setError('Could not read the selected file.');
        reader.readAsText(file);
        e.target.value = '';
    };

    const run = async () => {
        if (!csv.trim()) {
            setError('Paste CSV content or choose a .csv file first.');
            return;
        }
        setError(null);
        setBusy(true);
        try {
            const res = await importBillablesCsv(csv);
            setResult({ res, demo: false });
            toast('success', 'Import complete', `${res.created} created, ${res.updated} updated`);
            onImported();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                const res = demoImportCsv(csv);
                setResult({ res, demo: true });
                toast('info', 'Imported into demo data', 'Backend offline — changes live only in this browser session.');
                onImported();
            } else {
                setError(err instanceof Error ? err.message : 'Import failed');
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            size="lg"
            title="Import items from CSV"
            description="Upsert billable items by item code. Existing codes are updated; new codes are created."
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={busy}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={run} loading={busy}>
                        <FileUp className="h-4 w-4" aria-hidden /> Run import
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                {error && (
                    <p className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger" role="alert">
                        {error}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                        <FileUp className="h-3.5 w-3.5" aria-hidden /> Choose .csv file
                    </Button>
                    <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} aria-label="CSV file" />
                    {fileName && <Badge tone="info">{fileName}</Badge>}
                </div>

                <div>
                    <Label htmlFor="import-csv">CSV content</Label>
                    <Textarea
                        id="import-csv"
                        value={csv}
                        onChange={(e) => { setCsv(e.target.value); setResult(null); }}
                        placeholder={`${TEMPLATE_HEADER}\nLAB-CBC,Complete Blood Count (CBC),lab_test,Hematology,,,test,350,0,999316,true`}
                        className="min-h-40 font-mono text-xs"
                        spellCheck={false}
                    />
                    <FieldHint>
                        Header columns (any order): <span className="font-mono">{TEMPLATE_HEADER}</span>
                    </FieldHint>
                </div>

                {result && (
                    <div className="rounded-2xl border border-border bg-muted/40 p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground">Import result</h4>
                            {result.demo && <Badge tone="warning" dot>Demo simulation — backend offline</Badge>}
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                                <span className="tabular-nums font-semibold text-foreground">{result.res.created}</span>
                                <span className="text-muted-foreground">created</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <RefreshCw className="h-4 w-4 text-info" aria-hidden />
                                <span className="tabular-nums font-semibold text-foreground">{result.res.updated}</span>
                                <span className="text-muted-foreground">updated</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <SkipForward className="h-4 w-4 text-warning" aria-hidden />
                                <span className="tabular-nums font-semibold text-foreground">{result.res.skippedDuplicates}</span>
                                <span className="text-muted-foreground">duplicates</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <AlertTriangle className="h-4 w-4 text-danger" aria-hidden />
                                <span className="tabular-nums font-semibold text-foreground">{result.res.errors.length}</span>
                                <span className="text-muted-foreground">errors</span>
                            </div>
                        </div>
                        {result.res.errors.length > 0 && (
                            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto scrollbar-thin text-xs">
                                {result.res.errors.map((e, i) => (
                                    <li key={i} className="flex gap-2 text-danger">
                                        <span className="shrink-0 font-mono tabular-nums">Line {e.line}:</span>
                                        <span>{e.message}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </Dialog>
    );
}
