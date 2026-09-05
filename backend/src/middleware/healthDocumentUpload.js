const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * healthDocumentUpload — storage for CareConnect Health Record Capture
 * scans/uploads.
 *
 * SECURITY NOTE (deliberately NOT reusing middleware/upload.js's storage
 * root): `backend/src/server.js` mounts `app.use('/uploads', express.static(
 * path.join(__dirname, '..', 'uploads')))` — EVERYTHING under `uploads/` is
 * already served to the public with no auth check (that's how radiology
 * scans and general uploads work today). Health documents must never be
 * reachable that way (spec: "Never expose medical documents through public
 * URLs"), so they're stored under a SEPARATE root
 * (`SECURE_UPLOAD_DIR`, default `./uploads-secure`) that the static
 * middleware never touches. The only way to read a page back is
 * `GET /api/health-records/documents/:id/pages/:pageNumber/file`
 * (healthDocumentController.getPageFile), which checks
 * patient/caregiver/clinical-staff authorization before streaming the file
 * from disk — see that controller for the enforcement point.
 */

const SECURE_ROOT = process.env.SECURE_UPLOAD_DIR || path.join(process.cwd(), 'uploads-secure');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/tiff', 'image/bmp',
    'application/pdf',
];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // patientId is validated/authorized in the controller BEFORE the file
        // is attached to any record — this path segment is just storage
        // layout, not an access-control decision.
        const patientId = req.body.patientId || 'pending';
        const dateStr = new Date().toISOString().split('T')[0];
        const dir = path.join(SECURE_ROOT, 'health-documents', String(patientId), dateStr);
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}${path.extname(file.originalname || '')}`);
    },
});

function fileFilter(req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported file type "${file.mimetype}". Allowed: images (jpeg/png/webp/heic/tiff/bmp) or PDF.`), false);
}

const uploadHealthDocument = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024, files: 15 }, // 20MB/page, up to 15 pages
});

/** sha256 of a file already written to disk — for HealthDocument.pages[].checksum. */
function checksumFile(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

module.exports = { uploadHealthDocument, checksumFile, SECURE_ROOT };
