'use client';

/**
 * Audit-log API client — talks to the real backend at http://localhost:5000
 * (GET /api/audit and /api/audit/verify) and degrades gracefully to a clearly
 * labeled demo dataset when the backend is unreachable or the caller is
 * unauthenticated. Follows the same `{ data, demo }` convention as
 * src/app/emr/_lib/api.ts.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

/* ────────────────────────────── Types ────────────────────────────── */

export interface AuditActor {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
}

export interface AuditEntry {
    _id: string;
    seq: number;
    actorId?: AuditActor | string | null;
    actorRole?: string;
    action: string;
    resource: string;
    resourceId?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    ip?: string;
    traceId?: string;
    tenantId?: string;
    at: string;
    prevHash: string;
    hash: string;
}

export interface AuditListResult {
    entries: AuditEntry[];
    total: number;
    page: number;
    limit: number;
}

export interface VerifyResult {
    valid: boolean;
    checkedCount: number;
    firstBrokenSeq: number | null;
}

export interface WithDemo<T> {
    data: T;
    demo: boolean;
}

export interface AuditFilters {
    action?: string;
    resource?: string;
    actorId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

/* ─────────────────────────── Fetch plumbing ───────────────────────── */

export function getToken(): string | null {
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

async function request<T>(path: string, timeoutMs = 5000): Promise<T> {
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
    // 401/403 (expired token or non-admin role) degrade to demo data — this is
    // a read-only viewer, so no forced re-login here.
    if (!res.ok) throw new ApiOfflineError(`Request failed (${res.status})`);
    return res.json() as Promise<T>;
}

/* ─────────────────────────── Demo dataset ─────────────────────────── */
/** Placeholder hashes — clearly NOT real sha256 chain values. */

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

const demoEntry = (
    seq: number,
    action: string,
    resource: string,
    role: string,
    name: string,
    statusCode: number,
    at: string,
    resourceId?: string,
): AuditEntry => ({
    _id: `demo-${seq}`,
    seq,
    actorId: { _id: `demo-actor-${role}`, firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' '), role },
    actorRole: role,
    action,
    resource,
    resourceId,
    method: action === 'READ' ? 'GET' : 'POST',
    path: `/api/${resource.toLowerCase()}`,
    statusCode,
    ip: '10.0.4.12',
    traceId: `demo-trace-${seq.toString().padStart(4, '0')}`,
    tenantId: 't-default',
    at,
    prevHash: seq === 1 ? 'GENESIS' : `demo-placeholder-hash-${seq - 1}`,
    hash: `demo-placeholder-hash-${seq}`,
});

export const DEMO_AUDIT_ENTRIES: AuditEntry[] = [
    demoEntry(8, 'READ', 'EMR', 'doctor', 'Raj Sharma', 200, hoursAgo(0.2), 'pat-88231'),
    demoEntry(7, 'SIGN', 'EMR', 'doctor', 'Raj Sharma', 200, hoursAgo(1), 'note-5521'),
    demoEntry(6, 'UPDATE', 'Teleradiology', 'radiologist', 'Meera Reddy', 200, hoursAgo(2), 'study-3310'),
    demoEntry(5, 'READ', 'Billing', 'admin', 'Admin CareConnect', 200, hoursAgo(3)),
    demoEntry(4, 'CREATE', 'Consent', 'doctor', 'Anita Desai', 201, hoursAgo(5), 'cons-102'),
    demoEntry(3, 'READ', 'Patient', 'patient', 'Ravi Teja', 200, hoursAgo(8), 'pat-88231'),
    demoEntry(2, 'READ', 'Teleradiology', 'radiologist', 'Arjun Nair', 403, hoursAgo(12), 'study-3308'),
    demoEntry(1, 'CREATE', 'EMR', 'doctor', 'Raj Sharma', 201, hoursAgo(24), 'enc-9001'),
];

const DEMO_LIST: AuditListResult = {
    entries: DEMO_AUDIT_ENTRIES,
    total: DEMO_AUDIT_ENTRIES.length,
    page: 1,
    limit: 25,
};

const DEMO_VERIFY: VerifyResult = {
    valid: true,
    checkedCount: DEMO_AUDIT_ENTRIES.length,
    firstBrokenSeq: null,
};

/* ───────────────────────── Reads (with fallback) ──────────────────── */

interface BackendListResponse {
    success: boolean;
    data: AuditEntry[];
    page: number;
    limit: number;
    total: number;
}

export async function fetchAuditLogs(filters: AuditFilters = {}): Promise<WithDemo<AuditListResult>> {
    const params = new URLSearchParams();
    if (filters.action) params.set('action', filters.action);
    if (filters.resource) params.set('resource', filters.resource);
    if (filters.actorId) params.set('actorId', filters.actorId);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    params.set('page', String(filters.page || 1));
    params.set('limit', String(filters.limit || 25));

    try {
        const res = await request<BackendListResponse>(`/api/audit?${params.toString()}`);
        return {
            data: { entries: res.data || [], total: res.total || 0, page: res.page || 1, limit: res.limit || 25 },
            demo: false,
        };
    } catch (err) {
        if (err instanceof ApiOfflineError) {
            // Apply the filters locally so the demo view stays interactive.
            let entries = DEMO_AUDIT_ENTRIES;
            if (filters.action) entries = entries.filter((e) => e.action === filters.action);
            if (filters.resource) entries = entries.filter((e) => e.resource === filters.resource);
            return { data: { ...DEMO_LIST, entries, total: entries.length }, demo: true };
        }
        throw err;
    }
}

export async function verifyChain(): Promise<WithDemo<VerifyResult>> {
    try {
        const res = await request<VerifyResult & { success: boolean }>('/api/audit/verify', 30_000);
        return {
            data: { valid: !!res.valid, checkedCount: res.checkedCount || 0, firstBrokenSeq: res.firstBrokenSeq ?? null },
            demo: false,
        };
    } catch (err) {
        if (err instanceof ApiOfflineError) return { data: DEMO_VERIFY, demo: true };
        throw err;
    }
}

/* ─────────────────────────────── Utils ────────────────────────────── */

export function actorName(entry: AuditEntry): string {
    const a = entry.actorId;
    if (a && typeof a === 'object') {
        const name = [a.firstName, a.lastName].filter(Boolean).join(' ');
        if (name) return name;
        if (a.email) return a.email;
    }
    return entry.actorRole ? `(${entry.actorRole})` : 'Unknown';
}

export function actorIdOf(entry: AuditEntry): string {
    const a = entry.actorId;
    if (a && typeof a === 'object') return a._id;
    return a ? String(a) : '—';
}

export function formatWhen(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
