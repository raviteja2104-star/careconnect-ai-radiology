'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    authService, PERSONAS, sessionFromBackendUser, readStoredAuth, persistAuth, clearStoredAuth,
    refreshAccessToken, AUTH_API_BASE, TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY,
    type AuthUserSession, type BackendUser,
} from '@/services/authService';

const ROLE_KEY = 'cc-active-role';
const DEMO_STARTED_KEY = 'cc-demo-started';
const DEMO_SESSION_MAX_MS = 8 * 60 * 60 * 1000; // 8 h

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
    signIn: (user: BackendUser, token: string, permissions?: string[], workspaces?: string[], refreshToken?: string) => AuthUserSession;
    /** Clear the JWT + stored user, fall back to the demo persona, go to /login. */
    logout: () => void;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

/** The demo persona the app falls back to when no JWT is present.
 *  Clears the stored role after DEMO_SESSION_MAX_MS so stale sessions
 *  don't persist across browser restarts indefinitely. */
function demoPersona(): AuthUserSession {
    try {
        const startedAt = localStorage.getItem(DEMO_STARTED_KEY);
        if (startedAt && Date.now() - Number(startedAt) > DEMO_SESSION_MAX_MS) {
            localStorage.removeItem(ROLE_KEY);
            localStorage.removeItem(DEMO_STARTED_KEY);
            return authService.getCurrentSession();
        }
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
            const real = sessionFromBackendUser(stored.user, stored.token, stored.permissions, stored.workspaces);
            authService.setActiveSession(real);
            // eslint-disable-next-line react-hooks/set-state-in-effect
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
        try {
            localStorage.setItem(ROLE_KEY, role);
            if (!localStorage.getItem(DEMO_STARTED_KEY)) {
                localStorage.setItem(DEMO_STARTED_KEY, String(Date.now()));
            }
        } catch { /* storage unavailable */ }
        authService.setActiveSession(persona);
        setSession(persona);
    }, [isAuthenticated]);

    const signIn = React.useCallback((user: BackendUser, token: string, permissions?: string[], workspaces?: string[], refreshToken?: string) => {
        persistAuth(user, token, workspaces, permissions, refreshToken);
        const real = sessionFromBackendUser(user, token, permissions, workspaces);
        authService.setActiveSession(real);
        setSession(real);
        setIsAuthenticated(true);
        return real;
    }, []);

    const logout = React.useCallback(() => {
        // Best-effort: invalidate the refresh token on the backend
        try {
            const jwt = window.localStorage.getItem(TOKEN_STORAGE_KEY);
            if (jwt) {
                fetch(`${AUTH_API_BASE}/api/auth/logout`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${jwt}` },
                }).catch(() => {});
            }
        } catch { /* ignore */ }
        clearStoredAuth();
        try {
            localStorage.removeItem(ROLE_KEY);
            localStorage.removeItem(DEMO_STARTED_KEY);
            localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
        } catch { /* storage unavailable */ }
        const persona = demoPersona();
        authService.setActiveSession(persona);
        setSession(persona);
        setIsAuthenticated(false);
        const role = session.role;
        router.push(role === 'PATIENT' ? '/' : '/login?reason=logged_out');
    }, [router, session.role]);

    // Proactive token refresh — schedule 5 minutes before JWT expiry
    React.useEffect(() => {
        if (!isAuthenticated) return;
        let timer: ReturnType<typeof setTimeout>;
        try {
            const jwt = window.localStorage.getItem(TOKEN_STORAGE_KEY);
            if (!jwt) return;
            const b64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const { exp } = JSON.parse(atob(b64)) as { exp?: number };
            if (!exp) return;
            const delay = exp * 1000 - 5 * 60 * 1000 - Date.now();
            const doRefresh = () => {
                refreshAccessToken().then(result => {
                    if (!result) { logout(); return; }
                    const stored = readStoredAuth();
                    if (!stored) return;
                    const newSess = sessionFromBackendUser(stored.user, result.token, stored.permissions, stored.workspaces);
                    authService.setActiveSession(newSess);
                    setSession(newSess);
                });
            };
            if (delay <= 0) { doRefresh(); return; }
            timer = setTimeout(doRefresh, delay);
        } catch { /* ignore JWT parse errors */ }
        return () => clearTimeout(timer);
    }, [isAuthenticated, logout]);

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
