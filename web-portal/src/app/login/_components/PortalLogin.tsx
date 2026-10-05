'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    HeartPulse, Mail, Lock, Phone, User, ShieldCheck, Activity, Scan, Sparkles,
    ArrowRight, ArrowLeft, Eye, EyeOff,
} from 'lucide-react';
import {
    Button, Input, Label, FieldHint, Select, Tabs, TabsList, TabsTrigger, TabsContent, Badge,
} from '@/components/ui';
import { useSession } from '@/components/providers/SessionProvider';
import { homeForRole } from '@/lib/navigation';
import {
    loginWithPassword, registerAccount, googleSignIn, mapBackendRole, AuthApiError, DEMO_USER_SESSION, type BackendRole,
} from '@/services/authService';
import { portalForRole, type LoginPortal } from '../_lib/portals';

const PITCH_POINTS = [
    { icon: Activity, title: 'One record, every touchpoint', text: 'EMR, labs, pharmacy, billing and telemedicine on a single longitudinal patient record.' },
    { icon: Scan, title: 'Teleradiology built in', text: 'AI-triaged worklists with SLA tracking, structured reporting and critical-finding alerts.' },
    { icon: ShieldCheck, title: 'Enterprise-grade security', text: 'JWT sessions, role-based access and tenant isolation across every workspace.' },
];

interface FieldErrors {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
    form?: string;
}

/** Wrong-door error rendered with a link to the user's actual portal. */
interface WrongPortal {
    portal: LoginPortal;
}

export function PortalLogin({ portal }: { portal: LoginPortal }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signIn } = useSession();
    const [tab, setTab] = React.useState('login');

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [loginErrors, setLoginErrors] = React.useState<FieldErrors>({});
    const [wrongPortal, setWrongPortal] = React.useState<WrongPortal | null>(null);
    const [loggingIn, setLoggingIn] = React.useState(false);

    const [regName, setRegName] = React.useState('');
    const [regEmail, setRegEmail] = React.useState('');
    const [regPhone, setRegPhone] = React.useState('');
    const [regPassword, setRegPassword] = React.useState('');
    const [regErrors, setRegErrors] = React.useState<FieldErrors>({});
    const [registering, setRegistering] = React.useState(false);
    const [googleLoading, setGoogleLoading] = React.useState(false);
    const [pendingApproval, setPendingApproval] = React.useState<string | null>(null);

    // Load Google Identity Services script once
    React.useEffect(() => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId || document.getElementById('google-gsi-script')) return;
        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }, []);

    const finishAuth = React.useCallback(
        (user: Parameters<typeof signIn>[0], token: string, permissions?: string[], workspaces?: string[]) => {
            signIn(user, token, permissions, workspaces);
            const next = searchParams.get('next');
            // Validate next: must be an internal path, not another login page
            const destination =
                next && next.startsWith('/') && !next.startsWith('/login')
                    ? next
                    : homeForRole(mapBackendRole(user.role));
            router.push(destination);
        },
        [signIn, router, searchParams]
    );

    const handleGoogleSignIn = React.useCallback(() => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
            setLoginErrors({ form: 'Google Sign-In is not configured. Contact your administrator.' });
            return;
        }
        setGoogleLoading(true);
        setPendingApproval(null);
        setLoginErrors({});

        // Use Google Identity Services one-tap / popup
        const google = (window as typeof window & { google?: { accounts: { id: { initialize: (c: object) => void; prompt: () => void } } } }).google;
        if (!google?.accounts?.id) {
            setLoginErrors({ form: 'Google Sign-In failed to load. Please refresh and try again.' });
            setGoogleLoading(false);
            return;
        }

        google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: { credential: string }) => {
                try {
                    // Pass the portal's primary role so backend can set the right role
                    const role = portal.roles[0] as BackendRole;
                    const result = await googleSignIn(response.credential, role);
                    if ('pendingApproval' in result && result.pendingApproval) {
                        setPendingApproval(result.message);
                        setGoogleLoading(false);
                        return;
                    }
                    const authResult = result as Awaited<ReturnType<typeof loginWithPassword>>;
                    // Portal role check
                    if (authResult.user && !portal.roles.includes(authResult.user.role as BackendRole)) {
                        const { portalForRole } = await import('../_lib/portals');
                        setWrongPortal({ portal: portalForRole(authResult.user.role as BackendRole) });
                        setGoogleLoading(false);
                        return;
                    }
                    finishAuth(authResult.user!, authResult.token!, authResult.permissions, authResult.workspaces);
                } catch (err) {
                    setLoginErrors({ form: err instanceof AuthApiError ? err.message : 'Google Sign-In failed. Please try again.' });
                    setGoogleLoading(false);
                }
            },
        });
        google.accounts.id.prompt();
    }, [portal, finishAuth]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: FieldErrors = {};
        if (!email.trim()) errors.email = 'Email is required.';
        else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Enter a valid email address.';
        if (!password) errors.password = 'Password is required.';
        setLoginErrors(errors);
        setWrongPortal(null);
        if (Object.keys(errors).length > 0) return;

        setLoggingIn(true);
        try {
            const { user, token, permissions, workspaces } = await loginWithPassword(email.trim(), password);
            // Portal separation: only roles this door serves may pass. The
            // credentials were valid — we simply do not start the session here.
            if (!portal.roles.includes(user.role as BackendRole)) {
                setWrongPortal({ portal: portalForRole(user.role as BackendRole) });
                setLoggingIn(false);
                return;
            }
            finishAuth(user, token, permissions, workspaces);
        } catch (err) {
            setLoginErrors({ form: err instanceof AuthApiError ? err.message : 'Something went wrong. Please try again.' });
            setLoggingIn(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: FieldErrors = {};
        if (!regName.trim()) errors.name = 'Your name is required.';
        if (!regEmail.trim()) errors.email = 'Email is required.';
        else if (!/\S+@\S+\.\S+/.test(regEmail)) errors.email = 'Enter a valid email address.';
        if (!regPhone.trim()) errors.phone = 'Phone number is required.';
        if (!regPassword) errors.password = 'Password is required.';
        else if (regPassword.length < 6) errors.password = 'Password must be at least 6 characters.';
        setRegErrors(errors);
        if (Object.keys(errors).length > 0) return;

        const [firstName, ...rest] = regName.trim().split(/\s+/);
        setRegistering(true);
        try {
            const { user, token } = await registerAccount({
                firstName,
                lastName: rest.join(' ') || firstName,
                email: regEmail.trim(),
                phone: regPhone.trim(),
                password: regPassword,
                role: 'patient' as BackendRole,
            });
            finishAuth(user, token);
        } catch (err) {
            setRegErrors({ form: err instanceof AuthApiError ? err.message : 'Something went wrong. Please try again.' });
            setRegistering(false);
        }
    };

    const PortalIcon = portal.icon;

    return (
        <div className="flex min-h-screen gradient-surface">
            {/* Brand panel */}
            <div className="relative hidden w-1/2 overflow-hidden gradient-brand lg:flex lg:flex-col lg:justify-between p-12 text-white">
                <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
                <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-black/10 blur-3xl" />

                <div className="relative flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 shadow-soft backdrop-blur">
                        <HeartPulse className="h-6 w-6" aria-hidden />
                    </div>
                    <div>
                        <p className="text-lg font-bold tracking-tight">CareConnect</p>
                        <p className="text-xs text-white/70">{portal.name}</p>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="relative max-w-lg"
                >
                    <Badge tone="neutral" className="bg-white/15 text-white">
                        <PortalIcon className="h-3.5 w-3.5" aria-hidden /> {portal.audience}
                    </Badge>
                    <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">{portal.headline}</h1>
                    <p className="mt-4 text-white/80">{portal.sub}</p>
                    <div className="mt-10 space-y-6">
                        {PITCH_POINTS.map((p, i) => (
                            <motion.div
                                key={p.title}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                                className="flex items-start gap-4"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                                    <p.icon className="h-5 w-5" aria-hidden />
                                </div>
                                <div>
                                    <p className="font-semibold">{p.title}</p>
                                    <p className="mt-0.5 text-sm text-white/75">{p.text}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <p className="relative text-xs text-white/60">
                    CareConnect · HIPAA &amp; NDHM aligned · TLS 1.3
                </p>
            </div>

            {/* Form column */}
            <div className="flex w-full items-center justify-center px-4 py-10 sm:px-8 lg:w-1/2">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-md"
                >
                    <Link
                        href="/login"
                        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden /> All sign-in portals
                    </Link>

                    <div className="glass-card rounded-3xl border border-border bg-card/80 p-6 shadow-float sm:p-8">
                        <div className="mb-6 flex items-start gap-4">
                            <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${portal.tile}`}>
                                <PortalIcon className="h-6 w-6" aria-hidden />
                            </span>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-foreground">{portal.name}</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Sign-in for {portal.audience.toLowerCase()}.
                                </p>
                            </div>
                        </div>

                        <Tabs value={tab} onValueChange={setTab}>
                            {portal.allowRegister && (
                                <TabsList className="mb-6 grid w-full grid-cols-2">
                                    <TabsTrigger value="login">Sign in</TabsTrigger>
                                    <TabsTrigger value="register">Create account</TabsTrigger>
                                </TabsList>
                            )}

                            <TabsContent value="login">
                                <form onSubmit={handleLogin} noValidate className="space-y-4">
                                    {wrongPortal && (
                                        <div role="alert" className="rounded-xl border border-warning/40 bg-warning-soft px-3.5 py-3 text-sm text-warning">
                                            This account belongs to the <strong>{wrongPortal.portal.name}</strong>.{' '}
                                            <Link href={`/login/${wrongPortal.portal.id}`} className="font-semibold underline underline-offset-2">
                                                Sign in there instead →
                                            </Link>
                                        </div>
                                    )}
                                    {loginErrors.form && (
                                        <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
                                            {loginErrors.form}
                                        </div>
                                    )}
                                    <div>
                                        <Label htmlFor="login-email">Email</Label>
                                        <Input
                                            id="login-email"
                                            type="email"
                                            autoComplete="email"
                                            icon={<Mail aria-hidden />}
                                            placeholder="you@hospital.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            error={Boolean(loginErrors.email)}
                                        />
                                        {loginErrors.email && <FieldHint error>{loginErrors.email}</FieldHint>}
                                    </div>
                                    <div>
                                        <Label htmlFor="login-password">Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="login-password"
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="current-password"
                                                icon={<Lock aria-hidden />}
                                                placeholder="••••••••"
                                                className="pr-11"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                error={Boolean(loginErrors.password)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((s) => !s)}
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-subtle-foreground transition-colors hover:text-foreground"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {loginErrors.password && <FieldHint error>{loginErrors.password}</FieldHint>}
                                    </div>
                                    <Button type="submit" className="w-full" size="lg" loading={loggingIn}>
                                        Sign in to {portal.name}
                                        <ArrowRight className="h-4 w-4" aria-hidden />
                                    </Button>
                                    {!portal.allowRegister && (
                                        <p className="text-center text-xs text-muted-foreground">
                                            Accounts for this portal are provisioned by your hospital administrator.
                                        </p>
                                    )}
                                </form>
                            </TabsContent>

                            {portal.allowRegister && (
                                <TabsContent value="register">
                                    <form onSubmit={handleRegister} noValidate className="space-y-4">
                                        {regErrors.form && (
                                            <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
                                                {regErrors.form}
                                            </div>
                                        )}
                                        <div>
                                            <Label htmlFor="reg-name">Full name</Label>
                                            <Input
                                                id="reg-name"
                                                autoComplete="name"
                                                icon={<User aria-hidden />}
                                                placeholder="Aarav Sharma"
                                                value={regName}
                                                onChange={(e) => setRegName(e.target.value)}
                                                error={Boolean(regErrors.name)}
                                            />
                                            {regErrors.name && <FieldHint error>{regErrors.name}</FieldHint>}
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <Label htmlFor="reg-email">Email</Label>
                                                <Input
                                                    id="reg-email"
                                                    type="email"
                                                    autoComplete="email"
                                                    icon={<Mail aria-hidden />}
                                                    placeholder="you@example.com"
                                                    value={regEmail}
                                                    onChange={(e) => setRegEmail(e.target.value)}
                                                    error={Boolean(regErrors.email)}
                                                />
                                                {regErrors.email && <FieldHint error>{regErrors.email}</FieldHint>}
                                            </div>
                                            <div>
                                                <Label htmlFor="reg-phone">Phone</Label>
                                                <Input
                                                    id="reg-phone"
                                                    type="tel"
                                                    autoComplete="tel"
                                                    icon={<Phone aria-hidden />}
                                                    placeholder="+91 98765 43210"
                                                    value={regPhone}
                                                    onChange={(e) => setRegPhone(e.target.value)}
                                                    error={Boolean(regErrors.phone)}
                                                />
                                                {regErrors.phone && <FieldHint error>{regErrors.phone}</FieldHint>}
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="reg-password">Password</Label>
                                            <Input
                                                id="reg-password"
                                                type="password"
                                                autoComplete="new-password"
                                                icon={<Lock aria-hidden />}
                                                placeholder="At least 6 characters"
                                                value={regPassword}
                                                onChange={(e) => setRegPassword(e.target.value)}
                                                error={Boolean(regErrors.password)}
                                            />
                                            {regErrors.password && <FieldHint error>{regErrors.password}</FieldHint>}
                                        </div>
                                        <FieldHint>Patient accounts only — staff access is provisioned by your hospital administrator.</FieldHint>
                                        <Button type="submit" className="w-full" size="lg" loading={registering}>
                                            Create patient account
                                            <ArrowRight className="h-4 w-4" aria-hidden />
                                        </Button>
                                    </form>
                                </TabsContent>
                            )}
                        </Tabs>

                        {pendingApproval && (
                            <div role="alert" className="mt-4 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning">
                                <p className="font-semibold">Account pending approval</p>
                                <p className="mt-0.5 text-warning/80">{pendingApproval}</p>
                            </div>
                        )}

                        <div className="my-6 flex items-center gap-3" aria-hidden>
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs font-medium uppercase tracking-widest text-subtle-foreground">or</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                            <>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleGoogleSignIn}
                                    loading={googleLoading}
                                    disabled={googleLoading}
                                >
                                    {/* Google "G" logo */}
                                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    Continue with Google
                                </Button>
                                <div className="my-4 flex items-center gap-3" aria-hidden>
                                    <div className="h-px flex-1 bg-border" />
                                    <span className="text-xs font-medium uppercase tracking-widest text-subtle-foreground">or</span>
                                    <div className="h-px flex-1 bg-border" />
                                </div>
                            </>
                        )}

                        <Button variant="outline" className="w-full" onClick={() => {
                            signIn(
                                { _id: DEMO_USER_SESSION.userId, role: 'admin', email: DEMO_USER_SESSION.email },
                                DEMO_USER_SESSION.accessToken,
                                DEMO_USER_SESSION.permissions,
                                DEMO_USER_SESSION.workspaces,
                            );
                            const next = searchParams.get('next');
                            const dest = next && next.startsWith('/') && !next.startsWith('/login') ? next : '/';
                            router.push(dest);
                        }}>
                            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                            Continue in demo mode
                        </Button>
                        <p className="mt-3 text-center text-xs text-muted-foreground">
                            Explore every workspace with realistic sample data — no account needed.
                        </p>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-2">
                        <Badge tone="outline" dot>
                            Secured with JWT · Role-based access
                        </Badge>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
