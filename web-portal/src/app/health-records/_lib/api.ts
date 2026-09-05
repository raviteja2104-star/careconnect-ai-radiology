'use client';

/**
 * Health Record Capture — patient-facing API client. Talks to the backend
 * feature mounted at http://localhost:5000/api/health-records (already
 * built and verified server-side: photograph a paper document → Claude
 * vision extracts fields with per-field confidence → a human reviews it
 * before it becomes a real record).
 *
 * CRITICAL — no fabricated demo data. This is real medical/PII-adjacent
 * data. Unlike most other `_lib/api.ts` files in this codebase (which fall
 * back to a small labeled demo dataset offline), this feature must never
 * invent fake patient documents, timeline entries, caregiver relationships,
 * or share grants — even labeled "demo". Offline/unreachable reads return
 * `{ data: [], demo: true }` (or `{ data: null, demo: true }` for a single
 * resource) so the page can render a plain "requires a live backend
 * connection" state. Writes NEVER simulate a fake success — they always
 * throw ApiOfflineError / ApiHttpError. Mirrors the convention in
 * `web-portal/src/app/admin/nearby/import/_lib/api.ts`.
 *
 * Auth: Bearer JWT from localStorage.getItem('token') (same key the rest of
 * the app's real backend calls use — see services/authService.ts).
 *
 * Role note: the backend's authorization (CaregiverAuthzService) checks the
 * RAW lowercase backend role string on req.user.role (e.g. 'doctor',
 * 'nurse', 'reception', 'lab_tech', 'admin', 'patient') — NOT the frontend's
 * mapped AuthUserSession['role'] enum (PHYSICIAN/NURSE/...). Notably
 * mapBackendRole() collapses both 'reception' and 'emergency' into the
 * frontend's 'PHYSICIAN', so session.role alone cannot distinguish an
 * actual doctor from front-desk staff. Where that distinction is load-
 * bearing (the doctor-only clinical verification action) this module reads
 * the raw backend role via readStoredAuth() instead of trusting session.role.
 */

import { readStoredAuth, type AuthUserSession } from '@/services/authService';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

/* ────────────────────────────── Types ────────────────────────────── */

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | null;

export type RecordStatus =
    | 'DRAFT_EXTRACTED' | 'REVIEW_REQUIRED' | 'CLINICIAN_REVIEW_REQUIRED'
    | 'VERIFIED' | 'REJECTED' | 'AMENDED';

export type TimelineRecordType =
    | 'HEALTH_DOCUMENT' | 'PRESCRIPTION' | 'LAB_REPORT' | 'DIAGNOSTIC_REPORT' | 'CONSULTATION';

export interface TimelineEntry {
    date: string;
    recordType: TimelineRecordType;
    recordId: string;
    source: string | null;
    uploadedBy: string | null;
    uploadedByRole: string | null;
    verificationStatus: string | null;
    summary: string | null;
}

export interface PrescriptionRecord {
    _id: string;
    prescriptionDate?: string;
    doctorName?: string;
    diagnosis: string[];
    medications: Array<{ name?: string; strength?: string; frequency?: string; duration?: string; confidenceLevel?: ConfidenceLevel }>;
    status: RecordStatus;
}

export interface LabReportRecord {
    _id: string;
    labName?: string;
    reportDate?: string;
    results: Array<{ testName?: string; result?: string; unit?: string; referenceRange?: string; flag?: string; confidenceLevel?: ConfidenceLevel }>;
    status: RecordStatus;
}

export interface DiagnosticReportRecord {
    _id: string;
    modality?: string;
    studyDate?: string;
    findings?: string;
    impression?: string;
    status: RecordStatus;
}

export interface PatientSummary {
    demographics: { name: string; dateOfBirth?: string; gender?: string; bloodGroup?: string };
    allergies: string[];
    chronicDiseases: string[];
    medications: string[];
    surgeries: string[];
    familyHistory: string[];
    documentCounts: { total: number; reviewRequired: number };
    prescriptions: PrescriptionRecord[];
    labReports: LabReportRecord[];
    diagnosticReports: DiagnosticReportRecord[];
}

export type HealthDocumentStatus =
    | 'UPLOADED' | 'PROCESSING' | 'EXTRACTED' | 'REVIEW_REQUIRED'
    | 'PATIENT_CONFIRMED' | 'CLINICIAN_REVIEW_REQUIRED' | 'VERIFIED' | 'REJECTED' | 'ARCHIVED';

export interface HealthDocument {
    _id: string;
    patientId: string | { _id: string; name?: string; firstName?: string; lastName?: string };
    documentType: string;
    documentTypeConfidence?: ConfidenceLevel;
    status: HealthDocumentStatus;
    pages: Array<{ pageNumber: number; originalName?: string; mimeType?: string }>;
    capturedBy: { userId: string; role: string };
    structuredRecord?: { model: ClinicalReviewModel; id: string } | null;
    notes?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface LowConfidenceExtraction {
    documentId: string;
    classification?: string;
    createdAt: string;
}

export interface DashboardData {
    awaitingReview: HealthDocument[];
    clinicianReviewRequired: HealthDocument[];
    lowConfidenceExtractions: LowConfidenceExtraction[];
    recentDocuments: HealthDocument[];
}

export type CaregiverRelationship = 'PARENT' | 'CHILD' | 'SPOUSE' | 'GUARDIAN' | 'OTHER_FAMILY' | 'OTHER';

export interface PermissionScope {
    canUploadDocuments: boolean;
    canViewRecords: boolean;
    canManageAppointments: boolean;
    canViewBilling: boolean;
}

export const DEFAULT_PERMISSION_SCOPE: PermissionScope = {
    canUploadDocuments: true,
    canViewRecords: true,
    canManageAppointments: false,
    canViewBilling: false,
};

export interface CaregiverAuthorization {
    _id: string;
    patientId: string;
    caregiverUserId: string;
    relationship: CaregiverRelationship;
    relationshipNote?: string;
    permissionScope: PermissionScope;
    status: 'PENDING' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    startDate: string;
    endDate?: string;
    authorizedBy: { userId: string; method: string };
    revokedAt?: string;
    revokeReason?: string;
    createdAt: string;
}

export type ShareScope = 'ALL_RECORDS' | 'SPECIFIC_DOCUMENT' | 'DOCUMENT_TYPE';

export interface RecordShare {
    _id: string;
    patientId: string;
    sharedWithUserId?: string;
    sharedWithProviderId?: string;
    sharedWithLabel?: string;
    scope: ShareScope;
    scopeDocumentIds?: string[];
    scopeDocumentTypes?: string[];
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    grantedAt: string;
    expiresAt?: string;
    revokedAt?: string;
    createdAt: string;
}

export interface AuditEntry {
    seq: number;
    actorId: string;
    actorRole: string;
    action: string;
    resource: string;
    resourceId?: string;
    method: string;
    path: string;
    statusCode: number;
    at: string;
}

export type ClinicalReviewModel = 'Prescription' | 'LabReport' | 'DiagnosticReport';
export type ClinicalReviewDecision = 'ACCEPT' | 'EDIT' | 'REJECT';

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
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(init?.headers || {}),
            },
        });
        clearTimeout(timer);
    } catch {
        throw new ApiOfflineError();
    }
    if (res.status === 401 || res.status === 403) {
        let body: Record<string, unknown> = {};
        try { body = await res.json(); } catch { /* non-JSON error body */ }
        // 403s here are meaningful authorization decisions (e.g. "only a
        // doctor can verify"), not just "backend unreachable" — surface them
        // as a real HTTP error so the UI can show the backend's own message,
        // while still letting an unauthenticated 401 degrade to offline-like
        // handling for read paths.
        if (res.status === 403) throw new ApiHttpError(403, body);
        throw new ApiOfflineError('Unauthorized');
    }
    if (!res.ok) {
        let body: Record<string, unknown> = {};
        try { body = await res.json(); } catch { /* non-JSON error body */ }
        throw new ApiHttpError(res.status, body);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

function isOfflineLike(err: unknown): boolean {
    return err instanceof ApiOfflineError || (err instanceof ApiHttpError && err.status === 404);
}

/* ───────────────────────── Reads (empty fallback, never fabricated) ──────────────────── */

export async function fetchTimeline(patientId: string): Promise<WithDemo<TimelineEntry[]>> {
    try {
        const data = await request<{ timeline: TimelineEntry[] }>(`/api/health-records/patients/${encodeURIComponent(patientId)}/timeline`);
        return { data: data.timeline, demo: false };
    } catch (err) {
        if (isOfflineLike(err)) return { data: [], demo: true };
        throw err;
    }
}

export async function fetchSummary(patientId: string): Promise<WithDemo<PatientSummary | null>> {
    try {
        const data = await request<PatientSummary>(`/api/health-records/patients/${encodeURIComponent(patientId)}/summary`);
        return { data, demo: false };
    } catch (err) {
        if (isOfflineLike(err)) return { data: null, demo: true };
        throw err;
    }
}

export async function fetchDashboard(): Promise<WithDemo<DashboardData>> {
    const empty: DashboardData = { awaitingReview: [], clinicianReviewRequired: [], lowConfidenceExtractions: [], recentDocuments: [] };
    try {
        const data = await request<DashboardData>('/api/health-records/dashboard');
        return { data, demo: false };
    } catch (err) {
        if (isOfflineLike(err)) return { data: empty, demo: true };
        throw err;
    }
}

export async function fetchCaregivers(patientId: string): Promise<WithDemo<CaregiverAuthorization[]>> {
    try {
        const data = await request<{ authorizations: CaregiverAuthorization[] }>(`/api/health-records/patients/${encodeURIComponent(patientId)}/caregivers`);
        return { data: data.authorizations, demo: false };
    } catch (err) {
        if (isOfflineLike(err)) return { data: [], demo: true };
        throw err;
    }
}

export async function fetchShares(patientId: string): Promise<WithDemo<RecordShare[]>> {
    try {
        const data = await request<{ shares: RecordShare[] }>(`/api/health-records/patients/${encodeURIComponent(patientId)}/shares`);
        return { data: data.shares, demo: false };
    } catch (err) {
        if (isOfflineLike(err)) return { data: [], demo: true };
        throw err;
    }
}

export async function fetchAccessHistory(patientId: string): Promise<WithDemo<AuditEntry[]>> {
    try {
        const data = await request<{ entries: AuditEntry[] }>(`/api/health-records/patients/${encodeURIComponent(patientId)}/access-history`);
        return { data: data.entries, demo: false };
    } catch (err) {
        if (isOfflineLike(err)) return { data: [], demo: true };
        throw err;
    }
}

/* ─────────────────────────────── Writes ───────────────────────────── */
/** Every write below either succeeds against the real backend or throws
 *  (ApiOfflineError / ApiHttpError) — never simulated. */

export function submitClinicalReview(
    model: ClinicalReviewModel,
    id: string,
    body: { decision: ClinicalReviewDecision; notes?: string }
): Promise<{ model: ClinicalReviewModel; record: PrescriptionRecord | LabReportRecord | DiagnosticReportRecord }> {
    return request(`/api/health-records/records/${model}/${encodeURIComponent(id)}/clinical-review`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export function grantCaregiverAuthorization(
    patientId: string,
    body: { caregiverUserId: string; relationship: CaregiverRelationship; relationshipNote?: string; permissionScope?: PermissionScope; endDate?: string }
): Promise<CaregiverAuthorization> {
    return request(`/api/health-records/patients/${encodeURIComponent(patientId)}/caregivers`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export function revokeCaregiverAuthorization(id: string, reason?: string): Promise<CaregiverAuthorization> {
    return request(`/api/health-records/caregivers/${encodeURIComponent(id)}/revoke`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
    });
}

export function createShare(
    patientId: string,
    body: {
        sharedWithUserId?: string; sharedWithProviderId?: string; sharedWithLabel?: string;
        scope: ShareScope; scopeDocumentIds?: string[]; scopeDocumentTypes?: string[]; expiresAt?: string;
    }
): Promise<RecordShare> {
    return request(`/api/health-records/patients/${encodeURIComponent(patientId)}/shares`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export function revokeShare(id: string): Promise<RecordShare> {
    return request(`/api/health-records/shares/${encodeURIComponent(id)}/revoke`, { method: 'PATCH' });
}

/* ─────────────────────────────── Utils ────────────────────────────── */

export function formatDate(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
    DRAFT_EXTRACTED: 'Draft (AI extracted)',
    REVIEW_REQUIRED: 'Review required',
    CLINICIAN_REVIEW_REQUIRED: 'Clinician review required',
    VERIFIED: 'Verified',
    REJECTED: 'Rejected',
    AMENDED: 'Amended',
};

export const RECORD_STATUS_TONE: Record<RecordStatus, 'success' | 'warning' | 'neutral' | 'danger' | 'info'> = {
    DRAFT_EXTRACTED: 'neutral',
    REVIEW_REQUIRED: 'warning',
    CLINICIAN_REVIEW_REQUIRED: 'warning',
    VERIFIED: 'success',
    REJECTED: 'danger',
    AMENDED: 'info',
};

export const DOCUMENT_STATUS_LABELS: Record<HealthDocumentStatus, string> = {
    UPLOADED: 'Uploaded',
    PROCESSING: 'Processing…',
    EXTRACTED: 'Extracted',
    REVIEW_REQUIRED: 'Review required',
    PATIENT_CONFIRMED: 'Patient confirmed',
    CLINICIAN_REVIEW_REQUIRED: 'Clinician review required',
    VERIFIED: 'Verified',
    REJECTED: 'Rejected',
    ARCHIVED: 'Archived',
};

export const DOCUMENT_STATUS_TONE: Record<HealthDocumentStatus, 'success' | 'warning' | 'neutral' | 'danger' | 'info'> = {
    UPLOADED: 'neutral',
    PROCESSING: 'info',
    EXTRACTED: 'info',
    REVIEW_REQUIRED: 'warning',
    PATIENT_CONFIRMED: 'info',
    CLINICIAN_REVIEW_REQUIRED: 'warning',
    VERIFIED: 'success',
    REJECTED: 'danger',
    ARCHIVED: 'neutral',
};

export const CONFIDENCE_TONE: Record<NonNullable<ConfidenceLevel> | 'UNKNOWN', 'success' | 'warning' | 'danger' | 'neutral'> = {
    HIGH: 'success',
    MEDIUM: 'warning',
    LOW: 'danger',
    UNKNOWN: 'neutral',
};

export const CAREGIVER_RELATIONSHIP_LABELS: Record<CaregiverRelationship, string> = {
    PARENT: 'Parent', CHILD: 'Child', SPOUSE: 'Spouse', GUARDIAN: 'Guardian',
    OTHER_FAMILY: 'Other family member', OTHER: 'Other',
};

export const CAREGIVER_STATUS_TONE: Record<CaregiverAuthorization['status'], 'success' | 'warning' | 'neutral' | 'danger'> = {
    PENDING: 'warning', ACTIVE: 'success', REVOKED: 'neutral', EXPIRED: 'danger',
};

export const SHARE_SCOPE_LABELS: Record<ShareScope, string> = {
    ALL_RECORDS: 'All records',
    SPECIFIC_DOCUMENT: 'Specific document(s)',
    DOCUMENT_TYPE: 'Document type(s)',
};

export const SHARE_STATUS_TONE: Record<RecordShare['status'], 'success' | 'neutral' | 'danger'> = {
    ACTIVE: 'success', REVOKED: 'neutral', EXPIRED: 'danger',
};

/** Document types the backend accepts — mirrors backend/src/models/HealthDocument.js DOCUMENT_TYPES. */
export const HEALTH_DOCUMENT_TYPES = [
    'HANDWRITTEN_PRESCRIPTION', 'PRINTED_PRESCRIPTION', 'OPD_NOTE', 'DOCTOR_NOTE',
    'LAB_REPORT', 'DIAGNOSTIC_REPORT', 'DISCHARGE_SUMMARY', 'REFERRAL_LETTER',
    'MEDICAL_CERTIFICATE', 'VACCINATION_RECORD', 'PREVIOUS_MEDICAL_RECORD',
    'NURSING_NOTE', 'HOSPITAL_DOCUMENT', 'MEDICAL_BILL', 'OTHER',
] as const;

export function documentTypeLabel(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Map a timeline entry's recordType to the clinical-review model name, or
 *  null when the entry isn't a clinically-reviewable structured record. */
export function toClinicalReviewModel(recordType: TimelineRecordType): ClinicalReviewModel | null {
    switch (recordType) {
        case 'PRESCRIPTION': return 'Prescription';
        case 'LAB_REPORT': return 'LabReport';
        case 'DIAGNOSTIC_REPORT': return 'DiagnosticReport';
        default: return null;
    }
}

/**
 * Whether the current actor can clinically VERIFY a record (backend gate:
 * `req.user.role === 'doctor'`, a raw lowercase string that the frontend's
 * mapped AuthUserSession['role'] can't reliably reproduce — 'reception' and
 * 'emergency' both also map to the frontend's 'PHYSICIAN'). When a real JWT
 * session is active we read the raw backend role directly; in demo/persona
 * mode (no stored backend user) we fall back to the PHYSICIAN persona,
 * which is the only doctor-like demo persona available. The backend remains
 * the source of truth either way — this only controls whether the button
 * is shown, not whether the write succeeds.
 */
/* ─────────────────────── User search ─────────────────────── */

export interface UserSearchResult {
    id: string;
    displayName: string;
    maskedPhone: string | null;
    maskedEmail: string | null;
    userType: 'PATIENT' | 'DOCTOR' | 'NURSE' | 'STAFF';
    ccDisplayId: string;
}

/** Search for CareConnect users by name, phone suffix, or email.
 *  Returns masked identity only — never full phone/email/clinical data.
 *  Throws ApiOfflineError when backend is unreachable. */
export async function searchUsers(q: string): Promise<UserSearchResult[]> {
    const data = await request<{ success: boolean; results: UserSearchResult[] }>(
        `/api/users/search?q=${encodeURIComponent(q)}`
    );
    return data.results;
}

export function actorIsDoctor(session: AuthUserSession): boolean {
    const stored = readStoredAuth();
    if (stored) return stored.user.role === 'doctor';
    return session.role === 'PHYSICIAN';
}
