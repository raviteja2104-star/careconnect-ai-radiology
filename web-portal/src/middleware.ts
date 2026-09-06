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
 * Must stay in sync with WORKSPACE_ROUTES in backend/src/constants/permissions.js
 */
const WORKSPACE_ROUTES: Record<string, string[]> = {
    PATIENT:        ['/dashboard', '/appointments', '/telemedicine', '/health-records', '/medications', '/lab', '/billing'],
    DOCTOR:         ['/doctor', '/consultations', '/emr'],
    RADIOLOGY:      ['/teleradiology'],
    HOSPITAL_STAFF: ['/reception', '/ems', '/icu', '/bed-management', '/lab-orders'],
    ADMINISTRATION: ['/admin'],
};

/** Routes that belong to at least one workspace (checked for access enforcement). */
const WORKSPACE_GUARDED_PREFIXES = Object.values(WORKSPACE_ROUTES).flat();

function isWorkspaceGuarded(pathname: string): string | null {
    for (const prefix of WORKSPACE_GUARDED_PREFIXES) {
        if (pathname.startsWith(prefix)) return prefix;
    }
    return null;
}

function userHasWorkspaceFor(pathname: string, workspaces: string[]): boolean {
    for (const [workspace, prefixes] of Object.entries(WORKSPACE_ROUTES)) {
        for (const prefix of prefixes) {
            if (pathname.startsWith(prefix) && workspaces.includes(workspace)) {
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

        // If the cookie is present but empty, the backend hasn't granted any
        // workspaces yet — redirect to the home page instead of /login.
        if (workspaces.length === 0) {
            return NextResponse.redirect(new URL('/home', req.url));
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
