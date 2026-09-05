'use client';

/**
 * Billable Items Master API client — talks to the backend at
 * http://localhost:5000/api/masters/billables and degrades gracefully to a
 * small, clearly-labeled demo dataset when the API is unreachable. Reads
 * return `{ data, demo }` so the UI can show a "Demo data — backend offline"
 * badge. Writes throw ApiOfflineError; the page decides how to simulate
 * locally (never faking a server success silently).
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

/* ────────────────────────────── Types ────────────────────────────── */

export type BillableType =
    | 'lab_test' | 'panel' | 'imaging' | 'consumable'
    | 'ivd_kit' | 'blood_bank' | 'service' | 'medicine';

export interface LabExt {
    testCode?: string;
    specimen?: string;
    container?: string;
    collectionInstructions?: string;
    tatHours?: number;
    refRange?: { default?: string; notes?: string };
    criticalValue?: string;
    method?: string;
    resultType?: string;
    nablScope?: boolean;
    externalReferral?: boolean;
    memberCodes?: string[];
}

export interface IvdExt {
    lotNumber?: string;
    expiryDate?: string;
    storageTemp?: string;
    packSize?: string;
    supplier?: string;
    purchasePrice?: number;
    regulatoryClass?: string;
    currentStock?: number;
    reorderLevel?: number;
}

export interface BillableItem {
    _id: string;
    itemCode: string;
    name: string;
    type: BillableType;
    category?: string;
    subcategory?: string;
    department?: string;
    unit?: string;
    unitPrice?: number;
    gst?: number;
    hsnSac?: string;
    barcode?: string;
    manufacturer?: string;
    brand?: string;
    active: boolean;
    inventoryTracked?: boolean;
    batchTracked?: boolean;
    expiryTracked?: boolean;
    notes?: string;
    labExt?: LabExt;
    ivdExt?: IvdExt;
}

export interface BillablesQuery {
    type?: BillableType;
    category?: string;
    q?: string;
    active?: boolean;
    page?: number;   // 1-based
    limit?: number;
}

export interface BillablesPage {
    items: BillableItem[];
    total: number;
    page: number;
    limit: number;
    source?: string;
}

export interface CategoryCount { category: string; count: number }

export interface BulkBody {
    ids: string[];
    action: 'activate' | 'deactivate' | 'price' | 'gst' | 'category';
    value?: number | string;
}

export interface ImportResult {
    created: number;
    updated: number;
    skippedDuplicates: number;
    errors: { line: number; message: string }[];
}

export interface WithDemo<T> { data: T; demo: boolean }

/* ─────────────────────────── Fetch plumbing ───────────────────────── */

export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try { return window.localStorage.getItem('token'); } catch { return null; }
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

async function rawFetch(path: string, init?: RequestInit, timeoutMs = 5000): Promise<Response> {
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
    return res;
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 5000): Promise<T> {
    const res = await rawFetch(path, init, timeoutMs);
    return res.json() as Promise<T>;
}

/* ─────────────────────────── Demo dataset ─────────────────────────── */
/**
 * Small labeled starter/demo catalogue. Prices, GST rates and clinical
 * metadata are illustrative placeholders — configure real values before use.
 */

const D = (partial: Omit<BillableItem, 'active'> & { active?: boolean }): BillableItem => ({ active: true, ...partial });

export const DEMO_BILLABLES: BillableItem[] = [
    // ── Lab tests (10) ──
    D({ _id: 'demo-lab-1', itemCode: 'LAB-CBC', name: 'Complete Blood Count (CBC)', type: 'lab_test', category: 'Hematology', unit: 'test', unitPrice: 350, gst: 0, hsnSac: '999316', labExt: { testCode: 'CBC', specimen: 'Whole blood', container: 'EDTA (lavender)', tatHours: 4, method: 'Automated cell counter', resultType: 'numeric-panel', nablScope: true } }),
    D({ _id: 'demo-lab-2', itemCode: 'LAB-HBA1C', name: 'HbA1c (Glycated Hemoglobin)', type: 'lab_test', category: 'Biochemistry', subcategory: 'Diabetes', unit: 'test', unitPrice: 550, gst: 0, hsnSac: '999316', labExt: { testCode: 'HBA1C', specimen: 'Whole blood', container: 'EDTA (lavender)', tatHours: 6, method: 'HPLC', resultType: 'numeric', nablScope: true } }),
    D({ _id: 'demo-lab-3', itemCode: 'LAB-LIPID', name: 'Lipid Profile', type: 'lab_test', category: 'Biochemistry', unit: 'test', unitPrice: 700, gst: 0, hsnSac: '999316', labExt: { testCode: 'LIPID', specimen: 'Serum', container: 'SST (gold)', collectionInstructions: '10–12 hours fasting', tatHours: 6, resultType: 'numeric-panel' } }),
    D({ _id: 'demo-lab-4', itemCode: 'LAB-LFT', name: 'Liver Function Test (LFT)', type: 'lab_test', category: 'Biochemistry', unit: 'test', unitPrice: 650, gst: 0, hsnSac: '999316', labExt: { testCode: 'LFT', specimen: 'Serum', container: 'SST (gold)', tatHours: 6, resultType: 'numeric-panel' } }),
    D({ _id: 'demo-lab-5', itemCode: 'LAB-KFT', name: 'Kidney Function Test (KFT)', type: 'lab_test', category: 'Biochemistry', unit: 'test', unitPrice: 600, gst: 0, hsnSac: '999316', labExt: { testCode: 'KFT', specimen: 'Serum', container: 'SST (gold)', tatHours: 6, resultType: 'numeric-panel' } }),
    D({ _id: 'demo-lab-6', itemCode: 'LAB-TSH', name: 'Thyroid Stimulating Hormone (TSH)', type: 'lab_test', category: 'Immunoassay', subcategory: 'Thyroid', unit: 'test', unitPrice: 400, gst: 0, hsnSac: '999316', labExt: { testCode: 'TSH', specimen: 'Serum', container: 'SST (gold)', tatHours: 8, method: 'CLIA', resultType: 'numeric' } }),
    D({ _id: 'demo-lab-7', itemCode: 'LAB-URM', name: 'Urine Routine & Microscopy', type: 'lab_test', category: 'Clinical Pathology', unit: 'test', unitPrice: 200, gst: 0, hsnSac: '999316', labExt: { testCode: 'URINE-RM', specimen: 'Urine', container: 'Sterile urine container', collectionInstructions: 'Midstream clean-catch sample', tatHours: 4, resultType: 'descriptive' } }),
    D({ _id: 'demo-lab-8', itemCode: 'LAB-CRP', name: 'C-Reactive Protein (CRP)', type: 'lab_test', category: 'Immunoassay', unit: 'test', unitPrice: 450, gst: 0, hsnSac: '999316', labExt: { testCode: 'CRP', specimen: 'Serum', container: 'SST (gold)', tatHours: 6, resultType: 'numeric' } }),
    D({ _id: 'demo-lab-9', itemCode: 'LAB-TROPI', name: 'Troponin I (Quantitative)', type: 'lab_test', category: 'Immunoassay', subcategory: 'Cardiac markers', unit: 'test', unitPrice: 1200, gst: 0, hsnSac: '999316', labExt: { testCode: 'TROP-I', specimen: 'Serum', container: 'SST (gold)', tatHours: 2, criticalValue: 'Per lab-validated cutoff', resultType: 'numeric' } }),
    D({ _id: 'demo-lab-10', itemCode: 'LAB-FBS', name: 'Fasting Blood Sugar (FBS)', type: 'lab_test', category: 'Biochemistry', subcategory: 'Diabetes', unit: 'test', unitPrice: 120, gst: 0, hsnSac: '999316', labExt: { testCode: 'FBS', specimen: 'Plasma', container: 'Fluoride (grey)', collectionInstructions: '8–10 hours fasting', tatHours: 4, resultType: 'numeric' } }),
    // ── Panels (3) ──
    D({ _id: 'demo-pnl-1', itemCode: 'PNL-DIAB', name: 'Diabetes Profile', type: 'panel', category: 'Profiles', unit: 'panel', unitPrice: 900, gst: 0, hsnSac: '999316', labExt: { specimen: 'Blood + urine', tatHours: 8, memberCodes: ['FBS', 'HBA1C', 'URINE-RM'] } }),
    D({ _id: 'demo-pnl-2', itemCode: 'PNL-CARD', name: 'Cardiac Risk Profile', type: 'panel', category: 'Profiles', unit: 'panel', unitPrice: 2200, gst: 0, hsnSac: '999316', labExt: { specimen: 'Serum', tatHours: 8, memberCodes: ['LIPID', 'TROP-I', 'CRP'] } }),
    D({ _id: 'demo-pnl-3', itemCode: 'PNL-FEVER', name: 'Fever Panel (Basic)', type: 'panel', category: 'Profiles', unit: 'panel', unitPrice: 1100, gst: 0, hsnSac: '999316', labExt: { specimen: 'Whole blood + urine', tatHours: 12, memberCodes: ['CBC', 'CRP', 'URINE-RM'] } }),
    // ── Imaging (4) ──
    D({ _id: 'demo-img-1', itemCode: 'IMG-CXRPA', name: 'Chest X-Ray (PA view)', type: 'imaging', category: 'X-Ray', department: 'Radiology', unit: 'study', unitPrice: 400, gst: 0, hsnSac: '999316' }),
    D({ _id: 'demo-img-2', itemCode: 'IMG-USGABD', name: 'USG Abdomen & Pelvis', type: 'imaging', category: 'Ultrasound', department: 'Radiology', unit: 'study', unitPrice: 1200, gst: 0, hsnSac: '999316' }),
    D({ _id: 'demo-img-3', itemCode: 'IMG-CTBRP', name: 'CT Brain (Plain)', type: 'imaging', category: 'CT', department: 'Radiology', unit: 'study', unitPrice: 3200, gst: 0, hsnSac: '999316' }),
    D({ _id: 'demo-img-4', itemCode: 'IMG-MRIKNEE', name: 'MRI Knee (Single joint)', type: 'imaging', category: 'MRI', department: 'Radiology', unit: 'study', unitPrice: 6500, gst: 0, hsnSac: '999316' }),
    // ── Consumables (5) ──
    D({ _id: 'demo-con-1', itemCode: 'CON-SYR5', name: 'Syringe 5 ml (Disposable)', type: 'consumable', category: 'Injection & Infusion', unit: 'piece', unitPrice: 8, gst: 12, hsnSac: '9018', inventoryTracked: true, batchTracked: true, expiryTracked: true }),
    D({ _id: 'demo-con-2', itemCode: 'CON-IVC20', name: 'IV Cannula 20G', type: 'consumable', category: 'Injection & Infusion', unit: 'piece', unitPrice: 35, gst: 12, hsnSac: '9018', inventoryTracked: true, batchTracked: true, expiryTracked: true }),
    D({ _id: 'demo-con-3', itemCode: 'CON-GLVM', name: 'Examination Gloves (Medium, pair)', type: 'consumable', category: 'Protection', unit: 'pair', unitPrice: 12, gst: 12, hsnSac: '4015', inventoryTracked: true }),
    D({ _id: 'demo-con-4', itemCode: 'CON-GAUZE', name: 'Gauze Roll (Sterile)', type: 'consumable', category: 'Dressing', unit: 'roll', unitPrice: 25, gst: 12, hsnSac: '3005', inventoryTracked: true, batchTracked: true }),
    D({ _id: 'demo-con-5', itemCode: 'CON-EDTA', name: 'EDTA Vacutainer (Lavender)', type: 'consumable', category: 'Sample Collection', unit: 'piece', unitPrice: 15, gst: 12, hsnSac: '9018', inventoryTracked: true, batchTracked: true, expiryTracked: true }),
    // ── IVD kits (2) ──
    D({ _id: 'demo-ivd-1', itemCode: 'IVD-NS1', name: 'Dengue NS1 Antigen Rapid Kit (25T)', type: 'ivd_kit', category: 'Rapid Tests', unit: 'kit', unitPrice: 2200, gst: 12, hsnSac: '3822', inventoryTracked: true, batchTracked: true, expiryTracked: true, ivdExt: { packSize: '25 tests', storageTemp: '2–30 °C', currentStock: 6, reorderLevel: 3, regulatoryClass: '' } }),
    D({ _id: 'demo-ivd-2', itemCode: 'IVD-HBA1C-R', name: 'HbA1c Reagent Kit (HPLC)', type: 'ivd_kit', category: 'Reagents', unit: 'kit', unitPrice: 14500, gst: 12, hsnSac: '3822', inventoryTracked: true, batchTracked: true, expiryTracked: true, ivdExt: { packSize: '200 tests', storageTemp: '2–8 °C', currentStock: 2, reorderLevel: 1, regulatoryClass: '' } }),
];

/* ────────────── Demo store (session-local, mutable) ────────────── */
/**
 * When the backend is offline, edits are applied to this in-memory copy so
 * the UI stays coherent within the session. Nothing persists — the page
 * labels every demo-mode change explicitly.
 */

let demoStore: BillableItem[] = DEMO_BILLABLES.map((i) => ({ ...i }));

export function demoQuery(query: BillablesQuery): BillablesPage {
    const { type, category, q, active, page = 1, limit = 10 } = query;
    let rows = demoStore;
    if (type) rows = rows.filter((r) => r.type === type);
    if (category) rows = rows.filter((r) => (r.category || '') === category);
    if (typeof active === 'boolean') rows = rows.filter((r) => r.active === active);
    if (q && q.trim()) {
        const needle = q.trim().toLowerCase();
        rows = rows.filter((r) =>
            [r.itemCode, r.name, r.category, r.subcategory, r.hsnSac, r.labExt?.testCode]
                .filter(Boolean)
                .some((h) => String(h).toLowerCase().includes(needle))
        );
    }
    const total = rows.length;
    const start = (page - 1) * limit;
    return { items: rows.slice(start, start + limit).map((r) => ({ ...r })), total, page, limit, source: 'demo' };
}

export function demoCategories(type?: BillableType): CategoryCount[] {
    const counts = new Map<string, number>();
    for (const r of demoStore) {
        if (type && r.type !== type) continue;
        const c = r.category || 'Uncategorized';
        counts.set(c, (counts.get(c) || 0) + 1);
    }
    return [...counts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => a.category.localeCompare(b.category));
}

export function demoUpsert(item: BillableItem): BillableItem {
    const idx = demoStore.findIndex((r) => r._id === item._id);
    if (idx >= 0) demoStore[idx] = { ...item };
    else demoStore = [{ ...item, _id: item._id || `demo-new-${Date.now()}` }, ...demoStore];
    return { ...item };
}

export function demoBulk(body: BulkBody): number {
    let modified = 0;
    for (const r of demoStore) {
        if (!body.ids.includes(r._id)) continue;
        modified++;
        switch (body.action) {
            case 'activate': r.active = true; break;
            case 'deactivate': r.active = false; break;
            case 'price': r.unitPrice = Number(body.value); break;
            case 'gst': r.gst = Number(body.value); break;
            case 'category': r.category = String(body.value ?? ''); break;
        }
    }
    return modified;
}

export function demoStats(): { total: number; active: number; labTests: number; consumables: number } {
    return {
        total: demoStore.length,
        active: demoStore.filter((r) => r.active).length,
        labTests: demoStore.filter((r) => r.type === 'lab_test').length,
        consumables: demoStore.filter((r) => r.type === 'consumable').length,
    };
}

export function demoExportCsv(type?: BillableType): string {
    const cols = ['itemCode', 'name', 'type', 'category', 'subcategory', 'department', 'unit', 'unitPrice', 'gst', 'hsnSac', 'active'] as const;
    const esc = (v: unknown) => {
        const s = v == null ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = demoStore.filter((r) => !type || r.type === type);
    return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

/** Minimal CSV line parser (handles quoted fields with "" escapes). */
function parseCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQ) {
            if (ch === '"') {
                if (line[i + 1] === '"') { cur += '"'; i++; }
                else inQ = false;
            } else cur += ch;
        } else if (ch === '"') inQ = true;
        else if (ch === ',') { out.push(cur); cur = ''; }
        else cur += ch;
    }
    out.push(cur);
    return out;
}

const VALID_TYPES: BillableType[] = ['lab_test', 'panel', 'imaging', 'consumable', 'ivd_kit', 'blood_bank', 'service', 'medicine'];

/**
 * Demo-mode CSV import: applies rows to the in-memory demo store and returns
 * the same ImportResult shape the backend would. Matches existing items by
 * itemCode (case-insensitive). Expected header columns (any order, extras
 * ignored): itemCode,name,type,category,subcategory,department,unit,unitPrice,gst,hsnSac,active
 */
export function demoImportCsv(csv: string): ImportResult {
    const result: ImportResult = { created: 0, updated: 0, skippedDuplicates: 0, errors: [] };
    const lines = csv.split(/\r?\n/);
    const headerLine = lines[0]?.trim();
    if (!headerLine) {
        result.errors.push({ line: 1, message: 'Empty CSV — expected a header row' });
        return result;
    }
    const header = parseCsvLine(headerLine).map((h) => h.trim());
    if (!header.includes('itemCode') || !header.includes('name')) {
        result.errors.push({ line: 1, message: 'Header must include at least itemCode and name' });
        return result;
    }
    const seen = new Set<string>();
    for (let i = 1; i < lines.length; i++) {
        const raw = lines[i];
        if (!raw || !raw.trim()) continue;
        const lineNo = i + 1;
        const cells = parseCsvLine(raw);
        const get = (col: string): string => {
            const idx = header.indexOf(col);
            return idx >= 0 ? (cells[idx] ?? '').trim() : '';
        };
        const itemCode = get('itemCode');
        const name = get('name');
        if (!itemCode || !name) {
            result.errors.push({ line: lineNo, message: 'Missing required itemCode or name' });
            continue;
        }
        const codeKey = itemCode.toLowerCase();
        if (seen.has(codeKey)) {
            result.skippedDuplicates++;
            continue;
        }
        seen.add(codeKey);
        const typeStr = get('type');
        if (typeStr && !VALID_TYPES.includes(typeStr as BillableType)) {
            result.errors.push({ line: lineNo, message: `Unknown type "${typeStr}" (expected one of ${VALID_TYPES.join(', ')})` });
            continue;
        }
        const numOrUndef = (s: string): number | undefined => (s === '' ? undefined : Number(s));
        const unitPrice = numOrUndef(get('unitPrice'));
        const gst = numOrUndef(get('gst'));
        if ((unitPrice !== undefined && Number.isNaN(unitPrice)) || (gst !== undefined && Number.isNaN(gst))) {
            result.errors.push({ line: lineNo, message: 'unitPrice / gst must be numeric' });
            continue;
        }
        const activeStr = get('active').toLowerCase();
        const existing = demoStore.find((r) => r.itemCode.toLowerCase() === codeKey);
        const patch: Partial<BillableItem> = {
            itemCode,
            name,
            ...(typeStr ? { type: typeStr as BillableType } : {}),
            ...(get('category') ? { category: get('category') } : {}),
            ...(get('subcategory') ? { subcategory: get('subcategory') } : {}),
            ...(get('department') ? { department: get('department') } : {}),
            ...(get('unit') ? { unit: get('unit') } : {}),
            ...(unitPrice !== undefined ? { unitPrice } : {}),
            ...(gst !== undefined ? { gst } : {}),
            ...(get('hsnSac') ? { hsnSac: get('hsnSac') } : {}),
            ...(activeStr ? { active: activeStr === 'true' || activeStr === '1' || activeStr === 'yes' } : {}),
        };
        if (existing) {
            demoUpsert({ ...existing, ...patch });
            result.updated++;
        } else {
            if (!typeStr) {
                result.errors.push({ line: lineNo, message: 'New items need a type column value' });
                continue;
            }
            demoUpsert({
                _id: `demo-import-${Date.now()}-${lineNo}`,
                active: true,
                ...patch,
            } as BillableItem);
            result.created++;
        }
    }
    return result;
}

/* ───────────────────────── Reads (with fallback) ──────────────────── */

function buildQs(query: BillablesQuery): string {
    const p = new URLSearchParams();
    if (query.type) p.set('type', query.type);
    if (query.category) p.set('category', query.category);
    if (query.q && query.q.trim()) p.set('q', query.q.trim());
    if (typeof query.active === 'boolean') p.set('active', String(query.active));
    p.set('page', String(query.page ?? 1));
    p.set('limit', String(query.limit ?? 10));
    return p.toString();
}

export async function fetchBillables(query: BillablesQuery): Promise<WithDemo<BillablesPage>> {
    try {
        const data = await request<BillablesPage>(`/api/masters/billables?${buildQs(query)}`);
        return { data, demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) return { data: demoQuery(query), demo: true };
        throw err;
    }
}

export async function fetchCategories(type?: BillableType): Promise<WithDemo<CategoryCount[]>> {
    try {
        const qs = type ? `?type=${encodeURIComponent(type)}` : '';
        const data = await request<{ categories: CategoryCount[] }>(`/api/masters/billables/categories${qs}`);
        return { data: Array.isArray(data?.categories) ? data.categories : [], demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) return { data: demoCategories(type), demo: true };
        throw err;
    }
}

export interface HeadlineStats { total: number; active: number; labTests: number; consumables: number }

export async function fetchStats(): Promise<WithDemo<HeadlineStats>> {
    try {
        const [all, active, lab, cons] = await Promise.all([
            request<BillablesPage>(`/api/masters/billables?page=1&limit=1`),
            request<BillablesPage>(`/api/masters/billables?active=true&page=1&limit=1`),
            request<BillablesPage>(`/api/masters/billables?type=lab_test&page=1&limit=1`),
            request<BillablesPage>(`/api/masters/billables?type=consumable&page=1&limit=1`),
        ]);
        return { data: { total: all.total, active: active.total, labTests: lab.total, consumables: cons.total }, demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) return { data: demoStats(), demo: true };
        throw err;
    }
}

/* ─────────────────────────────── Writes ───────────────────────────── */
/** Throw ApiOfflineError when the backend is down; the page simulates locally with explicit demo labeling. */

export function createBillable(body: Partial<BillableItem>) {
    return request<BillableItem>('/api/masters/billables', { method: 'POST', body: JSON.stringify(body) });
}

export function updateBillable(id: string, body: Partial<BillableItem>) {
    return request<BillableItem>(`/api/masters/billables/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function deleteBillable(id: string) {
    return request<{ ok?: boolean }>(`/api/masters/billables/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function bulkBillables(body: BulkBody) {
    return request<{ modified: number }>('/api/masters/billables/bulk', { method: 'POST', body: JSON.stringify(body) });
}

export function importBillablesCsv(csv: string) {
    return request<ImportResult>('/api/masters/billables/import', { method: 'POST', body: JSON.stringify({ csv }) }, 15000);
}

export async function exportBillablesCsv(type?: BillableType): Promise<WithDemo<string>> {
    try {
        const qs = type ? `?type=${encodeURIComponent(type)}` : '';
        const res = await rawFetch(`/api/masters/billables/export${qs}`, undefined, 15000);
        return { data: await res.text(), demo: false };
    } catch (err) {
        if (err instanceof ApiOfflineError) return { data: demoExportCsv(type), demo: true };
        throw err;
    }
}

/* ─────────────────────────────── Utils ────────────────────────────── */

export function formatINR(amount?: number): string {
    if (amount == null || Number.isNaN(amount)) return '—';
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const TYPE_LABELS: Record<BillableType, string> = {
    lab_test: 'Laboratory',
    panel: 'Panels',
    imaging: 'Imaging',
    consumable: 'Consumables',
    ivd_kit: 'IVD Kits & Reagents',
    blood_bank: 'Blood Bank',
    service: 'Services',
    medicine: 'Medicines',
};
