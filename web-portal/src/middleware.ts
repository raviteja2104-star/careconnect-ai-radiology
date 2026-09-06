import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Edge Middleware — navigation guard only.
 *
 * SECURITY MODEL:
 *   This middleware is a UX convenience layer that redirects unauthenticated
 *   or out-of-workspace browsers before they render a page.
 *
 *   It is NOT the security boundary.
 *
 *   The security boundary is the Express backend:
 *     protect()  — verifies the JWT and loads req.user from MongoDB
 *     permit()   — verifies effective permissions via PermissionService
 *     ownership  — controllers verify the resource belongs to req.user
 *
 *   The `cc-workspaces` cookie used below is set by the frontend after a real
 *   backend login, but it is client-readable and must never be treated as
 *   authoritative for access-control decisions.  A user who manipulates it in
 *   DevTools will reach a Next.js page, but every API call that page makes will
 *   be independently rejected with 403 by the backend.
 */

// Routes accessible without a session
const PUBLIC_PATHS = new Set(['/', '/login', '/home', '/business', '/display', '/kiosk']);

// Prefixes that are always allowed through.
const PUBLIC_PREFIXES = ['/api/', '/_next/', '/favicon', '/.well-known/', '/login/'];

/**
 * Map a workspace name to the route prefixes it unlocks.
 *
 * Rules:
 *   - Prefixes must end without a trailing slash; matchesPrefix() appends "/" before
 *     startsWith() to prevent false-prefix matches (e.g. /lab ≠ /lab-reports).
 *   - Patient home is "/" (chromeless, always public). /dashboard is clinical-only.
 *   - DOCTOR and HOSPITAL_STAFF are intentionally absent. Clinical routes not listed
 *     here are unguarded at the middleware layer; AppShell's ROUTE_ACCESS (navigation.ts)
 *     handles clinical-vs-patient separation, and the backend protect()/authorize()
 *     is the authoritative security boundary. This avoids workspace-key mismatches
 *     blocking legitimate clinical navigation (e.g. PHYSICIAN reaching /health-records/dashboard
 *     or /nearby/provider/dashboard).
 *   - PATIENT uses precise sub-paths (not /health-records or /nearby as a parent prefix)
 *     so that /health-records/dashboard (clinical) and /nearby/provider/* (clinical) are
 *     never accidentally caught by PATIENT workspace enforcement.
 */
const WORKSPACE_ROUTES: Record<string, string[]> = {
    PATIENT: [
        '/appointments', '/telemedicine',
        // Use specific health-records sub-paths, NOT the bare /health-records prefix:
        // /health-records/dashboard is CLINICAL_ROLES-only and must not be blocked here.
        '/health-records/capture', '/health-records/caregivers',
        '/health-records/sharing', '/health-records/documents',
        '/medications', '/lab-reports', '/billing',
        // Use specific nearby sub-paths, NOT /nearby itself:
        // /nearby/provider/* is clinical and must not be blocked here.
        '/nearby/search', '/nearby/book', '/nearby/lab-booking', '/nearby/my-appointments',
        '/prescriptions', '/radiology', '/insurance', '/patient',
        '/family', '/reports', '/ai-assistant',
    ],
    RADIOLOGY:      ['/teleradiology'],
    ADMINISTRATION: ['/admin'],
    BILLER:         ['/billing', '/admin/billing'],
};

/** Routes that belong to at least one workspace (checked for access enforcement). */
const WORKSPACE_GUARDED_PREFIXES = Object.values(WORKSPACE_ROUTES).flat();

function matchesPrefix(pathname: string, prefix: string): boolean {
    // Exact match OR path starts with prefix + "/" to prevent /lab matching /lab-reports.
    return pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : prefix + '/');
}

function isWorkspaceGuarded(pathname: string): string | null {
    for (const prefix of WORKSPACE_GUARDED_PREFIXES) {
        if (matchesPrefix(pathname, prefix)) return prefix;
    }
    return null;
}

function userHasWorkspaceFor(pathname: string, workspaces: string[]): boolean {
    for (const [workspace, prefixes] of Object.entries(WORKSPACE_ROUTES)) {
        for (const prefix of prefixes) {
            if (matchesPrefix(pathname, prefix) && workspaces.includes(workspace)) {
                return true;
            }
        }
    }
    return false;
}

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Always allow public paths and infrastructure prefixes
    if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
    for (const prefix of PUBLIC_PREFIXES) {
        if (pathname.startsWith(prefix)) return NextResponse.next();
    }
    // Allow static assets
    if (/\.(ico|png|jpg|jpeg|svg|webp|woff2?|css|js|map)$/.test(pathname)) {
        return NextResponse.next();
    }

    // Require a session cookie for all protected paths
    const hasSession = req.cookies.has('cc-session');
    if (!hasSession) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Workspace enforcement: if the route belongs to a specific workspace,
    // only users whose cc-workspaces cookie lists that workspace may access it.
    const guardedPrefix = isWorkspaceGuarded(pathname);
    if (guardedPrefix) {
        const rawWorkspaces = req.cookies.get('cc-workspaces')?.value ?? '';
        const workspaces = decodeURIComponent(rawWorkspaces).split(',').filter(Boolean);

        // If the workspaces cookie is absent or empty, fall through: the session
        // is valid (cc-session is present) but workspace attribution hasn't been
        // written yet (backend omitted the field, or this is a first render after
        // login before persistAuth fires). The backend protect()/authorize() guards
        // on every API call are the real security boundary — see SECURITY MODEL above.
        if (workspaces.length === 0) {
            return NextResponse.next();
        }

        if (!userHasWorkspaceFor(pathname, workspaces)) {
            return NextResponse.redirect(new URL('/home', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
