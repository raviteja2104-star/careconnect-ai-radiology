const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Ensure upload directories exist
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// PACS-like storage structure: uploads/pacs/{patientId}/{scanType}/{date}/
const pacsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const patientId = req.body.patientId || req.user?._id || 'unknown';
        const scanType = (req.body.scanType || 'GENERAL').toUpperCase();
        const dateStr = new Date().toISOString().split('T')[0];
        const dir = path.join(process.env.UPLOAD_DIR || './uploads', 'pacs', String(patientId), scanType, dateStr);
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueId}${ext}`);
    },
});

// File filter for medical images
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/dicom',
        'application/dicom',
        'application/octet-stream', // DICOM files sometimes come as this
        'image/tiff',
        'image/bmp',
    ];

    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.dcm')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only medical image formats are allowed.'), false);
    }
};

const uploadScan = multer({
    storage: pacsStorage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
    },
});

// General file upload (for avatars, documents, etc.)
const generalStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(process.env.UPLOAD_DIR || './uploads', 'general');
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueId}${ext}`);
    },
});

const uploadGeneral = multer({
    storage: generalStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
});

module.exports = { uploadScan, uploadGeneral, ensureDir };
