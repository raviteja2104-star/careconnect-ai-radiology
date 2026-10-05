'use client';

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { refreshAccessToken } from '@/services/authService';

function isAuthError(error: unknown): boolean {
    const msg = (error as Error)?.message ?? '';
    return msg.includes('401') ||
        msg.toLowerCase().includes('authentication required') ||
        msg.toLowerCase().includes('not authorized');
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => {
        let client: QueryClient;
        client = new QueryClient({
        queryCache: new QueryCache({
            onError(error) {
                // Only redirect to login when a real JWT is present and the server
                // rejected it. In demo mode there is no token in localStorage, so
                // a 401 just means the endpoint requires auth — not an expired session.
                if (isAuthError(error) && typeof window !== 'undefined') {
                    const token = window.localStorage.getItem('token');
                    if (!token) return;
                    // Try to silently refresh before sending the user to /login
                    refreshAccessToken().then(result => {
                        if (result) {
                            // New token stored; re-run stale queries with the fresh token
                            client.invalidateQueries();
                        } else {
                            const next = encodeURIComponent(window.location.pathname);
                            window.location.replace(`/login?reason=session_expired&next=${next}`);
                        }
                    });
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
        });
        return client;
    });

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
