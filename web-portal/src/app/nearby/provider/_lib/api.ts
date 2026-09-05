'use client';

/**
 * Provider Dashboard API client — talks to the CareConnect Nearby backend at
 * http://localhost:5000/api/nearby and degrades gracefully to a small,
 * clearly-labeled demo dataset when the API is unreachable. Reads return
 * `{ data, demo }` so the UI can show a "Demo data — backend offline" badge.
 * Writes throw ApiOfflineError; the page decides how to simulate locally
 * (never faking a server success silently).
 *
 * Auth: interim role model — the backend has no dedicated provider-staff
 * role yet, so provider-admin endpoints are called with whatever Bearer JWT
 * is in local storage under 'token' (expected role: admin/doctor). A
 * dedicated provider-staff role (scoped to a single claimed provider) is a
 * follow-up once the backend ships one.
 *
 * This file is page-local to /nearby/provider/* and intentionally does NOT
 * share code with src/app/nearby/_lib/api.ts (the patient-facing client,
 * owned by a sibling workstream) even though both talk to /api/nearby —
 * see DESIGN_SYSTEM.md / build brief for the split.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

/* ────────────────────────────── Types ────────────────────────────── */

export type VerificationStatus = 'VERIFIED' | 'CLAIMED' | 'UNVERIFIED' | 'SUSPENDED' | 'CLOSED';

export interface WorkingHoursDay {
    dayOfWeek: number; // 0=Sun … 6=Sat
    open?: string;      // 'HH:mm'
    close?: string;      // 'HH:mm'
    closed?: boolean;
}

export interface Provider {
    _id: string;
    name: string;
    type: string;              // clinic | hospital | diagnostic_lab | pharmacy | ...
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
    workingHours?: WorkingHoursDay[];
    createdAt?: string;
}

export interface Doctor {
    _id: string;
    providerId: string;
    name: string;
    specialty?: string;
    qualification?: string;
    registrationNumber?: string;
    experienceYears?: number;
    consultationFee?: number;
    active: boolean;
}

export interface ScheduleBreak {
    start: string; // 'HH:mm'
    end: string;   // 'HH:mm'
    label?: string;
}

export interface ScheduleDay {
    dayOfWeek: number; // 0=Sun … 6=Sat
    active: boolean;
    startTime?: string;
    endTime?: string;
    slotDurationMinutes?: number;
    breaks: ScheduleBreak[];
}

export interface DoctorSchedule {
    _id: string;
    providerId: string;
    doctorId: string;
    days: ScheduleDay[];
}

export interface Service {
    _id: string;
    providerId: string;
    name: string;
    category?: string;
    price: number;
    durationMinutes: number;
    homeCollection: boolean;
    onlineBooking: boolean;
    active: boolean;
}

export interface AvailabilityException {
    _id: string;
    providerId: string;
    doctorId?: string | null; // null/absent = applies to whole provider
    date: string;             // ISO date, 'YYYY-MM-DD'
    type: 'HOLIDAY' | 'CLOSED' | 'CUSTOM_HOURS';
    reason?: string;
    startTime?: string;
    endTime?: string;
}

export interface PatientDetails {
    name: string;
    age?: number;
    gender?: string;
    phone?: string;
}

export type AppointmentStatus = 'BOOKED' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
    _id: string;
    providerId: string;
    doctorId?: string;
    serviceId?: string;
    type: string;
    date: string;      // ISO date
    startTime: string;  // 'HH:mm'
    endTime: string;    // 'HH:mm'
    status: AppointmentStatus;
    patientDetails: PatientDetails;
    confirmationCode: string;
    paymentMode?: string;
    paymentStatus?: string;
}

export interface ProviderDashboard {
    todayAppointments: Appointment[];
    upcoming: Appointment[];
    cancelled: Appointment[];
    noShows: Appointment[];
}

export interface WithDemo<T> { data: T; demo: boolean }

/* ─────────────────────────── Fetch plumbing ───────────────────────── */

export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try { return window.localStorage.getItem('token'); } catch { return null; }
}

export function currentUserId(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem('cc-user');
        if (!raw) return null;
        const u = JSON.parse(raw) as { _id?: string };
        return u?._id || null;
    } catch { return null; }
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
    if (res.status === 401 || res.status === 403) throw new ApiOfflineError('Unauthorized');
    if (!res.ok) {
        let body: Record<string, unknown> = {};
        try { body = await res.json(); } catch { /* non-JSON error body */ }
        throw new ApiHttpError(res.status, body);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

/** Endpoints not explicitly listed in the /api/nearby contract (e.g. check-in)
 *  also fall back to demo simulation on 404, since the backend is being
 *  built in parallel and may not have shipped them yet. */
function isMissingEndpoint(err: unknown): boolean {
    return err instanceof ApiOfflineError || (err instanceof ApiHttpError && err.status === 404);
}

/* ─────────────────────────── Demo dataset ─────────────────────────── */

const DEMO_USER_ID = 'demo-provider-owner';

export const DEMO_PROVIDER_ID_1 = 'demo-prov-clinic-1';
export const DEMO_PROVIDER_ID_2 = 'demo-prov-lab-1';

const DEMO_PROVIDERS: Provider[] = [
    {
        _id: DEMO_PROVIDER_ID_1,
        name: 'Sunrise Family Clinic',
        type: 'clinic',
        subtype: 'General Medicine & Pediatrics',
        locality: 'Kothrud',
        address: '2nd Floor, Paranjape Complex, Kothrud Depot Road',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411038',
        phone: '+91 98220 11223',
        email: 'front-desk@sunrisefamilyclinic.example',
        verificationStatus: 'VERIFIED',
        careconnectVerified: true,
        lastVerifiedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
        claimedByUserId: DEMO_USER_ID,
        appointmentEnabled: true,
        workingHours: [
            { dayOfWeek: 0, closed: true },
            { dayOfWeek: 1, open: '09:00', close: '20:00' },
            { dayOfWeek: 2, open: '09:00', close: '20:00' },
            { dayOfWeek: 3, open: '09:00', close: '20:00' },
            { dayOfWeek: 4, open: '09:00', close: '20:00' },
            { dayOfWeek: 5, open: '09:00', close: '20:00' },
            { dayOfWeek: 6, open: '09:00', close: '14:00' },
        ],
        createdAt: new Date(Date.now() - 400 * 86400000).toISOString(),
    },
    {
        _id: DEMO_PROVIDER_ID_2,
        name: 'MedCore Diagnostics',
        type: 'diagnostic_lab',
        subtype: 'Pathology & Radiology',
        locality: 'Baner',
        address: 'Shop 4, Amanora Chambers, Baner Road',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411045',
        phone: '+91 98220 55667',
        verificationStatus: 'CLAIMED',
        careconnectVerified: false,
        claimedByUserId: DEMO_USER_ID,
        appointmentEnabled: true,
        workingHours: [
            { dayOfWeek: 0, open: '08:00', close: '13:00' },
            { dayOfWeek: 1, open: '07:00', close: '21:00' },
            { dayOfWeek: 2, open: '07:00', close: '21:00' },
            { dayOfWeek: 3, open: '07:00', close: '21:00' },
            { dayOfWeek: 4, open: '07:00', close: '21:00' },
            { dayOfWeek: 5, open: '07:00', close: '21:00' },
            { dayOfWeek: 6, open: '07:00', close: '21:00' },
        ],
        createdAt: new Date(Date.now() - 200 * 86400000).toISOString(),
    },
];

const DEMO_DOCTORS: Record<string, Doctor[]> = {
    [DEMO_PROVIDER_ID_1]: [
        { _id: 'demo-doc-1', providerId: DEMO_PROVIDER_ID_1, name: 'Dr. Anjali Rao', specialty: 'General Medicine', qualification: 'MBBS, MD', registrationNumber: 'MH-12345', experienceYears: 11, consultationFee: 500, active: true },
        { _id: 'demo-doc-2', providerId: DEMO_PROVIDER_ID_1, name: 'Dr. Vivek Kulkarni', specialty: 'Pediatrics', qualification: 'MBBS, DCH', registrationNumber: 'MH-22987', experienceYears: 8, consultationFee: 450, active: true },
    ],
    [DEMO_PROVIDER_ID_2]: [
        { _id: 'demo-doc-3', providerId: DEMO_PROVIDER_ID_2, name: 'Dr. Farhan Shaikh', specialty: 'Pathology', qualification: 'MBBS, MD (Path)', registrationNumber: 'MH-30456', experienceYears: 14, consultationFee: 0, active: true },
    ],
};

const DEMO_SERVICES: Record<string, Service[]> = {
    [DEMO_PROVIDER_ID_1]: [
        { _id: 'demo-svc-1', providerId: DEMO_PROVIDER_ID_1, name: 'General Consultation', category: 'Consultation', price: 500, durationMinutes: 15, homeCollection: false, onlineBooking: true, active: true },
        { _id: 'demo-svc-2', providerId: DEMO_PROVIDER_ID_1, name: 'Pediatric Consultation', category: 'Consultation', price: 450, durationMinutes: 15, homeCollection: false, onlineBooking: true, active: true },
        { _id: 'demo-svc-3', providerId: DEMO_PROVIDER_ID_1, name: 'Vaccination', category: 'Procedure', price: 800, durationMinutes: 20, homeCollection: false, onlineBooking: false, active: true },
    ],
    [DEMO_PROVIDER_ID_2]: [
        { _id: 'demo-svc-4', providerId: DEMO_PROVIDER_ID_2, name: 'Complete Blood Count', category: 'Lab Test', price: 350, durationMinutes: 10, homeCollection: true, onlineBooking: true, active: true },
        { _id: 'demo-svc-5', providerId: DEMO_PROVIDER_ID_2, name: 'Chest X-Ray (PA)', category: 'Imaging', price: 400, durationMinutes: 15, homeCollection: false, onlineBooking: true, active: true },
    ],
};

const DEFAULT_SCHEDULE_DAYS = (): ScheduleDay[] => [0, 1, 2, 3, 4, 5, 6].map((d) => ({
    dayOfWeek: d,
    active: d !== 0,
    startTime: '09:00',
    endTime: '18:00',
    slotDurationMinutes: 15,
    breaks: d !== 0 ? [{ start: '13:00', end: '14:00', label: 'Lunch' }] : [],
}));

const DEMO_SCHEDULES: Record<string, DoctorSchedule> = {
    'demo-doc-1': { _id: 'demo-sch-1', providerId: DEMO_PROVIDER_ID_1, doctorId: 'demo-doc-1', days: DEFAULT_SCHEDULE_DAYS() },
    'demo-doc-2': { _id: 'demo-sch-2', providerId: DEMO_PROVIDER_ID_1, doctorId: 'demo-doc-2', days: DEFAULT_SCHEDULE_DAYS() },
    'demo-doc-3': { _id: 'demo-sch-3', providerId: DEMO_PROVIDER_ID_2, doctorId: 'demo-doc-3', days: DEFAULT_SCHEDULE_DAYS() },
};

const DEMO_EXCEPTIONS: Record<string, AvailabilityException[]> = {
    [DEMO_PROVIDER_ID_1]: [
        { _id: 'demo-exc-1', providerId: DEMO_PROVIDER_ID_1, date: new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10), type: 'HOLIDAY', reason: 'Ganesh Chaturthi' },
    ],
    [DEMO_PROVIDER_ID_2]: [],
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

function buildDemoDashboard(providerId: string): ProviderDashboard {
    const doctors = DEMO_DOCTORS[providerId] || [];
    const d1 = doctors[0]?._id;
    const d2 = doctors[1]?._id ?? d1;
    return {
        todayAppointments: [
            { _id: 'demo-appt-1', providerId, doctorId: d1, type: 'consultation', date: todayIso(), startTime: '09:30', endTime: '09:45', status: 'BOOKED', patientDetails: { name: 'Rohit Sharma', age: 34, gender: 'male', phone: '+91 98765 43210' }, confirmationCode: 'CC-DEMO-1001', paymentMode: 'pay_at_visit', paymentStatus: 'pending' },
            { _id: 'demo-appt-2', providerId, doctorId: d1, type: 'consultation', date: todayIso(), startTime: '10:00', endTime: '10:15', status: 'CHECKED_IN', patientDetails: { name: 'Sunita Patil', age: 52, gender: 'female', phone: '+91 90210 44556' }, confirmationCode: 'CC-DEMO-1002', paymentMode: 'online', paymentStatus: 'paid' },
            { _id: 'demo-appt-3', providerId, doctorId: d2, type: 'consultation', date: todayIso(), startTime: '11:30', endTime: '11:45', status: 'BOOKED', patientDetails: { name: 'Aarav Mehta', age: 6, gender: 'male', phone: '+91 88992 33445' }, confirmationCode: 'CC-DEMO-1003', paymentMode: 'pay_at_visit', paymentStatus: 'pending' },
        ],
        upcoming: [
            { _id: 'demo-appt-4', providerId, doctorId: d1, type: 'consultation', date: inDays(1), startTime: '09:15', endTime: '09:30', status: 'BOOKED', patientDetails: { name: 'Kiran Joshi', age: 41, gender: 'male', phone: '+91 90112 33440' }, confirmationCode: 'CC-DEMO-1004', paymentMode: 'online', paymentStatus: 'paid' },
            { _id: 'demo-appt-5', providerId, doctorId: d2, type: 'consultation', date: inDays(2), startTime: '16:00', endTime: '16:15', status: 'CONFIRMED', patientDetails: { name: 'Meera Iyer', age: 29, gender: 'female', phone: '+91 99009 12233' }, confirmationCode: 'CC-DEMO-1005', paymentMode: 'pay_at_visit', paymentStatus: 'pending' },
        ],
        cancelled: [
            { _id: 'demo-appt-6', providerId, doctorId: d1, type: 'consultation', date: inDays(-1), startTime: '18:00', endTime: '18:15', status: 'CANCELLED', patientDetails: { name: 'Nilesh Deshmukh', age: 38, gender: 'male', phone: '+91 91234 56780' }, confirmationCode: 'CC-DEMO-1006', paymentMode: 'online', paymentStatus: 'refunded' },
        ],
        noShows: [
            { _id: 'demo-appt-7', providerId, doctorId: d2, type: 'consultation', date: inDays(-2), startTime: '10:30', endTime: '10:45', status: 'NO_SHOW', patientDetails: { name: 'Priya Nair', age: 25, gender: 'female', phone: '+91 90876 54321' }, confirmationCode: 'CC-DEMO-1007', paymentMode: 'pay_at_visit', paymentStatus: 'pending' },
        ],
    };
}

/* ─────────────── Session-local demo store (mutable, not persisted) ─────────────── */

const demoProviders: Provider[] = DEMO_PROVIDERS.map((p) => ({ ...p }));
const demoDoctors: Record<string, Doctor[]> = Object.fromEntries(
    Object.entries(DEMO_DOCTORS).map(([k, v]) => [k, v.map((d) => ({ ...d }))])
);
const demoServices: Record<string, Service[]> = Object.fromEntries(
    Object.entries(DEMO_SERVICES).map(([k, v]) => [k, v.map((s) => ({ ...s }))])
);
const demoSchedules: Record<string, DoctorSchedule> = Object.fromEntries(
    Object.entries(DEMO_SCHEDULES).map(([k, v]) => [k, { ...v, days: v.days.map((d) => ({ ...d, breaks: [...d.breaks] })) }])
);
const demoExceptions: Record<string, AvailabilityException[]> = Object.fromEntries(
    Object.entries(DEMO_EXCEPTIONS).map(([k, v]) => [k, v.map((e) => ({ ...e }))])
);
const demoDashboards: Record<string, ProviderDashboard> = {};
function demoDashboardFor(providerId: string): ProviderDashboard {
    if (!demoDashboards[providerId]) demoDashboards[providerId] = buildDemoDashboard(providerId);
    return demoDashboards[providerId];
}

let demoIdSeq = 1;
const nextDemoId = (prefix: string) => `demo-new-${prefix}-${demoIdSeq++}`;

/* ───────────────────────── Reads (with fallback) ──────────────────── */

/**
 * "My providers" — the set the signed-in provider-admin can manage.
 * The contract does not yet define a dedicated ownership-filtered endpoint,
 * so this calls GET /api/nearby/providers?claimedByUserId=me as a
 * best-effort filter (harmless if the backend ignores unknown query params —
 * it then returns the full directory, still usable to seed the selector) and
 * falls back to a 2-provider demo set clearly owned by the demo user.
 */
export async function fetchMyProviders(): Promise<WithDemo<Provider[]>> {
    try {
        const data = await request<Provider[] | { providers: Provider[] }>('/api/nearby/providers?claimedByUserId=me');
        const list = Array.isArray(data) ? data : (data?.providers ?? []);
        return { data: list, demo: false };
    } catch (err) {
        if (isMissingEndpoint(err)) return { data: demoProviders, demo: true };
        throw err;
    }
}

export async function fetchProviderDashboard(providerId: string): Promise<WithDemo<ProviderDashboard>> {
    if (providerId.startsWith('demo-')) return { data: demoDashboardFor(providerId), demo: true };
    try {
        const data = await request<ProviderDashboard>(`/api/nearby/providers/${encodeURIComponent(providerId)}/dashboard`);
        return { data, demo: false };
    } catch (err) {
        if (isMissingEndpoint(err)) return { data: demoDashboardFor(providerId), demo: true };
        throw err;
    }
}

export async function fetchDoctors(providerId: string): Promise<WithDemo<Doctor[]>> {
    if (providerId.startsWith('demo-')) return { data: demoDoctors[providerId] || [], demo: true };
    try {
        const data = await request<Doctor[]>(`/api/nearby/providers/${encodeURIComponent(providerId)}/doctors`);
        return { data, demo: false };
    } catch (err) {
        if (isMissingEndpoint(err)) return { data: demoDoctors[providerId] || [], demo: true };
        throw err;
    }
}

export async function fetchServices(providerId: string): Promise<WithDemo<Service[]>> {
    if (providerId.startsWith('demo-')) return { data: demoServices[providerId] || [], demo: true };
    try {
        const data = await request<Service[]>(`/api/nearby/providers/${encodeURIComponent(providerId)}/services`);
        return { data, demo: false };
    } catch (err) {
        if (isMissingEndpoint(err)) return { data: demoServices[providerId] || [], demo: true };
        throw err;
    }
}

export async function fetchSchedules(providerId: string): Promise<WithDemo<DoctorSchedule[]>> {
    if (providerId.startsWith('demo-')) {
        return { data: Object.values(demoSchedules).filter((s) => s.providerId === providerId), demo: true };
    }
    try {
        const data = await request<DoctorSchedule[]>(`/api/nearby/providers/${encodeURIComponent(providerId)}/schedules`);
        return { data, demo: false };
    } catch (err) {
        if (isMissingEndpoint(err)) return { data: Object.values(demoSchedules).filter((s) => s.providerId === providerId), demo: true };
        throw err;
    }
}

export async function fetchExceptions(providerId: string): Promise<WithDemo<AvailabilityException[]>> {
    if (providerId.startsWith('demo-')) return { data: demoExceptions[providerId] || [], demo: true };
    try {
        const data = await request<AvailabilityException[]>(`/api/nearby/providers/${encodeURIComponent(providerId)}/exceptions`);
        return { data, demo: false };
    } catch (err) {
        if (isMissingEndpoint(err)) return { data: demoExceptions[providerId] || [], demo: true };
        throw err;
    }
}

/* ─────────────────────────────── Writes ───────────────────────────── */
/**
 * Writes throw ApiOfflineError (or 404 for endpoints not yet shipped) when
 * the backend can't fulfil them; the page then calls the matching
 * `demoApply*` helper to simulate the same change against the session-local
 * store and toasts that it's an offline/demo-mode change. Nothing here ever
 * marks a UI action "done" without going through one of these two paths.
 */

export function createProvider(body: Partial<Provider>) {
    return request<Provider>('/api/nearby/providers', { method: 'POST', body: JSON.stringify(body) });
}

export function updateProvider(providerId: string, body: Partial<Provider>) {
    return request<Provider>(`/api/nearby/providers/${encodeURIComponent(providerId)}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function claimProvider(providerId: string) {
    return request<Provider>(`/api/nearby/providers/${encodeURIComponent(providerId)}/claim`, { method: 'POST' });
}

export function createDoctor(providerId: string, body: Partial<Doctor>) {
    return request<Doctor>(`/api/nearby/providers/${encodeURIComponent(providerId)}/doctors`, { method: 'POST', body: JSON.stringify(body) });
}
export function updateDoctor(providerId: string, doctorId: string, body: Partial<Doctor>) {
    return request<Doctor>(`/api/nearby/providers/${encodeURIComponent(providerId)}/doctors/${encodeURIComponent(doctorId)}`, { method: 'PUT', body: JSON.stringify(body) });
}
export function deleteDoctor(providerId: string, doctorId: string) {
    return request<{ ok?: boolean }>(`/api/nearby/providers/${encodeURIComponent(providerId)}/doctors/${encodeURIComponent(doctorId)}`, { method: 'DELETE' });
}

export function createService(providerId: string, body: Partial<Service>) {
    return request<Service>(`/api/nearby/providers/${encodeURIComponent(providerId)}/services`, { method: 'POST', body: JSON.stringify(body) });
}
export function updateService(providerId: string, serviceId: string, body: Partial<Service>) {
    return request<Service>(`/api/nearby/providers/${encodeURIComponent(providerId)}/services/${encodeURIComponent(serviceId)}`, { method: 'PUT', body: JSON.stringify(body) });
}
export function deleteService(providerId: string, serviceId: string) {
    return request<{ ok?: boolean }>(`/api/nearby/providers/${encodeURIComponent(providerId)}/services/${encodeURIComponent(serviceId)}`, { method: 'DELETE' });
}

export function putSchedule(providerId: string, doctorId: string, body: Partial<DoctorSchedule>) {
    return request<DoctorSchedule>(`/api/nearby/providers/${encodeURIComponent(providerId)}/schedules/${encodeURIComponent(doctorId)}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function createException(providerId: string, body: Partial<AvailabilityException>) {
    return request<AvailabilityException>(`/api/nearby/providers/${encodeURIComponent(providerId)}/exceptions`, { method: 'POST', body: JSON.stringify(body) });
}
export function deleteException(providerId: string, exceptionId: string) {
    return request<{ ok?: boolean }>(`/api/nearby/providers/${encodeURIComponent(providerId)}/exceptions/${encodeURIComponent(exceptionId)}`, { method: 'DELETE' });
}

/** Not in the documented contract yet (assumption, flagged for backend confirmation). */
export function checkInAppointment(appointmentId: string) {
    return request<Appointment>(`/api/nearby/appointments/${encodeURIComponent(appointmentId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CHECKED_IN' }),
    });
}

/* ────────────── Demo-store mutation helpers (offline simulation) ────────────── */

export function demoApplyProviderUpdate(providerId: string, patch: Partial<Provider>): Provider {
    const idx = demoProviders.findIndex((p) => p._id === providerId);
    if (idx >= 0) demoProviders[idx] = { ...demoProviders[idx], ...patch };
    return demoProviders[idx];
}

export function demoApplyClaim(providerId: string): Provider {
    return demoApplyProviderUpdate(providerId, { claimedByUserId: DEMO_USER_ID, verificationStatus: 'CLAIMED' });
}

export function demoApplyDoctorUpsert(providerId: string, doctor: Partial<Doctor> & { _id?: string }): Doctor {
    const list = demoDoctors[providerId] || (demoDoctors[providerId] = []);
    if (doctor._id) {
        const idx = list.findIndex((d) => d._id === doctor._id);
        if (idx >= 0) { list[idx] = { ...list[idx], ...doctor } as Doctor; return list[idx]; }
    }
    const created: Doctor = { active: true, name: '', providerId, ...doctor, _id: doctor._id || nextDemoId('doc') } as Doctor;
    list.unshift(created);
    return created;
}
export function demoApplyDoctorRemove(providerId: string, doctorId: string) {
    demoDoctors[providerId] = (demoDoctors[providerId] || []).filter((d) => d._id !== doctorId);
}

export function demoApplyServiceUpsert(providerId: string, service: Partial<Service> & { _id?: string }): Service {
    const list = demoServices[providerId] || (demoServices[providerId] = []);
    if (service._id) {
        const idx = list.findIndex((s) => s._id === service._id);
        if (idx >= 0) { list[idx] = { ...list[idx], ...service } as Service; return list[idx]; }
    }
    const created: Service = {
        active: true, name: '', providerId, price: 0, durationMinutes: 15, homeCollection: false, onlineBooking: true,
        ...service, _id: service._id || nextDemoId('svc'),
    } as Service;
    list.unshift(created);
    return created;
}
export function demoApplyServiceRemove(providerId: string, serviceId: string) {
    demoServices[providerId] = (demoServices[providerId] || []).filter((s) => s._id !== serviceId);
}

export function demoApplySchedule(providerId: string, doctorId: string, days: ScheduleDay[]): DoctorSchedule {
    const existing = demoSchedules[doctorId];
    const next: DoctorSchedule = { _id: existing?._id || nextDemoId('sch'), providerId, doctorId, days };
    demoSchedules[doctorId] = next;
    return next;
}

export function demoApplyExceptionAdd(providerId: string, exception: Partial<AvailabilityException>): AvailabilityException {
    const list = demoExceptions[providerId] || (demoExceptions[providerId] = []);
    const created: AvailabilityException = { type: 'HOLIDAY', date: todayIso(), providerId, ...exception, _id: nextDemoId('exc') } as AvailabilityException;
    list.unshift(created);
    return created;
}
export function demoApplyExceptionRemove(providerId: string, exceptionId: string) {
    demoExceptions[providerId] = (demoExceptions[providerId] || []).filter((e) => e._id !== exceptionId);
}

export function demoApplyCheckIn(providerId: string, appointmentId: string): Appointment | null {
    const board = demoDashboardFor(providerId);
    const appt = board.todayAppointments.find((a) => a._id === appointmentId);
    if (appt) appt.status = 'CHECKED_IN';
    return appt || null;
}

/* ─────────────────────────────── Utils ────────────────────────────── */

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatINR(amount?: number): string {
    if (amount == null || Number.isNaN(amount)) return '—';
    if (amount === 0) return 'Free';
    return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function formatDate(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function isToday(iso: string): boolean {
    return iso.slice(0, 10) === todayIso();
}

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
    VERIFIED: 'Verified',
    CLAIMED: 'Claimed — pending review',
    UNVERIFIED: 'Unverified',
    SUSPENDED: 'Temporarily unavailable',
    CLOSED: 'Closed',
};
