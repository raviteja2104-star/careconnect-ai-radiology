'use strict';
/**
 * Authorization Middleware Test Suite
 *
 * Tests permit() and permitAny() in isolation with a mocked PermissionService.
 * No HTTP / no server start required.
 *
 * Verifies:
 *  - AND logic (permit): ALL required permissions must be held
 *  - OR logic (permitAny): ANY one permission is sufficient
 *  - 401 when req.user is missing (unauthenticated)
 *  - 403 when user lacks required permissions (authenticated but unauthorized)
 *  - Role permission matrix: each role type is allowed/denied the correct endpoints
 *  - Stale-session behaviour: backend recalculates on every request; old session data
 *    cannot persist a revoked permission
 */

jest.mock('../../services/PermissionService', () => ({
    userHasPermissions:  jest.fn(),
    getEffectivePermissions: jest.fn(),
    ensureUserHasRole:   jest.fn().mockResolvedValue(undefined),
}));

const { userHasPermissions, getEffectivePermissions } = require('../../services/PermissionService');
const { permit, permitAny } = require('../../middleware/permit');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json   = jest.fn().mockReturnValue(res);
    return res;
}

function mockReq(userId, extra = {}) {
    return { user: { _id: userId }, ...extra };
}

// Permission sets that mirror the DEFAULT_ROLES in permissions.js
const PATIENT_PERMS = new Set([
    'PATIENT.VIEW_PROFILE', 'PATIENT.EDIT_PROFILE',
    'PATIENT.VIEW_APPOINTMENTS', 'PATIENT.BOOK_APPOINTMENT', 'PATIENT.CANCEL_APPOINTMENT',
    'PATIENT.VIEW_MEDICAL_RECORDS', 'PATIENT.UPLOAD_DOCUMENT', 'PATIENT.DOWNLOAD_MEDICAL_RECORDS',
    'PATIENT.USE_TELEMEDICINE',
    'PATIENT.VIEW_PRESCRIPTIONS',
    'PATIENT.VIEW_BILLING',
    'PATIENT.VIEW_LAB_RESULTS',
    'PATIENT.TRIGGER_EMERGENCY',
]);

const DOCTOR_PERMS = new Set([
    'DOCTOR.VIEW_PATIENTS', 'DOCTOR.VIEW_MEDICAL_RECORDS',
    'DOCTOR.EDIT_CLINICAL_NOTES', 'DOCTOR.SIGN_CLINICAL_NOTES',
    'DOCTOR.CREATE_PRESCRIPTION',
    'DOCTOR.VIEW_APPOINTMENTS', 'DOCTOR.MANAGE_APPOINTMENTS',
    'DOCTOR.START_TELEMEDICINE', 'DOCTOR.END_TELEMEDICINE',
    'DOCTOR.ORDER_LAB', 'DOCTOR.ORDER_RADIOLOGY',
    'DOCTOR.CREATE_ENCOUNTER',
    'DOCTOR.VIEW_SCHEDULE', 'DOCTOR.MANAGE_SCHEDULE',
]);

const RADIOLOGIST_PERMS = new Set([
    'RADIOLOGY.VIEW_WORKLIST', 'RADIOLOGY.VIEW_STUDIES', 'RADIOLOGY.UPLOAD_STUDY',
    'RADIOLOGY.CREATE_REPORT', 'RADIOLOGY.EDIT_REPORT', 'RADIOLOGY.FINALIZE_REPORT',
    'RADIOLOGY.VIEW_STATS',
]);

const RECEPTION_PERMS = new Set([
    'STAFF.RECEPTION', 'STAFF.MANAGE_RECORDS',
    'STAFF.VIEW_APPOINTMENTS', 'STAFF.CREATE_APPOINTMENTS', 'STAFF.CHECKIN_PATIENTS',
]);

const ADMIN_PERMS = new Set([
    'ADMIN.VIEW_USERS', 'ADMIN.CREATE_USERS', 'ADMIN.EDIT_USERS', 'ADMIN.DISABLE_USERS',
    'ADMIN.MANAGE_ROLES', 'ADMIN.MANAGE_PERMISSIONS',
    'ADMIN.GRANT_ACCESS', 'ADMIN.REVOKE_ACCESS',
    'ADMIN.VIEW_AUDIT_LOG', 'ADMIN.VIEW_DASHBOARD', 'ADMIN.VIEW_ANALYTICS',
    'ADMIN.MANAGE_SYSTEM_SETTINGS', 'ADMIN.MANAGE_PROVIDERS',
    'STAFF.VIEW_APPOINTMENTS', 'STAFF.CREATE_APPOINTMENTS',
    'STAFF.MANAGE_RECORDS',
    'STAFF.VIEW_LAB_ORDERS', 'STAFF.VIEW_PRESCRIPTIONS',
    'STAFF.BILLING', 'STAFF.CREATE_INVOICE', 'STAFF.PROCESS_PAYMENT', 'STAFF.VIEW_REVENUE',
]);

/** Configure mocks so permit/permitAny look up from a static Set. */
function withPermissions(permSet) {
    userHasPermissions.mockImplementation(async (_userId, required) =>
        required.every(p => permSet.has(p))
    );
    getEffectivePermissions.mockImplementation(async (_userId) => ({
        permissions: [...permSet],
        workspaces:  [],
    }));
}

// ─── permit() — AND logic ─────────────────────────────────────────────────────

describe('permit() — AND logic', () => {
    beforeEach(() => jest.clearAllMocks());

    it('calls next() when user holds all required permissions', async () => {
        withPermissions(DOCTOR_PERMS);
        const req  = mockReq('doctor-1');
        const res  = mockRes();
        const next = jest.fn();
        await permit('DOCTOR.VIEW_PATIENTS')(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 403 when user lacks a required permission', async () => {
        withPermissions(PATIENT_PERMS);
        const req  = mockReq('patient-1');
        const res  = mockRes();
        const next = jest.fn();
        await permit('DOCTOR.VIEW_PATIENTS')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when user lacks ANY ONE of multiple required permissions (AND)', async () => {
        // Doctor has VIEW_PATIENTS but NOT ADMIN.MANAGE_PERMISSIONS
        withPermissions(DOCTOR_PERMS);
        const req  = mockReq('doctor-1');
        const res  = mockRes();
        const next = jest.fn();
        await permit('DOCTOR.VIEW_PATIENTS', 'ADMIN.MANAGE_PERMISSIONS')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when req.user is absent (unauthenticated)', async () => {
        const req  = { user: undefined };
        const res  = mockRes();
        const next = jest.fn();
        await permit('DOCTOR.VIEW_PATIENTS')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});

// ─── permitAny() — OR logic ───────────────────────────────────────────────────

describe('permitAny() — OR logic', () => {
    beforeEach(() => jest.clearAllMocks());

    it('calls next() when user holds at least one of the candidate permissions', async () => {
        // Patient has PATIENT.VIEW_MEDICAL_RECORDS; route accepts that OR doctor perm
        withPermissions(PATIENT_PERMS);
        const req  = mockReq('patient-1');
        const res  = mockRes();
        const next = jest.fn();
        await permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'DOCTOR.VIEW_MEDICAL_RECORDS')(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('returns 403 when user holds none of the candidate permissions', async () => {
        withPermissions(PATIENT_PERMS);
        const req  = mockReq('patient-1');
        const res  = mockRes();
        const next = jest.fn();
        await permitAny('DOCTOR.VIEW_PATIENTS', 'RADIOLOGY.VIEW_WORKLIST')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when req.user is absent', async () => {
        const req  = { user: undefined };
        const res  = mockRes();
        const next = jest.fn();
        await permitAny('PATIENT.VIEW_BILLING')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});

// ─── Role permission matrix ───────────────────────────────────────────────────

describe('PATIENT role — allowed', () => {
    beforeEach(() => { jest.clearAllMocks(); withPermissions(PATIENT_PERMS); });
    const req = () => mockReq('patient-1');

    it('can access own medical records', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('PATIENT.VIEW_MEDICAL_RECORDS')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
    it('can book appointment', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('PATIENT.BOOK_APPOINTMENT')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
    it('can join telemedicine', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('PATIENT.USE_TELEMEDICINE')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
    it('can view own billing', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('PATIENT.VIEW_BILLING')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
    it('can upload documents', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('PATIENT.UPLOAD_DOCUMENT')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
});

describe('PATIENT role — denied', () => {
    beforeEach(() => { jest.clearAllMocks(); withPermissions(PATIENT_PERMS); });
    const req = () => mockReq('patient-1');

    it('cannot view doctor patient list', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('DOCTOR.VIEW_PATIENTS')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
    it('cannot access radiology worklist', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('RADIOLOGY.VIEW_WORKLIST')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
    it('cannot manage permissions (admin)', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('ADMIN.MANAGE_PERMISSIONS')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
    it('cannot create invoices (staff billing)', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('STAFF.CREATE_INVOICE')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
    it('cannot start telemedicine as doctor', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('DOCTOR.START_TELEMEDICINE')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
});

describe('DOCTOR role — allowed', () => {
    beforeEach(() => { jest.clearAllMocks(); withPermissions(DOCTOR_PERMS); });
    const req = () => mockReq('doctor-1');

    it('can view patients', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('DOCTOR.VIEW_PATIENTS')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
    it('can view and edit clinical notes', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('DOCTOR.EDIT_CLINICAL_NOTES')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
    it('can order radiology and lab', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('DOCTOR.ORDER_RADIOLOGY')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
    it('is accepted by permitAny for patient/doctor medical records', async () => {
        const res = mockRes(); const next = jest.fn();
        await permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'DOCTOR.VIEW_MEDICAL_RECORDS')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
});

describe('DOCTOR role — denied', () => {
    beforeEach(() => { jest.clearAllMocks(); withPermissions(DOCTOR_PERMS); });
    const req = () => mockReq('doctor-1');

    it('cannot access radiology worklist', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('RADIOLOGY.VIEW_WORKLIST')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
    it('cannot manage RBAC permissions', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('ADMIN.MANAGE_PERMISSIONS')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
    it('cannot view revenue dashboard', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('STAFF.VIEW_REVENUE')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
    it('cannot process billing payments', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('STAFF.PROCESS_PAYMENT')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
});

describe('RADIOLOGIST role — allowed', () => {
    beforeEach(() => { jest.clearAllMocks(); withPermissions(RADIOLOGIST_PERMS); });
    const req = () => mockReq('rad-1');

    it('can view worklist', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('RADIOLOGY.VIEW_WORKLIST')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
    it('can create and finalize reports', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('RADIOLOGY.FINALIZE_REPORT')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
    it('can view stats', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('RADIOLOGY.VIEW_STATS')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
});

describe('RADIOLOGIST role — denied', () => {
    beforeEach(() => { jest.clearAllMocks(); withPermissions(RADIOLOGIST_PERMS); });
    const req = () => mockReq('rad-1');

    it('cannot manage doctor patients', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('DOCTOR.VIEW_PATIENTS')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
    it('cannot access billing', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('STAFF.BILLING')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
    it('cannot manage RBAC permissions', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('ADMIN.MANAGE_PERMISSIONS')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
});

describe('RECEPTIONIST role — permission isolation', () => {
    beforeEach(() => { jest.clearAllMocks(); withPermissions(RECEPTION_PERMS); });
    const req = () => mockReq('reception-1');

    it('can access reception and scheduling', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('STAFF.RECEPTION')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
    it('cannot access lab functions (STAFF.LAB)', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('STAFF.LAB')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
    it('cannot access pharmacy functions', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('STAFF.PHARMACY')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
    it('cannot access emergency functions', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('STAFF.EMERGENCY')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
    it('cannot process billing payments', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('STAFF.PROCESS_PAYMENT')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
    it('cannot manage RBAC permissions', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('ADMIN.MANAGE_PERMISSIONS')(req(), res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
});

describe('HOSPITAL_ADMIN role — allowed', () => {
    beforeEach(() => { jest.clearAllMocks(); withPermissions(ADMIN_PERMS); });
    const req = () => mockReq('admin-1');

    it('can manage RBAC permissions', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('ADMIN.MANAGE_PERMISSIONS')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
    it('can view audit log', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('ADMIN.VIEW_AUDIT_LOG')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
    it('can view users', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('ADMIN.VIEW_USERS')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
    it('can manage roles', async () => {
        const res = mockRes(); const next = jest.fn();
        await permit('ADMIN.MANAGE_ROLES')(req(), res, next);
        expect(next).toHaveBeenCalled();
    });
});

// ─── Stale permission test ────────────────────────────────────────────────────

describe('Stale permissions — backend recalculates on every request', () => {
    it('revoked permission is immediately denied on the next request', async () => {
        // First request: user has DOCTOR.VIEW_PATIENTS
        userHasPermissions.mockResolvedValueOnce(true);
        const req1  = mockReq('doctor-1');
        const res1  = mockRes();
        const next1 = jest.fn();
        await permit('DOCTOR.VIEW_PATIENTS')(req1, res1, next1);
        expect(next1).toHaveBeenCalled();

        // Admin revokes the permission. Next backend call recalculates from DB.
        userHasPermissions.mockResolvedValueOnce(false);
        const req2  = mockReq('doctor-1');
        const res2  = mockRes();
        const next2 = jest.fn();
        await permit('DOCTOR.VIEW_PATIENTS')(req2, res2, next2);
        // Despite the user having had the permission before, it is now denied.
        expect(res2.status).toHaveBeenCalledWith(403);
        expect(next2).not.toHaveBeenCalled();
    });
});
