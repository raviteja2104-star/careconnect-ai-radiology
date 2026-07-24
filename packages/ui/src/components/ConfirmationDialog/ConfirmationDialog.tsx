import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog } from '../Dialog/Dialog';
import { Button } from '../Button/Button';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen, onClose, onConfirm, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', isLoading
}: ConfirmationDialogProps) {
  const iconColors = { danger: 'text-red-600 bg-red-100 dark:bg-red-900/30', warning: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', primary: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' };
  const btnVariants = { danger: 'danger', warning: 'primary', primary: 'primary' } as const;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>{cancelLabel}</Button>
          <Button variant={btnVariants[variant]} onClick={onConfirm} isLoading={isLoading}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full ${iconColors[variant]} shrink-0`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
        </div>
      </div>
    </Dialog>
  );
}
