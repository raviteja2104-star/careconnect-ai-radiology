'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, CircleOff, IndianRupee, Percent, FolderInput, X } from 'lucide-react';
import { Button, Dialog, Input, Label } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { ApiOfflineError, bulkBillables, demoBulk, type BulkBody } from '../_lib/api';

type BulkAction = BulkBody['action'];

interface PendingDialog {
    action: 'price' | 'gst' | 'category';
    title: string;
    label: string;
    inputType: 'number' | 'text';
    placeholder?: string;
}

const DIALOGS: Record<'price' | 'gst' | 'category', PendingDialog> = {
    price: { action: 'price', title: 'Set unit price', label: 'New unit price (₹)', inputType: 'number', placeholder: '350' },
    gst: { action: 'gst', title: 'Set GST rate', label: 'New GST %', inputType: 'number', placeholder: '12' },
    category: { action: 'category', title: 'Set category', label: 'New category', inputType: 'text', placeholder: 'Hematology' },
};

export interface BulkBarProps {
    selectedIds: string[];
    onClear: () => void;
    onDone: () => void;
}

export function BulkBar({ selectedIds, onClear, onDone }: BulkBarProps) {
    const { toast } = useToast();
    const [pending, setPending] = React.useState<PendingDialog | null>(null);
    const [value, setValue] = React.useState('');
    const [busy, setBusy] = React.useState<BulkAction | null>(null);

    const run = async (action: BulkAction, val?: number | string) => {
        setBusy(action);
        const body: BulkBody = { ids: selectedIds, action, ...(val !== undefined ? { value: val } : {}) };
        try {
            const { modified } = await bulkBillables(body);
            toast('success', 'Bulk update applied', `${modified} item(s) modified`);
            setPending(null);
            onDone();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                const modified = demoBulk(body);
                toast('info', 'Applied to demo data', `${modified} item(s) modified — backend offline, session-only.`);
                setPending(null);
                onDone();
            } else {
                toast('error', 'Bulk update failed', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setBusy(null);
        }
    };

    const openValueDialog = (key: 'price' | 'gst' | 'category') => {
        setValue('');
        setPending(DIALOGS[key]);
    };

    const submitValue = () => {
        if (!pending) return;
        if (pending.inputType === 'number') {
            const n = Number(value);
            if (value.trim() === '' || Number.isNaN(n) || n < 0) {
                toast('error', 'Enter a valid non-negative number');
                return;
            }
            void run(pending.action, n);
        } else {
            if (!value.trim()) {
                toast('error', 'Enter a category name');
                return;
            }
            void run(pending.action, value.trim());
        }
    };

    return (
        <>
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-float"
                    >
                        <span className="mr-1 text-sm font-medium text-foreground">
                            <span className="tabular-nums">{selectedIds.length}</span> selected
                        </span>
                        <Button variant="outline" size="sm" onClick={() => run('activate')} loading={busy === 'activate'}>
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Activate
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => run('deactivate')} loading={busy === 'deactivate'}>
                            <CircleOff className="h-3.5 w-3.5" aria-hidden /> Deactivate
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openValueDialog('price')}>
                            <IndianRupee className="h-3.5 w-3.5" aria-hidden /> Set price
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openValueDialog('gst')}>
                            <Percent className="h-3.5 w-3.5" aria-hidden /> Set GST
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openValueDialog('category')}>
                            <FolderInput className="h-3.5 w-3.5" aria-hidden /> Set category
                        </Button>
                        <Button variant="ghost" size="sm" className="ml-auto" onClick={onClear}>
                            <X className="h-3.5 w-3.5" aria-hidden /> Clear
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <Dialog
                open={!!pending}
                onClose={() => setPending(null)}
                size="sm"
                title={pending?.title}
                description={`Applies to ${selectedIds.length} selected item(s).`}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setPending(null)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={submitValue} loading={busy === pending?.action}>
                            Apply
                        </Button>
                    </>
                }
            >
                {pending && (
                    <div>
                        <Label htmlFor="bulk-value">{pending.label}</Label>
                        <Input
                            id="bulk-value"
                            type={pending.inputType}
                            min={pending.inputType === 'number' ? 0 : undefined}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={pending.placeholder}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && submitValue()}
                        />
                    </div>
                )}
            </Dialog>
        </>
    );
}
