'use client';

/**
 * Self-contained laboratory report renderer. Produces a complete standalone
 * HTML document (inline CSS only — no CDNs, works offline) for printing and
 * save-as-PDF via the browser's print dialog. Opened through the shared
 * openPrescriptionPrintWindow helper.
 */

import type { ResultFlag, WorklistItem } from './api';
import { effectiveFlag, formatWhen } from './api';

const esc = (s: unknown) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const nl2br = (s: unknown) => esc(s).replace(/\n/g, '<br>');

const FLAG_STYLE: Record<Exclude<ResultFlag, null>, { marker: string; color: string }> = {
    high: { marker: '▲ High', color: '#B45309' },
    low: { marker: '▼ Low', color: '#2563EB' },
    critical: { marker: 'CRITICAL', color: '#B91C1C' },
    normal: { marker: '', color: '#059669' },
    positive: { marker: 'Positive', color: '#B45309' },
    negative: { marker: 'Negative', color: '#059669' },
    abnormal: { marker: 'Abnormal', color: '#B45309' },
};

function flagCell(flag: ResultFlag): string {
    if (!flag || flag === 'normal') return '<td class="c mono">&nbsp;</td>';
    const f = FLAG_STYLE[flag];
    const heavy = flag === 'critical';
    return `<td class="c"><span style="color:${f.color};font-weight:800;font-size:${heavy ? 10.5 : 10}px;letter-spacing:0.05em;${heavy ? 'border:1.5px solid #B91C1C;border-radius:4px;padding:1px 5px;' : ''}">${esc(f.marker)}</span></td>`;
}

export function buildLabReportHtml(item: WorklistItem): string {
    const amended = (item.amendments?.length ?? 0) > 0;
    const released = item.status === 'RELEASED';
    const statusLabel = released ? (amended ? 'AMENDED REPORT' : 'FINAL REPORT — RELEASED') : 'PRELIMINARY — NOT RELEASED';
    const statusColor = released ? (amended ? '#B45309' : '#059669') : '#B91C1C';
    const reportedAt = item.releasedAt ? formatWhen(item.releasedAt) : '—';
    const printedAt = new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const testBlocks = item.tests
        .map((t) => {
            const rows = t.parameters
                .map((p) => {
                    const flag = effectiveFlag(p);
                    const bold = flag && flag !== 'normal' && flag !== 'negative';
                    return `
        <tr>
          <td>${esc(p.name)}${p.comments ? `<div class="pcomment">${nl2br(p.comments)}</div>` : ''}</td>
          <td class="c mono"${bold ? ' style="font-weight:800"' : ''}>${esc(p.value || '—')}</td>
          <td class="c">${esc(p.unit || '')}</td>
          <td class="c mono">${esc(p.refRangeUsed || '—')}</td>
          ${flagCell(flag)}
        </tr>`;
                })
                .join('');
            return `
    <div class="test">
      <div class="testhead">
        <span class="testname">${esc(t.name)}</span>
        <span class="testmeta">Code: ${esc(t.code)}${t.specimen ? ` · Specimen: ${esc(t.specimen)}` : ''}</span>
      </div>
      <table>
        <thead><tr><th>Parameter</th><th class="c">Result</th><th class="c">Unit</th><th class="c">Reference Range</th><th class="c">Flag</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${t.techComments ? `<div class="techcomment"><b>Technologist comments:</b> ${nl2br(t.techComments)}</div>` : ''}
    </div>`;
        })
        .join('');

    const criticalHtml = (item.criticalEvents || []).length
        ? `<div class="critbox">
    <div class="critlabel">Critical results communicated</div>
    ${(item.criticalEvents || [])
            .map((e) =>
                e.acknowledgedAt
                    ? `<div class="critline">${esc(e.parameter)} = ${esc(e.value)} — notified ${esc(e.notifiedWho || '—')} via ${esc(e.notificationMethod || '—')} on ${esc(formatWhen(e.acknowledgedAt))}.</div>`
                    : `<div class="critline" style="color:#B91C1C">${esc(e.parameter)} = ${esc(e.value)} — notification pending acknowledgement.</div>`
            )
            .join('')}
  </div>`
        : '';

    const amendmentsHtml = amended
        ? `<div class="amendbox">
    <div class="critlabel" style="color:#B45309">Amendment history</div>
    ${(item.amendments || []).map((a) => `<div class="critline">${esc(formatWhen(a.at))} — ${nl2br(a.reason)}</div>`).join('')}
  </div>`
        : '';

    const v = item.verification || {};

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Lab Report — ${esc(item.labNumber)} — ${esc(item.patientId?.name || 'Patient')}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Segoe UI', system-ui, Arial, sans-serif; color: #0F172A; background: #fff; font-size: 12px; line-height: 1.5; }
  .sheet { max-width: 760px; margin: 0 auto; padding: 8px 4px; min-height: 96vh; display: flex; flex-direction: column; }
  .head { border-bottom: 2.5px solid #00294D; padding-bottom: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .hosp { font-size: 19px; font-weight: 800; color: #00294D; }
  .tag { font-size: 10.5px; color: #475569; margin-top: 2px; }
  .addr { font-size: 10px; color: #64748B; margin-top: 4px; }
  .stamp { text-align: right; }
  .stamp .s { display: inline-block; border: 2px solid ${statusColor}; color: ${statusColor}; font-weight: 800; font-size: 11px; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 6px; }
  .stamp .lab { font-size: 12px; font-weight: 700; margin-top: 6px; }
  .pinfo { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 18px; background: #F5F8FC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 9px 12px; margin-bottom: 12px; font-size: 11px; }
  .pinfo b { color: #334155; }
  .test { margin-bottom: 14px; }
  .testhead { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; border-bottom: 1.5px solid #00294D; padding-bottom: 3px; margin-bottom: 2px; }
  .testname { font-weight: 800; font-size: 12.5px; color: #00294D; }
  .testmeta { font-size: 9.5px; color: #64748B; }
  table { width: 100%; border-collapse: collapse; margin-top: 2px; }
  th { text-align: left; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748B; border-bottom: 1px solid #CBD5E1; padding: 5px 8px; }
  td { border-bottom: 1px solid #EEF2F7; padding: 5.5px 8px; vertical-align: top; }
  td.c, th.c { text-align: center; white-space: nowrap; }
  .mono { font-variant-numeric: tabular-nums; }
  .pcomment { font-size: 10px; color: #64748B; font-style: italic; }
  .techcomment { font-size: 10.5px; color: #475569; margin-top: 4px; padding: 5px 8px; background: #F8FAFC; border-radius: 6px; }
  .critbox, .amendbox { border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px 12px; margin-top: 10px; }
  .critbox { border-color: #FCA5A5; background: #FEF2F2; }
  .amendbox { border-color: #FCD34D; background: #FFFBEB; }
  .critlabel { font-size: 9.5px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #B91C1C; margin-bottom: 3px; }
  .critline { font-size: 10.5px; color: #334155; }
  .bottom { margin-top: auto; padding-top: 16px; }
  .signrow { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin-top: 18px; }
  .qr { width: 74px; height: 74px; border: 1.5px dashed #94A3B8; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 8.5px; color: #64748B; text-align: center; flex-shrink: 0; }
  .sign { text-align: center; }
  .sign .line { width: 180px; border-bottom: 1.5px solid #334155; margin: 0 auto 5px; height: 26px; }
  .sign .who { font-weight: 700; font-size: 11.5px; }
  .sign .role { font-size: 9.5px; color: #64748B; }
  .foot { border-top: 1px solid #E2E8F0; margin-top: 12px; padding-top: 7px; text-align: center; font-size: 8.5px; color: #94A3B8; }
</style>
</head>
<body>
<div class="sheet">
  <div class="head">
    <div>
      <div class="hosp">CareConnect Diagnostics Laboratory</div>
      <div class="tag">Department of Laboratory Medicine · CareConnect Multispeciality Hospital</div>
      <div class="addr">12 MG Road, Bengaluru 560001 · +91 80 4000 1234 · lab@careconnect.example.in</div>
    </div>
    <div class="stamp">
      <span class="s">${esc(statusLabel)}</span>
      <div class="lab">${esc(item.labNumber)}</div>
    </div>
  </div>

  <div class="pinfo">
    <span><b>Patient:</b> ${esc(item.patientId?.name || '—')}</span>
    <span><b>Patient ID:</b> ${esc(item.patientId?._id || '—')}</span>
    <span><b>Lab No:</b> ${esc(item.labNumber)}</span>
    <span><b>Ordering doctor:</b> ${esc(item.orderingDoctorId?.name || '—')}</span>
    <span><b>Priority:</b> ${esc(item.priority.toUpperCase())}</span>
    <span><b>Sample ID:</b> ${esc(item._id)}</span>
    <span><b>Collected:</b> ${esc(formatWhen(item.sample?.collectedAt))}</span>
    <span><b>Reported:</b> ${esc(reportedAt)}</span>
    <span><b>Printed:</b> ${esc(printedAt)}</span>
  </div>

  ${testBlocks}
  ${criticalHtml}
  ${amendmentsHtml}

  <div class="bottom">
    <div class="signrow">
      <div class="qr">Scan to verify<br>digital report</div>
      <div class="sign">
        <div class="line"></div>
        <div class="who">${esc(v.technicalBy || '—')}</div>
        <div class="role">Medical Laboratory Technologist${v.technicalAt ? ` · ${esc(formatWhen(v.technicalAt))}` : ''}</div>
      </div>
      <div class="sign">
        <div class="line"></div>
        <div class="who">${esc(v.pathologistBy || '—')}</div>
        <div class="role">Consultant Pathologist${v.pathologistAt ? ` · ${esc(formatWhen(v.pathologistAt))}` : ''}</div>
      </div>
    </div>
    <div class="foot">
      Results relate only to the sample received. This report is electronically verified and released through CareConnect LIS.
      ▲ above reference range · ▼ below reference range · CRITICAL requires immediate clinical attention.
    </div>
  </div>
</div>
</body>
</html>`;
}
