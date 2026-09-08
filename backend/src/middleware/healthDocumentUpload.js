const multer = require('multer');
const crypto = require('crypto');

const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'image/tiff', 'image/bmp', 'application/pdf',
];

function fileFilter(req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported file type "${file.mimetype}". Allowed: images (jpeg/png/webp/heic/tiff/bmp) or PDF.`), false);
}

// Files land in memory; the controller uploads them to S3 and writes checksum from buffer.
const uploadHealthDocument = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024, files: 15 },
});

function checksumBuffer(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

// S3 key prefix for health documents.
// Old code exported SECURE_ROOT; now health documents are stored on S3 under this prefix.
const S3_HEALTH_PREFIX = 'health-documents';

module.exports = { uploadHealthDocument, checksumBuffer, S3_HEALTH_PREFIX };
