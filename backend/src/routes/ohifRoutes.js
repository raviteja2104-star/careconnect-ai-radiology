/**
 * OHIF Viewer Integration — CareConnect
 * Serves the OHIF viewer launcher with DICOMweb config.
 * CSP is set to allow the inline scripts required by this shell page.
 */
const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const DICOMWEB_BASE = process.env.DICOMWEB_URL || 'http://localhost:5000/api/dicomweb';
const OHIF_LOCAL_BUILD = path.join(__dirname, '..', '..', '..', 'ohif-viewer', 'dist');

// ── CSP middleware for all /ohif routes ──────────────────────────────────────
router.use((req, res, next) => {
    // Prevent caching so browsers always pick up fresh CSP headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    // Allow inline scripts/styles on our own OHIF shell page.
    res.setHeader(
        'Content-Security-Policy',
        [
            "default-src 'self' http://localhost:5000 https://viewer.ohif.org",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://viewer.ohif.org",
            "script-src-attr 'unsafe-inline' 'unsafe-hashes'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "connect-src 'self' http://localhost:5000 https://viewer.ohif.org wss:",
            "frame-src 'self' https://viewer.ohif.org http://localhost:5000",
            "worker-src blob: 'self'",
        ].join('; ')
    );
    next();
});

// ── Serve OHIF app-config.js ──────────────────────────────────────────────
router.get('/app-config.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(`
window.config = {
  routerBasename: '/ohif',
  showStudyList: true,
  extensions: [],
  modes: [],
  customizationService: {},
  defaultDataSourceName: 'careconnect',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'careconnect',
      configuration: {
        friendlyName: 'CareConnect DICOMweb',
        name: 'careconnect',
        wadoUriRoot: '${DICOMWEB_BASE}/wado',
        qidoRoot: '${DICOMWEB_BASE}/rs',
        wadoRoot: '${DICOMWEB_BASE}/rs',
        qidoSupportsIncludeField: false,
        supportsReject: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        singlepart: 'bulkdata,video,pdf',
        requestOptions: { requestFromBrowser: true },
      },
    },
  ],
};
    `.trim());
});

// ── OHIF HTML shell ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
    const hasLocalBuild = fs.existsSync(path.join(OHIF_LOCAL_BUILD, 'index.html'));
    if (hasLocalBuild) return res.sendFile(path.join(OHIF_LOCAL_BUILD, 'index.html'));

    // All JS moved out of inline onclick= into a deferred <script src> equivalent.
    // The <script> block at bottom uses addEventListener — no inline handlers.
    const STUDIES = [
        {
            uid: '1.2.840.113619.2.55.3.604688119.971.1717595236.375',
            name: 'Ravi Teja — CT Head',
            meta: '25 Apr 2026 · 24 slices · Apollo Diagnostics',
            badge: 'CT', cls: 'badge-ct',
        },
        {
            uid: '1.2.840.113619.2.55.3.604688119.971.1717595236.376',
            name: 'Priya Sharma — MRI Spine',
            meta: '15 Apr 2026 · 36 slices · Yashoda Hospitals',
            badge: 'MR', cls: 'badge-mr',
        },
    ];

    const studyRows = STUDIES.map(s => `
      <div class="study-row" data-study-uid="${s.uid}" role="button" tabindex="0">
        <div class="study-info">
          <div class="study-name">${s.name}</div>
          <div class="study-meta">${s.meta}</div>
        </div>
        <span class="study-badge ${s.cls}">${s.badge}</span>
      </div>`).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CareConnect — OHIF Radiology Viewer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #0A1628; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #ohif-loading {
      position: fixed; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; background: #0A1628;
      z-index: 9999; gap: 20px;
    }
    .cc-logo { display: flex; align-items: center; gap: 14px; }
    .cc-icon {
      width: 52px; height: 52px; border-radius: 14px;
      background: linear-gradient(135deg, #00E5A0, #00B4D8);
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; font-weight: bold; color: #0A1628;
    }
    .cc-name { color: #00E5A0; font-size: 22px; font-weight: 700; letter-spacing: 0.4px; }
    .cc-sub  { color: #64748B; font-size: 13px; margin-top: 3px; }
    .study-list {
      width: min(560px, 92vw); background: #111D2E;
      border-radius: 16px; overflow: hidden;
      border: 1px solid rgba(0,229,160,0.15);
    }
    .study-header {
      padding: 14px 20px; background: rgba(0,229,160,0.07);
      border-bottom: 1px solid rgba(0,229,160,0.1);
      color: #00E5A0; font-size: 13px; font-weight: 600;
      display: flex; align-items: center; gap: 8px;
    }
    .study-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);
      cursor: pointer; transition: background 0.18s; outline: none;
    }
    .study-row:hover, .study-row:focus { background: rgba(0,229,160,0.07); }
    .study-row:last-child { border-bottom: none; }
    .study-info { display: flex; flex-direction: column; gap: 3px; }
    .study-name { color: #fff; font-size: 14px; font-weight: 600; }
    .study-meta { color: #64748B; font-size: 12px; }
    .study-badge {
      padding: 3px 10px; border-radius: 6px;
      font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
    }
    .badge-ct { background: rgba(0,180,216,0.2); color: #00B4D8; }
    .badge-mr { background: rgba(171,71,188,0.2); color: #AB47BC; }
    .badge-xr { background: rgba(0,229,160,0.2); color: #00E5A0; }
    .btn-row { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .open-btn {
      padding: 12px 32px; background: #00E5A0;
      color: #0A1628; font-weight: 700; font-size: 15px;
      border: none; border-radius: 12px; cursor: pointer;
      transition: opacity 0.2s;
    }
    .open-btn:hover { opacity: 0.85; }
    .ohif-note {
      color: #64748B; font-size: 11px; text-align: center;
      max-width: 400px; line-height: 1.65;
    }
    .ohif-note code { color: #94A3B8; background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 4px; }
    #status-text { color: #64748B; font-size: 13px; text-align: center; }
    #status-text.ok   { color: #00E5A0; }
    #status-text.warn { color: #F59E0B; }
  </style>
</head>
<body>
  <div id="ohif-loading">
    <div class="cc-logo">
      <div class="cc-icon">&#10010;</div>
      <div>
        <div class="cc-name">CareConnect Radiology</div>
        <div class="cc-sub">OHIF Viewer &mdash; Powered by DICOMweb</div>
      </div>
    </div>

    <div class="study-list">
      <div class="study-header">&#128203; Available Studies</div>
      ${studyRows}
    </div>

    <div class="btn-row">
      <button class="open-btn" id="btn-studylist">
        &#128300; Launch OHIF Viewer (Study List)
      </button>
      <p class="ohif-note">
        OHIF Viewer opens with your CareConnect DICOMweb backend.<br/>
        For real DICOM images, drop <code>.dcm</code> files into <code>backend/uploads/dicom/</code>
      </p>
    </div>

    <div id="status-text">Checking DICOMweb connection&hellip;</div>
  </div>

  <script src="/ohif/viewer.js"></script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
});

// ── External JS file — no inline handlers, CSP-safe ─────────────────────
router.get('/viewer.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(`
(function () {
  'use strict';

  var OHIF_PUBLIC   = 'https://viewer.ohif.org';
  var DICOMWEB_BASE = '${DICOMWEB_BASE}';

  function buildStudyUrl(studyUID) {
    return OHIF_PUBLIC
      + '/viewer?StudyInstanceUIDs=' + encodeURIComponent(studyUID)
      + '&wadoUriRoot=' + encodeURIComponent(DICOMWEB_BASE + '/wado')
      + '&qidoRoot='    + encodeURIComponent(DICOMWEB_BASE + '/rs')
      + '&wadoRoot='    + encodeURIComponent(DICOMWEB_BASE + '/rs');
  }

  // Wire study rows
  document.querySelectorAll('.study-row[data-study-uid]').forEach(function (row) {
    function open() { window.open(buildStudyUrl(row.dataset.studyUid), '_blank', 'noopener'); }
    row.addEventListener('click', open);
    row.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') open(); });
  });

  // Wire launch button
  var launchBtn = document.getElementById('btn-studylist');
  if (launchBtn) {
    launchBtn.addEventListener('click', function () {
      window.open(OHIF_PUBLIC + '/studylist', '_blank', 'noopener');
    });
  }

  // Backend health check
  var statusEl = document.getElementById('status-text');
  fetch('http://localhost:5000/api/dicomweb/health')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      statusEl.textContent = '\u2705 ' + d.service + ' \u2014 Online';
      statusEl.className = 'ok';
    })
    .catch(function () {
      statusEl.textContent = '\u26A0\uFE0F Backend offline \u2014 run: node backend/src/server.js';
      statusEl.className = 'warn';
    });

  // Auto-open study from URL param
  var params    = new URLSearchParams(window.location.search);
  var autoStudy = params.get('StudyInstanceUIDs');
  if (autoStudy) window.open(buildStudyUrl(autoStudy), '_blank', 'noopener');
}());
    `.trim());
});

// ── Serve local OHIF build static assets if present ───────────────────────
if (fs.existsSync(OHIF_LOCAL_BUILD)) {
    router.use('/', express.static(OHIF_LOCAL_BUILD));
}

module.exports = router;
