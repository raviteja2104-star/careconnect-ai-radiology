'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    authService, PERSONAS, sessionFromBackendUser, readStoredAuth, persistAuth, clearStoredAuth,
    type AuthUserSession, type BackendUser,
} from '@/services/authService';

const ROLE_KEY = 'cc-active-role';

interface SessionContextValue {
    session: AuthUserSession;
    /** Switch to another app persona (demo mode only — no-op when authenticated). */
    switchRole: (role: keyof typeof PERSONAS) => void;
    availableRoles: Array<keyof typeof PERSONAS>;
    /** False during SSR/first paint, true once the persisted role/JWT is applied. */
    hydrated: boolean;
    /** True when the session is backed by a real backend JWT (not a demo persona). */
    isAuthenticated: boolean;
    /** Persist a real backend login and swap the session to it. */
    signIn: (user: BackendUser, token: string) => AuthUserSession;
    /** Clear the JWT + stored user, fall back to the demo persona, go to /login. */
    logout: () => void;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

/** The demo persona the app falls back to when no JWT is present. */
function demoPersona(): AuthUserSession {
    try {
        const stored = localStorage.getItem(ROLE_KEY);
        if (stored && PERSONAS[stored]) return PERSONAS[stored];
    } catch { /* storage unavailable */ }
    return authService.getCurrentSession();
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    // Server render always uses the default persona; the persisted role or the
    // real JWT session is applied after mount to keep hydration deterministic.
    const [session, setSession] = React.useState<AuthUserSession>(authService.getCurrentSession());
    const [hydrated, setHydrated] = React.useState(false);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);

    React.useEffect(() => {
        // Real login wins: a stored JWT + user rebuilds the authenticated session.
        const stored = readStoredAuth();
        if (stored) {
            const real = sessionFromBackendUser(stored.user, stored.token);
            authService.setActiveSession(real);
            setSession(real);
            setIsAuthenticated(true);
        } else {
            // Demo mode: behave exactly as before (persisted persona or default).
            const persona = demoPersona();
            authService.setActiveSession(persona);
            setSession(persona);
        }
        setHydrated(true);
    }, []);

    const switchRole = React.useCallback((role: keyof typeof PERSONAS) => {
        if (isAuthenticated) return; // personas are demo-only
        const persona = PERSONAS[role];
        if (!persona) return;
        localStorage.setItem(ROLE_KEY, role);
        authService.setActiveSession(persona);
        setSession(persona);
    }, [isAuthenticated]);

    const signIn = React.useCallback((user: BackendUser, token: string) => {
        persistAuth(user, token);
        const real = sessionFromBackendUser(user, token);
        authService.setActiveSession(real);
        setSession(real);
        setIsAuthenticated(true);
        return real;
    }, []);

    const logout = React.useCallback(() => {
        clearStoredAuth();
        const persona = demoPersona();
        authService.setActiveSession(persona);
        setSession(persona);
        setIsAuthenticated(false);
        router.push('/login');
    }, [router]);

    const value = React.useMemo<SessionContextValue>(
        () => ({
            session,
            switchRole,
            availableRoles: Object.keys(PERSONAS) as Array<keyof typeof PERSONAS>,
            hydrated,
            isAuthenticated,
            signIn,
            logout,
        }),
        [session, switchRole, hydrated, isAuthenticated, signIn, logout]
    );

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
    const ctx = React.useContext(SessionContext);
    if (!ctx) throw new Error('useSession must be used within SessionProvider');
    return ctx;
}
