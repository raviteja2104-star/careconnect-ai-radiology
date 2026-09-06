'use client';

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

function isAuthError(error: unknown): boolean {
    const msg = (error as Error)?.message ?? '';
    return msg.includes('401') ||
        msg.toLowerCase().includes('authentication required') ||
        msg.toLowerCase().includes('not authorized');
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        queryCache: new QueryCache({
            onError(error) {
                // Redirect to login when the session expires
                if (isAuthError(error) && typeof window !== 'undefined') {
                    const next = encodeURIComponent(window.location.pathname);
                    window.location.replace(`/login?reason=session_expired&next=${next}`);
                }
            },
        }),
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                // Don't retry on 401/403 — retrying won't change the outcome
                retry: (failureCount, error) => {
                    const msg = (error as Error)?.message ?? '';
                    if (msg.includes('401') || msg.includes('403')) return false;
                    return failureCount < 2;
                },
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
