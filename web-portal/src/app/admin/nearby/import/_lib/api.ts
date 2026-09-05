'use client';

/**
 * Nearby — Provider Import Admin API client. Talks to the CareConnect
 * Nearby backend at https://api.careconnect.care/api/nearby/admin/import
 * (admin-only surface, already built and unit-tested on the backend).
 *
 * Unlike the sibling `admin/nearby/_lib/api.ts`, this feature has no
 * sensible offline demo dataset — it is a live upload/review/commit
 * workflow against real staged data, not browsable directory content.
 * Reads degrade to an empty `{ data: [], demo: true }` shape so the page
 * can render a "backend unavailable" state, but writes (upload, decide,
 * bulk-decide, commit) NEVER simulate a fake success — they always throw
 * ApiOfflineError / ApiHttpError for the page to surface as a hard error.
 * This mirrors the project's no-fabrication rule: nothing here ever
 * silently pretends an import happened.
 *
 * Auth: same interim role model as the rest of /admin/nearby — calls go
 * out with whatever Bearer JWT is in localStorage under 'token'.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

/* ────────────────────────────── Types ────────────────────────────── */

export type BatchStatus = 'PARSING' | 'REVIEW_PENDING' | 'IMPORTED' | 'PARTIALLY_IMPORTED' | 'FAILED';

export interface BatchStats {
    valid: number;
    invalid: number;
    duplicate: number;
    approved: number;
    rejected: number;
    imported: number;
}

export interface Batch {
    _id: string;
    fileName: string;
    sheetName?: string;
    status: BatchStatus;
    totalRows: number;
    stats: BatchStats;
    errorSummary?: string;
    createdAt: string;
    updatedAt: string;
}

export type RowStatus = 'VALID' | 'INVALID' | 'DUPLICATE' | 'APPROVED' | 'REJECTED' | 'IMPORTED';

export interface DuplicateMatch {
    matchType: 'existing_name_locality' | 'existing_phone' | 'batch_duplicate';
    providerId?: string;
    providerName?: string;
    matchedRowIndex?: number;
}

export interface NormalizedProviderRow {
    name?: string;
    type?: string;
    providerTypeId?: string;
    locality?: string;
    localityId?: string;
    branchName?: string;
    address?: string;
    pincode?: string;
    city?: string;
    district?: string;
    state?: string;
    phone?: string;
    email?: string;
    website?: string;
    specialties?: string[];
    servicesOffered?: string[];
    emergencyAvailable?: boolean;
    homeCollection?: boolean;
    teleconsultation?: boolean;
    consultationFee?: number;
    lat?: number;
    lng?: number;
    sourceLabel?: string;
    sourceUrl?: string;
    notes?: string;
}

export interface Row {
    _id: string;
    batchId: string;
    rowIndex: number;
    rawData: Record<string, unknown>;
    normalizedData: NormalizedProviderRow;
    validationErrors: string[];
    validationWarnings: string[];
    duplicateMatches: DuplicateMatch[];
    status: RowStatus;
    reviewedByUserId: string | null;
    reviewedAt?: string;
    reviewNotes?: string;
    importedProviderId: string | null;
}

export interface RowsPage {
    rows: Row[];
    total: number;
    page: number;
    limit: number;
}

export type Decision = 'APPROVE' | 'REJECT';

export interface BulkDecideResult {
    rowId: string;
    ok: boolean;
    status?: string;
    message?: string;
}

export interface CommitResult {
    imported: number;
    failed: number;
    failures: Array<{ rowId: string; message: string }>;
    stats: BatchStats;
    batchStatus: string;
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
                ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
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

/* ───────────────────────── Reads (empty fallback) ──────────────────── */
/** No demo dataset here by design — see file header. A missing/offline
 *  backend returns an empty, clearly-flagged result rather than fake data. */

export async function fetchImportBatches(): Promise<WithDemo<Batch[]>> {
    try {
        const data = await request<Batch[]>('/api/nearby/admin/import/batches');
        return { data, demo: false };
    } catch (err) {
        if (isMissingEndpoint(err)) return { data: [], demo: true };
        throw err;
    }
}

export async function fetchImportBatch(id: string): Promise<WithDemo<Batch | null>> {
    try {
        const data = await request<Batch>(`/api/nearby/admin/import/batches/${encodeURIComponent(id)}`);
        return { data, demo: false };
    } catch (err) {
        if (isMissingEndpoint(err)) return { data: null, demo: true };
        throw err;
    }
}

export async function fetchImportRows(
    batchId: string,
    opts: { status?: RowStatus; page?: number; limit?: number } = {}
): Promise<WithDemo<RowsPage>> {
    try {
        const params = new URLSearchParams();
        if (opts.status) params.set('status', opts.status);
        if (opts.page) params.set('page', String(opts.page));
        if (opts.limit) params.set('limit', String(opts.limit));
        const qs = params.toString();
        const data = await request<RowsPage>(
            `/api/nearby/admin/import/batches/${encodeURIComponent(batchId)}/rows${qs ? `?${qs}` : ''}`
        );
        return { data, demo: false };
    } catch (err) {
        if (isMissingEndpoint(err)) return { data: { rows: [], total: 0, page: opts.page ?? 1, limit: opts.limit ?? 50 }, demo: true };
        throw err;
    }
}

/* ─────────────────────────────── Writes ───────────────────────────── */
/** Every write below either succeeds against the real backend or throws
 *  (ApiOfflineError / ApiHttpError) — never simulated. */

export function uploadImportFile(file: File): Promise<{ batch: Batch; previewRows: Row[] }> {
    const form = new FormData();
    form.append('file', file);
    return request<{ batch: Batch; previewRows: Row[] }>('/api/nearby/admin/import/upload', {
        method: 'POST',
        body: form,
    }, 60000);
}

export function decideImportRow(
    batchId: string,
    rowId: string,
    body: { decision: Decision; editedData?: Partial<NormalizedProviderRow>; reviewNotes?: string }
): Promise<Row> {
    return request<Row>(
        `/api/nearby/admin/import/batches/${encodeURIComponent(batchId)}/rows/${encodeURIComponent(rowId)}`,
        { method: 'PATCH', body: JSON.stringify(body) }
    );
}

export function bulkDecideImportRows(batchId: string, rowIds: string[], decision: Decision): Promise<{ results: BulkDecideResult[] }> {
    return request<{ results: BulkDecideResult[] }>(
        `/api/nearby/admin/import/batches/${encodeURIComponent(batchId)}/bulk-decide`,
        { method: 'POST', body: JSON.stringify({ rowIds, decision }) }
    );
}

export function commitImportBatch(batchId: string): Promise<CommitResult> {
    return request<CommitResult>(
        `/api/nearby/admin/import/batches/${encodeURIComponent(batchId)}/commit`,
        { method: 'POST' },
        60000
    );
}

/* ─────────────────────────────── Utils ────────────────────────────── */

export function formatDate(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
    PARSING: 'Parsing…',
    REVIEW_PENDING: 'Review pending',
    IMPORTED: 'Imported',
    PARTIALLY_IMPORTED: 'Partially imported',
    FAILED: 'Failed',
};

export const BATCH_STATUS_TONE: Record<BatchStatus, 'success' | 'warning' | 'neutral' | 'danger' | 'info'> = {
    PARSING: 'info',
    REVIEW_PENDING: 'warning',
    IMPORTED: 'success',
    PARTIALLY_IMPORTED: 'warning',
    FAILED: 'danger',
};

export const ROW_STATUS_LABELS: Record<RowStatus, string> = {
    VALID: 'Valid',
    INVALID: 'Invalid',
    DUPLICATE: 'Duplicate',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    IMPORTED: 'Imported',
};

export const ROW_STATUS_TONE: Record<RowStatus, 'success' | 'warning' | 'neutral' | 'danger' | 'info'> = {
    VALID: 'success',
    INVALID: 'danger',
    DUPLICATE: 'warning',
    APPROVED: 'info',
    REJECTED: 'neutral',
    IMPORTED: 'success',
};

/** True once the backend has resolved the row's free-text type/locality
 *  against the ProviderType/Locality master collections. Approving a row
 *  before this is true will 400 — the UI uses this to gate the Approve
 *  action and offer inline correction instead. */
export function isRowResolved(row: Row): boolean {
    return !!row.normalizedData?.providerTypeId && !!row.normalizedData?.localityId;
}
