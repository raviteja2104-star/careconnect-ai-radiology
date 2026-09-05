'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PortalLogin } from '../_components/PortalLogin';
import { portalById } from '../_lib/portals';

export default function PortalLoginPage({ params }: { params: Promise<{ portal: string }> }) {
    const { portal: portalId } = React.use(params);
    const portal = portalById(portalId);

    if (!portal) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gradient-surface px-4">
                <h1 className="text-2xl font-bold text-foreground">That sign-in portal doesn't exist.</h1>
                <Link
                    href="/login"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden /> Choose your portal
                </Link>
            </div>
        );
    }

    return (
        <React.Suspense fallback={null}>
            <PortalLogin portal={portal} />
        </React.Suspense>
    );
}
