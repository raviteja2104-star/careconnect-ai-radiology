import { Skeleton } from '@/components/ui';

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-7.5rem)] min-h-[540px] flex-col space-y-6" aria-busy>
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        {/* Conversation list skeleton */}
        <div className="hidden w-80 shrink-0 flex-col border-r border-border bg-muted/30 md:flex md:w-96">
          <div className="space-y-3 border-b border-border p-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thread skeleton */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-border p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="ml-auto h-8 w-32 rounded-xl" />
          </div>
          <div className="flex-1 space-y-4 bg-muted/20 p-6">
            <Skeleton className="h-16 w-2/3 rounded-2xl" />
            <Skeleton className="ml-auto h-12 w-1/2 rounded-2xl" />
            <Skeleton className="h-20 w-2/3 rounded-2xl" />
            <Skeleton className="ml-auto h-12 w-2/5 rounded-2xl" />
          </div>
          <div className="flex items-center gap-2 border-t border-border p-4">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
