'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HeartPulse, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { LOGIN_PORTALS } from './_lib/portals';

/**
 * Sign-in portal chooser — every user type has its own door.
 * Direct links: /login/patient · /login/doctor · /login/radiology ·
 * /login/staff · /login/admin
 */
export default function LoginChooserPage() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gradient-surface px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-3xl"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="gradient-brand flex h-14 w-14 items-center justify-center rounded-2xl shadow-float">
                        <HeartPulse className="h-7 w-7 text-white" aria-hidden />
                    </div>
                    <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Welcome to CareConnect
                    </h1>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        One platform, five workspaces. Choose your sign-in portal.
                    </p>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {LOGIN_PORTALS.map((portal, i) => (
                        <motion.div
                            key={portal.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.08 + i * 0.05 }}
                            className={portal.id === 'admin' ? 'sm:col-span-2' : ''}
                        >
                            <Link
                                href={`/login/${portal.id}`}
                                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-float"
                            >
                                <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${portal.tile}`}>
                                    <portal.icon className="h-6 w-6" aria-hidden />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-base font-semibold text-foreground">{portal.name}</span>
                                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{portal.audience}</span>
                                </span>
                                <ArrowRight className="h-4 w-4 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className="my-8 flex items-center gap-3" aria-hidden>
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-medium uppercase tracking-widest text-subtle-foreground">or</span>
                    <div className="h-px flex-1 bg-border" />
                </div>

                <div className="flex flex-col items-center gap-4">
                    <Link href="/home" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        ← Back to Home
                    </Link>
                    <Button variant="outline" onClick={() => router.push('/')}>
                        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                        Continue in demo mode
                    </Button>
                    <Badge tone="outline" dot>
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Secured with JWT · Role-based access
                    </Badge>
                </div>
            </motion.div>
        </div>
    );
}
