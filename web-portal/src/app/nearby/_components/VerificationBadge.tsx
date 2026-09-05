'use client';

import * as React from 'react';
import { ShieldCheck, ShieldQuestion, ShieldAlert, Clock3, Ban } from 'lucide-react';
import { Badge } from '@/components/ui';
import { formatDDMMYYYY, VERIFICATION_LABELS, type VerificationStatus } from '../_lib/api';

/**
 * Renders the actual verification status carried by the API/demo data.
 * Never render UNVERIFIED/CLAIMED info with a verified-looking badge — the
 * tone, icon, and label are keyed off `status` and nothing else.
 */
export function VerificationBadge({
    status,
    lastVerifiedAt,
    className,
}: {
    status: VerificationStatus;
    lastVerifiedAt?: string;
    className?: string;
}) {
    const config: Record<VerificationStatus, { tone: 'success' | 'info' | 'warning' | 'danger'; icon: React.ElementType }> = {
        VERIFIED: { tone: 'success', icon: ShieldCheck },
        CLAIMED: { tone: 'info', icon: ShieldQuestion },
        UNVERIFIED: { tone: 'warning', icon: ShieldAlert },
        SUSPENDED: { tone: 'warning', icon: Clock3 },
        CLOSED: { tone: 'danger', icon: Ban },
    };
    const { tone, icon: Icon } = config[status];
    return (
        <span className={className}>
            <Badge tone={tone}>
                <Icon className="h-3 w-3" aria-hidden /> {VERIFICATION_LABELS[status]}
            </Badge>
            {status === 'VERIFIED' && lastVerifiedAt && (
                <span className="ml-2 text-[11px] text-muted-foreground">
                    Last verified {formatDDMMYYYY(lastVerifiedAt)}
                </span>
            )}
        </span>
    );
}
