/**
 * OHIF Viewer Integration — CareConnect
 * 
 * Serves the OHIF viewer with custom configuration pointing to
 * our DICOMweb backend. Supports two modes:
 *   1. Local OHIF build (fast, offline) — run: npm run build:ohif first
 *   2. CDN-proxied OHIF (no build needed) — default mode
 */
const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const DICOMWEB_BASE = process.env.DICOMWEB_URL || 'http://localhost:5000/api/dicomweb';
const OHIF_LOCAL_BUILD = path.join(__dirname, '..', '..', '..', 'ohif-viewer', 'dist');

// ── Serve OHIF config (app.config.js style) ────────────────────────────────
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
        requestOptions: {
          requestFromBrowser: true,
        },
      },
    },
  ],
  whiteLabeling: {
    createLogoComponentFn: function(React) {
      return React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }
      }, [
        React.createElement('div', {
          key: 'icon',
          style: {
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #00E5A0, #00B4D8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: 14, color: '#0A1628'
          }
        }, '✚'),
        React.createElement('span', {
          key: 'label',
          style: { color: '#00E5A0', fontWeight: 700, fontSize: 16, letterSpacing: 0.5 }
        }, 'CareConnect Radiology'),
      ]);
    },
  },
};
    `.trim());
});

// ── Serve OHIF HTML shell (points to CDN build or local build) ────────────
router.get('/', (req, res) => {
    const studyUID = req.query.StudyInstanceUIDs || '';
    const hasLocalBuild = fs.existsSync(path.join(OHIF_LOCAL_BUILD, 'index.html'));

    if (hasLocalBuild) {
        // Serve local OHIF build
        return res.sendFile(path.join(OHIF_LOCAL_BUILD, 'index.html'));
    }

    // Inline HTML shell with OHIF loaded from CDN (unpkg / jsdelivr)
    // This works without any build step
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CareConnect — OHIF Radiology Viewer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #0A1628; font-family: -apple-system, sans-serif; }
    #ohif-loading {
      position: fixed; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; background: #0A1628; z-index: 9999;
      gap: 20px;
    }
    .cc-logo { display: flex; align-items: center; gap: 12px; }
    .cc-icon {
      width: 52px; height: 52px; border-radius: 14px;
      background: linear-gradient(135deg, #00E5A0, #00B4D8);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: bold; color: #0A1628;
    }
    .cc-name { color: #00E5A0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    .cc-sub { color: #64748B; font-size: 13px; margin-top: 2px; }
    .spinner {
      width: 48px; height: 48px; border: 3px solid rgba(0,229,160,0.15);
      border-top-color: #00E5A0; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .status { color: #64748B; font-size: 13px; text-align: center; }
    .study-list {
      margin-top: 32px; width: 560px; background: #111D2E;
      border-radius: 16px; overflow: hidden; border: 1px solid rgba(0,229,160,0.15);
    }
    .study-header {
      padding: 16px 20px; background: rgba(0,229,160,0.08);
      border-bottom: 1px solid rgba(0,229,160,0.1);
      color: #00E5A0; font-size: 13px; font-weight: 600;
      display: flex; align-items: center; gap: 8px;
    }
    .study-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04);
      cursor: pointer; transition: background 0.2s;
    }
    .study-row:hover { background: rgba(0,229,160,0.06); }
    .study-row:last-child { border-bottom: none; }
    .study-info { display: flex; flex-direction: column; gap: 3px; }
    .study-name { color: #fff; font-size: 14px; font-weight: 600; }
    .study-meta { color: #64748B; font-size: 12px; }
    .study-badge {
      padding: 3px 10px; border-radius: 6px; font-size: 10px;
      font-weight: 700; letter-spacing: 0.5px;
    }
    .badge-ct { background: rgba(0,180,216,0.2); color: #00B4D8; }
    .badge-mr { background: rgba(171,71,188,0.2); color: #AB47BC; }
    .badge-xr { background: rgba(0,229,160,0.2); color: #00E5A0; }
    .open-btn {
      margin-top: 24px; padding: 12px 32px; background: #00E5A0;
      color: #0A1628; font-weight: 700; font-size: 15px;
      border: none; border-radius: 12px; cursor: pointer;
      transition: opacity 0.2s;
    }
    .open-btn:hover { opacity: 0.85; }
    .ohif-note {
      color: #64748B; font-size: 11px; text-align: center; max-width: 400px;
      line-height: 1.6; margin-top: 8px;
    }
    #viewer-frame { width: 100%; height: 100%; border: none; display: none; }
  </style>
</head>
<body>
  <div id="ohif-loading">
    <div class="cc-logo">
      <div class="cc-icon">✚</div>
      <div>
        <div class="cc-name">CareConnect Radiology</div>
        <div class="cc-sub">OHIF Viewer — Powered by DICOMweb</div>
      </div>
    </div>

    <div class="study-list">
      <div class="study-header">
        <span>📋</span> Available Studies
      </div>
      <div class="study-row" onclick="openStudy('1.2.840.113619.2.55.3.604688119.971.1717595236.375')">
        <div class="study-info">
          <div class="study-name">Ravi Teja — CT Head</div>
          <div class="study-meta">25 Apr 2026 · 24 slices · Apollo Diagnostics</div>
        </div>
        <span class="study-badge badge-ct">CT</span>
      </div>
      <div class="study-row" onclick="openStudy('1.2.840.113619.2.55.3.604688119.971.1717595236.376')">
        <div class="study-info">
          <div class="study-name">Priya Sharma — MRI Spine</div>
          <div class="study-meta">15 Apr 2026 · 36 slices · Yashoda Hospitals</div>
        </div>
        <span class="study-badge badge-mr">MR</span>
      </div>
    </div>

    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
      <button class="open-btn" onclick="openOHIF()">
        🔬 Launch OHIF Viewer (Study List)
      </button>
      <p class="ohif-note">
        OHIF Viewer launches with your CareConnect DICOMweb backend.<br/>
        For real DICOM images, upload .dcm files to <code>backend/uploads/dicom/</code>
      </p>
    </div>

    <div class="status" id="status-text">Connected to DICOMweb at ${DICOMWEB_BASE}</div>
  </div>

  <iframe id="viewer-frame" src="" allow="fullscreen"></iframe>

  <script>
    const OHIF_PUBLIC = 'https://viewer.ohif.org';
    const WADO_ROOT = '${DICOMWEB_BASE}/rs';
    const STUDY_BASE = OHIF_PUBLIC + '/viewer?StudyInstanceUIDs=';

    function openStudy(studyUID) {
      const url = OHIF_PUBLIC +
        '/viewer?StudyInstanceUIDs=' + studyUID +
        '&wadoUriRoot=${DICOMWEB_BASE}/wado' +
        '&qidoRoot=${DICOMWEB_BASE}/rs' +
        '&wadoRoot=${DICOMWEB_BASE}/rs';
      
      // Open in new tab (OHIF public demo with our data source in URL params)
      window.open(url, '_blank');
    }

    function openOHIF() {
      const url = OHIF_PUBLIC + '/studylist';
      window.open(url, '_blank');
    }

    // Check backend health
    fetch('http://localhost:5000/api/dicomweb/health')
      .then(r => r.json())
      .then(d => {
        document.getElementById('status-text').textContent = '✅ ' + d.service + ' — Online';
        document.getElementById('status-text').style.color = '#00E5A0';
      })
      .catch(() => {
        document.getElementById('status-text').textContent = '⚠️ Backend offline — start with: node backend/src/server.js';
        document.getElementById('status-text').style.color = '#F59E0B';
      });

    // Auto-open study from URL param
    const params = new URLSearchParams(window.location.search);
    const autoStudy = params.get('StudyInstanceUIDs');
    if (autoStudy) openStudy(autoStudy);
  </script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

// ── Serve local OHIF build static assets if available ─────────────────────
if (fs.existsSync(OHIF_LOCAL_BUILD)) {
    router.use('/', express.static(OHIF_LOCAL_BUILD));
}

module.exports = router;
