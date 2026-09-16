const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { s3, BUCKET } = require('../lib/s3');

function makeStorage(keyFn) {
    if (s3 && BUCKET) {
        return multerS3({
            s3,
            bucket: BUCKET,
            serverSideEncryption: 'AES256',
            key: keyFn,
            contentType: multerS3.AUTO_CONTENT_TYPE,
        });
    }
    // Local dev fallback — files land in memory (not saved to disk)
    return multer.memoryStorage();
}

const SCAN_MIME_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/dicom', 'application/dicom',
    'image/tiff', 'image/bmp',
]);

const GENERAL_ALLOWED_MIMES = new Set([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
]);

const uploadScan = multer({
    storage: makeStorage((req, file, cb) => {
        const patientId = req.body.patientId || req.user?._id || 'unknown';
        const scanType = (req.body.scanType || 'GENERAL').toUpperCase().replace(/\s+/g, '_');
        const date = new Date().toISOString().split('T')[0];
        const ext = path.extname(file.originalname).toLowerCase() || '.bin';
        cb(null, `pacs/${patientId}/${scanType}/${date}/${uuidv4()}${ext}`);
    }),
    fileFilter: (req, file, cb) => {
        if (SCAN_MIME_TYPES.has(file.mimetype) || file.originalname.endsWith('.dcm')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only medical image formats are allowed.'), false);
        }
    },
    limits: { fileSize: 100 * 1024 * 1024 },
});

const uploadGeneral = multer({
    storage: makeStorage((req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.bin';
        cb(null, `general/${uuidv4()}${ext}`);
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (GENERAL_ALLOWED_MIMES.has(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type '${file.mimetype}' is not allowed.`));
        }
    },
});

module.exports = { uploadScan, uploadGeneral };
