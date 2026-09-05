'use client';

/**
 * Nearby — Provider Directory Admin API client. Talks to the CareConnect
 * Nearby backend at https://api.careconnect.care/api/nearby (admin-only surface)
 * and degrades gracefully to a small, clearly-labeled demo dataset when the
 * API is unreachable. Reads return `{ data, demo }` so the UI can show a
 * "Demo data — backend offline" badge. Writes throw ApiOfflineError; the
 * page decides how to simulate locally (never faking a server success
 * silently, and never auto-approving a verification action in the UI —
 * every status change here goes through `verifyProvider` / its demo
 * equivalent, both of which are explicit state transitions).
 *
 * Page-local to /admin/nearby — intentionally independent of
 * src/app/nearby/_lib/api.ts (patient-facing, sibling-owned) and
 * src/app/nearby/provider/_lib/api.ts (provider dashboard, this workstream
 * but a separate page bundle) even though all three talk to /api/nearby.
 *
 * Auth: interim role model — admin endpoints are called with whatever
 * Bearer JWT is in local storage under 'token' (expected backend role:
 * 'admin'). A dedicated admin scope for the Nearby directory is a follow-up.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

/* ────────────────────────────── Types ────────────────────────────── */

export type VerificationStatus = 'VERIFIED' | 'CLAIMED' | 'UNVERIFIED' | 'SUSPENDED' | 'CLOSED';

export interface Provider {
    _id: string;
    name: string;
    type: string;
    subtype?: string;
    locality: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    email?: string;
    verificationStatus: VerificationStatus;
    careconnectVerified: boolean;
    lastVerifiedAt?: string;
    claimedByUserId?: string | null;
    appointmentEnabled: boolean;
    createdAt?: string;
}

export interface Doctor {
    _id: string;
    providerId: string;
    name: string;
    specialty?: string;
    qualification?: string;
    active: boolean;
}

export interface WithDemo<T> { data: T; demo: boolean }

/* ─────────────────────────── Fetch plumbing ───────────────────────── */

export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try { return window.localStorage.getItem('token'); } catch { return null; }
}

export class ApiOfflineError extends Error {
    constructor(message = 'Backend unreachable') {
        super(message);
        this.name = 'ApiOfflineError';
    }
}

export class ApiHttpError extends Error {
    status: number;
    body: Record<string, unknown>;
    constructor(status: number, body: Record<string, unknown>) {
        super(String(body?.message || `Request failed (${status})`));
        this.name = 'ApiHttpError';
        this.status = status;
        this.body = body;
    }
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 5000): Promise<T> {
    const token = getToken();
    let res: Response;
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        res = await fetch(`${API_BASE}${path}`, {
            ...init,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(init?.headers || {}),
            },
        });
        clearTimeout(timer);
    } catch {
        throw new ApiOfflineError();
    }
    if (res.status === 401 || res.status === 403) throw new ApiOfflineError('Unauthorized');
    if (!res.ok) {
        let body: Record<string, unknown> = {};
        try { body = await res.json(); } catch { /* non-JSON error body */ }
        throw new ApiHttpError(res.status, body);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

function isMissingEndpoint(err: unknown): boolean {
    return err instanceof ApiOfflineError || (err instanceof ApiHttpError && err.status === 404);
}

/* ─────────────────────────── Demo dataset ─────────────────────────── */
/**
 * Small labeled seed directory. This mirrors a SAMPLE onboarding batch only —
 * never presented as a real, complete provider directory (honesty rule).
 */

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

const DEMO_PROVIDERS: Provider[] = [
    { _id: 'demo-adm-1', name: 'Sunrise Family Clinic', type: 'clinic', subtype: 'General Medicine & Pediatrics', locality: 'Kothrud', city: 'Pune', state: 'Maharashtra', pincode: '411038', phone: '+91 98220 11223', verificationStatus: 'VERIFIED', careconnectVerified: true, lastVerifiedAt: daysAgo(12), claimedByUserId: 'demo-provider-owner', appointmentEnabled: true, createdAt: daysAgo(400) },
    { _id: 'demo-adm-2', name: 'MedCore Diagnostics', type: 'diagnostic_lab', subtype: 'Pathology & Radiology', locality: 'Baner', city: 'Pune', state: 'Maharashtra', pincode: '411045', phone: '+91 98220 55667', verificationStatus: 'CLAIMED', careconnectVerified: false, claimedByUserId: 'demo-provider-owner', appointmentEnabled: true, createdAt: daysAgo(200) },
    { _id: 'demo-adm-3', name: 'Green Valley Multi-Speciality Hospital', type: 'hospital', subtype: 'Multi-specialty', locality: 'Aundh', city: 'Pune', state: 'Maharashtra', pincode: '411007', phone: '+91 20 4123 5566', verificationStatus: 'UNVERIFIED', careconnectVerified: false, claimedByUserId: null, appointmentEnabled: false, createdAt: daysAgo(30) },
    { _id: 'demo-adm-4', name: 'Green Valley Hospital', type: 'hospital', subtype: 'Multi-specialty', locality: 'Aundh', city: 'Pune', state: 'Maharashtra', pincode: '411007', phone: '+91 20 4123 5567', verificationStatus: 'UNVERIFIED', careconnectVerified: false, claimedByUserId: null, appointmentEnabled: false, createdAt: daysAgo(28) },
    { _id: 'demo-adm-5', name: 'Apex Physiotherapy & Rehab', type: 'clinic', subtype: 'Physiotherapy', locality: 'Viman Nagar', city: 'Pune', state: 'Maharashtra', pincode: '411014', phone: '+91 98500 12121', verificationStatus: 'UNVERIFIED', careconnectVerified: false, claimedByUserId: null, appointmentEnabled: false, createdAt: daysAgo(15) },
    { _id: 'demo-adm-6', name: 'CityCare Pharmacy', type: 'pharmacy', locality: 'Shivaji Nagar', city: 'Pune', state: 'Maharashtra', pincode: '411005', phone: '+91 98230 90909', verificationStatus: 'SUSPENDED', careconnectVerified: true, lastVerifiedAt: daysAgo(60), claimedByUserId: 'demo-user-2', appointmentEnabled: false, createdAt: daysAgo(500) },
    { _id: 'demo-adm-7', name: 'Wellness Dental Studio', type: 'clinic', subtype: 'Dental', locality: 'Kothrud', city: 'Pune', state: 'Maharashtra', pincode: '411038', phone: '+91 90210 44556', verificationStatus: 'VERIFIED', careconnectVerified: true, lastVerifiedAt: daysAgo(5), claimedByUserId: 'demo-user-3', appointmentEnabled: true, createdAt: daysAgo(310) },
    { _id: 'demo-adm-8', name: 'Horizon Diagnostic Centre', type: 'diagnostic_lab', locality: 'Baner', city: 'Pune', state: 'Maharashtra', pincode: '411045', phone: '+91 98220 99887', verificationStatus: 'CLOSED', careconnectVerified: false, lastVerifiedAt: daysAgo(120), claimedByUserId: 'demo-user-4', appointmentEnabled: false, createdAt: daysAgo(600) },
];

const DEMO_DOCTORS: Doctor[] = [
    { _id: 'demo-adm-doc-1', providerId: 'demo-adm-1', name: 'Dr. Anjali Rao', specialty: 'General Medicine', qualification: 'MBBS, MD', active: true },
    { _id: 'demo-adm-doc-2', providerId: 'demo-adm-1', name: 'Dr. Vivek Kulkarni', specialty: 'Pediatrics', qualification: 'MBBS, DCH', active: true },
    { _id: 'demo-adm-doc-3', providerId: 'demo-adm-2', name: 'Dr. Farhan Shaikh', specialty: 'Pathology', qualification: 'MBBS, MD (Path)', active: true },
    { _id: 'demo-adm-doc-4', providerId: 'demo-adm-7', name: 'Dr. Neha Kapoor', specialty: 'Dentistry', qualification: 'BDS, MDS', active: true },
];

/* ─────────────── Session-local demo store (mutable, not persisted) ─────────────── */

const demoProviders: Provider[] = DEMO_PROVIDERS.map((p) => ({ ...p }));
const demoDoctors: Doctor[] = DEMO_DOCTORS.map((d) => ({ ...d }));

/* ───────────────────────── Reads (with fallback) ──────────────────── */

export async function fetchAdminProviders(status?: VerificationStatus): Promise<WithDemo<Provider[]>> {
    try {
        const qs = status ? `?status=${encodeURIComponent(status)}` : '';
        const data = await request<Provider[] | { providers: Provider[] }>(`/api/nearby/admin/providers${qs}`);
        const list = Array.isArray(data) ? data : (data?.providers ?? []);
        return { data: list, demo: false };
    } catch (err) {
        if (isMissingEndpoint(err)) {
            const rows = status ? demoProviders.filter((p) => p.verificationStatus === status) : demoProviders;
            return { data: rows.map((p) => ({ ...p })), demo: true };
        }
        throw err;
    }
}

/**
 * Flat doctor list across providers. No dedicated aggregate endpoint is in
 * the documented contract, so this fans out GET /providers/:id/doctors
 * across every provider currently loaded — acceptable for a directory-admin
 * console at seed-data scale, flagged as a follow-up if the provider count
 * grows (a backend GET /admin/doctors would be more efficient).
 */
export async function fetchAllDoctors(providers: Provider[]): Promise<WithDemo<Doctor[]>> {
    if (providers.length === 0) return { data: [], demo: false };
    try {
        const lists = await Promise.all(
            providers.map((p) => request<Doctor[]>(`/api/nearby/providers/${encodeURIComponent(p._id)}/doctors`))
        );
        return { data: lists.flat(), demo: false };
    } catch (err) {
        if (isMissingEndpoint(err)) return { data: demoDoctors.map((d) => ({ ...d })), demo: true };
        throw err;
    }
}

/* ─────────────────────────────── Writes ───────────────────────────── */

export function verifyProvider(providerId: string, status: VerificationStatus) {
    return request<Provider>(`/api/nearby/providers/${encodeURIComponent(providerId)}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

export function updateProviderCore(providerId: string, body: Partial<Provider>) {
    return request<Provider>(`/api/nearby/providers/${encodeURIComponent(providerId)}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function mergeProviders(keepId: string, mergeId: string) {
    return request<{ ok?: boolean; keepId?: string }>('/api/nearby/admin/providers/merge', {
        method: 'POST',
        body: JSON.stringify({ keepId, mergeId }),
    });
}

/* ────────────── Demo-store mutation helpers (offline simulation) ────────────── */
/** A genuine state transition against the session-local store — never a
 *  silent UI-only "approved" flag. Approving always stamps lastVerifiedAt. */
export function demoApplyVerify(providerId: string, status: VerificationStatus): Provider | null {
    const idx = demoProviders.findIndex((p) => p._id === providerId);
    if (idx < 0) return null;
    demoProviders[idx] = {
        ...demoProviders[idx],
        verificationStatus: status,
        careconnectVerified: status === 'VERIFIED' ? true : demoProviders[idx].careconnectVerified,
        lastVerifiedAt: status === 'VERIFIED' ? new Date().toISOString() : demoProviders[idx].lastVerifiedAt,
        appointmentEnabled: status === 'CLOSED' || status === 'SUSPENDED' ? false : demoProviders[idx].appointmentEnabled,
    };
    return demoProviders[idx];
}

export function demoApplyProviderUpdate(providerId: string, patch: Partial<Provider>): Provider | null {
    const idx = demoProviders.findIndex((p) => p._id === providerId);
    if (idx < 0) return null;
    demoProviders[idx] = { ...demoProviders[idx], ...patch };
    return demoProviders[idx];
}

export function demoApplyMerge(keepId: string, mergeId: string): boolean {
    const keepIdx = demoProviders.findIndex((p) => p._id === keepId);
    const mergeIdx = demoProviders.findIndex((p) => p._id === mergeId);
    if (keepIdx < 0 || mergeIdx < 0) return false;
    // Doctors under the merged-away provider move to the kept record.
    for (const d of demoDoctors) if (d.providerId === mergeId) d.providerId = keepId;
    demoProviders.splice(mergeIdx, 1);
    return true;
}

/* ────────────────────── Client-side duplicate heuristic ────────────────────── */

function normalize(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export interface DuplicateCandidate {
    key: string;
    providers: Provider[];
}

/** Groups providers by normalized name+locality; only groups with >1 member
 *  are candidates. Purely a client-side heuristic — never auto-merged. */
export function findDuplicateCandidates(providers: Provider[]): DuplicateCandidate[] {
    const groups = new Map<string, Provider[]>();
    for (const p of providers) {
        const key = `${normalize(p.name)}::${normalize(p.locality)}`;
        const arr = groups.get(key) || [];
        arr.push(p);
        groups.set(key, arr);
    }
    return [...groups.entries()]
        .filter(([, arr]) => arr.length > 1)
        .map(([key, arr]) => ({ key, providers: arr }));
}

/* ─────────────────────────────── Utils ────────────────────────────── */

export function formatDate(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
    VERIFIED: 'Verified',
    CLAIMED: 'Claimed — pending review',
    UNVERIFIED: 'Unverified',
    SUSPENDED: 'Temporarily unavailable',
    CLOSED: 'Closed',
};

export const VERIFICATION_TONE: Record<VerificationStatus, 'success' | 'warning' | 'neutral' | 'danger'> = {
    VERIFIED: 'success',
    CLAIMED: 'warning',
    UNVERIFIED: 'neutral',
    SUSPENDED: 'warning',
    CLOSED: 'danger',
};

export const PROVIDER_TYPE_LABELS: Record<string, string> = {
    clinic: 'Clinic',
    hospital: 'Hospital',
    diagnostic_lab: 'Diagnostic Lab',
    pharmacy: 'Pharmacy',
};
