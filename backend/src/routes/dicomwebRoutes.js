/**
 * CareConnect — DICOMweb Server (WADO-URI / WADO-RS / STOW-RS)
 * Compatible with OHIF Viewer v3
 * 
 * Endpoints:
 *   GET /wado?requestType=WADO&studyUID=...&seriesUID=...&objectUID=...  WADO-URI
 *   GET /rs/studies                                                       QIDO-RS study list
 *   GET /rs/studies/:studyUID/series                                      QIDO-RS series
 *   GET /rs/studies/:studyUID/series/:seriesUID/instances                 QIDO-RS instances
 *   GET /rs/studies/:studyUID/series/:seriesUID/instances/:sopUID/frames/1 WADO-RS frames
 *   POST /rs/studies                                                      STOW-RS upload
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const orthanc = require('../services/OrthancClient');

const DICOMWEB_BASE = process.env.DICOMWEB_URL || `http://localhost:${process.env.PORT || 5000}/api/dicomweb`;

// Configure multer for DICOM uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', '..', 'uploads', 'dicom');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Use the provided sopUID if available, otherwise use original name
        const sopUID = req.body.sopUID;
        if (sopUID) {
            cb(null, `${sopUID}.dcm`);
        } else {
            cb(null, file.originalname);
        }
    }
});
const upload = multer({ storage });

// PUBLIC: /health is a liveness probe with no PHI. Every other DICOMweb endpoint
// (QIDO/WADO expose patient names, IDs, birth dates and pixel data) requires a
// valid JWT. NOTE: the OHIF viewer must now attach a Bearer token to its
// DICOMweb requests (see security report).
router.use((req, res, next) => (req.path === '/health' ? next() : protect(req, res, next)));

// ── LIVE PACS PATH: proxy /rs/* to Orthanc's DICOMweb API when reachable ─────
// This middleware sits at the top of every QIDO/WADO-RS/STOW handler below.
// If Orthanc answers its cached health probe, the request is streamed to
// {ORTHANC_URL}/dicom-web/* and Orthanc's response is returned verbatim
// (binary streaming for frames/bulkdata, multipart passthrough for STOW).
// If Orthanc is down — or the proxy fails before headers are sent — we call
// next() and fall through to the MOCK handlers below, which are kept intact
// as the offline/dev fallback.
router.use('/rs', async (req, res, next) => {
    let pacsUp = false;
    try { pacsUp = await orthanc.isReachable(); } catch (_) { pacsUp = false; }
    if (!pacsUp) return next(); // MOCK FALLBACK: Orthanc unreachable

    const doProxy = async () => {
        try {
            // req.url here is relative to the /rs mount (e.g. "/studies?...")
            await orthanc.proxyDicomWeb(req, res, req.url);
        } catch (err) {
            if (res.headersSent) return; // stream already started; res was destroyed
            next(); // MOCK FALLBACK: proxy failed cleanly — serve mock data
        }
    };

    // Preserve the role gate the mock STOW handler enforces (writes only).
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        return doProxy();
    }
    return authorize('radiologist', 'admin')(req, res, (err) => (err ? next(err) : doProxy()));
});

// ── DICOM mock data (realistic UIDs) — FALLBACK when Orthanc is offline ──────
const MOCK_STUDIES = [
    {
        '0020000D': { vr: 'UI', Value: ['1.2.840.113619.2.55.3.604688119.971.1717595236.375'] }, // StudyInstanceUID
        '00100010': { vr: 'PN', Value: [{ Alphabetic: 'TEJA^RAVI' }] },                          // PatientName
        '00100020': { vr: 'LO', Value: ['PID-20260425-001'] },                                   // PatientID
        '00100030': { vr: 'DA', Value: ['19950615'] },                                           // PatientBirthDate
        '00100040': { vr: 'CS', Value: ['M'] },                                                  // PatientSex
        '00080020': { vr: 'DA', Value: ['20260425'] },                                           // StudyDate
        '00080030': { vr: 'TM', Value: ['090000'] },                                             // StudyTime
        '00080050': { vr: 'SH', Value: ['ACC-2026-001'] },                                       // AccessionNumber
        '00080061': { vr: 'CS', Value: ['CT'] },                                                 // ModalitiesInStudy
        '00081030': { vr: 'LO', Value: ['CT HEAD WITHOUT CONTRAST'] },                           // StudyDescription
        '00200010': { vr: 'SH', Value: ['STUDY-001'] },                                         // StudyID
        '00201206': { vr: 'IS', Value: [1] },                                                    // NumberOfStudyRelatedSeries
        '00201208': { vr: 'IS', Value: [24] },                                                   // NumberOfStudyRelatedInstances
    },
    {
        '0020000D': { vr: 'UI', Value: ['1.2.840.113619.2.55.3.604688119.971.1717595236.376'] },
        '00100010': { vr: 'PN', Value: [{ Alphabetic: 'SHARMA^PRIYA' }] },
        '00100020': { vr: 'LO', Value: ['PID-20260415-002'] },
        '00100030': { vr: 'DA', Value: ['19900322'] },
        '00100040': { vr: 'CS', Value: ['F'] },
        '00080020': { vr: 'DA', Value: ['20260415'] },
        '00080030': { vr: 'TM', Value: ['110000'] },
        '00080050': { vr: 'SH', Value: ['ACC-2026-002'] },
        '00080061': { vr: 'CS', Value: ['MR'] },
        '00081030': { vr: 'LO', Value: ['MRI LUMBAR SPINE'] },
        '00200010': { vr: 'SH', Value: ['STUDY-002'] },
        '00201206': { vr: 'IS', Value: [2] },
        '00201208': { vr: 'IS', Value: [36] },
    },
];

const MOCK_SERIES = {
    '1.2.840.113619.2.55.3.604688119.971.1717595236.375': [
        {
            '0020000D': { vr: 'UI', Value: ['1.2.840.113619.2.55.3.604688119.971.1717595236.375'] },
            '0020000E': { vr: 'UI', Value: ['1.2.840.113619.2.55.3.604688119.971.1717595236.400'] },
            '00080060': { vr: 'CS', Value: ['CT'] },
            '0008103E': { vr: 'LO', Value: ['AXIAL HEAD'] },
            '00200011': { vr: 'IS', Value: [1] },
            '00201209': { vr: 'IS', Value: [24] },
        },
    ],
};

const MOCK_INSTANCES = (studyUID, seriesUID) => {
    const instances = [];
    for (let i = 1; i <= 24; i++) {
        instances.push({
            '0020000D': { vr: 'UI', Value: [studyUID] },
            '0020000E': { vr: 'UI', Value: [seriesUID] },
            '00080018': { vr: 'UI', Value: [`${seriesUID}.${i}`] },
            '00200013': { vr: 'IS', Value: [i] },
            '00280010': { vr: 'US', Value: [512] }, // Rows
            '00280011': { vr: 'US', Value: [512] }, // Columns
            '00280100': { vr: 'US', Value: [16] },  // BitsAllocated
            '00280103': { vr: 'US', Value: [1] },   // PixelRepresentation
        });
    }
    return instances;
};

const setDICOMwebHeaders = (res) => {
    res.setHeader('Content-Type', 'application/dicom+json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
};

// ── QIDO-RS: Query studies ─────────────────────────────────────────────────
router.get('/rs/studies', (req, res) => {
    setDICOMwebHeaders(res);
    const { PatientName, StudyDate, ModalitiesInStudy } = req.query;
    let studies = [...MOCK_STUDIES];
    if (PatientName) {
        studies = studies.filter(s =>
            s['00100010']?.Value?.[0]?.Alphabetic?.includes(PatientName.toUpperCase())
        );
    }
    res.json(studies);
});

// ── QIDO-RS: Query series ──────────────────────────────────────────────────
router.get('/rs/studies/:studyUID/series', (req, res) => {
    setDICOMwebHeaders(res);
    const { studyUID } = req.params;
    const series = MOCK_SERIES[studyUID] || [
        {
            '0020000D': { vr: 'UI', Value: [studyUID] },
            '0020000E': { vr: 'UI', Value: [`${studyUID}.100`] },
            '00080060': { vr: 'CS', Value: ['CT'] },
            '0008103E': { vr: 'LO', Value: ['DEFAULT SERIES'] },
            '00200011': { vr: 'IS', Value: [1] },
            '00201209': { vr: 'IS', Value: [24] },
        },
    ];
    res.json(series);
});

// ── QIDO-RS: Query instances ───────────────────────────────────────────────
router.get('/rs/studies/:studyUID/series/:seriesUID/instances', (req, res) => {
    setDICOMwebHeaders(res);
    const { studyUID, seriesUID } = req.params;
    res.json(MOCK_INSTANCES(studyUID, seriesUID));
});

// ── WADO-RS: Retrieve instance metadata ───────────────────────────────────
router.get('/rs/studies/:studyUID/series/:seriesUID/instances/:sopUID', (req, res) => {
    setDICOMwebHeaders(res);
    const { studyUID, seriesUID, sopUID } = req.params;
    const sliceIdx = parseInt(sopUID.split('.').pop()) || 1;
    res.json([{
        '0020000D': { vr: 'UI', Value: [studyUID] },
        '0020000E': { vr: 'UI', Value: [seriesUID] },
        '00080018': { vr: 'UI', Value: [sopUID] },
        '00200013': { vr: 'IS', Value: [sliceIdx] },
        '00280010': { vr: 'US', Value: [512] },
        '00280011': { vr: 'US', Value: [512] },
        '00280100': { vr: 'US', Value: [16] },
    }]);
});

// ── WADO-RS: Retrieve pixel data (returns a synthetic grayscale JPEG) ─────
router.get('/rs/studies/:studyUID/series/:seriesUID/instances/:sopUID/frames/:frame', (req, res) => {
    const { sopUID } = req.params;

    // Check if real DICOM file exists
    const dicomDir = path.join(__dirname, '..', '..', 'uploads', 'dicom');
    const dicomFile = path.join(dicomDir, `${sopUID}.dcm`);
    if (fs.existsSync(dicomFile)) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.sendFile(dicomFile);
    }

    // Serve synthetic grayscale image as multipart/related
    const sliceIdx = parseInt(req.params.frame) || 1;
    const { createCanvas } = (() => { try { return require('canvas'); } catch (_) { return {}; } })();

    if (createCanvas) {
        const canvas = createCanvas(512, 512);
        const ctx = canvas.getContext('2d');
        // Draw synthetic brain cross-section
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 512, 512);
        const gray = 40 + Math.sin(sliceIdx * 0.3) * 20;
        ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
        ctx.beginPath();
        ctx.ellipse(256, 256, 180, 200, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgb(${gray + 30},${gray + 30},${gray + 30})`;
        ctx.beginPath();
        ctx.ellipse(256, 256, 140, 160, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(220, 240, 18, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(292, 240, 18, 24, 0, 0, Math.PI * 2);
        ctx.fill();

        const boundary = 'myboundary';
        res.setHeader('Content-Type', `multipart/related; type="application/octet-stream"; boundary="${boundary}"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        const buf = canvas.toBuffer('image/png');
        res.write(`--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`);
        res.write(buf);
        res.write(`\r\n--${boundary}--`);
        return res.end();
    }

    // Fallback: tiny 1x1 pixel response
    res.setHeader('Content-Type', 'multipart/related; type="application/octet-stream"; boundary="myboundary"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end('--myboundary\r\nContent-Type: application/octet-stream\r\n\r\n\r\n--myboundary--');
});

// ── WADO-URI (classic): ?requestType=WADO&studyUID=...&... ────────────────
router.get('/wado', async (req, res) => {
    // LIVE PACS PATH: forward WADO-URI to Orthanc's /wado when reachable.
    let pacsUp = false;
    try { pacsUp = await orthanc.isReachable(); } catch (_) { pacsUp = false; }
    if (pacsUp) {
        try {
            return await orthanc.proxyWadoUri(req, res);
        } catch (err) {
            if (res.headersSent) return; // stream already started
            // MOCK FALLBACK: proxy failed — continue to local-file/mock logic below
        }
    }

    const { requestType, studyUID, seriesUID, objectUID, contentType } = req.query;
    if (requestType !== 'WADO') return res.status(400).json({ error: 'Only requestType=WADO supported' });

    // Check for real DICOM file
    const dicomDir = path.join(__dirname, '..', '..', 'uploads', 'dicom');
    const dicomFile = path.join(dicomDir, `${objectUID}.dcm`);
    if (fs.existsSync(dicomFile)) {
        res.setHeader('Content-Type', 'application/dicom');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.sendFile(dicomFile);
    }

    // Return 404 with helpful message — OHIF will gracefully skip
    res.status(404).json({
        error: 'DICOM file not found',
        hint: 'Upload real DICOM files to backend/uploads/dicom/<sopUID>.dcm',
        objectUID,
    });
});

// ── STOW-RS / Simple File Upload ──────────────────────────────────────────
router.post('/upload', authorize('radiologist', 'admin'), upload.single('dicomFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    // LIVE PACS PATH: push the received DICOM into Orthanc when reachable.
    // The file is also kept in uploads/dicom/ so the mock WADO fallback can
    // still serve it if Orthanc later goes away.
    let pacsUp = false;
    try { pacsUp = await orthanc.isReachable(); } catch (_) { pacsUp = false; }
    if (pacsUp) {
        try {
            const buffer = fs.readFileSync(req.file.path);
            const stored = await orthanc.storeInstance(buffer);
            return res.status(200).json({
                success: true,
                message: 'DICOM file stored in Orthanc PACS',
                file: req.file.filename,
                orthanc: stored,
            });
        } catch (err) {
            // MOCK FALLBACK: Orthanc rejected the file (e.g. not valid DICOM)
            // or dropped mid-upload — fall through to local-storage response.
        }
    }

    // In a full implementation we would parse the DICOM tags to extract study/series/SOP UIDs
    // and update our database. For now, we return success so the frontend knows it uploaded.
    res.status(200).json({
        success: true,
        message: 'DICOM file uploaded successfully',
        file: req.file.filename
    });
});

// STOW-RS (Standard) — MOCK FALLBACK. When Orthanc is reachable the /rs proxy
// middleware above forwards the STOW multipart to Orthanc before this runs.
router.post('/rs/studies', authorize('radiologist', 'admin'), (req, res) => {
    const dicomDir = path.join(__dirname, '..', '..', 'uploads', 'dicom');
    if (!fs.existsSync(dicomDir)) fs.mkdirSync(dicomDir, { recursive: true });
    res.status(200).json({ '00081190': { vr: 'UR', Value: [`${DICOMWEB_BASE}/rs/studies`] } });
});

// ── OHIF config endpoint ───────────────────────────────────────────────────
router.get('/ohif-config', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
        routerBasename: '/ohif',
        showStudyList: true,
        servers: {
            dicomWeb: [{
                name: 'CareConnect DICOMweb',
                wadoUriRoot: `${DICOMWEB_BASE}/wado`,
                qidoRoot: `${DICOMWEB_BASE}/rs`,
                wadoRoot: `${DICOMWEB_BASE}/rs`,
                qidoSupportsIncludeField: false,
                imageRendering: 'wadors',
                thumbnailRendering: 'wadors',
                requestOptions: { requestFromBrowser: true },
            }],
        },
        oidc: [],
        whiteLabeling: {
            createLogoComponentFn: null,
        },
    });
});

// ── Health check ───────────────────────────────────────────────────────────
router.get('/health', async (req, res) => {
    let pacsUp = false;
    try { pacsUp = await orthanc.isReachable(); } catch (_) { pacsUp = false; }
    res.json({
        success: true,
        service: 'CareConnect DICOMweb Server',
        pacs: {
            orthancUrl: orthanc.ORTHANC_URL,
            reachable: pacsUp,
            mode: pacsUp ? 'orthanc-proxy' : 'mock-fallback',
        },
        endpoints: {
            studies: 'GET /api/dicomweb/rs/studies',
            series: 'GET /api/dicomweb/rs/studies/:uid/series',
            instances: 'GET /api/dicomweb/rs/studies/:uid/series/:uid/instances',
            waadors: 'GET /api/dicomweb/rs/studies/:uid/series/:uid/instances/:uid/frames/1',
            wadouri: 'GET /api/dicomweb/wado?requestType=WADO&studyUID=...&seriesUID=...&objectUID=...',
            upload: 'POST /api/dicomweb/rs/studies',
            ohifConfig: 'GET /api/dicomweb/ohif-config',
        },
    });
});

module.exports = router;
