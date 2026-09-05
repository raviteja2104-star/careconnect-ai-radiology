'use client';

/**
 * EMR API client — talks to the real backend at https://api.careconnect.care and
 * degrades gracefully to realistic demo data when the API is unreachable or
 * the caller is unauthenticated. Per project rule the frontend must never
 * crash when the backend is down; every read returns `{ data, demo }` so the
 * UI can surface a subtle "Demo data — backend offline" badge instead.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

/* ────────────────────────────── Types ────────────────────────────── */

export interface PatientRecord {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    allergies?: string[];
    chronicDiseases?: string[];
    medications?: string[];
    uhid?: string;
    abhaId?: string;
    criticalAlert?: string;
    insurance?: { providerName?: string; policyNumber?: string; validTill?: string };
    primaryDoctor?: { name?: string } | string;
    primaryPhysicianName?: string;
}

export interface TimelineEvent {
    kind: string;
    at: string;
    title: string;
    status?: string;
    priority?: string;
    amount?: number;
    ref?: string;
}

export interface DiagnosisEntry {
    _id?: string;
    code?: string;
    term: string;
    type?: 'provisional' | 'differential' | 'confirmed' | 'ruled_out';
    isPrimary?: boolean;
    notedAt?: string;
}

export interface DrugLine {
    name: string;
    dose: string;
    frequency: string;
    route: string;
    duration: string;
    instructions: string;
    foodTiming: 'before food' | 'after food' | 'with food' | '';
    prn: boolean;
}

export interface Patient360 {
    patient: PatientRecord;
    summary: {
        encounters: number;
        openOrders: number;
        labReports: number;
        radiologyStudies: number;
        invoices: number;
        activeMedications: number;
    };
    activeMedications: Partial<DrugLine>[];
    diagnoses: DiagnosisEntry[];
    timeline: TimelineEvent[];
}

export interface VitalsEntry {
    _id?: string;
    recordedAt?: string;
    heightCm?: number;
    weightKg?: number;
    bmi?: number;
    systolicBp?: number;
    diastolicBp?: number;
    pulse?: number;
    respiratoryRate?: number;
    temperatureC?: number;
    spo2?: number;
    painScore?: number;
}

export interface EncounterRecord {
    _id: string;
    patientId: { _id: string; name?: string } | string;
    doctorId?: { _id: string; name?: string } | string;
    type?: string;
    specialty?: string;
    status?: string;
    chiefComplaint?: string;
    vitals?: VitalsEntry[];
    diagnoses?: DiagnosisEntry[];
    createdAt?: string;
}

export type NoteFormat = 'SOAP' | 'DAP' | 'BIRP' | 'CUSTOM';

export interface NoteSections {
    chiefComplaint?: string;
    historyOfPresentIllness?: string;
    pastMedicalHistory?: string;
    pastSurgicalHistory?: string;
    familyHistory?: string;
    socialHistory?: string;
    physicalExamination?: string;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    data?: string;
    behavior?: string;
    intervention?: string;
    response?: string;
}

export interface ClinicalNoteRecord {
    _id: string;
    encounterId: string;
    format: NoteFormat;
    sections: NoteSections;
    version: number;
    status: 'draft' | 'signed' | 'amended';
    signedAt?: string;
    signatureHash?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SafetyFlag {
    kind: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
}

export interface ClinicalOrderRecord {
    _id: string;
    orderCode?: string;
    category: 'lab' | 'radiology' | 'procedure' | 'medication' | 'referral' | 'followup';
    priority?: 'routine' | 'urgent' | 'stat' | 'emergency';
    department?: string;
    status?: string;
    details?: Record<string, unknown> & { drugs?: Partial<DrugLine>[]; tests?: string[]; modality?: string; bodyPart?: string; indication?: string; notes?: string };
    safetyReview?: { flags?: SafetyFlag[]; overrideReason?: string };
    createdAt?: string;
    orderingDoctorId?: { name?: string } | string;
}

export interface EncounterBundle {
    encounter: EncounterRecord;
    notes: ClinicalNoteRecord[];
    orders: ClinicalOrderRecord[];
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

/** Thrown for HTTP errors that carry a meaningful body (e.g. 422 safety flags). */
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

const daysAgo = (n: number, h = 10) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(h, 15, 0, 0);
    return d.toISOString();
};

export const DEMO_PATIENT_ID = 'demo';
export const DEMO_ENCOUNTER_ID = 'demo';

const DEMO_PATIENT: PatientRecord = {
    _id: DEMO_PATIENT_ID,
    firstName: 'Rohit',
    lastName: 'Sharma',
    phone: '+91 98765 43210',
    email: 'rohit.sharma@example.in',
    dateOfBirth: '1992-05-12T00:00:00.000Z',
    gender: 'male',
    bloodGroup: 'B+',
    allergies: ['Penicillin', 'Sulfa drugs'],
    chronicDiseases: ['Hypertension', 'Type 2 Diabetes Mellitus'],
    uhid: 'UHID-2024-0001234',
    abhaId: '91-1234-5678-9012',
    criticalAlert: 'Anaphylaxis risk — Penicillin',
    insurance: { providerName: 'Star Health Assure', policyNumber: 'SHA-9982341', validTill: '2027-03-31T00:00:00.000Z' },
    primaryPhysicianName: 'Dr. Raj Sharma (Cardiology)',
};

const DEMO_ACTIVE_MEDICATIONS: Partial<DrugLine>[] = [
    { name: 'Telmisartan', dose: '40 mg', frequency: '0-0-1 (OD)', route: 'Oral', duration: 'Ongoing', instructions: 'After dinner' },
    { name: 'Metformin', dose: '500 mg', frequency: '1-0-1 (BID)', route: 'Oral', duration: 'Ongoing', instructions: 'After meals' },
    { name: 'Atorvastatin', dose: '10 mg', frequency: '0-0-1 (OD)', route: 'Oral', duration: 'Ongoing', instructions: 'At bedtime' },
];

const DEMO_DIAGNOSES: DiagnosisEntry[] = [
    { _id: 'dx1', term: 'Essential (primary) hypertension', code: 'I10', type: 'confirmed', isPrimary: true, notedAt: daysAgo(240) },
    { _id: 'dx2', term: 'Type 2 diabetes mellitus without complications', code: 'E11.9', type: 'confirmed', notedAt: daysAgo(180) },
    { _id: 'dx3', term: 'Atypical chest pain — rule out CAD', code: 'R07.89', type: 'provisional', notedAt: daysAgo(2) },
];

const DEMO_TIMELINE: TimelineEvent[] = [
    { kind: 'encounter', at: daysAgo(0, 9), title: 'OPD encounter — Cardiology', status: 'open', ref: DEMO_ENCOUNTER_ID },
    { kind: 'order:lab', at: daysAgo(0, 9), title: 'Lab order ORD-8841 · Troponin I, CBC', status: 'ordered', priority: 'urgent', ref: 'o1' },
    { kind: 'billing', at: daysAgo(1, 17), title: 'Invoice INV-20260807', status: 'paid', amount: 1500, ref: 'inv1' },
    { kind: 'radiology', at: daysAgo(2, 14), title: 'Chest X-Ray PA view', status: 'reported', ref: 'r1' },
    { kind: 'lab', at: daysAgo(2, 8), title: 'HbA1c — 7.1%', status: 'completed', ref: 'l1' },
    { kind: 'pharmacy', at: daysAgo(6, 12), title: 'Pharmacy order — 30-day refill', status: 'dispensed', ref: 'p1' },
    { kind: 'telemedicine', at: daysAgo(14, 18), title: 'Telemedicine session — BP review', status: 'completed', ref: 't1' },
    { kind: 'consultation', at: daysAgo(30, 11), title: 'Chest discomfort, fatigue', status: 'completed', ref: 'c1' },
    { kind: 'lab', at: daysAgo(45, 8), title: 'Lipid profile — LDL 128 mg/dL', status: 'completed', ref: 'l2' },
    { kind: 'consent', at: daysAgo(60, 10), title: 'Consent — teleconsultation & data sharing', status: 'granted', ref: 'cn1' },
    { kind: 'encounter', at: daysAgo(90, 10), title: 'OPD encounter — General Medicine', status: 'signed', ref: 'e2' },
    { kind: 'billing', at: daysAgo(90, 12), title: 'Invoice INV-20260511', status: 'paid', amount: 850, ref: 'inv2' },
];

export const DEMO_360: Patient360 = {
    patient: DEMO_PATIENT,
    summary: { encounters: 4, openOrders: 2, labReports: 6, radiologyStudies: 2, invoices: 3, activeMedications: DEMO_ACTIVE_MEDICATIONS.length },
    activeMedications: DEMO_ACTIVE_MEDICATIONS,
    diagnoses: DEMO_DIAGNOSES,
    timeline: DEMO_TIMELINE,
};

export const DEMO_ENCOUNTER_BUNDLE: EncounterBundle = {
    encounter: {
        _id: DEMO_ENCOUNTER_ID,
        patientId: { _id: DEMO_PATIENT_ID, name: 'Rohit Sharma' },
        doctorId: { _id: 'doc1', name: 'Dr. Raj Sharma' },
        type: 'opd',
        specialty: 'Cardiology',
        status: 'open',
        chiefComplaint: 'Chest pain and mild shortness of breath since 2 days.',
        createdAt: daysAgo(0, 9),
        vitals: [
            {
                _id: 'v1',
                recordedAt: daysAgo(0, 9),
                heightCm: 172,
                weightKg: 72,
                bmi: 24.3,
                systolicBp: 128,
                diastolicBp: 84,
                pulse: 82,
                respiratoryRate: 16,
                temperatureC: 37.0,
                spo2: 98,
                painScore: 3,
            },
        ],
        diagnoses: [DEMO_DIAGNOSES[2]],
    },
    notes: [],
    orders: [
        {
            _id: 'o1',
            orderCode: 'ORD-8841',
            category: 'lab',
            priority: 'urgent',
            status: 'ordered',
            details: { tests: ['Troponin I', 'Complete Blood Count (CBC)'], notes: 'Fasting not required' },
            createdAt: daysAgo(0, 9),
        },
        {
            _id: 'o2',
            orderCode: 'ORD-8802',
            category: 'radiology',
            priority: 'routine',
            status: 'completed',
            details: { modality: 'XR', bodyPart: 'Chest PA', indication: 'R/O cardiomegaly' },
            createdAt: daysAgo(2, 14),
        },
    ],
};

/* ────────────────── Client-side demo safety screening ─────────────── */
/**
 * Mirror of the backend's advisory PrescriptionSafety rules so the 422
 * safety-flag flow stays demoable when the backend is offline.
 */
const DEMO_INTERACTIONS: { pair: [string, string]; severity: SafetyFlag['severity']; message: string }[] = [
    { pair: ['warfarin', 'aspirin'], severity: 'critical', message: 'Warfarin + Aspirin: major bleeding risk.' },
    { pair: ['warfarin', 'ibuprofen'], severity: 'critical', message: 'Warfarin + NSAID: major bleeding risk.' },
    { pair: ['sildenafil', 'nitroglycerin'], severity: 'critical', message: 'PDE5 inhibitor + nitrate: severe hypotension.' },
    { pair: ['clopidogrel', 'omeprazole'], severity: 'warning', message: 'Omeprazole may reduce clopidogrel activation.' },
    { pair: ['lisinopril', 'spironolactone'], severity: 'warning', message: 'ACE inhibitor + K-sparing diuretic: hyperkalemia risk.' },
    { pair: ['tramadol', 'sertraline'], severity: 'warning', message: 'Serotonergic combination: serotonin syndrome risk.' },
];

export interface SafetyContext {
    currentMedications?: string[];
    allergies?: string[];
    renalImpairment?: boolean;
    pregnant?: boolean;
}

export function demoScreenDrugs(drugs: Partial<DrugLine>[], context: SafetyContext): SafetyFlag[] {
    const norm = (s?: string) => String(s || '').trim().toLowerCase();
    const flags: SafetyFlag[] = [];
    const newNames = drugs.map((d) => norm(d.name)).filter(Boolean);
    const allNames = [...newNames, ...(context.currentMedications || []).map(norm)];
    const allergies = (context.allergies || []).map(norm);

    const seen = new Set<string>();
    for (const n of allNames) {
        if (seen.has(n) && newNames.includes(n)) flags.push({ kind: 'duplicate', severity: 'warning', message: `Duplicate therapy detected: ${n}.` });
        seen.add(n);
    }
    for (const { pair, severity, message } of DEMO_INTERACTIONS) {
        const [a, b] = pair;
        const hasA = allNames.some((n) => n.includes(a));
        const hasB = allNames.some((n) => n.includes(b));
        const involvesNew = newNames.some((n) => n.includes(a) || n.includes(b));
        if (hasA && hasB && involvesNew) flags.push({ kind: 'interaction', severity, message });
    }
    for (const n of newNames) {
        for (const allergy of allergies) {
            if (allergy && (n.includes(allergy) || allergy.includes(n))) {
                flags.push({ kind: 'allergy', severity: 'critical', message: `Patient has a recorded allergy matching "${n}".` });
            }
        }
    }
    if (context.renalImpairment) {
        for (const n of newNames) {
            if (['metformin', 'ibuprofen', 'nsaid', 'gentamicin', 'vancomycin', 'lithium'].some((r) => n.includes(r))) {
                flags.push({ kind: 'renal', severity: 'warning', message: `Renal dosing review recommended for ${n}.` });
            }
        }
    }
    if (context.pregnant) {
        for (const n of newNames) {
            if (['warfarin', 'isotretinoin', 'methotrexate', 'valproate', 'lisinopril', 'atorvastatin'].some((p) => n.includes(p))) {
                flags.push({ kind: 'pregnancy', severity: 'critical', message: `${n} is cautioned in pregnancy — verify indication.` });
            }
        }
    }
    return flags;
}

/* ───────────────────────── Reads (with fallback) ──────────────────── */

export interface WithDemo<T> {
    data: T;
    demo: boolean;
}

export async function fetchPatient360(patientId: string): Promise<WithDemo<Patient360>> {
    if (patientId === DEMO_PATIENT_ID) return { data: DEMO_360, demo: true };
    try {
        const data = await request<Patient360>(`/api/emr/patients/${patientId}/summary`);
        return { data, demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError || (err instanceof ApiHttpError && err.status === 404)) {
            return { data: { ...DEMO_360, patient: { ...DEMO_360.patient, _id: patientId } }, demo: true };
        }
        throw err;
    }
}

export async function fetchEncounterBundle(encounterId: string): Promise<WithDemo<EncounterBundle>> {
    if (encounterId === DEMO_ENCOUNTER_ID) return { data: DEMO_ENCOUNTER_BUNDLE, demo: true };
    try {
        const data = await request<EncounterBundle>(`/api/emr/encounters/${encounterId}`);
        return { data, demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError || (err instanceof ApiHttpError && err.status === 404)) {
            return { data: { ...DEMO_ENCOUNTER_BUNDLE, encounter: { ...DEMO_ENCOUNTER_BUNDLE.encounter, _id: encounterId } }, demo: true };
        }
        throw err;
    }
}

export async function fetchEncounters(patientId: string): Promise<WithDemo<EncounterRecord[]>> {
    if (patientId === DEMO_PATIENT_ID) return { data: [DEMO_ENCOUNTER_BUNDLE.encounter], demo: true };
    try {
        const data = await request<EncounterRecord[]>(`/api/emr/encounters?patientId=${encodeURIComponent(patientId)}`);
        return { data, demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) return { data: [DEMO_ENCOUNTER_BUNDLE.encounter], demo: true };
        throw err;
    }
}

/* ─────────────────────────────── Writes ───────────────────────────── */
/**
 * Writes throw ApiOfflineError when the backend is down; callers decide how
 * to simulate locally (the UI never fakes a server success silently).
 */

export function createEncounter(body: { patientId: string; type: string; specialty: string; chiefComplaint?: string }) {
    return request<EncounterRecord>('/api/emr/encounters', { method: 'POST', body: JSON.stringify(body) });
}

export function postVitals(encounterId: string, vitals: VitalsEntry) {
    return request<VitalsEntry>(`/api/emr/encounters/${encounterId}/vitals`, { method: 'POST', body: JSON.stringify(vitals) });
}

export function postDiagnosis(encounterId: string, dx: { term: string; code?: string; type: string; isPrimary: boolean }) {
    return request<DiagnosisEntry>(`/api/emr/encounters/${encounterId}/diagnoses`, { method: 'POST', body: JSON.stringify(dx) });
}

export function putNote(encounterId: string, body: { format: NoteFormat; templateKey?: string; sections: NoteSections }) {
    return request<ClinicalNoteRecord>(`/api/emr/encounters/${encounterId}/note`, { method: 'PUT', body: JSON.stringify(body) });
}

export function signNote(noteId: string) {
    return request<ClinicalNoteRecord>(`/api/emr/notes/${noteId}/sign`, { method: 'POST' });
}

export function amendNote(noteId: string, body: { sections?: NoteSections; reason: string }) {
    return request<ClinicalNoteRecord>(`/api/emr/notes/${noteId}/amend`, { method: 'POST', body: JSON.stringify(body) });
}

export interface CreateOrderBody {
    category: ClinicalOrderRecord['category'];
    priority: NonNullable<ClinicalOrderRecord['priority']>;
    department?: string;
    details: Record<string, unknown>;
    safetyContext?: SafetyContext;
    acknowledgeCritical?: boolean;
    overrideReason?: string;
}

export function postOrder(encounterId: string, body: CreateOrderBody) {
    return request<ClinicalOrderRecord>(`/api/emr/encounters/${encounterId}/orders`, { method: 'POST', body: JSON.stringify(body) });
}

export function patchOrderStatus(orderId: string, body: { status: string; note?: string }) {
    return request<ClinicalOrderRecord>(`/api/emr/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify(body) });
}

/* ───────────────────── Claude clinical AI (copilot) ───────────────── */
/**
 * Real-AI drafting endpoints, proxied by the backend to the Python AI service.
 * Availability is gated on GET /api/ai/health — when the AI service has no
 * ANTHROPIC_API_KEY (503 {available:false}) or the backend is offline, the
 * copilot keeps its on-device deterministic drafting. Claude calls can take a
 * while, so these use a 65s timeout instead of the default 5s.
 */

const AI_TIMEOUT_MS = 65_000;

export interface AiSoapDraft {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
}

export interface AiDischargeSummary {
    summary: string;
    advice: string;
    followUp: string;
}

export interface AiLabExplanation {
    explanation: string;
    keyPoints?: string[];
}

export interface AiDifferentialItem {
    condition: string;
    likelihood?: string;
    reasoning?: string;
}

export interface AiDifferentialsResult {
    differentials: AiDifferentialItem[];
    note?: string;
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

export function postAiSoapDraft(body: {
    chiefComplaint?: string;
    vitals?: VitalsEntry | null;
    diagnoses?: string[];
    history?: Record<string, unknown>;
}): Promise<AiSoapDraft> {
    return request<AiSoapDraft>('/api/ai/soap-draft', { method: 'POST', body: JSON.stringify(body) }, AI_TIMEOUT_MS);
}

export function postAiDischargeSummary(body: Record<string, unknown>): Promise<AiDischargeSummary> {
    return request<AiDischargeSummary>('/api/ai/discharge-summary', { method: 'POST', body: JSON.stringify(body) }, AI_TIMEOUT_MS);
}

export function postAiExplain(body: { labs?: string[]; text?: string }): Promise<AiLabExplanation> {
    return request<AiLabExplanation>('/api/ai/explain', { method: 'POST', body: JSON.stringify(body) }, AI_TIMEOUT_MS);
}

export function postAiDifferentials(body: { presentation: Record<string, unknown> }): Promise<AiDifferentialsResult> {
    return request<AiDifferentialsResult>('/api/ai/differentials', { method: 'POST', body: JSON.stringify(body) }, AI_TIMEOUT_MS);
}

/* ─────────────────────────────── Utils ────────────────────────────── */

export function patientDisplayName(p?: PatientRecord | null): string {
    if (!p) return 'Unknown patient';
    if (p.name) return p.name;
    return [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown patient';
}

export function ageOf(dateOfBirth?: string): number | null {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
}

export function formatWhen(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function formatINR(amount?: number): string {
    if (amount == null) return '—';
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ──────────────── Clinical catalog typeahead ──────────────── */

export type CatalogKind = 'medication' | 'complaint' | 'diagnosis' | 'lab_test' | 'duration' | 'instruction';

export interface CatalogSuggestion {
    kind: CatalogKind;
    label: string;
    code?: string;
    meta?: { generic?: string; brand?: string; strength?: string; form?: string };
}

/** Small offline subset so suggestions still work with the backend down. */
const DEMO_CATALOG: Record<CatalogKind, CatalogSuggestion[]> = {
    medication: [
        { kind: 'medication', label: 'Paracetamol 500 mg Tablet', meta: { generic: 'Paracetamol', brand: 'Crocin', strength: '500 mg', form: 'Tablet' } },
        { kind: 'medication', label: 'Paracetamol 650 mg Tablet', meta: { generic: 'Paracetamol', brand: 'Dolo 650', strength: '650 mg', form: 'Tablet' } },
        { kind: 'medication', label: 'Amoxicillin + Clavulanate 625 mg Tablet', meta: { generic: 'Amoxicillin + Clavulanate', brand: 'Augmentin', strength: '625 mg', form: 'Tablet' } },
        { kind: 'medication', label: 'Azithromycin 500 mg Tablet', meta: { generic: 'Azithromycin', brand: 'Azithral', strength: '500 mg', form: 'Tablet' } },
        { kind: 'medication', label: 'Metformin 500 mg Tablet', meta: { generic: 'Metformin', brand: 'Glycomet', strength: '500 mg', form: 'Tablet' } },
        { kind: 'medication', label: 'Amlodipine 5 mg Tablet', meta: { generic: 'Amlodipine', brand: 'Amlong', strength: '5 mg', form: 'Tablet' } },
        { kind: 'medication', label: 'Telmisartan 40 mg Tablet', meta: { generic: 'Telmisartan', brand: 'Telma', strength: '40 mg', form: 'Tablet' } },
        { kind: 'medication', label: 'Atorvastatin 10 mg Tablet', meta: { generic: 'Atorvastatin', brand: 'Atorva', strength: '10 mg', form: 'Tablet' } },
        { kind: 'medication', label: 'Pantoprazole 40 mg Tablet', meta: { generic: 'Pantoprazole', brand: 'Pan 40', strength: '40 mg', form: 'Tablet' } },
        { kind: 'medication', label: 'Cetirizine 10 mg Tablet', meta: { generic: 'Cetirizine', brand: 'Cetzine', strength: '10 mg', form: 'Tablet' } },
        { kind: 'medication', label: 'Ondansetron 4 mg Tablet', meta: { generic: 'Ondansetron', brand: 'Emeset', strength: '4 mg', form: 'Tablet' } },
        { kind: 'medication', label: 'Salbutamol 100 mcg Inhaler', meta: { generic: 'Salbutamol', brand: 'Asthalin', strength: '100 mcg', form: 'Inhaler' } },
        { kind: 'medication', label: 'Levothyroxine 50 mcg Tablet', meta: { generic: 'Levothyroxine', brand: 'Thyronorm', strength: '50 mcg', form: 'Tablet' } },
        { kind: 'medication', label: 'Aspirin 75 mg Tablet', meta: { generic: 'Aspirin', brand: 'Ecosprin', strength: '75 mg', form: 'Tablet' } },
        { kind: 'medication', label: 'Ibuprofen 400 mg Tablet', meta: { generic: 'Ibuprofen', brand: 'Brufen', strength: '400 mg', form: 'Tablet' } },
    ],
    complaint: [
        'Fever', 'Cough', 'Chest pain', 'Breathlessness', 'Abdominal pain', 'Headache', 'Dizziness',
        'Vomiting', 'Loose stools', 'Burning micturition', 'Joint pain', 'Low back pain', 'Sore throat',
        'Skin rash', 'Palpitations', 'Generalized weakness', 'Weight loss', 'Blurred vision',
    ].map((label) => ({ kind: 'complaint' as const, label })),
    diagnosis: [
        { kind: 'diagnosis', label: 'Essential (primary) hypertension', code: 'I10' },
        { kind: 'diagnosis', label: 'Type 2 diabetes mellitus without complications', code: 'E11.9' },
        { kind: 'diagnosis', label: 'Acute upper respiratory infection, unspecified', code: 'J06.9' },
        { kind: 'diagnosis', label: 'Urinary tract infection, site not specified', code: 'N39.0' },
        { kind: 'diagnosis', label: 'Gastritis, unspecified', code: 'K29.7' },
        { kind: 'diagnosis', label: 'Pneumonia, unspecified organism', code: 'J18.9' },
        { kind: 'diagnosis', label: 'Asthma, unspecified', code: 'J45.9' },
        { kind: 'diagnosis', label: 'Hypothyroidism, unspecified', code: 'E03.9' },
        { kind: 'diagnosis', label: 'Dengue fever', code: 'A90' },
        { kind: 'diagnosis', label: 'Iron deficiency anemia, unspecified', code: 'D50.9' },
        { kind: 'diagnosis', label: 'Low back pain', code: 'M54.5' },
        { kind: 'diagnosis', label: 'Dyslipidemia', code: 'E78.5' },
    ],
    lab_test: [
        { kind: 'lab_test', label: 'Complete Blood Count (CBC)', code: 'CBC' },
        { kind: 'lab_test', label: 'Liver Function Test (LFT)', code: 'LFT' },
        { kind: 'lab_test', label: 'Kidney Function Test (KFT)', code: 'KFT' },
        { kind: 'lab_test', label: 'HbA1c (Glycated Hemoglobin)', code: 'HBA1C' },
        { kind: 'lab_test', label: 'Fasting Blood Sugar (FBS)', code: 'FBS' },
        { kind: 'lab_test', label: 'Lipid Profile', code: 'LIPID' },
        { kind: 'lab_test', label: 'Thyroid Stimulating Hormone (TSH)', code: 'TSH' },
        { kind: 'lab_test', label: 'Urine Routine & Microscopy', code: 'URINE-RM' },
        { kind: 'lab_test', label: 'C-Reactive Protein (CRP)', code: 'CRP' },
        { kind: 'lab_test', label: 'Dengue NS1 Antigen', code: 'NS1' },
        { kind: 'lab_test', label: 'Troponin I', code: 'TROP-I' },
        { kind: 'lab_test', label: 'Serum Electrolytes', code: 'ELEC' },
    ],
    duration: [
        'Single dose', '3 days', '5 days', '7 days', '10 days', '14 days', '2 weeks',
        '1 month', '3 months', 'Ongoing / long term', 'Until next review', 'SOS (as needed)',
    ].map((label) => ({ kind: 'duration' as const, label })),
    instruction: [
        'After food', 'Before food', 'Early morning on empty stomach', 'At bedtime',
        'With a full glass of water', 'Do not crush or chew', 'Complete the full course',
        'Avoid alcohol during treatment', 'May cause drowsiness - avoid driving',
        'Take at the same time every day', 'Shake well before use', 'Rinse mouth after inhaler use',
    ].map((label) => ({ kind: 'instruction' as const, label })),
};

export function demoCatalogSearch(kind: CatalogKind, q: string): CatalogSuggestion[] {
    const needle = q.toLowerCase();
    const pool = DEMO_CATALOG[kind] || [];
    const starts = pool.filter((s) =>
        [s.label, s.code, s.meta?.generic, s.meta?.brand].filter(Boolean).some((h) => String(h).toLowerCase().startsWith(needle))
    );
    const contains = pool.filter((s) =>
        !starts.includes(s) &&
        [s.label, s.code, s.meta?.generic, s.meta?.brand].filter(Boolean).some((h) => String(h).toLowerCase().includes(needle))
    );
    return [...starts, ...contains].slice(0, 12);
}

/** Typeahead search against the clinical catalog; offline-safe, never throws. */
export async function fetchCatalogSuggestions(kind: CatalogKind, q: string): Promise<CatalogSuggestion[]> {
    const query = q.trim();
    if (!query) return [];
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(
            API_BASE + '/api/emr/catalog?kind=' + encodeURIComponent(kind) + '&q=' + encodeURIComponent(query),
            {
                headers: token ? { Authorization: 'Bearer ' + token } : undefined,
                signal: controller.signal,
            }
        );
        clearTimeout(timer);
        if (!res.ok) return demoCatalogSearch(kind, query);
        const body = await res.json();
        const suggestions = Array.isArray(body?.suggestions) ? body.suggestions : [];
        return suggestions.length > 0 ? suggestions : demoCatalogSearch(kind, query);
    } catch {
        return demoCatalogSearch(kind, query);
    }
}

/* ──────────── AI medication suggestions (decision support) ──────────── */

export interface MedSuggestion {
    name: string;
    generic?: string;
    indication?: string;
    dosage?: string;
    route?: string;
    frequency?: string;
    duration?: string;
    precautions?: string;
    interactions?: string;
    warnings?: Array<{ kind: string; severity: 'info' | 'warning' | 'critical'; message: string }>;
}

export interface MedSuggestionResponse {
    source: 'ai' | 'reference' | 'insufficient' | 'unavailable';
    suggestions: MedSuggestion[];
    notice?: string;
    disclaimer?: string;
}

/**
 * Request medication decision-support suggestions for the entered diagnoses
 * and patient context. Never throws; backend-down returns 'unavailable'.
 */
export async function postAiMedicationSuggestions(body: {
    diagnoses: string[];
    symptoms?: string;
    patient?: {
        age?: number;
        gender?: string;
        allergies?: string[];
        currentMedications?: string[];
        renalImpairment?: boolean;
        pregnant?: boolean;
    };
    exclude?: string[];
}): Promise<MedSuggestionResponse> {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 65000);
        const res = await fetch(API_BASE + '/api/emr/ai/medication-suggestions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: 'Bearer ' + token } : {}),
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) return { source: 'unavailable', suggestions: [] };
        const data = await res.json();
        return {
            source: data.source || 'unavailable',
            suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
            notice: data.notice,
            disclaimer: data.disclaimer,
        };
    } catch {
        return { source: 'unavailable', suggestions: [] };
    }
}
