'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
    PageHeader, Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent,
    Tabs, TabsList, TabsTrigger, TabsContent, Input, Textarea, Select, Label, FieldHint,
    Switch, Dialog,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
    buildPrescriptionHtml, openPrescriptionPrintWindow,
    type PrescriptionSheetSettings, type PrescriptionSheetData,
    type RxMedicineColumn, type RxAlign, type RxPaperSize, type RxFontFamily, type RxSignatureSize,
} from '@/components/prescriptionSheet';
import {
    Printer, Plus, Copy, Pencil, Star, Trash2, Eye, UploadCloud, X,
    ArrowUp, ArrowDown, Sparkles, Save, RotateCcw, Layers, Info,
} from 'lucide-react';

/* ============================== Model ============================== */

type TemplateLevel = 'hospital' | 'department' | 'doctor';

/** Full settings model: everything the sheet renderer understands plus a few
 *  UI-only fields (persisted with the template, ignored by the renderer). */
interface RxSettingsModel extends PrescriptionSheetSettings {
    templateLanguage?: string;
    allowCustomMargins?: boolean;
    brandSecondary?: string;
    brandAccent?: string;
    letterheadPreset?: 'minimal' | 'standard' | 'detailed';
    ai?: { suggestions: boolean; interactions: boolean; alternatives: boolean };
}

interface RxTemplate {
    id: string;
    name: string;
    level: TemplateLevel;
    isDefault: boolean;
    settings: RxSettingsModel;
}

interface RxStore {
    version: 1;
    activeId: string | null;
    templates: RxTemplate[];
}

const STORAGE_KEY = 'cc-rx-templates';
const DEFAULT_FOOTER_TEXT = 'Generated through CareConnect | AI-Powered Healthcare Operating System';
const AI_DISCLAIMER = 'AI-generated suggestions are clinical decision support. Final prescribing decisions remain with the treating clinician.';

const LEVEL_LABEL: Record<TemplateLevel, string> = { hospital: 'Hospital', department: 'Department', doctor: 'Doctor' };
const LEVEL_PRIORITY: Record<TemplateLevel, number> = { doctor: 0, department: 1, hospital: 2 };

const ALL_MED_COLUMNS: Array<{ key: RxMedicineColumn; label: string }> = [
    { key: 'index', label: 'Serial No. (#)' },
    { key: 'name', label: 'Medicine Name' },
    { key: 'generic', label: 'Generic Name' },
    { key: 'strength', label: 'Strength' },
    { key: 'dosage', label: 'Dosage' },
    { key: 'route', label: 'Route' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'duration', label: 'Duration' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'instructions', label: 'Instructions' },
    { key: 'foodTiming', label: 'Food Timing' },
];

const DEFAULT_MED_COLUMNS: RxMedicineColumn[] = ['index', 'name', 'frequency', 'duration', 'instructions'];

const SECTION_ITEMS: Array<{ key: NonNullable<RxSettingsModel['sections']> extends infer T ? keyof NonNullable<T> : never; label: string }> = [
    { key: 'chiefComplaints', label: 'Chief Complaints' },
    { key: 'symptoms', label: 'Symptoms' },
    { key: 'clinicalFindings', label: 'Clinical Findings' },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'allergies', label: 'Allergies' },
    { key: 'medicalHistory', label: 'Medical History' },
    { key: 'currentMedications', label: 'Current Medications' },
    { key: 'vitals', label: 'Vitals' },
    { key: 'treatmentPlan', label: 'Treatment Plan' },
    { key: 'followUp', label: 'Follow-up' },
    { key: 'advice', label: 'Advice' },
];

const DEFAULT_SETTINGS: RxSettingsModel = {
    hospitalName: 'CareConnect Super Specialty Hospital',
    tagline: 'Center for Advanced Cardiovascular & Medical Sciences',
    address: 'Plot 42, Health City, Electronic City Ph-1, Bangalore - 560100',
    phone: '+91 (080) 4567-8900 / Emergency: 108',
    email: 'rx@careconnect.health',
    website: 'www.careconnect.health',
    regNo: 'NABH Accr. Reg No: HMC-2024-8849',
    doctorName: 'Dr. Raj Sharma',
    doctorTitle: 'Senior Consultant Cardiologist',
    doctorRegNo: 'KMC Reg No: 54932',
    headerStyle: 'modern',
    showDiagnosis: true,
    showVitals: true,
    showDigitalSignature: true,
    showQrCode: true,
    showFooter: true,
    footerTerms: '1. Valid for 15 days from date of issue.\n2. Do not substitute medications without physician consultation.\n3. In emergency, report to ER or call 108.',
    fontFamily: 'Segoe UI',
    fontSizePx: 12.5,
    textAlign: 'left',
    paperSize: 'A4',
    orientation: 'portrait',
    margins: { topCm: 1.2, bottomCm: 1.2, leftCm: 1.2, rightCm: 1.2 },
    allowCustomMargins: false,
    colors: { primary: '#00294D', text: '#0F172A', border: '#E2E8F0' },
    brandSecondary: '#475569',
    brandAccent: '#0EA5E9',
    logoPosition: 'left',
    showLogo: true,
    showHospitalName: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showWebsite: false,
    showRegNo: true,
    headerText: { text: '', fontSizePx: 11, weight: 600, color: '#334155', align: 'center' },
    footerText: { text: DEFAULT_FOOTER_TEXT, fontSizePx: 9.5, color: '#64748B', align: 'center' },
    showPageNumber: false,
    showGeneratedAt: true,
    showContact: false,
    showDisclaimer: false,
    disclaimerText: 'This prescription is issued electronically and is valid without a physical signature.',
    signaturePosition: 'right',
    signatureSize: 'md',
    qualification: 'MBBS, MD, DM (Cardiology)',
    designation: 'Senior Consultant Cardiologist',
    department: 'Dept. of Cardiology',
    signatureFields: { doctorName: true, qualification: true, designation: false, regNo: true, department: false },
    medicineColumns: DEFAULT_MED_COLUMNS,
    sections: {
        chiefComplaints: true, symptoms: true, clinicalFindings: true, diagnosis: true,
        allergies: true, medicalHistory: false, currentMedications: false, vitals: true,
        treatmentPlan: false, followUp: true, advice: true,
    },
    investigationColumns: { name: true, indication: true, priority: true, instructions: true },
    resultColumns: { test: true, result: true, unit: true, referenceRange: true, flag: true, comments: false },
    templateLanguage: 'en',
    letterheadPreset: 'standard',
    ai: { suggestions: true, interactions: true, alternatives: false },
};

/** Realistic — but clearly sample — consultation for the live preview. */
function buildSampleData(s: RxSettingsModel): PrescriptionSheetData {
    return {
        settings: { ...s, margins: s.allowCustomMargins ? s.margins : undefined },
        patient: { name: 'Ananya Krishnan', ageSex: '46y / F', id: 'SAMPLE-0001', mobile: '+91 98450 12345' },
        date: '31/08/2026, 10:42 am',
        chiefComplaintsText: 'Fatigue and increased thirst for 3 weeks. Occasional blurring of vision.',
        symptoms: 'Polyuria, polydipsia, generalized fatigue. No fever, no chest pain.',
        clinicalFindings: 'BMI 27.4. No pallor / icterus. CVS: S1 S2 normal. RS: clear breath sounds.',
        diagnosis: '1. Type 2 Diabetes Mellitus — suboptimal control\n2. Dyslipidemia\n3. Hypertension — controlled',
        allergiesText: 'No known drug allergies (NKDA).',
        medicalHistoryText: 'Hypertension since 2019. T2DM since 2021. No prior surgeries.',
        currentMedicationsText: 'Tab. Telmisartan 40 mg OD (ongoing).',
        vitals: 'BP 128/82 mmHg · HR 78 bpm · SpO2 98% · Temp 98.4°F · Wt 72 kg',
        treatmentPlanText: 'Optimize glycemic control; lifestyle modification; review lipid profile in 6 weeks.',
        advice: 'Low-sugar, low-fat diet. 30 min brisk walk daily. Monitor fasting sugar twice a week.',
        followUpText: 'Review after 4 weeks with fasting reports, or earlier if symptoms worsen.',
        drugs: [
            { name: 'Tab. Metformin', generic: 'Metformin Hydrochloride', strength: '500 mg', dose: '500 mg', dosage: '1 tablet', route: 'Oral', frequency: '1-0-1 (BID)', duration: '30 days', quantity: '60', instructions: 'Do not skip doses', foodTiming: 'After food' },
            { name: 'Tab. Telmisartan', generic: 'Telmisartan', strength: '40 mg', dose: '40 mg', dosage: '1 tablet', route: 'Oral', frequency: '1-0-0 (OD)', duration: '30 days', quantity: '30', instructions: 'Continue ongoing dose', foodTiming: 'Before food' },
            { name: 'Tab. Atorvastatin', generic: 'Atorvastatin Calcium', strength: '10 mg', dose: '10 mg', dosage: '1 tablet', route: 'Oral', frequency: '0-0-1 (HS)', duration: '30 days', quantity: '30', instructions: 'Take at bedtime', foodTiming: 'After food' },
        ],
        investigations: [
            { name: 'HbA1c', indication: 'Glycemic control assessment', priority: 'Routine', instructions: 'No fasting required' },
            { name: 'Fasting Lipid Profile', indication: 'Dyslipidemia monitoring', priority: 'Routine', instructions: '10–12 hrs fasting' },
        ],
        results: [
            { test: 'HbA1c', result: '8.1', unit: '%', referenceRange: '4.0 – 5.6', flag: 'high', comments: 'Repeat in 3 months' },
            { test: 'LDL Cholesterol', result: '162', unit: 'mg/dL', referenceRange: '< 100', flag: 'high', comments: 'Statin initiated' },
        ],
    };
}

/* ============================== Storage helpers ============================== */

function seedStore(): RxStore {
    const seed: RxTemplate = {
        id: 'tpl-hospital-standard',
        name: 'Hospital Standard',
        level: 'hospital',
        isDefault: true,
        settings: DEFAULT_SETTINGS,
    };
    return { version: 1, activeId: seed.id, templates: [seed] };
}

function loadStore(): RxStore {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.templates) && parsed.templates.length > 0) {
                return {
                    version: 1,
                    activeId: typeof parsed.activeId === 'string' ? parsed.activeId : parsed.templates[0].id,
                    templates: parsed.templates.map((t: RxTemplate) => ({
                        ...t,
                        settings: { ...DEFAULT_SETTINGS, ...t.settings },
                    })),
                };
            }
        }
    } catch { /* corrupt or unavailable storage — fall back to seed */ }
    return seedStore();
}

function persistStore(store: RxStore) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch { /* storage full/unavailable — settings stay in memory for this session */ }
}

function effectiveDefault(templates: RxTemplate[]): RxTemplate | undefined {
    return templates
        .filter((t) => t.isDefault)
        .sort((a, b) => LEVEL_PRIORITY[a.level] - LEVEL_PRIORITY[b.level])[0];
}

function deriveMedCols(visible?: RxMedicineColumn[]): Array<{ key: RxMedicineColumn; visible: boolean }> {
    const vis = visible && visible.length ? visible : DEFAULT_MED_COLUMNS;
    const seen = vis.filter((k) => ALL_MED_COLUMNS.some((c) => c.key === k));
    const rest = ALL_MED_COLUMNS.map((c) => c.key).filter((k) => !seen.includes(k));
    return [...seen.map((k) => ({ key: k, visible: true })), ...rest.map((k) => ({ key: k, visible: false }))];
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/* ============================== Small local UI pieces ============================== */

function ToggleRow({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
    return (
        <div className="flex items-center justify-between gap-3 py-1">
            <div className="min-w-0">
                <span className="text-sm text-foreground">{label}</span>
                {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            </div>
            <Switch checked={checked} onCheckedChange={onChange} label={label} />
        </div>
    );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground cursor-pointer hover:bg-muted/50 transition-colors">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-current text-primary"
            />
            <span>{label}</span>
        </label>
    );
}

function Segmented<T extends string>({ options, value, onChange, ariaLabel }: {
    options: Array<{ value: T; label: string }>;
    value: T;
    onChange: (v: T) => void;
    ariaLabel: string;
}) {
    return (
        <div role="group" aria-label={ariaLabel} className="inline-flex rounded-xl border border-border bg-muted p-1 gap-1">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    aria-pressed={value === o.value}
                    onClick={() => onChange(o.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${value === o.value ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const safe = HEX_RE.test(value) ? value : '#000000';
    return (
        <div>
            <Label className="text-xs">{label}</Label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={safe}
                    onChange={(e) => onChange(e.target.value)}
                    aria-label={`${label} color picker`}
                    className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-input bg-card p-1"
                />
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    aria-label={`${label} hex value`}
                    className="h-9 text-xs font-mono"
                    placeholder="#000000"
                />
            </div>
        </div>
    );
}

function UploadZone({ label, value, onChange, mimeTypes, acceptAttr, note }: {
    label: string;
    value?: string;
    onChange: (dataUrl: string | undefined) => void;
    mimeTypes: string[];
    acceptAttr: string;
    note: string;
}) {
    const { toast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFiles = useCallback((files: FileList | null) => {
        const f = files?.[0];
        if (!f) return;
        if (!mimeTypes.includes(f.type)) {
            toast('error', 'Unsupported file type', `${label} accepts: ${acceptAttr}`);
            return;
        }
        if (f.size > 300 * 1024) {
            toast('error', 'File too large', `${label} must be 300KB or smaller (got ${Math.round(f.size / 1024)}KB).`);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => onChange(String(reader.result));
        reader.readAsDataURL(f);
    }, [acceptAttr, label, mimeTypes, onChange, toast]);

    return (
        <div>
            <Label className="text-xs">{label}</Label>
            {value ? (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={value} alt={`${label} preview`} className="h-14 max-w-[160px] rounded-lg border border-border bg-white object-contain p-1" />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Uploaded. Shown live in the preview.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onChange(undefined)}>
                        <X className="h-3.5 w-3.5" aria-hidden /> Remove
                    </Button>
                </div>
            ) : (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/40'}`}
                >
                    <UploadCloud className="h-6 w-6 text-muted-foreground" aria-hidden />
                    <p className="text-xs text-muted-foreground">Drag &amp; drop here, or</p>
                    <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>Browse files</Button>
                    <input
                        ref={inputRef}
                        type="file"
                        accept={acceptAttr}
                        className="hidden"
                        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
                    />
                </div>
            )}
            <FieldHint>{note}</FieldHint>
        </div>
    );
}

/* ============================== Page ============================== */

const PAPER_PX: Record<RxPaperSize, [number, number]> = { A4: [794, 1123], A5: [559, 794], Letter: [816, 1056] };

export default function PrescriptionSettingsPage() {
    const { toast } = useToast();

    const [store, setStore] = useState<RxStore>(seedStore);
    const [settings, setSettings] = useState<RxSettingsModel>(DEFAULT_SETTINGS);
    const [medCols, setMedCols] = useState(deriveMedCols(DEFAULT_SETTINGS.medicineColumns));
    const [hydrated, setHydrated] = useState(false);

    // Dialog state
    const [createOpen, setCreateOpen] = useState(false);
    const [createFromCurrent, setCreateFromCurrent] = useState(true);
    const [renameOpen, setRenameOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);
    const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
    const [draftName, setDraftName] = useState('');
    const [draftLevel, setDraftLevel] = useState<TemplateLevel>('doctor');

    const previewAnchorRef = useRef<HTMLDivElement>(null);
    const previewBoxRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.5);

    /* Load persisted templates on mount (client only — avoids hydration mismatch). */
    useEffect(() => {
        const loaded = loadStore();
        setStore(loaded);
        const active = loaded.templates.find((t) => t.id === loaded.activeId) || loaded.templates[0];
        if (active) {
            setSettings(active.settings);
            setMedCols(deriveMedCols(active.settings.medicineColumns));
        }
        setHydrated(true);
    }, []);

    const activeTemplate = store.templates.find((t) => t.id === store.activeId) || store.templates[0];
    const effDefault = effectiveDefault(store.templates);
    const dirty = hydrated && !!activeTemplate && JSON.stringify(settings) !== JSON.stringify(activeTemplate.settings);

    const set = useCallback((patch: Partial<RxSettingsModel>) => {
        setSettings((prev) => ({ ...prev, ...patch }));
    }, []);

    /* Live preview document — rebuilt instantly on every settings change. */
    const previewHtml = useMemo(() => buildPrescriptionHtml(buildSampleData(settings)), [settings]);

    const paper = settings.paperSize || 'A4';
    const landscape = settings.orientation === 'landscape';
    const [sheetW, sheetH] = landscape
        ? [PAPER_PX[paper][1], PAPER_PX[paper][0]]
        : PAPER_PX[paper];

    /* Fit-to-width scaling of the fixed-size sheet. */
    useEffect(() => {
        const el = previewBoxRef.current;
        if (!el) return;
        const update = () => setScale(Math.min(el.clientWidth / sheetW, 1));
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [sheetW]);

    /* ---------- Template ops ---------- */

    const commit = (next: RxStore) => {
        setStore(next);
        persistStore(next);
    };

    const selectTemplate = (id: string) => {
        const tpl = store.templates.find((t) => t.id === id);
        if (!tpl) return;
        commit({ ...store, activeId: id });
        setSettings(tpl.settings);
        setMedCols(deriveMedCols(tpl.settings.medicineColumns));
    };

    const saveChanges = () => {
        if (!activeTemplate) return;
        const next: RxStore = {
            ...store,
            templates: store.templates.map((t) => (t.id === activeTemplate.id ? { ...t, settings } : t)),
        };
        commit(next);
        toast('success', 'Prescription settings saved successfully.');
    };

    const createTemplate = () => {
        const name = draftName.trim();
        if (!name) {
            toast('warning', 'Template name required');
            return;
        }
        const tpl: RxTemplate = {
            id: `tpl-${Date.now().toString(36)}`,
            name,
            level: draftLevel,
            isDefault: false,
            settings: createFromCurrent ? settings : DEFAULT_SETTINGS,
        };
        commit({ ...store, activeId: tpl.id, templates: [...store.templates, tpl] });
        setSettings(tpl.settings);
        setMedCols(deriveMedCols(tpl.settings.medicineColumns));
        setCreateOpen(false);
        toast('success', `Template "${name}" created.`);
    };

    const duplicateTemplate = () => {
        if (!activeTemplate) return;
        const tpl: RxTemplate = {
            ...activeTemplate,
            id: `tpl-${Date.now().toString(36)}`,
            name: `${activeTemplate.name} (Copy)`,
            isDefault: false,
            settings,
        };
        commit({ ...store, activeId: tpl.id, templates: [...store.templates, tpl] });
        toast('success', `Duplicated as "${tpl.name}".`);
    };

    const renameTemplate = () => {
        const name = draftName.trim();
        if (!name || !activeTemplate) return;
        commit({
            ...store,
            templates: store.templates.map((t) => (t.id === activeTemplate.id ? { ...t, name } : t)),
        });
        setRenameOpen(false);
        toast('success', 'Template renamed.');
    };

    const setAsDefault = () => {
        if (!activeTemplate) return;
        commit({
            ...store,
            templates: store.templates.map((t) => ({
                ...t,
                isDefault: t.id === activeTemplate.id ? true : (t.level === activeTemplate.level ? false : t.isDefault),
            })),
        });
        toast('success', `"${activeTemplate.name}" is now the ${LEVEL_LABEL[activeTemplate.level].toLowerCase()}-level default.`);
    };

    const deleteTemplate = () => {
        if (!activeTemplate || store.templates.length <= 1) return;
        const remaining = store.templates.filter((t) => t.id !== activeTemplate.id);
        const nextActive = remaining[0];
        commit({ ...store, activeId: nextActive.id, templates: remaining });
        setSettings(nextActive.settings);
        setMedCols(deriveMedCols(nextActive.settings.medicineColumns));
        setDeleteOpen(false);
        toast('success', 'Template deleted.');
    };

    const resetToDefault = () => {
        setSettings(DEFAULT_SETTINGS);
        setMedCols(deriveMedCols(DEFAULT_SETTINGS.medicineColumns));
        setResetOpen(false);
        toast('info', 'Settings reset to defaults', 'Click "Save Changes" to keep this.');
    };

    const openPreview = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setMobilePreviewOpen(true);
        } else {
            previewAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handlePrint = () => {
        if (!openPrescriptionPrintWindow(previewHtml)) {
            toast('warning', 'Pop-up blocked', 'Allow pop-ups to print / save the prescription PDF.');
        }
    };

    /* ---------- Medicine column ops ---------- */

    const applyMedCols = (next: Array<{ key: RxMedicineColumn; visible: boolean }>) => {
        setMedCols(next);
        set({ medicineColumns: next.filter((c) => c.visible).map((c) => c.key) });
    };

    const toggleMedCol = (key: RxMedicineColumn, visible: boolean) => {
        applyMedCols(medCols.map((c) => (c.key === key ? { ...c, visible } : c)));
    };

    const moveMedCol = (index: number, dir: -1 | 1) => {
        const target = index + dir;
        if (target < 0 || target >= medCols.length) return;
        const next = [...medCols];
        [next[index], next[target]] = [next[target], next[index]];
        applyMedCols(next);
    };

    /* ---------- Letterhead preset ---------- */

    const applyLetterheadPreset = (p: 'minimal' | 'standard' | 'detailed') => {
        if (p === 'minimal') {
            set({ letterheadPreset: p, showLogo: false, showHospitalName: true, showAddress: false, showPhone: false, showEmail: false, showWebsite: false, showRegNo: false });
        } else if (p === 'standard') {
            set({ letterheadPreset: p, showLogo: true, showHospitalName: true, showAddress: true, showPhone: true, showEmail: true, showWebsite: false, showRegNo: true });
        } else {
            set({ letterheadPreset: p, showLogo: true, showHospitalName: true, showAddress: true, showPhone: true, showEmail: true, showWebsite: true, showRegNo: true });
        }
    };

    const sf = settings.signatureFields || {};
    const sections = settings.sections || {};

    /* ============================== Render ============================== */

    return (
        <div className="space-y-6">
            <PageHeader
                title="Prescription Settings"
                description="Configure the prescription template, letterhead, signature and AI assistance used across EMR and dispatch."
                crumbs={[{ label: 'Settings', href: '/settings' }, { label: 'Prescription' }]}
                actions={
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="h-4 w-4" aria-hidden /> Print / Save PDF
                    </Button>
                }
            />

            {/* ---------- Template management ---------- */}
            <Card>
                <CardContent className="pt-5">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[220px] flex-1 sm:max-w-xs">
                            <Label htmlFor="tpl-select" className="text-xs">Active Template</Label>
                            <Select id="tpl-select" value={activeTemplate?.id || ''} onChange={(e) => selectTemplate(e.target.value)}>
                                {store.templates.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} · {LEVEL_LABEL[t.level]}{t.isDefault ? ' ★' : ''}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setDraftName(''); setDraftLevel('doctor'); setCreateFromCurrent(true); setCreateOpen(true); }}>
                                <Plus className="h-3.5 w-3.5" aria-hidden /> Create
                            </Button>
                            <Button variant="outline" size="sm" onClick={duplicateTemplate}>
                                <Copy className="h-3.5 w-3.5" aria-hidden /> Duplicate
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setDraftName(activeTemplate?.name || ''); setRenameOpen(true); }}>
                                <Pencil className="h-3.5 w-3.5" aria-hidden /> Rename
                            </Button>
                            <Button variant="outline" size="sm" onClick={setAsDefault} disabled={!!activeTemplate?.isDefault}>
                                <Star className="h-3.5 w-3.5" aria-hidden /> Set as Default
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} disabled={store.templates.length <= 1}>
                                <Trash2 className="h-3.5 w-3.5 text-danger" aria-hidden /> Delete
                            </Button>
                            <Button variant="outline" size="sm" onClick={openPreview}>
                                <Eye className="h-3.5 w-3.5" aria-hidden /> Preview
                            </Button>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5" aria-hidden />
                            Default resolution: <b className="text-foreground">Doctor → Department → Hospital</b> (most specific level with a default wins).
                        </span>
                        {effDefault && (
                            <Badge tone="brand">
                                Effective default: {effDefault.name} ({LEVEL_LABEL[effDefault.level]})
                            </Badge>
                        )}
                        {dirty && <Badge tone="warning" dot>Unsaved changes</Badge>}
                    </div>
                    <p className="mt-2 text-[11px] text-subtle-foreground">
                        Templates are stored locally in this browser (localStorage). Server-side template storage is pending.
                    </p>
                </CardContent>
            </Card>

            {/* ---------- Two-column: settings + sticky preview ---------- */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">

                {/* LEFT — settings tabs */}
                <div className="min-w-0">
                    <Tabs defaultValue="prescription">
                        <div className="w-full overflow-x-auto no-scrollbar">
                            <TabsList className="w-max">
                                <TabsTrigger value="prescription">Prescription</TabsTrigger>
                                <TabsTrigger value="medicine">Medicine</TabsTrigger>
                                <TabsTrigger value="investigation">Investigation</TabsTrigger>
                                <TabsTrigger value="results">Results</TabsTrigger>
                                <TabsTrigger value="letterhead">Letterhead</TabsTrigger>
                                <TabsTrigger value="headerfooter">Header &amp; Footer</TabsTrigger>
                                <TabsTrigger value="signature">Signature</TabsTrigger>
                                <TabsTrigger value="ai">AI Settings</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* ----- Prescription tab ----- */}
                        <TabsContent value="prescription">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Prescription Format</CardTitle>
                                    <CardDescription>Typography, page setup and visible clinical sections.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="rx-lang" className="text-xs">Prescription Language</Label>
                                            <Select id="rx-lang" value={settings.templateLanguage || 'en'} onChange={(e) => set({ templateLanguage: e.target.value })}>
                                                <option value="en">English</option>
                                                <option value="hi">Hindi</option>
                                                <option value="te">Telugu</option>
                                                <option value="ta">Tamil</option>
                                                <option value="kn">Kannada</option>
                                                <option value="mr">Marathi</option>
                                                <option value="bn">Bengali</option>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="rx-font" className="text-xs">Font Family</Label>
                                            <Select id="rx-font" value={settings.fontFamily || 'Segoe UI'} onChange={(e) => set({ fontFamily: e.target.value as RxFontFamily })}>
                                                {(['Inter', 'Georgia', 'Arial', 'Times New Roman', 'Segoe UI'] as const).map((f) => <option key={f} value={f}>{f}</option>)}
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="rx-fontsize" className="text-xs">Base Font Size (px)</Label>
                                            <Input id="rx-fontsize" type="number" min={9} max={18} step={0.5}
                                                value={settings.fontSizePx ?? 12.5}
                                                onChange={(e) => set({ fontSizePx: Number(e.target.value) || 12.5 })} />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Body Text Alignment</Label>
                                            <div>
                                                <Segmented<RxAlign>
                                                    ariaLabel="Body text alignment"
                                                    value={settings.textAlign || 'left'}
                                                    onChange={(v) => set({ textAlign: v })}
                                                    options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="rx-paper" className="text-xs">Paper Size</Label>
                                            <Select id="rx-paper" value={settings.paperSize || 'A4'} onChange={(e) => set({ paperSize: e.target.value as RxPaperSize })}>
                                                <option value="A4">A4 (210 × 297 mm)</option>
                                                <option value="A5">A5 (148 × 210 mm)</option>
                                                <option value="Letter">Letter (8.5 × 11 in)</option>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="rx-orient" className="text-xs">Orientation</Label>
                                            <Select id="rx-orient" value={settings.orientation || 'portrait'} onChange={(e) => set({ orientation: e.target.value as 'portrait' | 'landscape' })}>
                                                <option value="portrait">Portrait</option>
                                                <option value="landscape">Landscape</option>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-border p-4">
                                        <ToggleRow
                                            label="Allow custom margins"
                                            hint="When off, the standard 12mm print margin is used."
                                            checked={!!settings.allowCustomMargins}
                                            onChange={(v) => set({ allowCustomMargins: v })}
                                        />
                                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                            {([['topCm', 'Top'], ['bottomCm', 'Bottom'], ['leftCm', 'Left'], ['rightCm', 'Right']] as const).map(([k, label]) => (
                                                <div key={k}>
                                                    <Label htmlFor={`rx-margin-${k}`} className="text-xs">{label} (cm)</Label>
                                                    <Input
                                                        id={`rx-margin-${k}`}
                                                        type="number" min={0.5} max={4} step={0.1}
                                                        disabled={!settings.allowCustomMargins}
                                                        value={settings.margins?.[k] ?? 1.2}
                                                        onChange={(e) => set({ margins: { ...settings.margins, [k]: Number(e.target.value) || 1.2 } })}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-xs">Clinical Sections Shown</Label>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            {SECTION_ITEMS.map((s) => (
                                                <CheckRow
                                                    key={s.key}
                                                    label={s.label}
                                                    checked={sections[s.key] !== false}
                                                    onChange={(v) => set({ sections: { ...sections, [s.key]: v } })}
                                                />
                                            ))}
                                        </div>
                                        <FieldHint>A section prints only when it is enabled here and has content in the consultation.</FieldHint>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ----- Medicine tab ----- */}
                        <TabsContent value="medicine">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Medicine Table Columns</CardTitle>
                                    <CardDescription>Choose which columns print and reorder them with the arrows.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {medCols.map((c, i) => {
                                            const meta = ALL_MED_COLUMNS.find((m) => m.key === c.key)!;
                                            return (
                                                <li key={c.key} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`medcol-${c.key}`}
                                                        checked={c.visible}
                                                        onChange={(e) => toggleMedCol(c.key, e.target.checked)}
                                                        className="h-4 w-4 rounded border-input"
                                                    />
                                                    <label htmlFor={`medcol-${c.key}`} className={`flex-1 text-sm ${c.visible ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {meta.label}
                                                    </label>
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="icon-sm" aria-label={`Move ${meta.label} up`} disabled={i === 0} onClick={() => moveMedCol(i, -1)}>
                                                            <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                                                        </Button>
                                                        <Button variant="ghost" size="icon-sm" aria-label={`Move ${meta.label} down`} disabled={i === medCols.length - 1} onClick={() => moveMedCol(i, 1)}>
                                                            <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                                                        </Button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    <FieldHint>The Medicine Name column shows the dose inline unless a separate Dosage column is enabled. Empty values print as &ldquo;—&rdquo;.</FieldHint>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ----- Investigation tab ----- */}
                        <TabsContent value="investigation">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Investigations Table</CardTitle>
                                    <CardDescription>Columns for the &ldquo;Investigations Advised&rdquo; table on the prescription.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {([['name', 'Investigation Name'], ['indication', 'Indication'], ['priority', 'Priority'], ['instructions', 'Instructions']] as const).map(([k, label]) => (
                                        <CheckRow
                                            key={k}
                                            label={label}
                                            checked={settings.investigationColumns?.[k] !== false}
                                            onChange={(v) => set({ investigationColumns: { ...settings.investigationColumns, [k]: v } })}
                                        />
                                    ))}
                                    <FieldHint>The table prints only when the consultation has advised investigations. The preview shows two sample investigations.</FieldHint>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ----- Results tab ----- */}
                        <TabsContent value="results">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Reports / Results Table</CardTitle>
                                    <CardDescription>Columns for attached lab results, with subtle high/low/critical flags.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {([['test', 'Test Name'], ['result', 'Result'], ['unit', 'Unit'], ['referenceRange', 'Reference Range'], ['flag', 'Flag (High / Low / Critical)'], ['comments', 'Comments']] as const).map(([k, label]) => (
                                        <CheckRow
                                            key={k}
                                            label={label}
                                            checked={settings.resultColumns?.[k] !== false}
                                            onChange={(v) => set({ resultColumns: { ...settings.resultColumns, [k]: v } })}
                                        />
                                    ))}
                                    <FieldHint>Flags render as quiet colored text — amber (high), blue (low), red (critical), green (normal) — never loud badges.</FieldHint>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ----- Letterhead tab ----- */}
                        <TabsContent value="letterhead">
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Letterhead</CardTitle>
                                        <CardDescription>Layout, hospital identity and logo shown at the top of every prescription.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <Label htmlFor="lh-layout" className="text-xs">Header Layout</Label>
                                                <Select id="lh-layout" value={settings.headerStyle || 'modern'} onChange={(e) => set({ headerStyle: e.target.value as 'classic' | 'modern' | 'centered' })}>
                                                    <option value="modern">Modern (two-sided)</option>
                                                    <option value="classic">Classic (two-sided)</option>
                                                    <option value="centered">Centered</option>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="lh-preset" className="text-xs">Letterhead Template</Label>
                                                <Select id="lh-preset" value={settings.letterheadPreset || 'standard'} onChange={(e) => applyLetterheadPreset(e.target.value as 'minimal' | 'standard' | 'detailed')}>
                                                    <option value="minimal">Minimal — name only</option>
                                                    <option value="standard">Standard — name + contact</option>
                                                    <option value="detailed">Detailed — everything incl. website</option>
                                                </Select>
                                            </div>
                                        </div>

                                        <UploadZone
                                            label="Hospital / Clinic Logo"
                                            value={settings.logoDataUrl}
                                            onChange={(v) => set({ logoDataUrl: v })}
                                            mimeTypes={['image/png', 'image/jpeg', 'image/svg+xml']}
                                            acceptAttr="image/png,image/jpeg,image/svg+xml"
                                            note="PNG, JPG or SVG up to 300KB. Recommended 300 DPI for crisp print output."
                                        />

                                        <div className="grid grid-cols-1 gap-x-6 gap-y-0.5 sm:grid-cols-2">
                                            <ToggleRow label="Show logo" checked={settings.showLogo !== false} onChange={(v) => set({ showLogo: v })} />
                                            <ToggleRow label="Show hospital name" checked={settings.showHospitalName !== false} onChange={(v) => set({ showHospitalName: v })} />
                                            <ToggleRow label="Show address" checked={settings.showAddress !== false} onChange={(v) => set({ showAddress: v })} />
                                            <ToggleRow label="Show phone" checked={settings.showPhone !== false} onChange={(v) => set({ showPhone: v })} />
                                            <ToggleRow label="Show email" checked={settings.showEmail !== false} onChange={(v) => set({ showEmail: v })} />
                                            <ToggleRow label="Show website" checked={settings.showWebsite === true} onChange={(v) => set({ showWebsite: v })} />
                                            <ToggleRow label="Show registration no." checked={settings.showRegNo !== false} onChange={(v) => set({ showRegNo: v })} />
                                        </div>

                                        <div>
                                            <Label htmlFor="lh-website" className="text-xs">Website</Label>
                                            <Input id="lh-website" value={settings.website || ''} onChange={(e) => set({ website: e.target.value })} placeholder="www.example.health" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Colour &amp; Branding</CardTitle>
                                        <CardDescription>Applies to the printed sheet only — the app interface keeps its own theme.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            <ColorField label="Primary" value={settings.colors?.primary || '#00294D'} onChange={(v) => set({ colors: { ...settings.colors, primary: v } })} />
                                            <ColorField label="Secondary" value={settings.brandSecondary || '#475569'} onChange={(v) => set({ brandSecondary: v })} />
                                            <ColorField label="Accent" value={settings.brandAccent || '#0EA5E9'} onChange={(v) => set({ brandAccent: v })} />
                                            <ColorField label="Text" value={settings.colors?.text || '#0F172A'} onChange={(v) => set({ colors: { ...settings.colors, text: v } })} />
                                            <ColorField label="Border" value={settings.colors?.border || '#E2E8F0'} onChange={(v) => set({ colors: { ...settings.colors, border: v } })} />
                                        </div>
                                        <FieldHint>Primary, Text and Border drive the sheet today; Secondary and Accent are saved with the template for upcoming letterhead styles.</FieldHint>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* ----- Header & Footer tab ----- */}
                        <TabsContent value="headerfooter">
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Header</CardTitle>
                                        <CardDescription>Optional line under the letterhead, plus logo placement.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="hd-text" className="text-xs">Header Text</Label>
                                            <Input id="hd-text" value={settings.headerText?.text || ''} onChange={(e) => set({ headerText: { ...settings.headerText, text: e.target.value } })} placeholder="e.g. Outpatient Department — Consultation Slip" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                            <div>
                                                <Label htmlFor="hd-size" className="text-xs">Size (px)</Label>
                                                <Input id="hd-size" type="number" min={8} max={20} value={settings.headerText?.fontSizePx ?? 11} onChange={(e) => set({ headerText: { ...settings.headerText, fontSizePx: Number(e.target.value) || 11 } })} />
                                            </div>
                                            <div>
                                                <Label htmlFor="hd-weight" className="text-xs">Weight</Label>
                                                <Select id="hd-weight" value={String(settings.headerText?.weight ?? 600)} onChange={(e) => set({ headerText: { ...settings.headerText, weight: Number(e.target.value) } })}>
                                                    <option value="400">Regular</option>
                                                    <option value="500">Medium</option>
                                                    <option value="600">Semibold</option>
                                                    <option value="700">Bold</option>
                                                </Select>
                                            </div>
                                            <div className="col-span-2">
                                                <ColorField label="Color" value={settings.headerText?.color || '#334155'} onChange={(v) => set({ headerText: { ...settings.headerText, color: v } })} />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-end gap-6">
                                            <div>
                                                <Label className="text-xs">Header Text Align</Label>
                                                <Segmented<RxAlign>
                                                    ariaLabel="Header text alignment"
                                                    value={settings.headerText?.align || 'center'}
                                                    onChange={(v) => set({ headerText: { ...settings.headerText, align: v } })}
                                                    options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Logo Position</Label>
                                                <Segmented<RxAlign>
                                                    ariaLabel="Logo position"
                                                    value={settings.logoPosition || 'left'}
                                                    onChange={(v) => set({ logoPosition: v })}
                                                    options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Footer</CardTitle>
                                        <CardDescription>Footer line and document options printed at the bottom of the sheet.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="ft-text" className="text-xs">Footer Text</Label>
                                            <Input id="ft-text" value={settings.footerText?.text || ''} onChange={(e) => set({ footerText: { ...settings.footerText, text: e.target.value } })} placeholder={DEFAULT_FOOTER_TEXT} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                            <div>
                                                <Label htmlFor="ft-size" className="text-xs">Size (px)</Label>
                                                <Input id="ft-size" type="number" min={7} max={14} step={0.5} value={settings.footerText?.fontSizePx ?? 9.5} onChange={(e) => set({ footerText: { ...settings.footerText, fontSizePx: Number(e.target.value) || 9.5 } })} />
                                            </div>
                                            <div className="col-span-2">
                                                <ColorField label="Color" value={settings.footerText?.color || '#64748B'} onChange={(v) => set({ footerText: { ...settings.footerText, color: v } })} />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Align</Label>
                                                <Segmented<RxAlign>
                                                    ariaLabel="Footer text alignment"
                                                    value={settings.footerText?.align || 'center'}
                                                    onChange={(v) => set({ footerText: { ...settings.footerText, align: v } })}
                                                    options={[{ value: 'left', label: 'L' }, { value: 'center', label: 'C' }, { value: 'right', label: 'R' }]}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            <CheckRow label="Show page number" checked={!!settings.showPageNumber} onChange={(v) => set({ showPageNumber: v })} />
                                            <CheckRow label="Show generated date/time" checked={!!settings.showGeneratedAt} onChange={(v) => set({ showGeneratedAt: v })} />
                                            <CheckRow label="Show contact details" checked={!!settings.showContact} onChange={(v) => set({ showContact: v })} />
                                            <CheckRow label="Show disclaimer" checked={!!settings.showDisclaimer} onChange={(v) => set({ showDisclaimer: v })} />
                                            <CheckRow label="Show QR verification code" checked={!!settings.showQrCode} onChange={(v) => set({ showQrCode: v })} />
                                        </div>
                                        {settings.showPageNumber && (
                                            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                                                Browser print engines don&apos;t reliably support per-page counters here, so a static &ldquo;Page 1 of 1&rdquo; line is printed instead.
                                            </p>
                                        )}
                                        {settings.showDisclaimer && (
                                            <div>
                                                <Label htmlFor="ft-disclaimer" className="text-xs">Disclaimer Text</Label>
                                                <Textarea id="ft-disclaimer" rows={2} className="min-h-0 text-xs" value={settings.disclaimerText || ''} onChange={(e) => set({ disclaimerText: e.target.value })} />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* ----- Signature tab ----- */}
                        <TabsContent value="signature">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Doctor Signature</CardTitle>
                                    <CardDescription>Signature image, placement and the identity lines printed beneath it.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <UploadZone
                                        label="Signature Image"
                                        value={settings.signatureDataUrl}
                                        onChange={(v) => set({ signatureDataUrl: v })}
                                        mimeTypes={['image/png', 'image/jpeg']}
                                        acceptAttr="image/png,image/jpeg"
                                        note="PNG or JPG up to 300KB, transparent background preferred. Recommended 300 DPI."
                                    />

                                    <div className="flex flex-wrap gap-8">
                                        <fieldset>
                                            <legend className="mb-1.5 block text-xs font-medium text-foreground">Position</legend>
                                            <div className="flex items-center gap-4">
                                                {(['left', 'center', 'right'] as const).map((p) => (
                                                    <label key={p} className="flex items-center gap-1.5 text-sm text-foreground capitalize cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="sig-position"
                                                            value={p}
                                                            checked={(settings.signaturePosition || 'right') === p}
                                                            onChange={() => set({ signaturePosition: p })}
                                                            className="h-4 w-4 border-input"
                                                        />
                                                        {p}
                                                    </label>
                                                ))}
                                            </div>
                                        </fieldset>
                                        <div>
                                            <Label className="text-xs">Size</Label>
                                            <Segmented<RxSignatureSize>
                                                ariaLabel="Signature size"
                                                value={settings.signatureSize || 'md'}
                                                onChange={(v) => set({ signatureSize: v })}
                                                options={[{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }]}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-x-6 gap-y-0.5 sm:grid-cols-2">
                                        <ToggleRow label="Show doctor name" checked={sf.doctorName !== false} onChange={(v) => set({ signatureFields: { ...sf, doctorName: v } })} />
                                        <ToggleRow label="Show qualification" checked={sf.qualification !== false} onChange={(v) => set({ signatureFields: { ...sf, qualification: v } })} />
                                        <ToggleRow label="Show designation" checked={sf.designation === true} onChange={(v) => set({ signatureFields: { ...sf, designation: v } })} />
                                        <ToggleRow label="Show department" checked={sf.department === true} onChange={(v) => set({ signatureFields: { ...sf, department: v } })} />
                                        <ToggleRow label="Show registration no." checked={sf.regNo !== false} onChange={(v) => set({ signatureFields: { ...sf, regNo: v } })} />
                                        <ToggleRow label="Digitally signed stamp" checked={!!settings.showDigitalSignature} onChange={(v) => set({ showDigitalSignature: v })} />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div>
                                            <Label htmlFor="sig-qual" className="text-xs">Qualification</Label>
                                            <Input id="sig-qual" value={settings.qualification || ''} onChange={(e) => set({ qualification: e.target.value })} placeholder="MBBS, MD" />
                                        </div>
                                        <div>
                                            <Label htmlFor="sig-desig" className="text-xs">Designation</Label>
                                            <Input id="sig-desig" value={settings.designation || ''} onChange={(e) => set({ designation: e.target.value })} placeholder="Senior Consultant" />
                                        </div>
                                        <div>
                                            <Label htmlFor="sig-dept" className="text-xs">Department</Label>
                                            <Input id="sig-dept" value={settings.department || ''} onChange={(e) => set({ department: e.target.value })} placeholder="Dept. of Cardiology" />
                                        </div>
                                    </div>

                                    {/* Mini signature-block preview */}
                                    <div>
                                        <Label className="text-xs">Signature Block Preview</Label>
                                        <div className="rounded-xl border border-border bg-white p-4 dark:bg-white">
                                            <div style={{ textAlign: settings.signaturePosition || 'right' }}>
                                                {settings.signatureDataUrl && (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img
                                                        src={settings.signatureDataUrl}
                                                        alt="Signature preview"
                                                        style={{
                                                            display: 'block',
                                                            maxHeight: { sm: 34, md: 50, lg: 66 }[settings.signatureSize || 'md'],
                                                            maxWidth: 220,
                                                            objectFit: 'contain',
                                                            marginLeft: (settings.signaturePosition || 'right') !== 'left' ? 'auto' : undefined,
                                                            marginRight: (settings.signaturePosition || 'right') === 'center' ? 'auto' : undefined,
                                                        }}
                                                    />
                                                )}
                                                <div
                                                    className="border-b-[1.5px] border-slate-700"
                                                    style={{
                                                        width: 190,
                                                        height: settings.signatureDataUrl ? 4 : 26,
                                                        marginBottom: 5,
                                                        marginLeft: (settings.signaturePosition || 'right') !== 'left' ? 'auto' : undefined,
                                                        marginRight: (settings.signaturePosition || 'right') === 'center' ? 'auto' : undefined,
                                                    }}
                                                />
                                                {sf.doctorName !== false && <div className="text-[12.5px] font-bold text-slate-900">{settings.doctorName}</div>}
                                                {sf.qualification !== false && settings.qualification && <div className="text-[10px] text-slate-500">{settings.qualification}</div>}
                                                {sf.designation === true && settings.designation && <div className="text-[10px] text-slate-500">{settings.designation}</div>}
                                                {sf.department === true && settings.department && <div className="text-[10px] text-slate-500">{settings.department}</div>}
                                                {sf.regNo !== false && settings.doctorRegNo && <div className="text-[10px] text-slate-500">{settings.doctorRegNo}</div>}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ----- AI Settings tab ----- */}
                        <TabsContent value="ai">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" aria-hidden /> AI Assistance
                                    </CardTitle>
                                    <CardDescription>Clinical decision support shown to the prescriber while writing prescriptions.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    <ToggleRow
                                        label="Enable AI medication suggestions"
                                        hint="Suggests medications from diagnosis and history while prescribing."
                                        checked={settings.ai?.suggestions !== false}
                                        onChange={(v) => set({ ai: { suggestions: v, interactions: settings.ai?.interactions !== false, alternatives: settings.ai?.alternatives === true } })}
                                    />
                                    <ToggleRow
                                        label="Show drug–drug interaction alerts"
                                        hint="Flags potential interactions across the current medication list."
                                        checked={settings.ai?.interactions !== false}
                                        onChange={(v) => set({ ai: { suggestions: settings.ai?.suggestions !== false, interactions: v, alternatives: settings.ai?.alternatives === true } })}
                                    />
                                    <ToggleRow
                                        label="Show generic / cheaper alternatives"
                                        hint="Offers equivalent alternatives where available."
                                        checked={settings.ai?.alternatives === true}
                                        onChange={(v) => set({ ai: { suggestions: settings.ai?.suggestions !== false, interactions: settings.ai?.interactions !== false, alternatives: v } })}
                                    />
                                    <div className="mt-4 rounded-xl border border-border bg-muted/50 p-3.5">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Disclaimer (fixed)</p>
                                        <p className="mt-1 text-sm text-foreground">{AI_DISCLAIMER}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* RIGHT — sticky live preview (desktop) */}
                <div ref={previewAnchorRef} className="hidden min-w-0 lg:block">
                    <div className="sticky top-6">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <CardTitle>Live Preview</CardTitle>
                                        <CardDescription>Sample consultation — updates as you edit.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge tone="info">Sample data</Badge>
                                        <Button variant="outline" size="sm" onClick={handlePrint}>
                                            <Printer className="h-3.5 w-3.5" aria-hidden /> Print / Save PDF
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div ref={previewBoxRef} className="w-full overflow-hidden rounded-xl border border-border bg-muted">
                                    <div style={{ height: Math.round(sheetH * scale) }}>
                                        <iframe
                                            title="Prescription live preview"
                                            srcDoc={previewHtml}
                                            sandbox=""
                                            style={{
                                                width: sheetW,
                                                height: sheetH,
                                                transform: `scale(${scale})`,
                                                transformOrigin: 'top left',
                                                border: 0,
                                                background: '#fff',
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    </div>
                                </div>
                                <p className="mt-2 text-[11px] text-subtle-foreground">
                                    {paper} · {landscape ? 'Landscape' : 'Portrait'} · scaled to fit. Print for true size.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* ---------- Sticky bottom action bar ---------- */}
            <div className="sticky bottom-0 z-30 -mx-1 px-1 pb-2">
                <div className="glass-panel rounded-2xl border border-border shadow-float px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {dirty ? <Badge tone="warning" dot>Unsaved changes</Badge> : <Badge tone="success">All changes saved</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setResetOpen(true)}>
                                <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset to Default
                            </Button>
                            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobilePreviewOpen(true)}>
                                <Eye className="h-3.5 w-3.5" aria-hidden /> Preview Prescription
                            </Button>
                            <Button variant="outline" size="sm" className="hidden lg:inline-flex" onClick={openPreview}>
                                <Eye className="h-3.5 w-3.5" aria-hidden /> Preview
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setDraftName(`${activeTemplate?.name || 'Template'} (Custom)`); setDraftLevel(activeTemplate?.level || 'doctor'); setCreateFromCurrent(true); setCreateOpen(true); }}>
                                <Copy className="h-3.5 w-3.5" aria-hidden /> Save as Template
                            </Button>
                            <Button size="sm" onClick={saveChanges}>
                                <Save className="h-3.5 w-3.5" aria-hidden /> Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ---------- Dialogs ---------- */}

            <Dialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Create Template"
                description="Templates can be scoped to the hospital, a department, or an individual doctor."
                footer={
                    <>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button onClick={createTemplate}>Create Template</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="tpl-new-name">Template Name</Label>
                        <Input id="tpl-new-name" value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g. Cardiology OPD" autoFocus />
                    </div>
                    <div>
                        <Label htmlFor="tpl-new-level">Level</Label>
                        <Select id="tpl-new-level" value={draftLevel} onChange={(e) => setDraftLevel(e.target.value as TemplateLevel)}>
                            <option value="hospital">Hospital — applies organization-wide</option>
                            <option value="department">Department — overrides hospital default</option>
                            <option value="doctor">Doctor — overrides department &amp; hospital</option>
                        </Select>
                    </div>
                    <ToggleRow label="Start from current settings" hint="Off = start from CareConnect defaults." checked={createFromCurrent} onChange={setCreateFromCurrent} />
                </div>
            </Dialog>

            <Dialog
                open={renameOpen}
                onClose={() => setRenameOpen(false)}
                title="Rename Template"
                size="sm"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
                        <Button onClick={renameTemplate}>Rename</Button>
                    </>
                }
            >
                <div>
                    <Label htmlFor="tpl-rename">Template Name</Label>
                    <Input id="tpl-rename" value={draftName} onChange={(e) => setDraftName(e.target.value)} autoFocus />
                </div>
            </Dialog>

            <Dialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                title="Delete Template?"
                size="sm"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={deleteTemplate}>
                            <Trash2 className="h-4 w-4" aria-hidden /> Delete
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-muted-foreground">
                    &ldquo;{activeTemplate?.name}&rdquo; will be permanently removed from this browser. This cannot be undone.
                </p>
            </Dialog>

            <Dialog
                open={resetOpen}
                onClose={() => setResetOpen(false)}
                title="Reset to Default?"
                size="sm"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={resetToDefault}>Reset</Button>
                    </>
                }
            >
                <p className="text-sm text-muted-foreground">
                    The working settings will be replaced by the CareConnect defaults. The saved template stays unchanged until you click &ldquo;Save Changes&rdquo;.
                </p>
            </Dialog>

            <Dialog
                open={mobilePreviewOpen}
                onClose={() => setMobilePreviewOpen(false)}
                title="Prescription Preview"
                description="Sample consultation data — scaled preview."
                size="xl"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setMobilePreviewOpen(false)}>Close</Button>
                        <Button onClick={handlePrint}>
                            <Printer className="h-4 w-4" aria-hidden /> Print / Save PDF
                        </Button>
                    </>
                }
            >
                <div className="w-full overflow-auto rounded-xl border border-border bg-muted p-2">
                    <div style={{ width: Math.round(sheetW * 0.42), height: Math.round(sheetH * 0.42) }}>
                        <iframe
                            title="Prescription preview (dialog)"
                            srcDoc={previewHtml}
                            sandbox=""
                            style={{
                                width: sheetW,
                                height: sheetH,
                                transform: 'scale(0.42)',
                                transformOrigin: 'top left',
                                border: 0,
                                background: '#fff',
                                pointerEvents: 'none',
                            }}
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
