import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('skeleton-shimmer rounded-lg', className)} aria-hidden {...props} />;
}

/** Full-card skeleton for dashboard widgets. */
export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
    return (
        <div className={cn('rounded-2xl border border-border bg-card p-6 space-y-3', className)} aria-busy>
            <Skeleton className="h-4 w-1/3" />
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className="h-3" style={{ width: `${85 - i * 15}%` }} />
            ))}
        </div>
    );
}

/** Table-shaped skeleton. */
export function SkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
    return (
        <div className={cn('rounded-2xl border border-border bg-card overflow-hidden', className)} aria-busy>
            <div className="border-b border-border bg-muted/50 p-4">
                <Skeleton className="h-4 w-48" />
            </div>
            <div className="divide-y divide-border">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                        <Skeleton className="h-3 flex-1" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
