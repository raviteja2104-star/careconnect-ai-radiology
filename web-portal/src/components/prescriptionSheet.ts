'use client';

/**
 * Self-contained prescription sheet renderer.
 * Produces a complete standalone HTML document (inline CSS only — no CDNs,
 * works offline) for: live preview (iframe srcDoc), printing, and
 * save-as-PDF via the browser's print dialog.
 *
 * Every field added by the Prescription Settings module is OPTIONAL and
 * defaults to today's behavior, so existing callers (EMR page,
 * DispatchRxModal) render byte-for-byte-equivalent output when they pass
 * only the original fields.
 */

export type RxAlign = 'left' | 'center' | 'right';
export type RxPaperSize = 'A4' | 'A5' | 'Letter';
export type RxOrientation = 'portrait' | 'landscape';
export type RxFontFamily = 'Inter' | 'Georgia' | 'Arial' | 'Times New Roman' | 'Segoe UI';
export type RxSignatureSize = 'sm' | 'md' | 'lg';
export type RxMedicineColumn =
    | 'index' | 'name' | 'generic' | 'strength' | 'dosage' | 'route'
    | 'frequency' | 'duration' | 'quantity' | 'instructions' | 'foodTiming';
export type RxResultFlag = 'high' | 'low' | 'critical' | 'normal';

export interface RxTextStyle {
    text?: string;
    fontSizePx?: number;
    weight?: number | string;
    color?: string;
    align?: RxAlign;
}

export interface RxSectionVisibility {
    chiefComplaints?: boolean;
    symptoms?: boolean;
    clinicalFindings?: boolean;
    diagnosis?: boolean;
    allergies?: boolean;
    medicalHistory?: boolean;
    currentMedications?: boolean;
    vitals?: boolean;
    treatmentPlan?: boolean;
    followUp?: boolean;
    advice?: boolean;
}

export interface RxInvestigation {
    name: string;
    indication?: string;
    priority?: string;
    instructions?: string;
}

export interface RxResult {
    test: string;
    result?: string;
    unit?: string;
    referenceRange?: string;
    flag?: RxResultFlag;
    comments?: string;
}

export interface RxDrugLine {
    name: string;
    dose?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
    /** Extended fields for the configurable medicine table (all optional). */
    generic?: string;
    strength?: string;
    dosage?: string;
    route?: string;
    quantity?: string;
    foodTiming?: string;
}

export interface PrescriptionSheetSettings {
    hospitalName: string;
    tagline?: string;
    address?: string;
    phone?: string;
    email?: string;
    regNo?: string;
    doctorName: string;
    doctorTitle?: string;
    doctorRegNo?: string;
    primaryColor?: 'indigo' | 'emerald' | 'blue' | 'slate';
    headerStyle?: 'classic' | 'modern' | 'centered';
    showDiagnosis?: boolean;
    showVitals?: boolean;
    showDigitalSignature?: boolean;
    showQrCode?: boolean;
    showFooter?: boolean;
    footerTerms?: string;

    /* ---------- Typography (optional; defaults = current output) ---------- */
    fontFamily?: RxFontFamily;
    /** Base body font size in px. Default 12.5. */
    fontSizePx?: number;
    /** Text alignment for body section values. Default left. */
    textAlign?: RxAlign;

    /* ---------- Page ---------- */
    paperSize?: RxPaperSize;
    orientation?: RxOrientation;
    /** Print margins in cm. When absent the current 12mm all-round is kept. */
    margins?: { topCm?: number; bottomCm?: number; leftCm?: number; rightCm?: number };

    /* ---------- Branding colors ----------
     * When `colors` is present, `colors.primary` (default #00294D) replaces
     * the legacy primaryColor palette. When absent, legacy behavior stays. */
    colors?: { primary?: string; text?: string; border?: string };

    /* ---------- Letterhead ---------- */
    logoDataUrl?: string;
    logoPosition?: RxAlign;
    website?: string;
    showLogo?: boolean;
    showHospitalName?: boolean;
    showAddress?: boolean;
    showPhone?: boolean;
    showEmail?: boolean;
    showWebsite?: boolean;
    showRegNo?: boolean;
    /** Custom header line rendered below the letterhead rule. */
    headerText?: RxTextStyle;

    /* ---------- Footer ---------- */
    footerText?: RxTextStyle;
    /**
     * Note: a per-page CSS counter in `@page` bottom-center is unreliable in
     * iframe/srcDoc + print contexts, so when enabled a static
     * "Page 1 of 1" line is rendered in the document footer instead.
     */
    showPageNumber?: boolean;
    showGeneratedAt?: boolean;
    showContact?: boolean;
    showDisclaimer?: boolean;
    disclaimerText?: string;

    /* ---------- Signature ---------- */
    signatureDataUrl?: string;
    /** Default 'right' (current layout). */
    signaturePosition?: RxAlign;
    signatureSize?: RxSignatureSize;
    qualification?: string;
    designation?: string;
    department?: string;
    signatureFields?: {
        doctorName?: boolean;
        qualification?: boolean;
        designation?: boolean;
        regNo?: boolean;
        department?: boolean;
    };

    /* ---------- Medicine table ----------
     * Ordered visible columns. Default = current table:
     * index, name (with dose), frequency, duration, instructions. */
    medicineColumns?: RxMedicineColumn[];

    /* ---------- Sections ---------- */
    sections?: RxSectionVisibility;

    /* ---------- Investigations & results column toggles ---------- */
    investigationColumns?: { name?: boolean; indication?: boolean; priority?: boolean; instructions?: boolean };
    resultColumns?: { test?: boolean; result?: boolean; unit?: boolean; referenceRange?: boolean; flag?: boolean; comments?: boolean };
}

export interface PrescriptionSheetData {
    settings: PrescriptionSheetSettings;
    patient: { name: string; ageSex?: string; id?: string; mobile?: string };
    date?: string;
    symptoms?: string;
    diagnosis?: string;
    vitals?: string;
    drugs: RxDrugLine[];
    advice?: string;
    /* Optional extended clinical sections (render only when provided + visible). */
    chiefComplaintsText?: string;
    clinicalFindings?: string;
    allergiesText?: string;
    medicalHistoryText?: string;
    currentMedicationsText?: string;
    treatmentPlanText?: string;
    followUpText?: string;
    investigations?: RxInvestigation[];
    results?: RxResult[];
}

const COLORS: Record<string, string> = {
    indigo: '#4F46E5',
    emerald: '#059669',
    blue: '#2563EB',
    slate: '#334155',
};

const FONT_STACKS: Record<RxFontFamily, string> = {
    'Inter': "'Inter', 'Segoe UI', system-ui, Arial, sans-serif",
    'Georgia': "Georgia, 'Times New Roman', serif",
    'Arial': "Arial, Helvetica, sans-serif",
    'Times New Roman': "'Times New Roman', Times, serif",
    'Segoe UI': "'Segoe UI', system-ui, Arial, sans-serif",
};

/** Sheet max-widths (px) tuned per paper size/orientation. */
const SHEET_WIDTH: Record<RxPaperSize, { portrait: number; landscape: number }> = {
    A4: { portrait: 760, landscape: 1085 },
    A5: { portrait: 500, landscape: 745 },
    Letter: { portrait: 780, landscape: 1020 },
};

const MED_COL_LABEL: Record<RxMedicineColumn, string> = {
    index: '#',
    name: 'Medication',
    generic: 'Generic',
    strength: 'Strength',
    dosage: 'Dose',
    route: 'Route',
    frequency: 'Frequency',
    duration: 'Duration',
    quantity: 'Qty',
    instructions: 'Notes',
    foodTiming: 'Food Timing',
};

const MED_COL_CENTERED: ReadonlySet<RxMedicineColumn> = new Set([
    'index', 'strength', 'dosage', 'route', 'frequency', 'duration', 'quantity', 'foodTiming',
]);

const DEFAULT_MED_COLUMNS: RxMedicineColumn[] = ['index', 'name', 'frequency', 'duration', 'instructions'];

const FLAG_COLORS: Record<RxResultFlag, string> = {
    high: '#B45309',
    low: '#2563EB',
    critical: '#B91C1C',
    normal: '#059669',
};

const esc = (s: unknown) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const nl2br = (s: unknown) => esc(s).replace(/\n/g, '<br>');

export function buildPrescriptionHtml(data: PrescriptionSheetData): string {
    const s = data.settings;
    const accent = s.colors
        ? (s.colors.primary || '#00294D')
        : (COLORS[s.primaryColor || 'indigo'] || COLORS.indigo);
    const textColor = s.colors?.text || '#0F172A';
    const borderColor = s.colors?.border || '#E2E8F0';
    const centered = s.headerStyle === 'centered';
    const date = data.date || new Date().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    /* ---- Typography / page ---- */
    const fontStack = s.fontFamily ? FONT_STACKS[s.fontFamily] : FONT_STACKS['Segoe UI'];
    const baseFontPx = s.fontSizePx && s.fontSizePx > 0 ? s.fontSizePx : 12.5;
    const bodyAlign = s.textAlign || 'left';
    const paper = s.paperSize || 'A4';
    const orientation = s.orientation || 'portrait';
    const pageSize = `${paper}${orientation === 'landscape' ? ' landscape' : ''}`;
    const m = s.margins;
    const pageMargin = m
        ? `${m.topCm ?? 1.2}cm ${m.rightCm ?? 1.2}cm ${m.bottomCm ?? 1.2}cm ${m.leftCm ?? 1.2}cm`
        : '12mm';
    const sheetMax = SHEET_WIDTH[paper][orientation];

    /* ---- Section visibility ---- */
    const sections = s.sections;
    const vis = (k: keyof RxSectionVisibility) => sections?.[k] !== false;
    const sec = (label: string, value: string | undefined, on: boolean) =>
        on && value && String(value).trim()
            ? `<div class="sec"><div class="lbl">${esc(label)}</div><div class="val">${nl2br(value)}</div></div>`
            : '';

    /* ---- Medicine table (ordered, configurable columns) ---- */
    const medCols = (s.medicineColumns && s.medicineColumns.length ? s.medicineColumns : DEFAULT_MED_COLUMNS)
        .filter((c) => MED_COL_LABEL[c]);
    const hasDoseColumn = medCols.includes('dosage');
    const drugList = data.drugs.filter((d) => d.name && d.name.trim());
    const medCell = (d: RxDrugLine, col: RxMedicineColumn, i: number): string => {
        switch (col) {
            case 'index': return `<td class="c">${i + 1}</td>`;
            case 'name': return `<td><strong>${esc(d.name)}</strong>${d.dose && !hasDoseColumn ? `<span class="sub"> · ${esc(d.dose)}</span>` : ''}</td>`;
            case 'generic': return `<td>${esc(d.generic || '—')}</td>`;
            case 'strength': return `<td class="c">${esc(d.strength || '—')}</td>`;
            case 'dosage': return `<td class="c">${esc(d.dosage || d.dose || '—')}</td>`;
            case 'route': return `<td class="c">${esc(d.route || '—')}</td>`;
            case 'frequency': return `<td class="c">${esc(d.frequency || '—')}</td>`;
            case 'duration': return `<td class="c">${esc(d.duration || '—')}</td>`;
            case 'quantity': return `<td class="c">${esc(d.quantity || '—')}</td>`;
            case 'instructions': return `<td>${esc(d.instructions || '—')}</td>`;
            case 'foodTiming': return `<td class="c">${esc(d.foodTiming || '—')}</td>`;
        }
    };
    const medHead = medCols
        .map((c) => `<th${MED_COL_CENTERED.has(c) ? ' class="c"' : ''}>${esc(MED_COL_LABEL[c])}</th>`)
        .join('');
    const rows = drugList
        .map((d, i) => `
            <tr>
              ${medCols.map((c) => medCell(d, c, i)).join('\n              ')}
            </tr>`)
        .join('');

    /* ---- Investigations table ---- */
    const ic = s.investigationColumns;
    const invList = (data.investigations || []).filter((x) => x.name && x.name.trim());
    const invCols: Array<{ key: keyof RxInvestigation; label: string; center?: boolean }> = [
        { key: 'name', label: 'Investigation' },
        { key: 'indication', label: 'Indication' },
        { key: 'priority', label: 'Priority', center: true },
        { key: 'instructions', label: 'Instructions' },
    ].filter((c) => (ic ? ic[c.key as keyof typeof ic] !== false : true)) as Array<{ key: keyof RxInvestigation; label: string; center?: boolean }>;
    const investigationsHtml = invList.length && invCols.length
        ? `<div class="sec"><div class="lbl">Investigations Advised</div></div>
  <table>
    <thead><tr><th class="c">#</th>${invCols.map((c) => `<th${c.center ? ' class="c"' : ''}>${esc(c.label)}</th>`).join('')}</tr></thead>
    <tbody>${invList.map((inv, i) => `
      <tr><td class="c">${i + 1}</td>${invCols.map((c) => `<td${c.center ? ' class="c"' : ''}>${c.key === 'name' ? `<strong>${esc(inv.name)}</strong>` : esc(inv[c.key] || '—')}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>`
        : '';

    /* ---- Results table (subtle flag badges) ---- */
    const rc = s.resultColumns;
    const resultList = (data.results || []).filter((x) => x.test && x.test.trim());
    const resCols: Array<{ key: keyof RxResult; label: string; center?: boolean }> = [
        { key: 'test', label: 'Test' },
        { key: 'result', label: 'Result', center: true },
        { key: 'unit', label: 'Unit', center: true },
        { key: 'referenceRange', label: 'Ref. Range', center: true },
        { key: 'flag', label: 'Flag', center: true },
        { key: 'comments', label: 'Comments' },
    ].filter((c) => (rc ? rc[c.key as keyof typeof rc] !== false : true)) as Array<{ key: keyof RxResult; label: string; center?: boolean }>;
    const resCell = (r: RxResult, key: keyof RxResult): string => {
        if (key === 'test') return `<strong>${esc(r.test)}</strong>`;
        if (key === 'flag') {
            if (!r.flag) return '—';
            const col = FLAG_COLORS[r.flag] || textColor;
            return `<span style="color:${col};font-weight:700;font-size:10px;letter-spacing:0.06em;text-transform:uppercase">${esc(r.flag)}</span>`;
        }
        return esc(r[key] || '—');
    };
    const resultsHtml = resultList.length && resCols.length
        ? `<div class="sec"><div class="lbl">Reports / Results</div></div>
  <table>
    <thead><tr>${resCols.map((c) => `<th${c.center ? ' class="c"' : ''}>${esc(c.label)}</th>`).join('')}</tr></thead>
    <tbody>${resultList.map((r) => `
      <tr>${resCols.map((c) => `<td${c.center ? ' class="c"' : ''}>${resCell(r, c.key)}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>`
        : '';

    /* ---- Letterhead ---- */
    const logoHtml = s.logoDataUrl && s.showLogo !== false
        ? `<div style="text-align:${s.logoPosition || 'left'};margin-bottom:8px"><img src="${esc(s.logoDataUrl)}" alt="Logo" style="max-height:64px;max-width:240px;object-fit:contain"></div>`
        : '';
    const contactBits = [
        s.showPhone !== false && s.phone ? esc(s.phone) : '',
        s.showEmail !== false && s.email ? esc(s.email) : '',
        s.showWebsite !== false && s.website ? esc(s.website) : '',
    ].filter(Boolean);
    const addrLine = [s.showAddress !== false && s.address ? esc(s.address) : '', ...contactBits].filter(Boolean).join(' · ');
    const ht = s.headerText;
    const headerTextHtml = ht && ht.text && ht.text.trim()
        ? `<div style="text-align:${ht.align || 'center'};font-size:${ht.fontSizePx || 11}px;font-weight:${ht.weight || 600};color:${ht.color || '#334155'};margin:-4px 0 10px">${nl2br(ht.text)}</div>`
        : '';

    /* ---- Footer extras ---- */
    const ft = s.footerText;
    const footLines: string[] = [];
    if (ft && ft.text && ft.text.trim()) {
        footLines.push(`<div style="text-align:${ft.align || 'center'};font-size:${ft.fontSizePx || 9.5}px;color:${ft.color || '#64748B'};font-weight:600">${nl2br(ft.text)}</div>`);
    }
    if (s.showContact && contactBits.length) {
        footLines.push(`<div class="footline">${contactBits.join(' · ')}</div>`);
    }
    if (s.showGeneratedAt) {
        footLines.push(`<div class="footline">Generated on ${esc(date)}</div>`);
    }
    if (s.showDisclaimer && s.disclaimerText && s.disclaimerText.trim()) {
        footLines.push(`<div class="footline">${nl2br(s.disclaimerText)}</div>`);
    }
    if (s.showPageNumber) {
        // Static line: @page margin-box counters are unreliable in srcDoc/print here.
        footLines.push(`<div class="footline">Page 1 of 1</div>`);
    }
    const footHtml = footLines.length ? `<div class="foot">${footLines.join('')}</div>` : '';

    /* ---- Signature block ---- */
    const sigAlign = s.signaturePosition || 'right';
    const sigHeights: Record<RxSignatureSize, number> = { sm: 34, md: 50, lg: 66 };
    const sigImgH = sigHeights[s.signatureSize || 'md'];
    const lineMargin = sigAlign === 'right' ? 'margin-left:auto;' : sigAlign === 'center' ? 'margin-left:auto;margin-right:auto;' : 'margin-right:auto;';
    const imgMargin = sigAlign === 'right' ? 'margin-left:auto;' : sigAlign === 'center' ? 'margin:0 auto;' : '';
    const sf = s.signatureFields;
    const sigImgHtml = s.signatureDataUrl
        ? `<img src="${esc(s.signatureDataUrl)}" alt="Signature" style="display:block;${imgMargin}max-height:${sigImgH}px;max-width:220px;object-fit:contain;margin-bottom:2px">`
        : '';
    const signIdentity = [
        (sf?.doctorName !== false) ? `<div class="who">${esc(s.doctorName)}</div>` : '',
        (sf?.qualification !== false) && s.qualification ? `<div class="reg">${esc(s.qualification)}</div>` : '',
        (sf?.designation !== false) && s.designation ? `<div class="reg">${esc(s.designation)}</div>` : '',
        (sf?.department !== false) && s.department ? `<div class="reg">${esc(s.department)}</div>` : '',
        (sf?.regNo !== false) && s.doctorRegNo ? `<div class="reg">${esc(s.doctorRegNo)}</div>` : '',
    ].filter(Boolean).join('\n        ');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Prescription — ${esc(data.patient.name)} — ${esc(s.hospitalName)}</title>
<style>
  @page { size: ${pageSize}; margin: ${pageMargin}; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ${fontStack}; color: ${textColor}; background: #fff; font-size: ${baseFontPx}px; line-height: 1.5; }
  .sheet { max-width: ${sheetMax}px; margin: 0 auto; padding: 8px 4px; min-height: 96vh; display: flex; flex-direction: column; }
  .head { border-bottom: 2.5px solid ${accent}; padding-bottom: 12px; margin-bottom: 12px; ${centered ? 'text-align: center;' : 'display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;'} }
  .hosp { font-size: 19px; font-weight: 800; color: ${accent}; letter-spacing: 0.01em; }
  .tag { font-size: 11px; color: #475569; margin-top: 2px; }
  .addr { font-size: 10.5px; color: #64748B; margin-top: 4px; white-space: pre-line; }
  .doc { ${centered ? 'margin-top: 8px;' : 'text-align: right;'} }
  .doc .n { font-weight: 700; font-size: 13.5px; }
  .doc .t { font-size: 11px; color: #475569; }
  .doc .r { font-size: 10px; color: #64748B; }
  .pinfo { display: flex; flex-wrap: wrap; gap: 4px 22px; background: #F5F8FC; border: 1px solid ${borderColor}; border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; font-size: 11.5px; }
  .pinfo b { color: #334155; }
  .sec { margin: 10px 0 4px; }
  .sec .lbl { font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: ${accent}; }
  .sec .val { margin-top: 3px; white-space: pre-line; text-align: ${bodyAlign}; }
  .rxmark { font-size: 22px; font-weight: 800; color: ${accent}; margin: 10px 0 4px; font-style: italic; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { text-align: left; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748B; border-bottom: 1.5px solid #CBD5E1; padding: 6px 8px; }
  td { border-bottom: 1px solid ${borderColor}; padding: 7px 8px; vertical-align: top; }
  td.c, th.c { text-align: center; white-space: nowrap; }
  .sub { color: #475569; font-weight: 600; }
  .bottom { margin-top: auto; padding-top: 18px; }
  .signrow { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 26px; }
  .qr { width: 74px; height: 74px; border: 1.5px dashed #94A3B8; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 8.5px; color: #64748B; text-align: center; }
  .sign { flex: 1; text-align: ${sigAlign}; }
  .sign .line { width: 190px; border-bottom: 1.5px solid #334155; ${lineMargin} margin-bottom: 5px; height: ${s.signatureDataUrl ? 4 : 30}px; }
  .sign .who { font-weight: 700; font-size: 12.5px; }
  .sign .reg { font-size: 10px; color: #64748B; }
  .terms { border-top: 1px solid ${borderColor}; margin-top: 14px; padding-top: 8px; font-size: 9.5px; color: #64748B; white-space: pre-line; }
  .foot { border-top: 1px solid ${borderColor}; margin-top: 10px; padding-top: 7px; }
  .footline { text-align: center; font-size: 9px; color: #94A3B8; margin-top: 2px; }
  .digital { font-size: 9.5px; color: ${accent}; font-weight: 600; margin-top: 2px; }
</style>
</head>
<body>
<div class="sheet">
  ${logoHtml}
  <div class="head">
    <div>
      ${s.showHospitalName !== false ? `<div class="hosp">${esc(s.hospitalName)}</div>` : ''}
      ${s.tagline ? `<div class="tag">${esc(s.tagline)}</div>` : ''}
      ${addrLine ? `<div class="addr">${addrLine}</div>` : ''}
      ${s.regNo && s.showRegNo !== false ? `<div class="addr">${esc(s.regNo)}</div>` : ''}
    </div>
    <div class="doc">
      <div class="n">${esc(s.doctorName)}</div>
      ${s.doctorTitle ? `<div class="t">${esc(s.doctorTitle)}</div>` : ''}
      ${s.doctorRegNo ? `<div class="r">${esc(s.doctorRegNo)}</div>` : ''}
    </div>
  </div>
  ${headerTextHtml}

  <div class="pinfo">
    <span><b>Name:</b> ${esc(data.patient.name)}</span>
    ${data.patient.ageSex ? `<span><b>Age/Sex:</b> ${esc(data.patient.ageSex)}</span>` : ''}
    ${data.patient.id ? `<span><b>ID:</b> ${esc(data.patient.id)}</span>` : ''}
    ${data.patient.mobile ? `<span><b>Mobile:</b> ${esc(data.patient.mobile)}</span>` : ''}
    <span><b>Date:</b> ${esc(date)}</span>
  </div>

  ${sec('Chief Complaints', data.chiefComplaintsText, vis('chiefComplaints'))}
  ${sec('Symptoms', data.symptoms, vis('symptoms'))}
  ${sec('Clinical Findings', data.clinicalFindings, vis('clinicalFindings'))}
  ${sec('Diagnosis', data.diagnosis, s.showDiagnosis !== false && vis('diagnosis'))}
  ${sec('Allergies', data.allergiesText, vis('allergies'))}
  ${sec('Medical History', data.medicalHistoryText, vis('medicalHistory'))}
  ${sec('Current Medications', data.currentMedicationsText, vis('currentMedications'))}
  ${sec('Vitals', data.vitals, !!s.showVitals && vis('vitals'))}

  <div class="rxmark">℞</div>
  ${rows
        ? `<table>
    <thead><tr>${medHead}</tr></thead>
    <tbody>${rows}</tbody>
  </table>`
        : '<div class="val" style="color:#64748B">No medications added.</div>'}

  ${investigationsHtml}
  ${resultsHtml}

  ${sec('Treatment Plan', data.treatmentPlanText, vis('treatmentPlan'))}
  ${sec('Advice / Plan', data.advice, vis('advice'))}
  ${sec('Follow-up', data.followUpText, vis('followUp'))}

  <div class="bottom">
    <div class="signrow">
      ${s.showQrCode ? `<div class="qr">Scan to verify<br>digital prescription</div>` : '<div></div>'}
      <div class="sign">
        ${sigImgHtml}
        <div class="line"></div>
        ${signIdentity}
        ${s.showDigitalSignature ? `<div class="digital">Digitally signed via CareConnect EMR · ${esc(date)}</div>` : ''}
      </div>
    </div>
    ${s.showFooter && s.footerTerms ? `<div class="terms">${nl2br(s.footerTerms)}</div>` : ''}
    ${footHtml}
  </div>
</div>
</body>
</html>`;
}

/** Open the sheet in a print window; the browser's dialog offers Save as PDF. */
export function openPrescriptionPrintWindow(html: string): boolean {
    const w = window.open('', '_blank', 'width=860,height=1120');
    if (!w) return false;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.onload = () => {
        w.focus();
        w.print();
    };
    return true;
}
