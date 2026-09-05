import { NextRequest, NextResponse } from 'next/server';

// Routes accessible without a session
const PUBLIC_PATHS = new Set(['/', '/login', '/home', '/business', '/display', '/kiosk']);

// Prefixes that are always allowed through
const PUBLIC_PREFIXES = ['/api/', '/_next/', '/favicon', '/.well-known/'];

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

    // Check for session cookie (set by persistAuth after login)
    const hasSession = req.cookies.has('cc-session');
    if (!hasSession) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    // Run on all paths except Next.js internals
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
