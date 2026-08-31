/**
 * OrthancClient — thin axios bridge between CareConnect and an Orthanc PACS
 * running the DICOMweb plugin (see the `orthanc` service in docker-compose.yml).
 *
 * Design:
 *   - `isReachable()` probes GET {ORTHANC_URL}/system with a short timeout and
 *     caches the result for PROBE_INTERVAL_MS (30s) so hot request paths never
 *     pay the probe cost. Concurrent callers share one in-flight probe.
 *   - `qidoStudies` / `qidoSeries` / `qidoInstances` are JSON QIDO-RS helpers.
 *   - `proxyDicomWeb` / `proxyWadoUri` stream a live Express request straight
 *     through to Orthanc (binary-safe — frames, bulkdata, STOW multipart).
 *   - `storeInstance` pushes a raw DICOM buffer via Orthanc's /instances REST
 *     endpoint (simpler than building a STOW multipart envelope server-side).
 *
 * ORTHANC_URL defaults to http://localhost:8042 (host dev). In docker-compose
 * the backend gets ORTHANC_URL=http://orthanc:8042 (service-to-service).
 */
const axios = require('axios');

const ORTHANC_URL = (process.env.ORTHANC_URL || 'http://localhost:8042').replace(/\/+$/, '');
const DICOMWEB_ROOT = '/dicom-web'; // Orthanc DicomWeb.Root (compose sets it explicitly)
const WADO_URI_ROOT = '/wado';      // Orthanc DicomWeb.WadoRoot (classic WADO-URI)

const PROBE_TIMEOUT_MS = 1500;      // fail fast — a down PACS must not stall requests
const PROBE_INTERVAL_MS = 30 * 1000; // re-probe cadence
const REQUEST_TIMEOUT_MS = 60 * 1000;

let _reachable = false;
let _lastProbeAt = 0;
let _inflightProbe = null;

/**
 * True when Orthanc answered a /system probe within the last 30s.
 * Never throws; a failed probe simply reports `false`.
 */
async function isReachable() {
    if (Date.now() - _lastProbeAt < PROBE_INTERVAL_MS) return _reachable;
    if (_inflightProbe) return _inflightProbe;

    _inflightProbe = axios
        .get(`${ORTHANC_URL}/system`, { timeout: PROBE_TIMEOUT_MS })
        .then(() => { _reachable = true; return true; })
        .catch(() => { _reachable = false; return false; })
        .finally(() => { _lastProbeAt = Date.now(); _inflightProbe = null; });

    return _inflightProbe;
}

// ── QIDO-RS helpers (application/dicom+json) ────────────────────────────────
function qidoStudies(params) {
    return axios.get(`${ORTHANC_URL}${DICOMWEB_ROOT}/studies`, {
        params, timeout: REQUEST_TIMEOUT_MS,
        headers: { Accept: 'application/dicom+json' },
    });
}

function qidoSeries(studyUID, params) {
    return axios.get(`${ORTHANC_URL}${DICOMWEB_ROOT}/studies/${encodeURIComponent(studyUID)}/series`, {
        params, timeout: REQUEST_TIMEOUT_MS,
        headers: { Accept: 'application/dicom+json' },
    });
}

function qidoInstances(studyUID, seriesUID, params) {
    return axios.get(
        `${ORTHANC_URL}${DICOMWEB_ROOT}/studies/${encodeURIComponent(studyUID)}/series/${encodeURIComponent(seriesUID)}/instances`,
        { params, timeout: REQUEST_TIMEOUT_MS, headers: { Accept: 'application/dicom+json' } }
    );
}

// ── Generic streaming passthrough ───────────────────────────────────────────
/**
 * Stream `req` to `${ORTHANC_URL}${targetPath}` and pipe Orthanc's response
 * (status + relevant headers + body) back into `res`. Binary-safe.
 * Throws BEFORE headers are sent if Orthanc cannot be contacted, so callers
 * can fall back to mock data. If the stream dies mid-flight, `res` is
 * destroyed (nothing sane can be salvaged at that point).
 */
async function proxyToOrthanc(req, res, targetPath) {
    const headers = {};
    if (req.headers.accept) headers.accept = req.headers.accept;
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
    // NOTE: the CareConnect JWT is deliberately NOT forwarded — Orthanc runs
    // with AuthenticationEnabled=false in dev (see docker-compose.yml).

    const hasBody = !['GET', 'HEAD', 'DELETE'].includes(req.method);
    const upstream = await axios({
        method: req.method,
        url: `${ORTHANC_URL}${targetPath}`,
        headers,
        data: hasBody ? req : undefined, // pipe the raw request stream (STOW multipart)
        responseType: 'stream',
        timeout: REQUEST_TIMEOUT_MS,
        maxRedirects: 0,
        validateStatus: () => true, // Orthanc's status codes are authoritative
    });

    res.status(upstream.status);
    for (const h of ['content-type', 'content-length', 'etag', 'last-modified', 'cache-control']) {
        if (upstream.headers[h]) res.setHeader(h, upstream.headers[h]);
    }
    res.setHeader('Access-Control-Allow-Origin', '*');

    upstream.data.pipe(res);
    await new Promise((resolve, reject) => {
        upstream.data.on('end', resolve);
        upstream.data.on('error', (err) => { res.destroy(); reject(err); });
    });
}

/** Proxy a DICOMweb (QIDO/WADO-RS/STOW) request. `subPath` starts after /rs and may include the query string. */
function proxyDicomWeb(req, res, subPath) {
    return proxyToOrthanc(req, res, `${DICOMWEB_ROOT}${subPath}`);
}

/** Proxy a classic WADO-URI request (?requestType=WADO&studyUID=...). */
function proxyWadoUri(req, res) {
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    return proxyToOrthanc(req, res, `${WADO_URI_ROOT}${qs}`);
}

/**
 * Upload one raw DICOM file (Buffer) via Orthanc's native /instances endpoint.
 * Resolves with Orthanc's JSON summary ({ID, ParentStudy, Status, ...}).
 */
function storeInstance(buffer) {
    return axios.post(`${ORTHANC_URL}/instances`, buffer, {
        timeout: REQUEST_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/dicom' },
        maxBodyLength: Infinity,
    }).then((r) => r.data);
}

module.exports = {
    ORTHANC_URL,
    isReachable,
    qidoStudies,
    qidoSeries,
    qidoInstances,
    proxyDicomWeb,
    proxyWadoUri,
    storeInstance,
};
