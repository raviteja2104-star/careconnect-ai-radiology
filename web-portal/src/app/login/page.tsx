'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    HeartPulse, Mail, Lock, Phone, User, ShieldCheck, Activity, Scan, Sparkles, ArrowRight, Eye, EyeOff,
} from 'lucide-react';
import {
    Button, Input, Label, FieldHint, Select, Tabs, TabsList, TabsTrigger, TabsContent, Badge,
} from '@/components/ui';
import { useSession } from '@/components/providers/SessionProvider';
import { homeForRole } from '@/lib/navigation';
import {
    loginWithPassword, registerAccount, mapBackendRole, AuthApiError, type BackendRole,
} from '@/services/authService';

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

export default function LoginPage() {
    const router = useRouter();
    const { signIn } = useSession();
    const [tab, setTab] = React.useState('login');

    // Sign in state
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [loginErrors, setLoginErrors] = React.useState<FieldErrors>({});
    const [loggingIn, setLoggingIn] = React.useState(false);

    // Register state
    const [regName, setRegName] = React.useState('');
    const [regEmail, setRegEmail] = React.useState('');
    const [regPhone, setRegPhone] = React.useState('');
    const [regPassword, setRegPassword] = React.useState('');
    const [regRole, setRegRole] = React.useState<BackendRole>('patient');
    const [regErrors, setRegErrors] = React.useState<FieldErrors>({});
    const [registering, setRegistering] = React.useState(false);

    const finishAuth = React.useCallback(
        (user: Parameters<typeof signIn>[0], token: string) => {
            signIn(user, token);
            router.push(homeForRole(mapBackendRole(user.role)));
        },
        [signIn, router]
    );

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: FieldErrors = {};
        if (!email.trim()) errors.email = 'Email is required.';
        else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Enter a valid email address.';
        if (!password) errors.password = 'Password is required.';
        setLoginErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setLoggingIn(true);
        try {
            const { user, token } = await loginWithPassword(email.trim(), password);
            finishAuth(user, token);
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
                role: regRole,
            });
            finishAuth(user, token);
        } catch (err) {
            setRegErrors({ form: err instanceof AuthApiError ? err.message : 'Something went wrong. Please try again.' });
            setRegistering(false);
        }
    };

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
                        <p className="text-xs text-white/70">Healthcare Operating System</p>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="relative max-w-lg"
                >
                    <h1 className="text-4xl font-bold leading-tight tracking-tight">
                        Every workspace your hospital runs on. One sign-in.
                    </h1>
                    <p className="mt-4 text-white/80">
                        Patients, clinicians, radiologists and administrators — each lands in a
                        purpose-built workspace the moment they sign in.
                    </p>
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
                    Apollo CareConnect Super Specialty · HIPAA &amp; NDHM aligned · TLS 1.3
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
                    {/* Mobile brand */}
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <div className="gradient-brand flex h-10 w-10 items-center justify-center rounded-xl shadow-soft">
                            <HeartPulse className="h-5 w-5 text-white" aria-hidden />
                        </div>
                        <div>
                            <p className="text-base font-bold tracking-tight text-foreground">CareConnect</p>
                            <p className="text-xs text-muted-foreground">Healthcare Operating System</p>
                        </div>
                    </div>

                    <div className="glass-card rounded-3xl border border-border bg-card/80 p-6 shadow-float sm:p-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Sign in to your workspace, or create a patient account.
                            </p>
                        </div>

                        <Tabs value={tab} onValueChange={setTab}>
                            <TabsList className="mb-6 grid w-full grid-cols-2">
                                <TabsTrigger value="login">Sign in</TabsTrigger>
                                <TabsTrigger value="register">Create account</TabsTrigger>
                            </TabsList>

                            <TabsContent value="login">
                                <form onSubmit={handleLogin} noValidate className="space-y-4">
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
                                        Sign in
                                        <ArrowRight className="h-4 w-4" aria-hidden />
                                    </Button>
                                </form>
                            </TabsContent>

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
                                    <div>
                                        <Label htmlFor="reg-role">Account type</Label>
                                        <Select
                                            id="reg-role"
                                            value={regRole}
                                            onChange={(e) => setRegRole(e.target.value as BackendRole)}
                                        >
                                            <option value="patient">Patient</option>
                                        </Select>
                                        <FieldHint>Staff accounts are provisioned by your hospital administrator.</FieldHint>
                                    </div>
                                    <Button type="submit" className="w-full" size="lg" loading={registering}>
                                        Create account
                                        <ArrowRight className="h-4 w-4" aria-hidden />
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>

                        <div className="my-6 flex items-center gap-3" aria-hidden>
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs font-medium uppercase tracking-widest text-subtle-foreground">or</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
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
