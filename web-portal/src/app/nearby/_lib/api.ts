'use client';

/**
 * CareConnect Nearby — API client for the patient discovery + booking surface.
 * Talks to the real backend at https://api.careconnect.care/api/nearby and degrades
 * gracefully to a clearly-labeled demo dataset when the API is unreachable.
 * Every read returns `{ data, demo }` so the UI can surface a
 * "Demo data — backend offline" badge instead of crashing or pretending the
 * data is real. This mirrors the pattern in `src/app/emr/_lib/api.ts`.
 *
 * HONESTY NOTE: The demo dataset below represents a SAMPLE seed directory,
 * not real onboarded Vizag providers. Nothing here should ever be presented
 * to the user without the demo badge, and verification status is always
 * carried through to the UI unmodified.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

/* ────────────────────────────── Types ────────────────────────────── */

export type ProviderType = 'hospital' | 'clinic' | 'diagnostic' | 'pharmacy';

/** Never render UNVERIFIED/CLAIMED info with a verified-looking badge. */
export type VerificationStatus =
    | 'VERIFIED'
    | 'CLAIMED'
    | 'UNVERIFIED'
    | 'SUSPENDED'
    | 'CLOSED';

export interface GeoPoint {
    lat: number;
    lng: number;
}

export interface ReviewSummary {
    avg: number;
    count: number;
}

export interface FeeRange {
    min: number;
    max: number;
}

export interface WorkingHoursDay {
    day: string;
    opens?: string;
    closes?: string;
    closed?: boolean;
}

export interface NearbyProvider {
    _id: string;
    name: string;
    type: ProviderType;
    subtype?: string;
    locality: string;
    address: string;
    geo: GeoPoint;
    distanceKm: number;
    openNow: boolean;
    availableToday: boolean;
    verificationStatus: VerificationStatus;
    careconnectVerified: boolean;
    servicesOffered: string[];
    specialties: string[];
    consultationFeeRange?: FeeRange;
    homeCollection: boolean;
    teleconsultation: boolean;
    emergencyAvailable: boolean;
    reviewSummary?: ReviewSummary;
    photos?: string[];
    logo?: string;
    /**
     * Extension fields — not guaranteed by the documented /search or
     * /providers/:id contract. Rendered only when actually present on the
     * response; the UI never fabricates them when absent.
     */
    lastVerifiedAt?: string;
    phone?: string;
    website?: string;
    workingHours?: WorkingHoursDay[];
    insuranceAccepted?: string[];
}

export interface DoctorSummary {
    _id: string;
    name: string;
    specialty: string;
    qualification?: string;
    experienceYears?: number;
    consultationFee?: number;
    consultationTypes?: string[]; // e.g. ['in_person', 'video']
    photo?: string;
}

export interface ServiceSummary {
    _id: string;
    name: string;
    category: string;
    price?: number;
    durationMinutes?: number;
    homeCollection?: boolean;
    onlineBooking?: boolean;
}

export interface SlotPreview {
    startTime: string;
}

export interface ProviderProfile {
    provider: NearbyProvider;
    doctors: DoctorSummary[];
    services: ServiceSummary[];
    todaySlotsPreview?: SlotPreview[];
}

export type SlotStatus = 'available' | 'limited' | 'full' | 'closed';

export interface Slot {
    startTime: string;
    endTime: string;
    status: SlotStatus;
}

export interface PatientDetails {
    name: string;
    age: number;
    gender: string;
    phone: string;
}

export type PaymentMode = 'pay_at_location' | 'upi' | 'card' | 'insurance';

export interface AppointmentRecord {
    _id: string;
    providerId: string;
    providerName: string;
    providerLocality?: string;
    doctorId?: string;
    doctorName?: string;
    serviceId?: string;
    serviceName?: string;
    type: string;
    date: string;
    startTime: string;
    status: 'scheduled' | 'completed' | 'cancelled' | string;
    patientDetails: PatientDetails;
    paymentMode: PaymentMode;
    confirmationCode: string;
    createdAt: string;
    /** Set only on locally-simulated bookings made while the backend was offline. */
    demo?: boolean;
}

export interface LabBookingRecord {
    _id: string;
    providerId: string;
    providerName: string;
    tests: string[];
    collectionMethod: 'home' | 'lab';
    date: string;
    slot: string;
    address?: string;
    status: 'scheduled' | 'completed' | 'cancelled' | string;
    confirmationCode: string;
    createdAt: string;
    demo?: boolean;
}

export interface SearchParams {
    lat?: number;
    lng?: number;
    radiusKm?: number;
    type?: ProviderType | '';
    specialty?: string;
    q?: string;
    openNow?: boolean;
    availableToday?: boolean;
    verifiedOnly?: boolean;
    homeCollection?: boolean;
    teleconsultation?: boolean;
    emergency?: boolean;
    maxFee?: number;
}

export interface SearchResponse {
    results: NearbyProvider[];
    total: number;
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

/** Thrown for HTTP errors that carry a meaningful body (e.g. 409 slot conflict). */
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
        try {
            body = await res.json();
        } catch {
            /* non-JSON error body */
        }
        throw new ApiHttpError(res.status, body);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

/* ───────────────────────── Geolocation helper ─────────────────────── */

export interface UserLocation {
    lat: number;
    lng: number;
    source: 'geolocation' | 'locality' | 'default';
    locality?: string;
}

/** Approximate center of Visakhapatnam, used only as a last-resort default. */
export const VIZAG_CENTER: GeoPoint = { lat: 17.6868, lng: 83.2185 };

/**
 * Wraps navigator.geolocation in a Promise. Resolves to null (never rejects
 * loudly) on denial, timeout, or absence of the API, so callers can fall
 * back to the manual locality picker without a console error scaring anyone.
 */
export function requestBrowserLocation(): Promise<UserLocation | null> {
    return new Promise((resolve) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, source: 'geolocation' }),
            () => resolve(null),
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
        );
    });
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h =
        Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/* ────────────────────────── Vizag localities ───────────────────────── */

export const VIZAG_LOCALITIES: { name: string; geo: GeoPoint }[] = [
    { name: 'MVP Colony', geo: { lat: 17.7326, lng: 83.3332 } },
    { name: 'Dwaraka Nagar', geo: { lat: 17.7211, lng: 83.3007 } },
    { name: 'Madhurawada', geo: { lat: 17.8085, lng: 83.3801 } },
    { name: 'Gajuwaka', geo: { lat: 17.6868, lng: 83.2007 } },
    { name: 'Seethammadhara', geo: { lat: 17.7423, lng: 83.3182 } },
    { name: 'Akkayyapalem', geo: { lat: 17.7280, lng: 83.2965 } },
    { name: 'Asilmetta', geo: { lat: 17.7148, lng: 83.3168 } },
    { name: 'Pendurthi', geo: { lat: 17.8302, lng: 83.2251 } },
    { name: 'Rushikonda', geo: { lat: 17.7799, lng: 83.3822 } },
    { name: 'Sheela Nagar', geo: { lat: 17.7000, lng: 83.2333 } },
    { name: 'Ukkunagaram', geo: { lat: 17.6288, lng: 83.1974 } },
    { name: 'Chinna Waltair', geo: { lat: 17.7180, lng: 83.3241 } },
];

export function localityToGeo(name: string): GeoPoint | null {
    return VIZAG_LOCALITIES.find((l) => l.name === name)?.geo ?? null;
}

export async function fetchLocalities(): Promise<WithDemo<string[]>> {
    try {
        const data = await request<{ localities: string[] }>('/api/nearby/localities');
        return { data: data.localities, demo: false };
    } catch {
        return { data: VIZAG_LOCALITIES.map((l) => l.name), demo: true };
    }
}

/* ─────────────────────────── Demo dataset ─────────────────────────── */

const g = (lat: number, lng: number): GeoPoint => ({ lat, lng });

function isoDaysFromNow(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
}

function isoDaysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
}

function formatDDMMYYYY(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

export { formatDDMMYYYY };

/** The 8 sample providers. IDs are prefixed `demo-` so real backend IDs never collide. */
export const DEMO_PROVIDERS: NearbyProvider[] = [
    {
        _id: 'demo-p1',
        name: 'Apex Multispecialty Hospital',
        type: 'hospital',
        subtype: 'Multispecialty',
        locality: 'MVP Colony',
        address: '10-50-12, Sector 4, MVP Colony, Visakhapatnam',
        geo: g(17.7332, 83.3341),
        distanceKm: 0,
        openNow: true,
        availableToday: true,
        verificationStatus: 'VERIFIED',
        careconnectVerified: true,
        servicesOffered: ['OPD Consultation', 'Emergency Care', 'ICU', 'Cardiology', 'Orthopedics'],
        specialties: ['Cardiology', 'Orthopedics', 'General Medicine', 'Pediatrics'],
        consultationFeeRange: { min: 400, max: 900 },
        homeCollection: false,
        teleconsultation: true,
        emergencyAvailable: true,
        reviewSummary: { avg: 4.4, count: 218 },
        photos: [],
        lastVerifiedAt: isoDaysAgo(12),
        phone: '+91 891 234 5001',
        website: 'https://apexhospitals.example.in',
        workingHours: [
            { day: 'Mon', opens: '00:00', closes: '23:59' },
            { day: 'Tue', opens: '00:00', closes: '23:59' },
            { day: 'Wed', opens: '00:00', closes: '23:59' },
            { day: 'Thu', opens: '00:00', closes: '23:59' },
            { day: 'Fri', opens: '00:00', closes: '23:59' },
            { day: 'Sat', opens: '00:00', closes: '23:59' },
            { day: 'Sun', opens: '00:00', closes: '23:59' },
        ],
        insuranceAccepted: ['Star Health', 'HDFC Ergo', 'ICICI Lombard', 'CGHS'],
    },
    {
        _id: 'demo-p2',
        name: 'Dwaraka Nagar Family Clinic',
        type: 'clinic',
        subtype: 'General Practice',
        locality: 'Dwaraka Nagar',
        address: 'Main Road, Dwaraka Nagar, Visakhapatnam',
        geo: g(17.7215, 83.3012),
        distanceKm: 0,
        openNow: true,
        availableToday: true,
        verificationStatus: 'VERIFIED',
        careconnectVerified: true,
        servicesOffered: ['General Consultation', 'Vaccination', 'Minor Procedures'],
        specialties: ['General Medicine', 'Pediatrics'],
        consultationFeeRange: { min: 250, max: 400 },
        homeCollection: false,
        teleconsultation: true,
        emergencyAvailable: false,
        reviewSummary: { avg: 4.6, count: 87 },
        photos: [],
        lastVerifiedAt: isoDaysAgo(30),
        phone: '+91 891 234 5002',
        workingHours: [
            { day: 'Mon', opens: '09:00', closes: '20:00' },
            { day: 'Tue', opens: '09:00', closes: '20:00' },
            { day: 'Wed', opens: '09:00', closes: '20:00' },
            { day: 'Thu', opens: '09:00', closes: '20:00' },
            { day: 'Fri', opens: '09:00', closes: '20:00' },
            { day: 'Sat', opens: '09:00', closes: '14:00' },
            { day: 'Sun', closed: true },
        ],
        insuranceAccepted: ['Star Health'],
    },
    {
        _id: 'demo-p3',
        name: 'Madhurawada Diagnostics & Labs',
        type: 'diagnostic',
        subtype: 'Pathology & Imaging',
        locality: 'Madhurawada',
        address: 'IT Hub Road, Madhurawada, Visakhapatnam',
        geo: g(17.8090, 83.3806),
        distanceKm: 0,
        openNow: true,
        availableToday: true,
        verificationStatus: 'CLAIMED',
        careconnectVerified: false,
        servicesOffered: ['Blood Tests', 'X-Ray', 'Ultrasound', 'Home Sample Collection'],
        specialties: [],
        consultationFeeRange: undefined,
        homeCollection: true,
        teleconsultation: false,
        emergencyAvailable: false,
        reviewSummary: { avg: 4.1, count: 42 },
        photos: [],
        phone: '+91 891 234 5003',
        workingHours: [
            { day: 'Mon', opens: '07:00', closes: '21:00' },
            { day: 'Tue', opens: '07:00', closes: '21:00' },
            { day: 'Wed', opens: '07:00', closes: '21:00' },
            { day: 'Thu', opens: '07:00', closes: '21:00' },
            { day: 'Fri', opens: '07:00', closes: '21:00' },
            { day: 'Sat', opens: '07:00', closes: '21:00' },
            { day: 'Sun', opens: '08:00', closes: '13:00' },
        ],
    },
    {
        _id: 'demo-p4',
        name: 'Gajuwaka General Hospital',
        type: 'hospital',
        subtype: 'General Hospital',
        locality: 'Gajuwaka',
        address: 'NH-16 Service Road, Gajuwaka, Visakhapatnam',
        geo: g(17.6872, 83.2013),
        distanceKm: 0,
        openNow: true,
        availableToday: false,
        verificationStatus: 'UNVERIFIED',
        careconnectVerified: false,
        servicesOffered: ['OPD Consultation', 'Emergency Care'],
        specialties: ['General Medicine', 'Surgery'],
        consultationFeeRange: undefined,
        homeCollection: false,
        teleconsultation: false,
        emergencyAvailable: true,
        reviewSummary: undefined,
        photos: [],
        phone: '+91 891 234 5004',
    },
    {
        _id: 'demo-p5',
        name: 'Seethammadhara Skin & Hair Clinic',
        type: 'clinic',
        subtype: 'Dermatology',
        locality: 'Seethammadhara',
        address: 'Beach Road Junction, Seethammadhara, Visakhapatnam',
        geo: g(17.7428, 83.3188),
        distanceKm: 0,
        openNow: false,
        availableToday: true,
        verificationStatus: 'VERIFIED',
        careconnectVerified: true,
        servicesOffered: ['Dermatology Consultation', 'Laser Treatment', 'Teleconsultation'],
        specialties: ['Dermatology', 'Cosmetology'],
        consultationFeeRange: { min: 500, max: 800 },
        homeCollection: false,
        teleconsultation: true,
        emergencyAvailable: false,
        reviewSummary: { avg: 4.8, count: 134 },
        photos: [],
        lastVerifiedAt: isoDaysAgo(5),
        phone: '+91 891 234 5005',
        workingHours: [
            { day: 'Mon', opens: '10:00', closes: '19:00' },
            { day: 'Tue', opens: '10:00', closes: '19:00' },
            { day: 'Wed', opens: '10:00', closes: '19:00' },
            { day: 'Thu', opens: '10:00', closes: '19:00' },
            { day: 'Fri', opens: '10:00', closes: '19:00' },
            { day: 'Sat', opens: '10:00', closes: '19:00' },
            { day: 'Sun', closed: true },
        ],
        insuranceAccepted: [],
    },
    {
        _id: 'demo-p6',
        name: 'Akkayyapalem City Pharmacy',
        type: 'pharmacy',
        subtype: 'Retail Pharmacy',
        locality: 'Akkayyapalem',
        address: 'Main Bazaar Road, Akkayyapalem, Visakhapatnam',
        geo: g(17.7285, 83.2970),
        distanceKm: 0,
        openNow: true,
        availableToday: false,
        verificationStatus: 'CLAIMED',
        careconnectVerified: false,
        servicesOffered: ['Medicine Dispensing', 'Home Delivery'],
        specialties: [],
        consultationFeeRange: undefined,
        homeCollection: false,
        teleconsultation: false,
        emergencyAvailable: false,
        reviewSummary: { avg: 4.0, count: 19 },
        photos: [],
        phone: '+91 891 234 5006',
        workingHours: [
            { day: 'Mon', opens: '08:00', closes: '22:00' },
            { day: 'Tue', opens: '08:00', closes: '22:00' },
            { day: 'Wed', opens: '08:00', closes: '22:00' },
            { day: 'Thu', opens: '08:00', closes: '22:00' },
            { day: 'Fri', opens: '08:00', closes: '22:00' },
            { day: 'Sat', opens: '08:00', closes: '22:00' },
            { day: 'Sun', opens: '08:00', closes: '22:00' },
        ],
    },
    {
        _id: 'demo-p7',
        name: 'Asilmetta Care Diagnostics',
        type: 'diagnostic',
        subtype: 'Pathology Lab',
        locality: 'Asilmetta',
        address: 'Siripuram Junction, Asilmetta, Visakhapatnam',
        geo: g(17.7152, 83.3172),
        distanceKm: 0,
        openNow: false,
        availableToday: false,
        verificationStatus: 'SUSPENDED',
        careconnectVerified: false,
        servicesOffered: ['Blood Tests', 'Health Packages'],
        specialties: [],
        consultationFeeRange: undefined,
        homeCollection: false,
        teleconsultation: false,
        emergencyAvailable: false,
        reviewSummary: { avg: 3.9, count: 11 },
        photos: [],
        phone: '+91 891 234 5007',
    },
    {
        _id: 'demo-p8',
        name: 'MVP Colony Dental & Ortho',
        type: 'clinic',
        subtype: 'Dental',
        locality: 'MVP Colony',
        address: 'Sector 2 Market, MVP Colony, Visakhapatnam',
        geo: g(17.7318, 83.3325),
        distanceKm: 0,
        openNow: false,
        availableToday: false,
        verificationStatus: 'CLOSED',
        careconnectVerified: false,
        servicesOffered: ['Dental Consultation', 'Orthodontics'],
        specialties: ['Dentistry'],
        consultationFeeRange: undefined,
        homeCollection: false,
        teleconsultation: false,
        emergencyAvailable: false,
        reviewSummary: { avg: 4.2, count: 56 },
        photos: [],
        phone: '+91 891 234 5008',
    },
];

/** Providers that allow booking a doctor appointment through CareConnect (derived from doctors/services below — never a bare flag). */
export const DEMO_APPOINTMENT_ENABLED_IDS = new Set(['demo-p1', 'demo-p2', 'demo-p5']);

const DEMO_DOCTORS: Record<string, DoctorSummary[]> = {
    'demo-p1': [
        {
            _id: 'demo-doc1',
            name: 'Dr. Raj Sharma',
            specialty: 'Cardiology',
            qualification: 'MD, DM Cardiology',
            experienceYears: 14,
            consultationFee: 700,
            consultationTypes: ['in_person', 'video'],
        },
        {
            _id: 'demo-doc2',
            name: 'Dr. Anitha Rao',
            specialty: 'Orthopedics',
            qualification: 'MS Ortho',
            experienceYears: 9,
            consultationFee: 500,
            consultationTypes: ['in_person'],
        },
    ],
    'demo-p2': [
        {
            _id: 'demo-doc3',
            name: 'Dr. Kiran Kumar',
            specialty: 'General Medicine',
            qualification: 'MBBS, MD',
            experienceYears: 11,
            consultationFee: 300,
            consultationTypes: ['in_person', 'video'],
        },
    ],
    'demo-p5': [
        {
            _id: 'demo-doc4',
            name: 'Dr. Priya Menon',
            specialty: 'Dermatology',
            qualification: 'MD Dermatology',
            experienceYears: 8,
            consultationFee: 600,
            consultationTypes: ['in_person', 'video'],
        },
    ],
    'demo-p4': [
        {
            _id: 'demo-doc5',
            name: 'Dr. Satish Babu',
            specialty: 'General Medicine',
            qualification: 'MBBS',
            experienceYears: 6,
            consultationTypes: [],
        },
    ],
};

const DEMO_SERVICES: Record<string, ServiceSummary[]> = {
    'demo-p1': [
        { _id: 'demo-svc1', name: 'Cardiology Consultation', category: 'Consultation', price: 700, durationMinutes: 20, onlineBooking: true },
        { _id: 'demo-svc2', name: 'ECG', category: 'Diagnostic', price: 250, durationMinutes: 15, onlineBooking: true },
    ],
    'demo-p2': [
        { _id: 'demo-svc3', name: 'General Consultation', category: 'Consultation', price: 300, durationMinutes: 15, onlineBooking: true },
        { _id: 'demo-svc4', name: 'Vaccination', category: 'Procedure', price: 450, durationMinutes: 10, onlineBooking: false },
    ],
    'demo-p3': [
        { _id: 'demo-svc5', name: 'Complete Blood Count (CBC)', category: 'Lab Test', price: 350, durationMinutes: 10, homeCollection: true, onlineBooking: true },
        { _id: 'demo-svc6', name: 'Chest X-Ray', category: 'Imaging', price: 500, durationMinutes: 15, homeCollection: false, onlineBooking: true },
        { _id: 'demo-svc7', name: 'Abdominal Ultrasound', category: 'Imaging', price: 900, durationMinutes: 20, homeCollection: false, onlineBooking: true },
    ],
    'demo-p5': [
        { _id: 'demo-svc8', name: 'Dermatology Consultation', category: 'Consultation', price: 600, durationMinutes: 20, onlineBooking: true },
        { _id: 'demo-svc9', name: 'Laser Hair Reduction (session)', category: 'Procedure', price: 1500, durationMinutes: 30, onlineBooking: true },
    ],
    'demo-p6': [
        { _id: 'demo-svc10', name: 'Home Medicine Delivery', category: 'Delivery', price: 0, durationMinutes: undefined, onlineBooking: false },
    ],
    'demo-p7': [
        { _id: 'demo-svc11', name: 'Full Body Checkup', category: 'Health Package', price: 1999, durationMinutes: 45, homeCollection: true, onlineBooking: false },
    ],
    'demo-p8': [
        { _id: 'demo-svc12', name: 'Dental Consultation', category: 'Consultation', price: 300, durationMinutes: 20, onlineBooking: false },
    ],
    'demo-p4': [],
};

/** Realistic-looking availability slots — only for the 2-3 providers the spec calls out. Never invented beyond this fixed table. */
const DEMO_SLOTS: Record<string, Slot[]> = {
    'demo-doc1': [
        { startTime: '09:00', endTime: '09:20', status: 'available' },
        { startTime: '09:20', endTime: '09:40', status: 'available' },
        { startTime: '09:40', endTime: '10:00', status: 'limited' },
        { startTime: '10:00', endTime: '10:20', status: 'full' },
        { startTime: '10:20', endTime: '10:40', status: 'available' },
        { startTime: '11:00', endTime: '11:20', status: 'closed' },
        { startTime: '16:00', endTime: '16:20', status: 'available' },
        { startTime: '16:20', endTime: '16:40', status: 'limited' },
    ],
    'demo-doc2': [
        { startTime: '11:00', endTime: '11:20', status: 'available' },
        { startTime: '11:20', endTime: '11:40', status: 'full' },
        { startTime: '11:40', endTime: '12:00', status: 'available' },
    ],
    'demo-doc3': [
        { startTime: '09:30', endTime: '09:45', status: 'available' },
        { startTime: '09:45', endTime: '10:00', status: 'available' },
        { startTime: '10:00', endTime: '10:15', status: 'limited' },
        { startTime: '18:00', endTime: '18:15', status: 'available' },
        { startTime: '18:15', endTime: '18:30', status: 'full' },
    ],
    'demo-doc4': [
        { startTime: '12:00', endTime: '12:20', status: 'available' },
        { startTime: '12:20', endTime: '12:40', status: 'available' },
        { startTime: '14:00', endTime: '14:20', status: 'limited' },
    ],
};

/** In-memory + localStorage-backed store for demo bookings created while offline. */
const DEMO_APPT_KEY = 'cc-nearby-demo-appointments';
const DEMO_LAB_KEY = 'cc-nearby-demo-lab-bookings';

function readLocal<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
        return [];
    }
}

function writeLocal<T>(key: string, items: T[]): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(items));
    } catch {
        /* storage unavailable */
    }
}

const SEED_APPOINTMENTS: AppointmentRecord[] = [
    {
        _id: 'demo-appt-seed-1',
        providerId: 'demo-p1',
        providerName: 'Apex Multispecialty Hospital',
        providerLocality: 'MVP Colony',
        doctorId: 'demo-doc1',
        doctorName: 'Dr. Raj Sharma',
        serviceId: 'demo-svc1',
        serviceName: 'Cardiology Consultation',
        type: 'in_person',
        date: isoDaysFromNow(2),
        startTime: '09:00',
        status: 'scheduled',
        patientDetails: { name: 'Rohit Sharma', age: 34, gender: 'male', phone: '+91 98765 43210' },
        paymentMode: 'pay_at_location',
        confirmationCode: 'DEMO-CC8841',
        createdAt: isoDaysAgo(3),
        demo: true,
    },
    {
        _id: 'demo-appt-seed-2',
        providerId: 'demo-p5',
        providerName: 'Seethammadhara Skin & Hair Clinic',
        providerLocality: 'Seethammadhara',
        doctorId: 'demo-doc4',
        doctorName: 'Dr. Priya Menon',
        serviceId: 'demo-svc8',
        serviceName: 'Dermatology Consultation',
        type: 'video',
        date: isoDaysAgo(20),
        startTime: '12:00',
        status: 'completed',
        patientDetails: { name: 'Rohit Sharma', age: 34, gender: 'male', phone: '+91 98765 43210' },
        paymentMode: 'upi',
        confirmationCode: 'DEMO-CC7720',
        createdAt: isoDaysAgo(22),
        demo: true,
    },
    {
        _id: 'demo-appt-seed-3',
        providerId: 'demo-p2',
        providerName: 'Dwaraka Nagar Family Clinic',
        providerLocality: 'Dwaraka Nagar',
        doctorId: 'demo-doc3',
        doctorName: 'Dr. Kiran Kumar',
        serviceId: 'demo-svc3',
        serviceName: 'General Consultation',
        type: 'in_person',
        date: isoDaysAgo(9),
        startTime: '18:00',
        status: 'cancelled',
        patientDetails: { name: 'Rohit Sharma', age: 34, gender: 'male', phone: '+91 98765 43210' },
        paymentMode: 'pay_at_location',
        confirmationCode: 'DEMO-CC7605',
        createdAt: isoDaysAgo(10),
        demo: true,
    },
];

/* ─────────────────────────── Search / list ─────────────────────────── */

function specialtyMatch(p: NearbyProvider, specialty?: string): boolean {
    if (!specialty) return true;
    // Contract defines a single `specialty` param; the UI's multiselect joins
    // choices with a comma and any match here counts as a hit.
    const needles = specialty.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!needles.length) return true;
    return needles.some((needle) => p.specialties.some((s) => s.toLowerCase().includes(needle)));
}

/**
 * Heuristic-only, contract-gap workaround: /search does not expose a
 * dedicated "doctor appointment bookable" flag, so this filter uses fields
 * the contract does define (a listed consultation fee range, or
 * teleconsultation support) as a reasonable proxy. It never claims booking
 * is confirmed — it only narrows to providers likely to support it.
 */
export function looksAppointmentAvailable(p: NearbyProvider): boolean {
    return Boolean(p.consultationFeeRange) || p.teleconsultation;
}

export const ALL_SPECIALTIES = Array.from(new Set(DEMO_PROVIDERS.flatMap((p) => p.specialties))).sort();

function textMatch(p: NearbyProvider, q?: string): boolean {
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
        p.name.toLowerCase().includes(needle) ||
        p.locality.toLowerCase().includes(needle) ||
        p.specialties.some((s) => s.toLowerCase().includes(needle)) ||
        p.servicesOffered.some((s) => s.toLowerCase().includes(needle))
    );
}

function demoSearch(params: SearchParams): SearchResponse {
    const origin: GeoPoint = params.lat != null && params.lng != null ? { lat: params.lat, lng: params.lng } : VIZAG_CENTER;
    const radius = params.radiusKm ?? 25;
    let results = DEMO_PROVIDERS.map((p) => ({ ...p, distanceKm: Math.round(haversineKm(origin, p.geo) * 10) / 10 }));

    results = results.filter((p) => p.distanceKm <= radius);
    if (params.type) results = results.filter((p) => p.type === params.type);
    if (params.specialty) results = results.filter((p) => specialtyMatch(p, params.specialty));
    if (params.q) results = results.filter((p) => textMatch(p, params.q));
    if (params.openNow) results = results.filter((p) => p.openNow);
    if (params.availableToday) results = results.filter((p) => p.availableToday);
    if (params.verifiedOnly) results = results.filter((p) => p.verificationStatus === 'VERIFIED');
    if (params.homeCollection) results = results.filter((p) => p.homeCollection);
    if (params.teleconsultation) results = results.filter((p) => p.teleconsultation);
    if (params.emergency) results = results.filter((p) => p.emergencyAvailable);
    if (params.maxFee != null) {
        results = results.filter((p) => !p.consultationFeeRange || p.consultationFeeRange.min <= params.maxFee!);
    }

    results.sort((a, b) => a.distanceKm - b.distanceKm);
    return { results, total: results.length };
}

export async function searchProviders(params: SearchParams): Promise<WithDemo<SearchResponse>> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== null) qs.set(k, String(v));
    });
    try {
        const data = await request<SearchResponse>(`/api/nearby/search?${qs.toString()}`);
        return { data, demo: false };
    } catch {
        return { data: demoSearch(params), demo: true };
    }
}

/* ─────────────────────────── Provider profile ─────────────────────── */

export function isAppointmentEnabled(profile: Pick<ProviderProfile, 'doctors' | 'services'>): boolean {
    const doctorBookable = profile.doctors.some((d) => (d.consultationTypes?.length ?? 0) > 0);
    const serviceBookable = profile.services.some((s) => s.onlineBooking);
    return doctorBookable || serviceBookable;
}

function demoProfile(id: string): ProviderProfile | null {
    const provider = DEMO_PROVIDERS.find((p) => p._id === id);
    if (!provider) return null;
    const doctors = DEMO_DOCTORS[id] ?? [];
    const services = DEMO_SERVICES[id] ?? [];
    const todaySlotsPreview = doctors
        .flatMap((d) => DEMO_SLOTS[d._id] ?? [])
        .filter((s) => s.status === 'available')
        .slice(0, 4)
        .map((s) => ({ startTime: s.startTime }));
    return { provider, doctors, services, todaySlotsPreview: todaySlotsPreview.length ? todaySlotsPreview : undefined };
}

export async function fetchProviderProfile(id: string): Promise<WithDemo<ProviderProfile>> {
    if (id.startsWith('demo-')) {
        const data = demoProfile(id);
        if (!data) throw new ApiHttpError(404, { message: 'Provider not found' });
        return { data, demo: true };
    }
    try {
        const data = await request<ProviderProfile>(`/api/nearby/providers/${id}`);
        return { data, demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) {
            const data = demoProfile('demo-p1')!;
            return { data: { ...data, provider: { ...data.provider, _id: id } }, demo: true };
        }
        throw err;
    }
}

export async function fetchAvailability(
    providerId: string,
    doctorId: string | undefined,
    date: string
): Promise<WithDemo<{ slots: Slot[] }>> {
    if (providerId.startsWith('demo-')) {
        const slots = doctorId ? DEMO_SLOTS[doctorId] ?? [] : [];
        return { data: { slots }, demo: true };
    }
    try {
        const qs = new URLSearchParams({ date, ...(doctorId ? { doctorId } : {}) });
        const data = await request<{ slots: Slot[] }>(`/api/nearby/providers/${providerId}/availability?${qs.toString()}`);
        return { data, demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) {
            const slots = doctorId ? DEMO_SLOTS[doctorId] ?? [] : [];
            return { data: { slots }, demo: true };
        }
        throw err;
    }
}

/* ───────────────────────── Appointments (writes) ───────────────────── */

export interface CreateAppointmentBody {
    providerId: string;
    doctorId?: string;
    serviceId?: string;
    type: string;
    date: string;
    startTime: string;
    patientDetails: PatientDetails;
    paymentMode: PaymentMode;
}

function genConfirmationCode(prefix = 'CC'): string {
    return `${prefix}${Math.floor(1000 + Math.random() * 9000)}${Math.floor(10 + Math.random() * 90)}`;
}

export async function createAppointment(body: CreateAppointmentBody): Promise<{ appointment: AppointmentRecord; demo: boolean }> {
    try {
        const data = await request<{ appointment: AppointmentRecord }>('/api/nearby/appointments', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        return { appointment: data.appointment, demo: false };
    } catch (err) {
        if (err instanceof ApiHttpError) throw err; // e.g. 409 conflict — caller must handle explicitly
        if (err instanceof ApiOfflineError) {
            const provider = DEMO_PROVIDERS.find((p) => p._id === body.providerId);
            const doctor = (DEMO_DOCTORS[body.providerId] ?? []).find((d) => d._id === body.doctorId);
            const service = (DEMO_SERVICES[body.providerId] ?? []).find((s) => s._id === body.serviceId);
            const appointment: AppointmentRecord = {
                _id: `demo-appt-${Date.now()}`,
                providerId: body.providerId,
                providerName: provider?.name ?? 'Selected provider',
                providerLocality: provider?.locality,
                doctorId: body.doctorId,
                doctorName: doctor?.name,
                serviceId: body.serviceId,
                serviceName: service?.name,
                type: body.type,
                date: body.date,
                startTime: body.startTime,
                status: 'scheduled',
                patientDetails: body.patientDetails,
                paymentMode: body.paymentMode,
                confirmationCode: `DEMO-${genConfirmationCode()}`,
                createdAt: new Date().toISOString(),
                demo: true,
            };
            const existing = readLocal<AppointmentRecord>(DEMO_APPT_KEY);
            writeLocal(DEMO_APPT_KEY, [appointment, ...existing]);
            return { appointment, demo: true };
        }
        throw err;
    }
}

export async function fetchMyAppointments(status?: string): Promise<WithDemo<AppointmentRecord[]>> {
    try {
        const qs = status ? `?status=${encodeURIComponent(status)}` : '';
        const data = await request<{ appointments: AppointmentRecord[] }>(`/api/nearby/appointments/mine${qs}`);
        return { data: data.appointments, demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) {
            const local = readLocal<AppointmentRecord>(DEMO_APPT_KEY);
            const all = [...local, ...SEED_APPOINTMENTS];
            const filtered = status ? all.filter((a) => a.status === status) : all;
            return { data: filtered, demo: true };
        }
        throw err;
    }
}

export async function cancelAppointment(id: string, reason: string): Promise<{ demo: boolean }> {
    if (id.startsWith('demo-')) {
        const local = readLocal<AppointmentRecord>(DEMO_APPT_KEY);
        const updated = local.map((a) => (a._id === id ? { ...a, status: 'cancelled' } : a));
        writeLocal(DEMO_APPT_KEY, updated);
        return { demo: true };
    }
    try {
        await request(`/api/nearby/appointments/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) });
        return { demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) return { demo: true };
        throw err;
    }
}

export async function rescheduleAppointment(id: string, date: string, startTime: string): Promise<{ demo: boolean }> {
    if (id.startsWith('demo-')) {
        const local = readLocal<AppointmentRecord>(DEMO_APPT_KEY);
        const updated = local.map((a) => (a._id === id ? { ...a, date, startTime } : a));
        writeLocal(DEMO_APPT_KEY, updated);
        return { demo: true };
    }
    try {
        await request(`/api/nearby/appointments/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify({ date, startTime }) });
        return { demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) return { demo: true };
        throw err;
    }
}

/* ───────────────────────── Lab bookings (writes) ───────────────────── */

export interface CreateLabBookingBody {
    providerId: string;
    tests: string[];
    collectionMethod: 'home' | 'lab';
    date: string;
    slot: string;
    address?: string;
}

export async function createLabBooking(body: CreateLabBookingBody): Promise<{ booking: LabBookingRecord; demo: boolean }> {
    try {
        const data = await request<{ booking: LabBookingRecord }>('/api/nearby/lab-bookings', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        return { booking: data.booking, demo: false };
    } catch (err) {
        if (err instanceof ApiHttpError) throw err;
        if (err instanceof ApiOfflineError) {
            const provider = DEMO_PROVIDERS.find((p) => p._id === body.providerId);
            const booking: LabBookingRecord = {
                _id: `demo-lab-${Date.now()}`,
                providerId: body.providerId,
                providerName: provider?.name ?? 'Selected lab',
                tests: body.tests,
                collectionMethod: body.collectionMethod,
                date: body.date,
                slot: body.slot,
                address: body.address,
                status: 'scheduled',
                confirmationCode: `DEMO-LAB${genConfirmationCode()}`,
                createdAt: new Date().toISOString(),
                demo: true,
            };
            const existing = readLocal<LabBookingRecord>(DEMO_LAB_KEY);
            writeLocal(DEMO_LAB_KEY, [booking, ...existing]);
            return { booking, demo: true };
        }
        throw err;
    }
}

export async function fetchMyLabBookings(): Promise<WithDemo<LabBookingRecord[]>> {
    try {
        const data = await request<{ bookings: LabBookingRecord[] }>('/api/nearby/lab-bookings/mine');
        return { data: data.bookings, demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) {
            return { data: readLocal<LabBookingRecord>(DEMO_LAB_KEY), demo: true };
        }
        throw err;
    }
}

/* ─────────────────────────────── Reviews ───────────────────────────── */

export async function postReview(providerId: string, body: { appointmentId: string; rating: number; comment: string }): Promise<{ demo: boolean }> {
    try {
        await request(`/api/nearby/providers/${providerId}/reviews`, { method: 'POST', body: JSON.stringify(body) });
        return { demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) return { demo: true };
        throw err;
    }
}

/* ─────────────────────────────── Utils ─────────────────────────────── */

export const PROVIDER_TYPE_LABELS: Record<ProviderType, string> = {
    hospital: 'Hospital',
    clinic: 'Clinic',
    diagnostic: 'Diagnostic Center',
    pharmacy: 'Pharmacy',
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
    VERIFIED: 'Verified by CareConnect',
    CLAIMED: 'Claimed — unverified',
    UNVERIFIED: 'Unverified listing',
    SUSPENDED: 'Temporarily unavailable',
    CLOSED: 'Permanently closed',
};

export function formatINR(amount?: number): string {
    if (amount == null) return '—';
    if (amount === 0) return 'Free';
    return '₹' + amount.toLocaleString('en-IN');
}

export function feeRangeLabel(range?: FeeRange): string {
    if (!range) return 'Fee not listed';
    if (range.min === range.max) return formatINR(range.min);
    return `${formatINR(range.min)} – ${formatINR(range.max)}`;
}

export function directionsUrl(geo: GeoPoint, label: string): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${geo.lat},${geo.lng}&destination_place_id=&travelmode=driving&dir_action=navigate&q=${encodeURIComponent(label)}`;
}

export function telUrl(phone?: string): string | null {
    if (!phone) return null;
    return `tel:${phone.replace(/\s+/g, '')}`;
}
