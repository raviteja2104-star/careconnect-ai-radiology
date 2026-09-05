'use client';

/**
 * Teleradiology API client — talks to the real backend at
 * http://localhost:5000/api/teleradiology/worklist and degrades gracefully to
 * a realistic in-memory demo dataset when the API is unreachable or the
 * caller is unauthenticated. Reads return `{ data, demo }` so pages can show
 * a "Demo data — backend offline" badge; writes are simulated against the
 * demo store when offline (and flagged `demo: true`) so guarded flows such as
 * claim → report → sign → addendum stay demoable without the frontend ever
 * crashing or silently faking a server success.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
const WORKLIST = '/api/teleradiology/worklist';

/* ────────────────────────────── Types ────────────────────────────── */

export type Modality = 'XR' | 'CT' | 'MRI' | 'US' | 'MG' | 'PET' | 'SPECT' | 'FL';
export type Priority = 'routine' | 'urgent' | 'stat' | 'emergency';
export type StudyStatus =
    | 'ORDERED' | 'RECEIVED' | 'UNREAD' | 'IN_PROGRESS'
    | 'DRAFT' | 'REVIEW' | 'SIGNED' | 'DELIVERED';

export const STATUS_FLOW: StudyStatus[] = [
    'ORDERED', 'RECEIVED', 'UNREAD', 'IN_PROGRESS', 'DRAFT', 'REVIEW', 'SIGNED', 'DELIVERED',
];

export interface AiFinding {
    finding: string;
    confidence: number; // 0–1
    urgency?: 'critical' | 'high' | 'moderate' | 'low' | string;
    reason?: string;
}

export interface ReportSections {
    technique?: string;
    comparison?: string;
    findings?: string;
    impression?: string;
    recommendations?: string;
}

export const REPORT_SECTION_KEYS: (keyof ReportSections)[] = [
    'technique', 'comparison', 'findings', 'impression', 'recommendations',
];

export interface ReportVersion {
    versionNumber?: number;
    sections?: ReportSections;
    reason?: string;
    createdAt?: string;
    authorName?: string;
}

export interface PopulatedRef {
    _id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
}

export interface Study {
    _id: string;
    accessionNumber: string;
    studyInstanceUID: string;
    modality: Modality;
    bodyPart?: string;
    contrast?: boolean;
    clinicalIndication?: string;
    priority: Priority;
    status: StudyStatus;
    assignedRadiologistId?: PopulatedRef | string | null;
    assignmentReason?: string;
    aiTriage?: { processed?: boolean; flagged?: boolean; findings?: AiFinding[] };
    tat?: {
        orderedAt?: string; receivedAt?: string; assignedAt?: string; openedAt?: string;
        reportStartedAt?: string; signedAt?: string; deliveredAt?: string;
    };
    slaMinutes?: number;
    studyAgeMinutes?: number;
    slaRemainingMinutes?: number;
    slaBreached?: boolean;
    breach?: boolean; // some payloads use a bare `breach` flag — read via isBreached()
    report?: { sections?: ReportSections; versions?: ReportVersion[]; signedAt?: string; signatureHash?: string };
    criticalFinding?: { flagged?: boolean; description?: string; acknowledgedAt?: string };
    patientId?: PopulatedRef | string | null;
}

export interface WorklistFilters {
    status?: string;
    modality?: string;
    priority?: string;
    aiFlagged?: boolean;
    slaBreached?: boolean;
    assignedToMe?: boolean;
}

export interface WorklistStats {
    count?: number;
    p50?: number;
    p90?: number;
    p95?: number;
    p99?: number;
    statAvg?: number;
    routineAvg?: number;
    breaches?: number;
    byStatus?: Record<string, number>;
    byPriority?: Record<string, number>;
    radiologists?: { name?: string; _id?: string; assigned?: number; signed?: number; active?: boolean }[];
    [key: string]: unknown;
}

export interface WithDemo<T> {
    data: T;
    demo: boolean;
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

/** Thrown for HTTP errors that carry a meaningful body (400 validation, 409 guards). */
export class ApiHttpError extends Error {
    status: number;
    body: Record<string, unknown>;
    constructor(status: number, body: Record<string, unknown>) {
        super(String(body?.message || body?.error || `Request failed (${status})`));
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
            // A real JWT was sent and rejected (expired/invalid): clear it and re-login.
            try {
                window.localStorage.removeItem('token');
                window.localStorage.removeItem('cc-user');
            } catch { /* storage unavailable */ }
            window.location.assign('/login');
            throw new ApiOfflineError('Session expired');
        }
        // No token (demo visitor): degrade to demo data as before.
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

export const DEMO_ME = { _id: 'rad-demo-me', name: 'Dr. Meera Krishnan' };
const RAD_2 = { _id: 'rad-demo-2', name: 'Dr. Arjun Rao' };
const RAD_3 = { _id: 'rad-demo-3', name: 'Dr. Sanjana Iyer' };

const minAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

interface DemoSeed {
    id: string; acc: string; uid: string; modality: Modality; bodyPart: string;
    contrast?: boolean; indication: string; priority: Priority; status: StudyStatus;
    assigned?: PopulatedRef | null; assignmentReason?: string; patient: string;
    orderedMinAgo: number; sla: number;
    ai?: { flagged: boolean; findings: AiFinding[] };
    report?: { sections?: ReportSections; signedMinAgo?: number; versions?: ReportVersion[] };
    critical?: { description: string; ackMinAgo?: number };
}

const SEEDS: DemoSeed[] = [
    {
        id: 'demo-trs-001', acc: 'ACC-26-04412', uid: '1.2.826.0.1.3680043.8.498.4412', modality: 'CT',
        bodyPart: 'Head', indication: 'Fall from height, GCS 12, on anticoagulants', priority: 'emergency',
        status: 'UNREAD', assigned: null, patient: 'Suresh Menon', orderedMinAgo: 24, sla: 30,
        ai: {
            flagged: true,
            findings: [
                { finding: 'Acute subdural hematoma, right convexity', confidence: 0.94, urgency: 'critical', reason: 'Crescentic hyperdensity with 6 mm midline shift' },
                { finding: 'Calvarial fracture, right parietal', confidence: 0.71, urgency: 'high', reason: 'Linear lucency crossing coronal suture' },
            ],
        },
    },
    {
        id: 'demo-trs-002', acc: 'ACC-26-04409', uid: '1.2.826.0.1.3680043.8.498.4409', modality: 'CT',
        bodyPart: 'Pulmonary angiogram', contrast: true, indication: 'Pleuritic chest pain, D-dimer 4.2, suspected PE',
        priority: 'stat', status: 'IN_PROGRESS', assigned: DEMO_ME, assignmentReason: 'Chest fellowship',
        patient: 'Farah Sheikh', orderedMinAgo: 52, sla: 60,
        ai: {
            flagged: true,
            findings: [
                { finding: 'Segmental pulmonary embolism, right lower lobe', confidence: 0.88, urgency: 'critical', reason: 'Central filling defect in RLL segmental artery' },
            ],
        },
    },
    {
        id: 'demo-trs-003', acc: 'ACC-26-04398', uid: '1.2.826.0.1.3680043.8.498.4398', modality: 'XR',
        bodyPart: 'Chest (portable)', indication: 'Post central-line placement, ICU bed 4', priority: 'stat',
        status: 'UNREAD', assigned: null, patient: 'Lakshmi Narayanan', orderedMinAgo: 74, sla: 45,
    },
    {
        id: 'demo-trs-004', acc: 'ACC-26-04390', uid: '1.2.826.0.1.3680043.8.498.4390', modality: 'MRI',
        bodyPart: 'Brain', contrast: true, indication: 'Stroke protocol follow-up, left MCA territory', priority: 'urgent',
        status: 'DRAFT', assigned: DEMO_ME, patient: 'Ibrahim Qureshi', orderedMinAgo: 130, sla: 240,
        report: {
            sections: {
                technique: 'Multiplanar multisequence MRI of the brain with and without gadolinium, including DWI/ADC, FLAIR, GRE and post-contrast T1.',
                comparison: 'CT head dated 06-Aug-2026.',
                findings: 'Restricted diffusion in the left MCA territory involving the insular cortex, consistent with subacute infarct. No hemorrhagic transformation on GRE.',
            },
        },
    },
    {
        id: 'demo-trs-005', acc: 'ACC-26-04371', uid: '1.2.826.0.1.3680043.8.498.4371', modality: 'XR',
        bodyPart: 'Knee (bilateral)', indication: 'Chronic pain, evaluate osteoarthritis', priority: 'routine',
        status: 'UNREAD', assigned: null, patient: 'Kavita Deshpande', orderedMinAgo: 180, sla: 720,
    },
    {
        id: 'demo-trs-006', acc: 'ACC-26-04365', uid: '1.2.826.0.1.3680043.8.498.4365', modality: 'US',
        bodyPart: 'Abdomen', indication: 'RUQ pain, suspected cholelithiasis', priority: 'routine',
        status: 'RECEIVED', assigned: null, patient: 'Joseph Varghese', orderedMinAgo: 95, sla: 720,
    },
    {
        id: 'demo-trs-007', acc: 'ACC-26-04352', uid: '1.2.826.0.1.3680043.8.498.4352', modality: 'CT',
        bodyPart: 'Abdomen/Pelvis', contrast: true, indication: 'RIF pain, leukocytosis — r/o appendicitis', priority: 'urgent',
        status: 'REVIEW', assigned: RAD_2, assignmentReason: 'Load balancing', patient: 'Ananya Bhattacharya',
        orderedMinAgo: 160, sla: 240,
        ai: {
            flagged: true,
            findings: [
                { finding: 'Acute appendicitis', confidence: 0.81, urgency: 'high', reason: 'Dilated 11 mm appendix with periappendiceal fat stranding' },
            ],
        },
        report: {
            sections: {
                technique: 'Contrast-enhanced CT of the abdomen and pelvis in portal venous phase.',
                comparison: 'None.',
                findings: 'The appendix is dilated to 11 mm with wall enhancement and periappendiceal fat stranding. No drainable collection. Trace pelvic free fluid.',
                impression: '1. Acute uncomplicated appendicitis.\n2. No perforation or abscess.',
                recommendations: 'Surgical consultation.',
            },
        },
    },
    {
        id: 'demo-trs-008', acc: 'ACC-26-04344', uid: '1.2.826.0.1.3680043.8.498.4344', modality: 'MG',
        bodyPart: 'Bilateral screening mammogram', indication: 'Annual screening, family history of breast cancer',
        priority: 'routine', status: 'UNREAD', assigned: null, patient: 'Rekha Pillai', orderedMinAgo: 300, sla: 1440,
        ai: {
            flagged: true,
            findings: [
                { finding: 'Architectural distortion, left upper-outer quadrant', confidence: 0.62, urgency: 'moderate', reason: 'Spiculated density on CC and MLO views' },
            ],
        },
    },
    {
        id: 'demo-trs-009', acc: 'ACC-26-04330', uid: '1.2.826.0.1.3680043.8.498.4330', modality: 'MRI',
        bodyPart: 'Lumbar spine', indication: 'Chronic low back pain with left L5 radiculopathy', priority: 'routine',
        status: 'SIGNED', assigned: RAD_2, patient: 'Devendra Chauhan', orderedMinAgo: 420, sla: 720,
        report: {
            sections: {
                technique: 'Sagittal and axial T1, T2 and STIR sequences of the lumbar spine without contrast.',
                comparison: 'Radiographs dated 12-Jul-2026.',
                findings: 'L4-L5 diffuse disc bulge with left paracentral protrusion contacting the traversing left L5 nerve root. Mild facet arthropathy. Conus normal.',
                impression: '1. L4-L5 left paracentral disc protrusion with left L5 nerve root contact.\n2. No canal stenosis.',
                recommendations: 'Clinical correlation; consider targeted physiotherapy.',
            },
            signedMinAgo: 120,
        },
    },
    {
        id: 'demo-trs-010', acc: 'ACC-26-04318', uid: '1.2.826.0.1.3680043.8.498.4318', modality: 'CT',
        bodyPart: 'Head', indication: 'Sudden severe headache, thunderclap onset', priority: 'stat',
        status: 'DELIVERED', assigned: RAD_3, patient: 'Gurpreet Kaur', orderedMinAgo: 480, sla: 60,
        report: {
            sections: {
                technique: 'Axial non-contrast CT of the head.',
                comparison: 'None.',
                findings: 'Diffuse hyperdensity within the basal cisterns and sylvian fissures consistent with acute subarachnoid hemorrhage. No hydrocephalus.',
                impression: '1. Acute subarachnoid hemorrhage.\n2. Recommend CT angiography to assess for aneurysm.',
                recommendations: 'Immediate neurosurgical referral; CTA circle of Willis.',
            },
            signedMinAgo: 415,
        },
        critical: { description: 'Acute subarachnoid hemorrhage — referring physician informed', ackMinAgo: 410 },
    },
    {
        id: 'demo-trs-011', acc: 'ACC-26-04305', uid: '1.2.826.0.1.3680043.8.498.4305', modality: 'PET',
        bodyPart: 'Whole body FDG', indication: 'Carcinoma breast — staging', priority: 'routine',
        status: 'ORDERED', assigned: null, patient: 'Sunita Agarwal', orderedMinAgo: 40, sla: 2880,
    },
    {
        id: 'demo-trs-012', acc: 'ACC-26-04299', uid: '1.2.826.0.1.3680043.8.498.4299', modality: 'US',
        bodyPart: 'Lower limb venous Doppler', indication: 'Left calf swelling post-flight — r/o DVT', priority: 'urgent',
        status: 'IN_PROGRESS', assigned: RAD_3, patient: 'Nikhil Kulkarni', orderedMinAgo: 200, sla: 240,
        ai: {
            flagged: true,
            findings: [
                { finding: 'Deep vein thrombosis, left popliteal vein', confidence: 0.85, urgency: 'critical', reason: 'Non-compressible popliteal vein with echogenic thrombus' },
            ],
        },
        critical: { description: 'Free-floating thrombus tail in left popliteal vein' },
    },
];

function seedToStudy(s: DemoSeed): Study {
    const ordered = s.orderedMinAgo;
    const signedAt = s.report?.signedMinAgo != null ? minAgo(s.report.signedMinAgo) : undefined;
    const started = ['IN_PROGRESS', 'DRAFT', 'REVIEW', 'SIGNED', 'DELIVERED'].includes(s.status);
    return {
        _id: s.id,
        accessionNumber: s.acc,
        studyInstanceUID: s.uid,
        modality: s.modality,
        bodyPart: s.bodyPart,
        contrast: s.contrast ?? false,
        clinicalIndication: s.indication,
        priority: s.priority,
        status: s.status,
        assignedRadiologistId: s.assigned ?? null,
        assignmentReason: s.assignmentReason,
        patientId: { _id: `pt-${s.id}`, name: s.patient },
        aiTriage: s.ai
            ? { processed: true, flagged: s.ai.flagged, findings: s.ai.findings }
            : { processed: true, flagged: false, findings: [] },
        slaMinutes: s.sla,
        tat: {
            orderedAt: minAgo(ordered),
            receivedAt: s.status !== 'ORDERED' ? minAgo(Math.max(ordered - 4, 1)) : undefined,
            assignedAt: s.assigned ? minAgo(Math.max(ordered - 8, 1)) : undefined,
            openedAt: started ? minAgo(Math.max(ordered - 10, 1)) : undefined,
            reportStartedAt: s.report ? minAgo(Math.max(ordered - 12, 1)) : undefined,
            signedAt,
            deliveredAt: s.status === 'DELIVERED' && s.report?.signedMinAgo != null
                ? minAgo(Math.max(s.report.signedMinAgo - 3, 1))
                : undefined,
        },
        report: s.report
            ? {
                sections: { ...s.report.sections },
                versions: s.report.versions ?? [],
                signedAt,
                signatureHash: signedAt ? pseudoHash(s.id + signedAt) : undefined,
            }
            : { sections: {}, versions: [] },
        criticalFinding: s.critical
            ? {
                flagged: true,
                description: s.critical.description,
                acknowledgedAt: s.critical.ackMinAgo != null ? minAgo(s.critical.ackMinAgo) : undefined,
            }
            : { flagged: false },
    };
}

function pseudoHash(input: string): string {
    let h1 = 0x811c9dc5;
    let h2 = 0x1000193;
    for (let i = 0; i < input.length; i++) {
        h1 = Math.imul(h1 ^ input.charCodeAt(i), 0x01000193) >>> 0;
        h2 = Math.imul(h2 + input.charCodeAt(i), 0x85ebca6b) >>> 0;
    }
    return `sha256:${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}${(h1 ^ h2).toString(16).padStart(8, '0')}`;
}

/** Mutable in-memory demo store, shared by demo reads and simulated writes. */
let demoStore: Study[] | null = null;

function getDemoStore(): Study[] {
    if (!demoStore) demoStore = SEEDS.map(seedToStudy);
    return demoStore;
}

function findDemo(studyId: string): Study {
    const s = getDemoStore().find((x) => x._id === studyId || x.accessionNumber === studyId);
    if (!s) throw new ApiHttpError(404, { message: 'Study not found' });
    return s;
}

/* ─────────────── Derived metrics (defensive, shared) ──────────────── */

export function studyAgeMin(s: Study): number {
    if (typeof s.studyAgeMinutes === 'number') return s.studyAgeMinutes;
    const start = s.tat?.receivedAt || s.tat?.orderedAt;
    if (!start) return 0;
    const t = new Date(start).getTime();
    if (Number.isNaN(t)) return 0;
    return Math.max(0, Math.round((Date.now() - t) / 60_000));
}

export function slaRemainingMin(s: Study): number | null {
    if (typeof s.slaRemainingMinutes === 'number') return s.slaRemainingMinutes;
    if (typeof s.slaMinutes !== 'number') return null;
    // Once signed, the clock stops at signing.
    if (s.tat?.signedAt && (s.tat?.receivedAt || s.tat?.orderedAt)) {
        const start = new Date(s.tat.receivedAt || s.tat.orderedAt!).getTime();
        const end = new Date(s.tat.signedAt).getTime();
        if (!Number.isNaN(start) && !Number.isNaN(end)) {
            return Math.round(s.slaMinutes - (end - start) / 60_000);
        }
    }
    return s.slaMinutes - studyAgeMin(s);
}

export function isBreached(s: Study): boolean {
    if (typeof s.slaBreached === 'boolean') return s.slaBreached;
    if (typeof s.breach === 'boolean') return s.breach;
    const rem = slaRemainingMin(s);
    return rem != null && rem < 0;
}

export function isSignedOrLater(s: Study): boolean {
    return s.status === 'SIGNED' || s.status === 'DELIVERED';
}

export function assignedName(s: Study): string | null {
    const a = s.assignedRadiologistId;
    if (!a) return null;
    if (typeof a === 'string') return a ? 'Assigned' : null;
    return a.name || [a.firstName, a.lastName].filter(Boolean).join(' ') || 'Assigned';
}

export function assignedId(s: Study): string | null {
    const a = s.assignedRadiologistId;
    if (!a) return null;
    return typeof a === 'string' ? a : a._id || null;
}

export function patientName(s: Study): string {
    const p = s.patientId;
    if (!p) return 'Unknown patient';
    if (typeof p === 'string') return `Patient ${p.slice(-6)}`;
    return p.name || [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown patient';
}

export function patientKey(s: Study): string | null {
    const p = s.patientId;
    if (!p) return null;
    return typeof p === 'string' ? p : p._id || null;
}

export function topAiFinding(s: Study): AiFinding | null {
    const f = s.aiTriage?.findings;
    if (!f || f.length === 0) return null;
    return [...f].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0];
}

export function humanizeMin(minutes: number | null | undefined): string {
    if (minutes == null || Number.isNaN(minutes)) return '—';
    const m = Math.round(Math.abs(minutes));
    const sign = minutes < 0 ? '-' : '';
    if (m < 60) return `${sign}${m}m`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    if (h < 24) return rm ? `${sign}${h}h ${rm}m` : `${sign}${h}h`;
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return rh ? `${sign}${d}d ${rh}h` : `${sign}${d}d`;
}

/* ───────────────────────── Reads (with fallback) ──────────────────── */

function extractStudies(raw: unknown): Study[] {
    if (Array.isArray(raw)) return raw as Study[];
    if (raw && typeof raw === 'object') {
        const o = raw as Record<string, unknown>;
        for (const k of ['studies', 'data', 'worklist', 'items', 'results']) {
            if (Array.isArray(o[k])) return o[k] as Study[];
        }
    }
    return [];
}

function filterDemo(list: Study[], f: WorklistFilters): Study[] {
    return list.filter((s) => {
        if (f.status && s.status !== f.status) return false;
        if (f.modality && s.modality !== f.modality) return false;
        if (f.priority && s.priority !== f.priority) return false;
        if (f.aiFlagged && !s.aiTriage?.flagged) return false;
        if (f.slaBreached && !isBreached(s)) return false;
        if (f.assignedToMe && assignedId(s) !== DEMO_ME._id) return false;
        return true;
    });
}

const PRIORITY_RANK: Record<Priority, number> = { emergency: 0, stat: 1, urgent: 2, routine: 3 };

function sortWorklist(list: Study[]): Study[] {
    return [...list].sort((a, b) => {
        const p = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
        if (p !== 0) return p;
        return studyAgeMin(b) - studyAgeMin(a);
    });
}

export async function fetchWorklist(filters: WorklistFilters = {}): Promise<WithDemo<Study[]>> {
    const qs = new URLSearchParams();
    if (filters.status) qs.set('status', filters.status);
    if (filters.modality) qs.set('modality', filters.modality);
    if (filters.priority) qs.set('priority', filters.priority);
    if (filters.aiFlagged) qs.set('aiFlagged', 'true');
    if (filters.slaBreached) qs.set('slaBreached', 'true');
    if (filters.assignedToMe) qs.set('assignedToMe', 'true');
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    try {
        const raw = await request<unknown>(`${WORKLIST}${suffix}`);
        return { data: sortWorklist(extractStudies(raw)), demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) {
            return { data: sortWorklist(filterDemo(getDemoStore(), filters)), demo: true };
        }
        throw err;
    }
}

function percentileOf(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
    return Math.round(sorted[Math.max(0, idx)]);
}

function demoStats(): WorklistStats {
    const list = getDemoStore();
    const signed = list.filter((s) => s.tat?.signedAt);
    const tatOf = (s: Study) => {
        const start = new Date(s.tat!.receivedAt || s.tat!.orderedAt!).getTime();
        return Math.round((new Date(s.tat!.signedAt!).getTime() - start) / 60_000);
    };
    const tats = signed.map(tatOf).filter((n) => !Number.isNaN(n) && n >= 0);
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    for (const s of list) {
        byStatus[s.status] = (byStatus[s.status] || 0) + 1;
        byPriority[s.priority] = (byPriority[s.priority] || 0) + 1;
    }
    const statTats = signed.filter((s) => s.priority === 'stat' || s.priority === 'emergency').map(tatOf);
    const routineTats = signed.filter((s) => s.priority === 'routine').map(tatOf);
    const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);
    return {
        count: list.length,
        p50: percentileOf(tats, 50),
        p90: percentileOf(tats, 90),
        p95: percentileOf(tats, 95),
        p99: percentileOf(tats, 99),
        statAvg: avg(statTats),
        routineAvg: avg(routineTats),
        breaches: list.filter(isBreached).length,
        byStatus,
        byPriority,
        radiologists: [
            { _id: DEMO_ME._id, name: DEMO_ME.name, assigned: list.filter((s) => assignedId(s) === DEMO_ME._id).length, signed: 14, active: true },
            { _id: RAD_2._id, name: RAD_2.name, assigned: list.filter((s) => assignedId(s) === RAD_2._id).length, signed: 11, active: true },
            { _id: RAD_3._id, name: RAD_3.name, assigned: list.filter((s) => assignedId(s) === RAD_3._id).length, signed: 9, active: false },
        ],
    };
}

export async function fetchStats(): Promise<WithDemo<WorklistStats>> {
    try {
        const raw = await request<unknown>(`${WORKLIST}/stats`);
        const data = (raw && typeof raw === 'object' ? raw : {}) as WorklistStats;
        return { data, demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) return { data: demoStats(), demo: true };
        throw err;
    }
}

/* ─────────────────────────────── Writes ───────────────────────────── */
/**
 * Writes try the real backend first. When it is offline, the change is
 * simulated against the in-memory demo store and flagged `demo: true` so the
 * caller can tell the user it was not persisted. Guard errors (400/409) are
 * thrown as ApiHttpError in both modes so the UI surfaces them identically.
 */

export async function claimStudy(studyId: string): Promise<WithDemo<Study>> {
    try {
        const data = await request<Study>(`${WORKLIST}/${studyId}/claim`, { method: 'PATCH' });
        return { data, demo: false };
    } catch (err) {
        if (!(err instanceof ApiOfflineError)) throw err;
        const s = findDemo(studyId);
        if (assignedId(s) && assignedId(s) !== DEMO_ME._id) {
            throw new ApiHttpError(409, { message: 'Study already assigned to another radiologist' });
        }
        s.assignedRadiologistId = { ...DEMO_ME };
        s.assignmentReason = 'Self-claimed from worklist';
        if (['ORDERED', 'RECEIVED', 'UNREAD'].includes(s.status)) s.status = 'IN_PROGRESS';
        s.tat = { ...s.tat, assignedAt: s.tat?.assignedAt || new Date().toISOString(), openedAt: s.tat?.openedAt || new Date().toISOString() };
        return { data: s, demo: true };
    }
}

export async function patchStatus(studyId: string, status: StudyStatus): Promise<WithDemo<Study>> {
    try {
        const data = await request<Study>(`${WORKLIST}/${studyId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
        return { data, demo: false };
    } catch (err) {
        if (!(err instanceof ApiOfflineError)) throw err;
        const s = findDemo(studyId);
        const from = STATUS_FLOW.indexOf(s.status);
        const to = STATUS_FLOW.indexOf(status);
        if (to !== from + 1 || status === 'SIGNED') {
            throw new ApiHttpError(409, { message: `Invalid transition ${s.status} → ${status}` });
        }
        s.status = status;
        return { data: s, demo: true };
    }
}

export async function saveReport(studyId: string, sections: ReportSections): Promise<WithDemo<Study>> {
    try {
        const data = await request<Study>(`${WORKLIST}/${studyId}/report`, {
            method: 'PUT',
            body: JSON.stringify({ sections }),
        });
        return { data, demo: false };
    } catch (err) {
        if (!(err instanceof ApiOfflineError)) throw err;
        const s = findDemo(studyId);
        if (isSignedOrLater(s)) throw new ApiHttpError(409, { message: 'Report is signed and immutable — add an addendum instead' });
        s.report = { ...s.report, sections: { ...sections } };
        s.tat = { ...s.tat, reportStartedAt: s.tat?.reportStartedAt || new Date().toISOString() };
        if (s.status === 'IN_PROGRESS') s.status = 'DRAFT';
        return { data: s, demo: true };
    }
}

export async function signReport(studyId: string): Promise<WithDemo<Study>> {
    try {
        const data = await request<Study>(`${WORKLIST}/${studyId}/sign`, { method: 'POST' });
        return { data, demo: false };
    } catch (err) {
        if (!(err instanceof ApiOfflineError)) throw err;
        const s = findDemo(studyId);
        if (isSignedOrLater(s)) throw new ApiHttpError(409, { message: 'Report already signed' });
        if (!s.report?.sections?.impression?.trim()) {
            throw new ApiHttpError(400, { message: 'Impression is required before signing' });
        }
        const signedAt = new Date().toISOString();
        s.status = 'SIGNED';
        s.tat = { ...s.tat, signedAt };
        s.report = { ...s.report, signedAt, signatureHash: pseudoHash(studyId + signedAt) };
        return { data: s, demo: true };
    }
}

export async function addAddendum(studyId: string, body: { sections: ReportSections; reason: string }): Promise<WithDemo<Study>> {
    try {
        const data = await request<Study>(`${WORKLIST}/${studyId}/addendum`, {
            method: 'POST',
            body: JSON.stringify(body),
        });
        return { data, demo: false };
    } catch (err) {
        if (!(err instanceof ApiOfflineError)) throw err;
        const s = findDemo(studyId);
        if (!isSignedOrLater(s)) throw new ApiHttpError(409, { message: 'Addenda are only allowed on signed reports' });
        const versions = s.report?.versions ?? [];
        versions.push({
            versionNumber: versions.length + 2,
            sections: { ...body.sections },
            reason: body.reason,
            createdAt: new Date().toISOString(),
            authorName: DEMO_ME.name,
        });
        s.report = { ...s.report, versions };
        return { data: s, demo: true };
    }
}

export async function flagCritical(studyId: string, description: string): Promise<WithDemo<Study>> {
    try {
        const data = await request<Study>(`${WORKLIST}/${studyId}/critical`, {
            method: 'POST',
            body: JSON.stringify({ description }),
        });
        return { data, demo: false };
    } catch (err) {
        if (!(err instanceof ApiOfflineError)) throw err;
        const s = findDemo(studyId);
        s.criticalFinding = { flagged: true, description, acknowledgedAt: undefined };
        return { data: s, demo: true };
    }
}

export async function ackCritical(studyId: string): Promise<WithDemo<Study>> {
    try {
        const data = await request<Study>(`${WORKLIST}/${studyId}/critical/ack`, { method: 'POST' });
        return { data, demo: false };
    } catch (err) {
        if (!(err instanceof ApiOfflineError)) throw err;
        const s = findDemo(studyId);
        if (!s.criticalFinding?.flagged) throw new ApiHttpError(409, { message: 'No critical finding to acknowledge' });
        s.criticalFinding = { ...s.criticalFinding, acknowledgedAt: new Date().toISOString() };
        return { data: s, demo: true };
    }
}

/* ─────────────────────── Report templates (canned) ────────────────── */

export const REPORT_TEMPLATES: { key: string; label: string; sections: ReportSections }[] = [
    {
        key: 'normal-ct-brain',
        label: 'Normal CT Brain',
        sections: {
            technique: 'Axial non-contrast CT images of the brain were obtained from the skull base to the vertex with multiplanar reformats.',
            comparison: 'None available.',
            findings: 'No acute intracranial hemorrhage, mass effect or midline shift. Gray-white differentiation is preserved. Ventricles and sulci are age-appropriate. Basal cisterns are patent. No acute territorial infarct. Calvarium and skull base are intact. Visualized paranasal sinuses and mastoid air cells are clear.',
            impression: 'No acute intracranial abnormality.',
            recommendations: 'Clinical correlation. MRI may be considered if symptoms persist.',
        },
    },
    {
        key: 'normal-cxr',
        label: 'Normal CXR',
        sections: {
            technique: 'Frontal (PA) radiograph of the chest.',
            comparison: 'None available.',
            findings: 'The lungs are clear without focal consolidation, effusion or pneumothorax. Cardiomediastinal silhouette is within normal limits. Hila are unremarkable. No acute osseous abnormality. Visualized upper abdomen is unremarkable.',
            impression: 'No acute cardiopulmonary abnormality.',
            recommendations: 'None.',
        },
    },
    {
        key: 'msk-mri',
        label: 'MSK MRI',
        sections: {
            technique: 'Multiplanar multisequence MRI of the joint including proton density fat-saturated, T1 and T2-weighted sequences without intravenous contrast.',
            comparison: 'None available.',
            findings: 'Osseous structures show normal marrow signal without fracture or osteochondral lesion. Articular cartilage is preserved. Menisci/labrum and visualized ligaments are intact. Tendons are normal in signal and caliber. No joint effusion or synovitis. No abnormal soft tissue mass.',
            impression: 'No acute internal derangement.',
            recommendations: 'Clinical correlation.',
        },
    },
];

/* ───────────────────── Claude AI report drafting ──────────────────── */
/**
 * Real-AI structured-report drafting, proxied by the backend to the Python AI
 * service. Availability is gated on GET /api/ai/health — when the AI service
 * has no ANTHROPIC_API_KEY (503 {available:false}) or the backend is offline,
 * the workspace keeps its existing behavior (templates + AI-triage inserts).
 * Claude calls can take a while, so drafting uses a 65s timeout.
 */

const AI_TIMEOUT_MS = 65_000;

export interface AiReportDraft {
    technique: string;
    comparison: string;
    findings: string;
    impression: string;
    recommendations: string;
}

/** True only when the backend is reachable AND the AI service has a key. */
export async function fetchAiHealth(): Promise<boolean> {
    try {
        const res = await request<{ available?: boolean }>('/api/ai/health');
        return Boolean(res?.available);
    } catch {
        return false;
    }
}

export function postAiRadiologyDraft(body: {
    modality?: string;
    bodyPart?: string;
    clinicalIndication?: string;
    aiTriageFindings?: AiFinding[];
}): Promise<AiReportDraft> {
    return request<AiReportDraft>('/api/ai/radiology-draft', {
        method: 'POST',
        body: JSON.stringify(body),
    }, AI_TIMEOUT_MS);
}
