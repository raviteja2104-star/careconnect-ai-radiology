'use client';

/**
 * Admin audit-log API client — hits GET /api/admin/audit-logs (paginated, filterable).
 * Falls back to a clearly-labeled demo dataset when the backend is unreachable or
 * the caller is unauthenticated. Follows the { data, demo } convention used
 * throughout the CareConnect frontend.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

/* ────────────────────────────── Types ────────────────────────────── */

export interface AuditActor {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
}

export interface AuditLogEntry {
    _id: string;
    seq?: number;
    userId?: AuditActor | string | null;
    userRole?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    ip?: string;
    traceId?: string;
    requestBody?: Record<string, unknown>;
    responseCode?: number;
    durationMs?: number;
    at: string;
    success?: boolean;
}

export interface AuditLogPage {
    entries: AuditLogEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface WithDemo<T> {
    data: T;
    demo: boolean;
}

export interface AuditLogParams {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
}

/* ─────────────────────────── Fetch plumbing ───────────────────────── */

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage.getItem('token');
    } catch {
        return null;
    }
}

class ApiOfflineError extends Error {
    constructor(message = 'Backend unreachable') {
        super(message);
        this.name = 'ApiOfflineError';
    }
}

async function request<T>(path: string, timeoutMs = 8000): Promise<T> {
    const token = getToken();
    if (!token) throw new ApiOfflineError('Unauthenticated');
    let res: Response;
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        res = await fetch(`${API_BASE}${path}`, {
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        clearTimeout(timer);
    } catch {
        throw new ApiOfflineError();
    }
    if (!res.ok) throw new ApiOfflineError(`Request failed (${res.status})`);
    return res.json() as Promise<T>;
}

/* ─────────────────────────── Demo dataset ─────────────────────────── */

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

function demoEntry(
    id: number,
    action: string,
    resource: string,
    role: string,
    firstName: string,
    lastName: string,
    statusCode: number,
    at: string,
    resourceId?: string,
    durationMs?: number,
): AuditLogEntry {
    return {
        _id: `demo-al-${id}`,
        seq: id,
        userId: { _id: `demo-u-${id}`, firstName, lastName, role, email: `${firstName.toLowerCase()}@careconnect.dev` },
        userRole: role,
        action,
        resource,
        resourceId,
        method: action === 'READ' ? 'GET' : action === 'CREATE' ? 'POST' : action === 'DELETE' ? 'DELETE' : 'PUT',
        path: `/api/${resource?.toLowerCase() ?? ''}${resourceId ? `/${resourceId}` : ''}`,
        statusCode,
        ip: '10.0.4.12',
        traceId: `demo-trace-${String(id).padStart(4, '0')}`,
        requestBody: action !== 'READ' ? { _note: 'demo request payload' } : undefined,
        responseCode: statusCode,
        durationMs: durationMs ?? Math.floor(Math.random() * 200 + 20),
        at,
        success: statusCode < 400,
    };
}

export const DEMO_ENTRIES: AuditLogEntry[] = [
    demoEntry(10, 'READ',   'emr',          'doctor',      'Raj',   'Sharma',   200, hoursAgo(0.1), 'pat-88231', 42),
    demoEntry(9,  'SIGN',   'emr',          'doctor',      'Raj',   'Sharma',   200, hoursAgo(0.5), 'note-5521', 88),
    demoEntry(8,  'CREATE', 'emr',          'doctor',      'Anita', 'Desai',    201, hoursAgo(1),   'enc-9002',  115),
    demoEntry(7,  'UPDATE', 'teleradiology','radiologist', 'Meera', 'Reddy',    200, hoursAgo(2),   'study-3310',67),
    demoEntry(6,  'READ',   'billing',      'admin',       'Admin', 'User',     200, hoursAgo(3),   undefined,   31),
    demoEntry(5,  'CREATE', 'consent',      'doctor',      'Anita', 'Desai',    201, hoursAgo(5),   'cons-102',  93),
    demoEntry(4,  'LOGIN',  'auth',         'patient',     'Ravi',  'Teja',     200, hoursAgo(8),   undefined,   210),
    demoEntry(3,  'READ',   'patient',      'patient',     'Ravi',  'Teja',     200, hoursAgo(9),   'pat-88231', 28),
    demoEntry(2,  'READ',   'teleradiology','radiologist', 'Arjun', 'Nair',     403, hoursAgo(12),  'study-3308',14),
    demoEntry(1,  'CREATE', 'emr',          'doctor',      'Raj',   'Sharma',   201, hoursAgo(24),  'enc-9001',  102),
];

/* ───────────────────────── API function ──────────────────────────── */

interface BackendResponse {
    success: boolean;
    data?: AuditLogEntry[];
    entries?: AuditLogEntry[];
    total?: number;
    page?: number;
    limit?: number;
}

export async function fetchAuditLogs(params?: AuditLogParams): Promise<WithDemo<AuditLogPage>> {
    const qs = new URLSearchParams();
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    qs.set('page', String(page));
    qs.set('limit', String(limit));
    if (params?.userId) qs.set('userId', params.userId);
    if (params?.action) qs.set('action', params.action);
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);

    try {
        const res = await request<BackendResponse>(`/api/admin/audit-logs?${qs.toString()}`);
        const entries = res.data ?? res.entries ?? [];
        const total = res.total ?? entries.length;
        return {
            data: { entries, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
            demo: false,
        };
    } catch (err) {
        if (err instanceof ApiOfflineError) {
            // Apply client-side filters on demo data so the UI stays interactive.
            let entries = DEMO_ENTRIES;
            if (params?.action) entries = entries.filter((e) => e.action === params.action);
            if (params?.userId) {
                const q = params.userId.toLowerCase();
                entries = entries.filter((e) => {
                    const u = e.userId;
                    if (!u || typeof u === 'string') return false;
                    return [u.firstName, u.lastName, u.email, u._id].filter(Boolean)
                        .some((s) => String(s).toLowerCase().includes(q));
                });
            }
            if (params?.from) {
                const from = new Date(params.from).getTime();
                entries = entries.filter((e) => new Date(e.at).getTime() >= from);
            }
            if (params?.to) {
                const to = new Date(params.to).getTime();
                entries = entries.filter((e) => new Date(e.at).getTime() <= to);
            }
            const total = entries.length;
            const start = (page - 1) * limit;
            const paged = entries.slice(start, start + limit);
            return {
                data: { entries: paged, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
                demo: true,
            };
        }
        throw err;
    }
}

/* ─────────────────────────── Utils ────────────────────────────── */

export function actorName(entry: AuditLogEntry): string {
    const u = entry.userId;
    if (u && typeof u === 'object') {
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
        if (name) return name;
        if (u.email) return u.email;
    }
    return entry.userRole ? `(${entry.userRole})` : 'Unknown';
}

export function actorId(entry: AuditLogEntry): string {
    const u = entry.userId;
    if (u && typeof u === 'object') return u._id;
    return u ? String(u) : '—';
}

export function formatWhen(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return (
        d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' · ' +
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
}
