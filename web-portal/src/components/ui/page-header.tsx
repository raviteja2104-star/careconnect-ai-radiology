'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Crumb {
    label: string;
    href?: string;
}

export interface PageHeaderProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    crumbs?: Crumb[];
    actions?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, description, crumbs, actions, className }: PageHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}
        >
            <div className="min-w-0">
                {crumbs && crumbs.length > 0 && (
                    <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1 text-xs text-subtle-foreground">
                        {crumbs.map((c, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <ChevronRight className="h-3 w-3" aria-hidden />}
                                {c.href ? (
                                    <Link href={c.href} className="transition-colors hover:text-foreground">{c.label}</Link>
                                ) : (
                                    <span className="text-muted-foreground">{c.label}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                )}
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
                {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
        </motion.div>
    );
}
