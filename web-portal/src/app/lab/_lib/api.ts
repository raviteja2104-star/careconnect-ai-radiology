'use client';

/**
 * LIS (Laboratory Information System) API client — talks to the backend at
 * https://api.careconnect.care/api/lis and degrades gracefully to realistic demo
 * data when the API is unreachable or the caller is unauthenticated.
 * Per project rule the frontend must never crash when the backend is down;
 * every read returns `{ data, demo }` so the UI can surface a subtle
 * "Demo data — backend offline" badge instead.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

/* ────────────────────────────── Types ────────────────────────────── */

export type LabPriority = 'routine' | 'urgent' | 'stat' | 'emergency';

export type LabStatus =
    | 'ORDERED'
    | 'SAMPLE_COLLECTED'
    | 'PROCESSING'
    | 'RESULT_PENDING'
    | 'VERIFICATION_PENDING'
    | 'VERIFIED'
    | 'RELEASED'
    | 'REJECTED';

export type SampleQuality =
    | 'accepted'
    | 'rejected'
    | 'hemolysed'
    | 'lipemic'
    | 'clotted'
    | 'insufficient'
    | 'wrong_container'
    | 'incorrect_sample'
    | 'other';

export type ResultFlag =
    | 'low'
    | 'normal'
    | 'high'
    | 'critical'
    | 'positive'
    | 'negative'
    | 'abnormal'
    | null;

export interface LabParameter {
    name: string;
    value?: string;
    unit?: string;
    refRangeUsed?: string;
    flag?: ResultFlag;
    comments?: string;
}

export interface LabTest {
    code: string;
    name: string;
    specimen?: string;
    parameters: LabParameter[];
    techComments?: string;
}

export interface CriticalEvent {
    parameter: string;
    value: string;
    acknowledgedAt?: string;
    notifiedWho?: string;
    notificationMethod?: string;
}

export interface SampleInfo {
    collectedAt?: string;
    quality?: SampleQuality;
    rejectedReason?: string;
    recollectionRequired?: boolean;
}

export interface VerificationInfo {
    technicalBy?: string;
    technicalAt?: string;
    pathologistBy?: string;
    pathologistAt?: string;
}

export interface Amendment {
    at: string;
    reason: string;
}

export interface WorklistItem {
    _id: string;
    labNumber: string;
    patientId: { _id: string; name?: string };
    orderingDoctorId?: { name?: string };
    priority: LabPriority;
    status: LabStatus;
    sample?: SampleInfo;
    tests: LabTest[];
    criticalEvents?: CriticalEvent[];
    verification?: VerificationInfo;
    releasedAt?: string;
    locked?: boolean;
    amendments?: Amendment[];
    createdAt?: string;
}

export interface HistoryPoint {
    at: string;
    value: string;
    unit?: string;
    flag?: ResultFlag;
    refRangeUsed?: string;
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

/** Thrown when the backend is unreachable or the caller is unauthenticated. */
export class ApiOfflineError extends Error {
    constructor(message = 'Backend unreachable') {
        super(message);
        this.name = 'ApiOfflineError';
    }
}

/** Thrown for HTTP errors that carry a meaningful body. */
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
    if (res.status === 401) {
        if (token && typeof window !== 'undefined') {
            try {
                window.localStorage.removeItem('token');
                window.localStorage.removeItem('cc-user');
            } catch { /* storage unavailable */ }
            window.location.assign('/login');
            throw new ApiOfflineError('Session expired');
        }
        throw new ApiOfflineError('Unauthorized');
    }
    if (res.status === 403) throw new ApiOfflineError('Unauthorized');
    if (!res.ok) {
        let body: Record<string, unknown> = {};
        try {
            body = await res.json();
        } catch {
            /* non-JSON error body */
        }
        throw new ApiHttpError(res.status, body);
    }
    return res.json() as Promise<T>;
}

/* ─────────────────────────── Demo dataset ─────────────────────────── */

const hoursAgo = (n: number) => {
    const d = new Date();
    d.setHours(d.getHours() - n);
    d.setMinutes(15, 0, 0);
    return d.toISOString();
};

const daysAgo = (n: number, h = 9) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(h, 30, 0, 0);
    return d.toISOString();
};

export const DEMO_ITEMS: WorklistItem[] = [
    {
        _id: 'demo-lab-1',
        labNumber: 'LAB-2026-0101',
        patientId: { _id: 'demo-pt-anita', name: 'Anita Desai' },
        orderingDoctorId: { name: 'Dr. Meera Krishnan' },
        priority: 'routine',
        status: 'ORDERED',
        sample: {},
        tests: [
            {
                code: 'LIPID',
                name: 'Lipid Profile',
                specimen: 'Serum',
                parameters: [
                    { name: 'Total Cholesterol', value: '', unit: 'mg/dL', refRangeUsed: '125 – 200' },
                    { name: 'Triglycerides', value: '', unit: 'mg/dL', refRangeUsed: '25 – 200' },
                    { name: 'HDL Cholesterol', value: '', unit: 'mg/dL', refRangeUsed: '40 – 60' },
                    { name: 'LDL Cholesterol', value: '', unit: 'mg/dL', refRangeUsed: '0 – 130' },
                    { name: 'VLDL Cholesterol', value: '', unit: 'mg/dL', refRangeUsed: '5 – 40' },
                ],
            },
        ],
        criticalEvents: [],
        createdAt: hoursAgo(2),
    },
    {
        _id: 'demo-lab-2',
        labNumber: 'LAB-2026-0102',
        patientId: { _id: 'demo-pt-rohit', name: 'Rohit Sharma' },
        orderingDoctorId: { name: 'Dr. Raj Sharma' },
        priority: 'urgent',
        status: 'SAMPLE_COLLECTED',
        sample: { collectedAt: hoursAgo(1), quality: 'accepted' },
        tests: [
            {
                code: 'HBA1C',
                name: 'HbA1c (Glycated Hemoglobin)',
                specimen: 'Whole blood (EDTA)',
                parameters: [{ name: 'HbA1c', value: '', unit: '%', refRangeUsed: '4.0 – 5.6' }],
            },
            {
                code: 'FBS',
                name: 'Fasting Blood Sugar',
                specimen: 'Plasma (Fluoride)',
                parameters: [{ name: 'Fasting Glucose', value: '', unit: 'mg/dL', refRangeUsed: '70 – 99' }],
            },
        ],
        criticalEvents: [],
        createdAt: hoursAgo(4),
    },
    {
        _id: 'demo-lab-3',
        labNumber: 'LAB-2026-0103',
        patientId: { _id: 'demo-pt-vikram', name: 'Vikram Mehta' },
        orderingDoctorId: { name: 'Dr. Asha Rao' },
        priority: 'stat',
        status: 'RESULT_PENDING',
        sample: { collectedAt: hoursAgo(3), quality: 'accepted' },
        tests: [
            {
                code: 'CBC',
                name: 'Complete Blood Count (CBC)',
                specimen: 'Whole blood (EDTA)',
                parameters: [
                    { name: 'Hemoglobin', value: '11.2', unit: 'g/dL', refRangeUsed: '13.0 – 17.0', flag: 'low' },
                    { name: 'RBC Count', value: '4.1', unit: 'million/µL', refRangeUsed: '4.5 – 5.5', flag: 'low' },
                    { name: 'Hematocrit (PCV)', value: '34', unit: '%', refRangeUsed: '40 – 50', flag: 'low' },
                    { name: 'MCV', value: '82', unit: 'fL', refRangeUsed: '83 – 101', flag: 'low' },
                    { name: 'MCH', value: '27.5', unit: 'pg', refRangeUsed: '27 – 32', flag: 'normal' },
                    { name: 'MCHC', value: '33', unit: 'g/dL', refRangeUsed: '31.5 – 34.5', flag: 'normal' },
                    { name: 'RDW', value: '', unit: '%', refRangeUsed: '11.5 – 14.5' },
                    { name: 'Total WBC Count', value: '13800', unit: 'cells/µL', refRangeUsed: '4000 – 11000', flag: 'high' },
                    { name: 'Neutrophils', value: '72', unit: '%', refRangeUsed: '40 – 80', flag: 'normal' },
                    { name: 'Lymphocytes', value: '18', unit: '%', refRangeUsed: '20 – 40', flag: 'low' },
                    { name: 'Monocytes', value: '6', unit: '%', refRangeUsed: '2 – 10', flag: 'normal' },
                    { name: 'Eosinophils', value: '3', unit: '%', refRangeUsed: '1 – 6', flag: 'normal' },
                    { name: 'Basophils', value: '1', unit: '%', refRangeUsed: '0 – 2', flag: 'normal' },
                    { name: 'Platelet Count', value: '190000', unit: '/µL', refRangeUsed: '150000 – 410000', flag: 'normal' },
                ],
                techComments: 'Mild microcytic hypochromic picture — peripheral smear review advised.',
            },
        ],
        criticalEvents: [],
        createdAt: hoursAgo(5),
    },
    {
        _id: 'demo-lab-4',
        labNumber: 'LAB-2026-0104',
        patientId: { _id: 'demo-pt-suresh', name: 'Suresh Iyer' },
        orderingDoctorId: { name: 'Dr. Kavita Nair' },
        priority: 'emergency',
        status: 'VERIFICATION_PENDING',
        sample: { collectedAt: hoursAgo(2), quality: 'accepted' },
        tests: [
            {
                code: 'ELEC',
                name: 'Serum Electrolytes',
                specimen: 'Serum',
                parameters: [
                    { name: 'Sodium', value: '129', unit: 'mmol/L', refRangeUsed: '135 – 145', flag: 'low' },
                    { name: 'Potassium', value: '6.8', unit: 'mmol/L', refRangeUsed: '3.5 – 5.1', flag: 'critical' },
                    { name: 'Chloride', value: '101', unit: 'mmol/L', refRangeUsed: '98 – 107', flag: 'normal' },
                    { name: 'Bicarbonate', value: '18', unit: 'mmol/L', refRangeUsed: '22 – 29', flag: 'low' },
                ],
                techComments: 'Potassium repeated on a fresh aliquot — value confirmed. No visible hemolysis.',
            },
        ],
        criticalEvents: [{ parameter: 'Potassium', value: '6.8 mmol/L' }],
        verification: { technicalBy: 'Priya Menon, MLT', technicalAt: hoursAgo(1) },
        createdAt: hoursAgo(3),
    },
    {
        _id: 'demo-lab-5',
        labNumber: 'LAB-2026-0105',
        patientId: { _id: 'demo-pt-anjali', name: 'Anjali Kulkarni' },
        orderingDoctorId: { name: 'Dr. Raj Sharma' },
        priority: 'routine',
        status: 'RELEASED',
        sample: { collectedAt: daysAgo(1, 8), quality: 'accepted' },
        tests: [
            {
                code: 'THY',
                name: 'Thyroid Profile (Free)',
                specimen: 'Serum',
                parameters: [
                    { name: 'TSH', value: '8.4', unit: 'µIU/mL', refRangeUsed: '0.4 – 4.2', flag: 'high' },
                    { name: 'Free T4', value: '0.7', unit: 'ng/dL', refRangeUsed: '0.8 – 1.8', flag: 'low' },
                    { name: 'Free T3', value: '2.4', unit: 'pg/mL', refRangeUsed: '2.3 – 4.2', flag: 'normal' },
                ],
                techComments: 'Pattern consistent with primary hypothyroidism — clinical correlation advised.',
            },
        ],
        criticalEvents: [],
        verification: {
            technicalBy: 'Priya Menon, MLT',
            technicalAt: daysAgo(1, 11),
            pathologistBy: 'Dr. Sunil Gupta, MD (Path)',
            pathologistAt: daysAgo(1, 12),
        },
        releasedAt: daysAgo(1, 12),
        locked: true,
        amendments: [{ at: hoursAgo(20), reason: 'Free T4 corrected from 7.0 to 0.7 ng/dL — transcription error at entry.' }],
        createdAt: daysAgo(1, 7),
    },
    {
        _id: 'demo-lab-6',
        labNumber: 'LAB-2026-0106',
        patientId: { _id: 'demo-pt-rohit', name: 'Rohit Sharma' },
        orderingDoctorId: { name: 'Dr. Asha Rao' },
        priority: 'urgent',
        status: 'REJECTED',
        sample: {
            collectedAt: hoursAgo(6),
            quality: 'hemolysed',
            rejectedReason: 'Gross hemolysis noted during collection — potassium and liver enzymes unreliable.',
            recollectionRequired: true,
        },
        tests: [
            {
                code: 'LFT',
                name: 'Liver Function Test (LFT)',
                specimen: 'Serum',
                parameters: [
                    { name: 'ALT (SGPT)', value: '', unit: 'U/L', refRangeUsed: '7 – 56' },
                    { name: 'AST (SGOT)', value: '', unit: 'U/L', refRangeUsed: '10 – 40' },
                    { name: 'Alkaline Phosphatase', value: '', unit: 'U/L', refRangeUsed: '44 – 147' },
                    { name: 'Total Bilirubin', value: '', unit: 'mg/dL', refRangeUsed: '0.1 – 1.2' },
                    { name: 'Albumin', value: '', unit: 'g/dL', refRangeUsed: '3.5 – 5.5' },
                ],
            },
        ],
        criticalEvents: [],
        createdAt: hoursAgo(7),
    },
];

const DEMO_HISTORY: Record<string, HistoryPoint[]> = {
    Potassium: [
        { at: daysAgo(30), value: '4.2', unit: 'mmol/L', flag: 'normal', refRangeUsed: '3.5 – 5.1' },
        { at: daysAgo(14), value: '4.8', unit: 'mmol/L', flag: 'normal', refRangeUsed: '3.5 – 5.1' },
        { at: daysAgo(7), value: '5.4', unit: 'mmol/L', flag: 'high', refRangeUsed: '3.5 – 5.1' },
        { at: daysAgo(2), value: '5.9', unit: 'mmol/L', flag: 'high', refRangeUsed: '3.5 – 5.1' },
    ],
    Hemoglobin: [
        { at: daysAgo(120), value: '13.4', unit: 'g/dL', flag: 'normal', refRangeUsed: '13.0 – 17.0' },
        { at: daysAgo(60), value: '12.6', unit: 'g/dL', flag: 'low', refRangeUsed: '13.0 – 17.0' },
        { at: daysAgo(21), value: '11.9', unit: 'g/dL', flag: 'low', refRangeUsed: '13.0 – 17.0' },
    ],
    TSH: [
        { at: daysAgo(180), value: '3.8', unit: 'µIU/mL', flag: 'normal', refRangeUsed: '0.4 – 4.2' },
        { at: daysAgo(90), value: '5.1', unit: 'µIU/mL', flag: 'high', refRangeUsed: '0.4 – 4.2' },
        { at: daysAgo(30), value: '6.3', unit: 'µIU/mL', flag: 'high', refRangeUsed: '0.4 – 4.2' },
    ],
    Sodium: [
        { at: daysAgo(30), value: '138', unit: 'mmol/L', flag: 'normal', refRangeUsed: '135 – 145' },
        { at: daysAgo(7), value: '133', unit: 'mmol/L', flag: 'low', refRangeUsed: '135 – 145' },
        { at: daysAgo(2), value: '131', unit: 'mmol/L', flag: 'low', refRangeUsed: '135 – 145' },
    ],
    'Total WBC Count': [
        { at: daysAgo(90), value: '8200', unit: 'cells/µL', flag: 'normal', refRangeUsed: '4000 – 11000' },
        { at: daysAgo(30), value: '10400', unit: 'cells/µL', flag: 'normal', refRangeUsed: '4000 – 11000' },
        { at: daysAgo(4), value: '12100', unit: 'cells/µL', flag: 'high', refRangeUsed: '4000 – 11000' },
    ],
    'Platelet Count': [
        { at: daysAgo(90), value: '240000', unit: '/µL', flag: 'normal', refRangeUsed: '150000 – 410000' },
        { at: daysAgo(30), value: '215000', unit: '/µL', flag: 'normal', refRangeUsed: '150000 – 410000' },
    ],
};

/* ───────────────────────── Reads (with fallback) ──────────────────── */

export interface WithDemo<T> {
    data: T;
    demo: boolean;
}

export interface WorklistQuery {
    status?: LabStatus | '';
    priority?: LabPriority | '';
    q?: string;
}

function demoFilter(items: WorklistItem[], params?: WorklistQuery): WorklistItem[] {
    let out = items;
    if (params?.status) out = out.filter((i) => i.status === params.status);
    if (params?.priority) out = out.filter((i) => i.priority === params.priority);
    if (params?.q?.trim()) {
        const q = params.q.trim().toLowerCase();
        out = out.filter((i) =>
            [i.labNumber, i.patientId?.name, i.orderingDoctorId?.name, ...i.tests.map((t) => t.name), ...i.tests.map((t) => t.code)]
                .filter(Boolean)
                .some((s) => String(s).toLowerCase().includes(q))
        );
    }
    return out;
}

export async function fetchWorklist(params?: WorklistQuery): Promise<WithDemo<WorklistItem[]>> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.priority) qs.set('priority', params.priority);
    if (params?.q?.trim()) qs.set('q', params.q.trim());
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    try {
        const body = await request<{ items?: WorklistItem[] } | WorklistItem[]>(`/api/lis/worklist${suffix}`);
        const items = Array.isArray(body) ? body : Array.isArray(body?.items) ? body.items : [];
        return { data: items, demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) return { data: demoFilter(DEMO_ITEMS, params), demo: true };
        throw err;
    }
}

export async function fetchWorklistItem(id: string): Promise<WithDemo<WorklistItem>> {
    const local = DEMO_ITEMS.find((i) => i._id === id);
    try {
        const data = await request<WorklistItem>(`/api/lis/worklist/${encodeURIComponent(id)}`);
        return { data, demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError || (err instanceof ApiHttpError && err.status === 404)) {
            if (local) return { data: structuredClone(local), demo: true };
            return { data: structuredClone(DEMO_ITEMS[2]), demo: true };
        }
        throw err;
    }
}

export async function fetchHistory(patientId: string, parameter: string): Promise<WithDemo<HistoryPoint[]>> {
    const qs = new URLSearchParams({ patientId, parameter });
    try {
        const data = await request<HistoryPoint[]>(`/api/lis/history?${qs.toString()}`);
        return { data: Array.isArray(data) ? data : [], demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) return { data: DEMO_HISTORY[parameter] || [], demo: true };
        throw err;
    }
}

/* ─────────────────────────────── Writes ───────────────────────────── */
/**
 * Writes throw ApiOfflineError when the backend is down; callers decide how
 * to simulate locally (the UI never fakes a server success silently).
 */

export interface ResultsPayload {
    tests: Array<{
        code: string;
        parameters: Array<{ name: string; value: string; comments?: string }>;
        techComments?: string;
    }>;
}

export function postCollect(id: string) {
    return request<WorklistItem>(`/api/lis/worklist/${encodeURIComponent(id)}/collect`, { method: 'POST' });
}

export function patchSample(id: string, body: { quality: SampleQuality; rejectedReason?: string }) {
    return request<WorklistItem>(`/api/lis/worklist/${encodeURIComponent(id)}/sample`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
}

export function putResults(id: string, body: ResultsPayload) {
    return request<WorklistItem>(`/api/lis/worklist/${encodeURIComponent(id)}/results`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

export function postVerify(id: string, body: { level: 'technical' | 'pathologist' }) {
    return request<WorklistItem>(`/api/lis/worklist/${encodeURIComponent(id)}/verify`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export function postCriticalAck(id: string, body: { index: number; notifiedWho: string; notificationMethod: string }) {
    return request<WorklistItem>(`/api/lis/worklist/${encodeURIComponent(id)}/critical/ack`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export function postRelease(id: string) {
    return request<WorklistItem>(`/api/lis/worklist/${encodeURIComponent(id)}/release`, { method: 'POST' });
}

export function postAmend(id: string, body: { reason: string } & ResultsPayload) {
    return request<WorklistItem>(`/api/lis/worklist/${encodeURIComponent(id)}/amend`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

/* ───────────────────── Flags, ranges & entry checks ───────────────── */

/** Parse a reference range of the shape "low – high" (any dash flavor). */
export function parseRefRange(ref?: string | null): { low: number; high: number } | null {
    if (!ref) return null;
    const m = String(ref).replace(/,/g, '').match(/(-?\d+(?:\.\d+)?)\s*[–—-]\s*(-?\d+(?:\.\d+)?)/);
    if (!m) return null;
    const low = parseFloat(m[1]);
    const high = parseFloat(m[2]);
    if (Number.isNaN(low) || Number.isNaN(high) || high < low) return null;
    return { low, high };
}

export function numericValue(value?: string | null): number | null {
    if (value == null) return null;
    const v = String(value).replace(/,/g, '').trim();
    if (!v || !/^-?\d+(\.\d+)?$/.test(v)) return null;
    const n = parseFloat(v);
    return Number.isNaN(n) ? null : n;
}

/**
 * Client-side provisional flag preview for numeric values against a parseable
 * "low – high" reference range. Advisory only — the server's flag is
 * authoritative once results are saved.
 */
export function provisionalFlag(value?: string | null, refRange?: string | null): ResultFlag {
    const n = numericValue(value);
    const range = parseRefRange(refRange);
    if (n === null || !range) return null;
    if (n < range.low) return 'low';
    if (n > range.high) return 'high';
    return 'normal';
}

/** Server flag if present, else the local provisional preview. */
export function effectiveFlag(p: LabParameter, draftValue?: string): ResultFlag {
    if (draftValue !== undefined && draftValue !== (p.value ?? '')) {
        return provisionalFlag(draftValue, p.refRangeUsed);
    }
    return p.flag ?? provisionalFlag(p.value, p.refRangeUsed);
}

export const TEXT_SUGGESTIONS = [
    'Positive',
    'Negative',
    'Reactive',
    'Non-reactive',
    'Detected',
    'Not Detected',
    'Equivocal',
] as const;

/** True when the parameter is best entered as free text (no numeric range). */
export function isTextParameter(p: LabParameter): boolean {
    return parseRefRange(p.refRangeUsed) === null;
}

export interface EntryCheck {
    kind: 'missing' | 'diff-sum' | 'range';
    severity: 'warning' | 'info';
    message: string;
}

const DIFFERENTIAL_NAMES = ['neutrophils', 'lymphocytes', 'monocytes', 'eosinophils', 'basophils'];

/**
 * Deterministic, client-side automated entry checks. These never block a
 * workflow action — verification and release remain with authorized
 * laboratory professionals.
 */
export function runEntryChecks(tests: LabTest[]): EntryCheck[] {
    const checks: EntryCheck[] = [];

    const missing: string[] = [];
    for (const t of tests) {
        for (const p of t.parameters) {
            if (!String(p.value ?? '').trim()) missing.push(p.name);
        }
    }
    if (missing.length > 0) {
        const shown = missing.slice(0, 4).join(', ');
        checks.push({
            kind: 'missing',
            severity: 'info',
            message: `${missing.length} parameter${missing.length > 1 ? 's' : ''} without a result: ${shown}${missing.length > 4 ? '…' : ''}`,
        });
    }

    for (const t of tests) {
        const diff = DIFFERENTIAL_NAMES.map((n) =>
            t.parameters.find((p) => p.name.toLowerCase().includes(n))
        );
        if (diff.every(Boolean)) {
            const values = diff.map((p) => numericValue(p!.value));
            if (values.every((v) => v !== null)) {
                const sum = values.reduce<number>((a, v) => a + (v as number), 0);
                if (Math.abs(sum - 100) > 2) {
                    checks.push({
                        kind: 'diff-sum',
                        severity: 'warning',
                        message: `${t.name}: differential percentages sum to ${sum.toFixed(1)}% (expected ≈100%).`,
                    });
                }
            }
        }
    }

    for (const t of tests) {
        for (const p of t.parameters) {
            const n = numericValue(p.value);
            const range = parseRefRange(p.refRangeUsed);
            if (n === null || !range) continue;
            const tooHigh = range.high > 0 && n > range.high * 3;
            const tooLow = range.low > 0 && n < range.low / 3;
            if (tooHigh || tooLow) {
                checks.push({
                    kind: 'range',
                    severity: 'warning',
                    message: `${p.name} = ${p.value} ${p.unit || ''} is ${tooHigh ? '>3× the upper' : '<⅓ of the lower'} reference limit — unusual — re-check entry.`,
                });
            }
        }
    }

    return checks;
}

/* ─────────────────────── Display metadata & utils ─────────────────── */

export const STATUS_FLOW: LabStatus[] = [
    'ORDERED',
    'SAMPLE_COLLECTED',
    'PROCESSING',
    'RESULT_PENDING',
    'VERIFICATION_PENDING',
    'VERIFIED',
    'RELEASED',
];

export const STATUS_META: Record<LabStatus, { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'outline' }> = {
    ORDERED: { label: 'Ordered', tone: 'neutral' },
    SAMPLE_COLLECTED: { label: 'Sample collected', tone: 'info' },
    PROCESSING: { label: 'Processing', tone: 'info' },
    RESULT_PENDING: { label: 'Result pending', tone: 'warning' },
    VERIFICATION_PENDING: { label: 'Verification pending', tone: 'warning' },
    VERIFIED: { label: 'Verified', tone: 'brand' },
    RELEASED: { label: 'Released', tone: 'success' },
    REJECTED: { label: 'Rejected', tone: 'danger' },
};

export const PRIORITY_META: Record<LabPriority, { label: string; tone: 'neutral' | 'warning' | 'danger'; pulse: boolean }> = {
    routine: { label: 'Routine', tone: 'neutral', pulse: false },
    urgent: { label: 'Urgent', tone: 'warning', pulse: false },
    stat: { label: 'STAT', tone: 'danger', pulse: true },
    emergency: { label: 'Emergency', tone: 'danger', pulse: true },
};

export const SAMPLE_QUALITIES: { value: SampleQuality; label: string }[] = [
    { value: 'accepted', label: 'Accepted' },
    { value: 'hemolysed', label: 'Hemolysed' },
    { value: 'lipemic', label: 'Lipemic' },
    { value: 'clotted', label: 'Clotted' },
    { value: 'insufficient', label: 'Insufficient quantity' },
    { value: 'wrong_container', label: 'Wrong container' },
    { value: 'incorrect_sample', label: 'Incorrect sample' },
    { value: 'rejected', label: 'Rejected (other reason)' },
    { value: 'other', label: 'Other' },
];

export function unackedCriticals(item: WorklistItem): CriticalEvent[] {
    return (item.criticalEvents || []).filter((e) => !e.acknowledgedAt);
}

export function formatWhen(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return (
        d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' · ' +
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    );
}

export function formatDay(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function isToday(iso?: string): boolean {
    if (!iso) return false;
    const d = new Date(iso);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
