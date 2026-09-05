'use client';

/**
 * Health Record Capture — CAPTURE + REVIEW API client (upload a scanned
 * document, walk the AI-extracted fields, accept/edit/reject each one,
 * confirm). Talks to the backend at https://api.careconnect.care/api/health-records
 * (already built and verified).
 *
 * Deliberately kept separate from `./api.ts` (the timeline/dashboard/
 * caregiver/sharing client for this same feature, owned by a parallel
 * change) so the two don't overwrite each other's work on the same file —
 * both hit the same Express mount but cover different endpoints.
 *
 * CRITICAL — no fabricated demo data. Every other `_lib/api.ts` in this
 * codebase falls back to a small labeled demo dataset when the backend is
 * offline. That pattern is wrong here: fabricating fake medical documents,
 * fake extracted prescriptions, or fake patient health data — even clearly
 * labeled "demo" — is far worse than a stale provider listing. So:
 *   - Reads degrade to an empty/null result with `demo: true` only when the
 *     backend is genuinely unreachable. They never invent content.
 *   - Writes (upload, field decisions, confirm, review, reprocess) NEVER
 *     simulate success — they always throw ApiOfflineError / ApiHttpError.
 *
 * Auth: Bearer JWT from localStorage.getItem('token'), same as the rest of
 * the app's real backend calls.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

/* ────────────────────────────── Types ────────────────────────────── */

export type DocumentType =
    | 'HANDWRITTEN_PRESCRIPTION' | 'PRINTED_PRESCRIPTION' | 'OPD_NOTE' | 'DOCTOR_NOTE'
    | 'LAB_REPORT' | 'DIAGNOSTIC_REPORT' | 'DISCHARGE_SUMMARY' | 'REFERRAL_LETTER'
    | 'MEDICAL_CERTIFICATE' | 'VACCINATION_RECORD' | 'PREVIOUS_MEDICAL_RECORD'
    | 'NURSING_NOTE' | 'HOSPITAL_DOCUMENT' | 'MEDICAL_BILL' | 'OTHER';

export type DocumentStatus =
    | 'UPLOADED' | 'PROCESSING' | 'EXTRACTED' | 'REVIEW_REQUIRED'
    | 'PATIENT_CONFIRMED' | 'CLINICIAN_REVIEW_REQUIRED' | 'VERIFIED' | 'REJECTED' | 'ARCHIVED';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | null;

export type CapturedVia = 'CAMERA' | 'UPLOAD_IMAGE' | 'UPLOAD_PDF';

export interface HealthDocumentPage {
    pageNumber: number;
    originalName?: string;
    mimeType: string;
    sizeBytes?: number;
    quality?: { warnings: string[] };
}

export interface HealthDocument {
    _id: string;
    patientId: string;
    documentType: DocumentType;
    documentTypeSource: 'AI_CLASSIFIED' | 'USER_SELECTED' | 'USER_CORRECTED';
    documentTypeConfidence: ConfidenceLevel;
    pages: HealthDocumentPage[];
    capturedBy: { userId: string; role: string };
    capturedVia: CapturedVia;
    caregiverAuthorizationId: string | null;
    status: DocumentStatus;
    currentExtractionId: string | null;
    structuredRecord: { model: 'Prescription' | 'LabReport' | 'DiagnosticReport' | null; id: string | null };
    reviews: Array<{ reviewerUserId: string; reviewerRole: string; decision: 'ACCEPT' | 'EDIT' | 'REJECT' | 'RESCAN_REQUESTED'; notes?: string; reviewedAt: string }>;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export type FieldDecision = 'ACCEPT' | 'EDIT' | 'REJECT';
export type HumanFieldStatus = 'PENDING' | 'ACCEPTED' | 'EDITED' | 'REJECTED';

export interface ExtractedField {
    key: string;
    label: string;
    value: string | number | null;
    confidenceLevel: ConfidenceLevel;
    confidenceNote?: string;
    illegible: boolean;
    humanStatus: HumanFieldStatus;
    humanValue?: string | number;
    humanEditedBy?: string;
    humanEditedAt?: string;
}

export interface DocumentExtraction {
    _id: string;
    documentId: string;
    aiProvider: string;
    aiModel?: string;
    classification: { documentType?: string; confidenceLevel: ConfidenceLevel; confidenceNote?: string };
    fields: ExtractedField[];
    status: 'PENDING' | 'COMPLETE' | 'FAILED';
    errorMessage?: string;
    processedAt?: string;
    createdAt: string;
}

export interface DocumentAndExtraction {
    document: HealthDocument;
    extraction: DocumentExtraction | null;
}

export interface MedicineSuggestionCandidate {
    catalogEntryId: string;
    label: string;
    generic?: string;
    brand?: string;
    strength?: string;
    form?: string;
}

export interface MedicineSuggestionsResult {
    interpretation: string | null;
    confidenceLevel: ConfidenceLevel;
    note: string;
    candidates: MedicineSuggestionCandidate[];
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

async function request<T>(path: string, init?: RequestInit, timeoutMs = 8000): Promise<T> {
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

/* ───────────────────────── Reads (empty fallback) ──────────────────── */
/** No demo dataset here by design — see file header. Only a genuinely
 *  unreachable backend degrades to an empty result; real 404s/errors from a
 *  live backend are rethrown so the page can show the true error. */

export async function fetchHealthDocuments(params: { patientId?: string; status?: DocumentStatus } = {}): Promise<WithDemo<HealthDocument[]>> {
    try {
        const qs = new URLSearchParams();
        if (params.patientId) qs.set('patientId', params.patientId);
        if (params.status) qs.set('status', params.status);
        const query = qs.toString();
        const data = await request<{ documents: HealthDocument[] }>(`/api/health-records/documents${query ? `?${query}` : ''}`);
        return { data: data.documents, demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) return { data: [], demo: true };
        throw err;
    }
}

export async function fetchHealthDocument(id: string): Promise<WithDemo<DocumentAndExtraction | null>> {
    try {
        const data = await request<DocumentAndExtraction>(`/api/health-records/documents/${encodeURIComponent(id)}`);
        return { data, demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) return { data: null, demo: true };
        throw err;
    }
}

/** Fetches the raw bytes of one page of a document (the only way to view the
 *  original). Requires the same Bearer auth as everything else — a plain
 *  <img src> can't carry that header, so callers should turn this into an
 *  object URL: `URL.createObjectURL(await fetchDocumentPageBlob(...))`. */
export async function fetchDocumentPageBlob(documentId: string, pageNumber: number): Promise<Blob> {
    const token = getToken();
    let res: Response;
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20000);
        res = await fetch(`${API_BASE}/api/health-records/documents/${encodeURIComponent(documentId)}/pages/${pageNumber}/file`, {
            signal: controller.signal,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
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
    return res.blob();
}

/* ─────────────────────────────── Writes ───────────────────────────── */
/** Every write below either succeeds against the real backend or throws
 *  (ApiOfflineError / ApiHttpError) — never simulated. */

export interface UploadDocumentInput {
    files: File[];
    patientId: string;
    documentType?: DocumentType;
    capturedVia: CapturedVia;
}

/** Extraction can take up to ~2 minutes — the timeout below gives it room. */
export function uploadHealthDocument(input: UploadDocumentInput): Promise<DocumentAndExtraction> {
    const form = new FormData();
    input.files.forEach((f) => form.append('files', f));
    form.append('patientId', input.patientId);
    form.append('capturedVia', input.capturedVia);
    if (input.documentType) form.append('documentType', input.documentType);
    return request<DocumentAndExtraction>('/api/health-records/documents', {
        method: 'POST',
        body: form,
    }, 130000);
}

export function reprocessHealthDocument(documentId: string): Promise<DocumentAndExtraction> {
    return request<DocumentAndExtraction>(
        `/api/health-records/documents/${encodeURIComponent(documentId)}/reprocess`,
        { method: 'POST' },
        130000
    );
}

export function decideField(
    documentId: string,
    fieldKey: string,
    body: { decision: FieldDecision; value?: string | number }
): Promise<DocumentExtraction> {
    return request<DocumentExtraction>(
        `/api/health-records/documents/${encodeURIComponent(documentId)}/fields/${encodeURIComponent(fieldKey)}`,
        { method: 'PATCH', body: JSON.stringify(body) }
    );
}

export function confirmDocument(documentId: string, notes?: string): Promise<{ document: HealthDocument; structuredRecord: { model: string; id: string } | null }> {
    return request(
        `/api/health-records/documents/${encodeURIComponent(documentId)}/confirm`,
        { method: 'POST', body: JSON.stringify({ notes }) }
    );
}

export function reviewDocument(
    documentId: string,
    body: { decision: 'ACCEPT' | 'EDIT' | 'REJECT' | 'RESCAN_REQUESTED'; notes?: string }
): Promise<HealthDocument> {
    return request<HealthDocument>(
        `/api/health-records/documents/${encodeURIComponent(documentId)}/review`,
        { method: 'POST', body: JSON.stringify(body) }
    );
}

export function fetchMedicineSuggestions(rawText: string | number): Promise<MedicineSuggestionsResult> {
    const qs = new URLSearchParams({ rawText: String(rawText) });
    return request<MedicineSuggestionsResult>(`/api/health-records/medicine-suggestions?${qs.toString()}`);
}

/* ─────────────────────────────── Labels ────────────────────────────── */

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    HANDWRITTEN_PRESCRIPTION: 'Handwritten Prescription',
    PRINTED_PRESCRIPTION: 'Printed Prescription',
    OPD_NOTE: 'OPD Note',
    DOCTOR_NOTE: "Doctor's Note",
    LAB_REPORT: 'Lab Report',
    DIAGNOSTIC_REPORT: 'Diagnostic Report',
    DISCHARGE_SUMMARY: 'Discharge Summary',
    REFERRAL_LETTER: 'Referral Letter',
    MEDICAL_CERTIFICATE: 'Medical Certificate',
    VACCINATION_RECORD: 'Vaccination Record',
    PREVIOUS_MEDICAL_RECORD: 'Previous Medical Record',
    NURSING_NOTE: 'Nursing Note',
    HOSPITAL_DOCUMENT: 'Hospital Document',
    MEDICAL_BILL: 'Medical Bill',
    OTHER: 'Other',
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
    UPLOADED: 'Uploaded',
    PROCESSING: 'Processing',
    EXTRACTED: 'Extracted',
    REVIEW_REQUIRED: 'Review Required',
    PATIENT_CONFIRMED: 'Patient Confirmed',
    CLINICIAN_REVIEW_REQUIRED: 'Clinician Review Required',
    VERIFIED: 'Verified',
    REJECTED: 'Rejected',
    ARCHIVED: 'Archived',
};

export const DOCUMENT_STATUS_TONE: Record<DocumentStatus, 'success' | 'warning' | 'neutral' | 'danger' | 'info' | 'brand'> = {
    UPLOADED: 'neutral',
    PROCESSING: 'info',
    EXTRACTED: 'info',
    REVIEW_REQUIRED: 'warning',
    PATIENT_CONFIRMED: 'brand',
    CLINICIAN_REVIEW_REQUIRED: 'warning',
    VERIFIED: 'success',
    REJECTED: 'danger',
    ARCHIVED: 'neutral',
};

export const CONFIDENCE_LABELS: Record<'HIGH' | 'MEDIUM' | 'LOW', string> = {
    HIGH: 'High confidence',
    MEDIUM: 'Medium confidence',
    LOW: 'Low confidence',
};

export function confidenceLabel(level: ConfidenceLevel): string {
    if (!level) return 'Not assessed';
    return CONFIDENCE_LABELS[level];
}

export function confidenceTone(level: ConfidenceLevel): 'success' | 'warning' | 'danger' | 'neutral' {
    if (level === 'HIGH') return 'success';
    if (level === 'MEDIUM') return 'warning';
    if (level === 'LOW') return 'danger';
    return 'neutral';
}

export const HUMAN_STATUS_LABELS: Record<HumanFieldStatus, string> = {
    PENDING: 'Pending review',
    ACCEPTED: 'Accepted',
    EDITED: 'Edited',
    REJECTED: 'Rejected',
};

export const HUMAN_STATUS_TONE: Record<HumanFieldStatus, 'success' | 'warning' | 'neutral' | 'danger' | 'info'> = {
    PENDING: 'warning',
    ACCEPTED: 'success',
    EDITED: 'info',
    REJECTED: 'danger',
};

/** Splits a field's bracket-path key ("medications[0].name") into its group
 *  name, list index, and sub-key, or returns null for a flat field key. */
export function parseBracketPath(key: string): { group: string; index: number; subKey: string } | null {
    const m = /^([A-Za-z0-9_]+)\[(\d+)\]\.(.+)$/.exec(key);
    if (!m) return null;
    return { group: m[1], index: Number(m[2]), subKey: m[3] };
}

/** Title-cases a group key like "medications" -> "Medication" for card headers. */
export function humanizeGroupKey(group: string): string {
    const words = group.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
    const singular = words.endsWith('s') && !words.endsWith('ss') ? words.slice(0, -1) : words;
    return singular.charAt(0).toUpperCase() + singular.slice(1);
}

export function formatDateTime(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
