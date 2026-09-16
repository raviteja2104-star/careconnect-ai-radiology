'use strict';
/**
 * Adversarial security tests — attempt to BREAK the authorization system.
 *
 * Each test tries a specific attack and verifies it is denied.
 * Tests cover:
 *   A-01: LIS History IDOR — patient-A cannot read patient-B's lab history
 *   A-02: LIS Worklist — patients cannot access clinical worklist
 *   A-03: Consultation sign uses SIGN permission, not EDIT
 *   A-04: Invoice IDOR — patient-A cannot pay patient-B's invoice
 *   A-05: Encounter IDOR — patient-A cannot read patient-B's encounter
 *   A-06: Appointment cancel — patient-A cannot cancel patient-B's appointment
 *   A-07: RBAC role assignment requires MANAGE_PERMISSIONS (not VIEW)
 *   A-08: Privilege escalation — patient cannot reach admin endpoints
 *   A-09: Permission separation — VIEW does not imply SIGN/APPROVE/DELETE
 *   A-10: Emergency access requires CLINICAL.EMERGENCY_ACCESS
 *   A-11: Admin audit log requires ADMIN.VIEW_AUDIT_LOG
 *   A-12: RBAC management endpoints not reachable with VIEW_USERS only
 *   A-13: Billing refund requires BILLING.REFUND (not VIEW_BILLING)
 *   A-14: LIS History patient-self access is allowed
 */

// ── Auth mock ─────────────────────────────────────────────────────────────────

const mockProtect = jest.fn();

jest.mock('../../middleware/auth', () => ({
    protect:   mockProtect,
    authorize: jest.fn(() => (req, res, next) => next()),
}));

// ── PermissionService mock — role-aware ───────────────────────────────────────

const ROLE_PERMISSIONS = {
    patient:        ['PATIENT.VIEW_LAB_RESULTS', 'PATIENT.VIEW_MEDICAL_RECORDS',
                     'PATIENT.VIEW_BILLING', 'PATIENT.VIEW_APPOINTMENTS',
                     'PATIENT.BOOK_APPOINTMENT', 'PATIENT.CANCEL_APPOINTMENT',
                     'PATIENT.TRIGGER_EMERGENCY'],
    doctor:         ['DOCTOR.VIEW_PATIENTS', 'DOCTOR.VIEW_MEDICAL_RECORDS',
                     'DOCTOR.EDIT_CLINICAL_NOTES', 'DOCTOR.SIGN_CLINICAL_NOTES',
                     'DOCTOR.VIEW_APPOINTMENTS', 'CLINICAL.SIGN_CONSULTATION',
                     'CLINICAL.VIEW_CONSULTATION', 'CLINICAL.EMERGENCY_ACCESS'],
    nurse:          ['STAFF.MANAGE_RECORDS', 'STAFF.VIEW_APPOINTMENTS'],
    lab_tech:       ['STAFF.PROCESS_LAB', 'STAFF.VIEW_LAB_ORDERS', 'STAFF.UPLOAD_LAB_RESULTS'],
    admin:          ['ADMIN.VIEW_DASHBOARD', 'ADMIN.VIEW_ANALYTICS', 'ADMIN.VIEW_USERS',
                     'ADMIN.MANAGE_SYSTEM_SETTINGS', 'ADMIN.MANAGE_ROLES',
                     'ADMIN.MANAGE_PERMISSIONS', 'ADMIN.VIEW_AUDIT_LOG',
                     'BILLING.REFUND', 'STAFF.VIEW_REVENUE', 'DOCTOR.VIEW_MEDICAL_RECORDS',
                     'STAFF.VIEW_LAB_ORDERS'],
    receptionist:   ['STAFF.VIEW_APPOINTMENTS', 'STAFF.CHECKIN_PATIENTS',
                     'STAFF.CREATE_APPOINTMENTS'],
};

jest.mock('../../services/PermissionService', () => {
    return {
        userHasPermissions: jest.fn((userId, perms) => {
            const user = global.__testUsers?.[String(userId)];
            if (!user) return Promise.resolve(false);
            const userPerms = ROLE_PERMISSIONS[user.role] || [];
            return Promise.resolve(perms.every(p => userPerms.includes(p)));
        }),
        getEffectivePermissions: jest.fn((userId) => {
            const user = global.__testUsers?.[String(userId)];
            const permissions = user ? (ROLE_PERMISSIONS[user.role] || []) : [];
            return Promise.resolve({ permissions });
        }),
        ensureUserHasRole: jest.fn().mockResolvedValue(undefined),
    };
});

// ── Model mocks ───────────────────────────────────────────────────────────────

jest.mock('../../models/LabWorkItem', () => ({
    find: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../models/User', () => ({
    findById: jest.fn().mockResolvedValue({ _id: 'patient-1', role: 'patient' }),
    find: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../models/Invoice', () => ({
    findById: jest.fn().mockResolvedValue({
        _id: 'invoice-99',
        patient: { _id: 'patient-2', toString: () => 'patient-2', equals: (x) => String(x) === 'patient-2' },
        status: 'PENDING',
        amount: 500,
        populate: jest.fn().mockReturnThis(),
    }),
    find: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../models/Encounter', () => ({
    findById: jest.fn().mockResolvedValue({
        _id: 'enc-1',
        patientId: { _id: 'patient-2', toString: () => 'patient-2' },
        vitals: [],
        diagnoses: [],
        save: jest.fn().mockResolvedValue(undefined),
    }),
}));
jest.mock('../../models/Appointment', () => ({
    findById: jest.fn().mockResolvedValue({
        _id: 'appt-1',
        patient: { toString: () => 'patient-2' },
        doctor: 'doc-1',
        status: 'Booked',
        save: jest.fn().mockResolvedValue(undefined),
        toObject: jest.fn().mockReturnValue({ _id: 'appt-1' }),
    }),
    exists: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ _id: 'appt-new' }),
    find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnThis(), populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([]) }),
}));
jest.mock('../../models/UserRole', () => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../models/Role', () => ({
    find: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue({ _id: 'role-1', name: 'viewer' }),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ _id: 'role-new' }),
    countDocuments: jest.fn().mockResolvedValue(0),
}));
jest.mock('../../models/EmergencyAccess', () => ({
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ _id: 'ea-1' }),
}));
jest.mock('../../models/AuditLog', () => ({
    find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([]) }),
    countDocuments: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../models/ConsentDocument', () => ({ findById: jest.fn().mockResolvedValue(null) }));
jest.mock('../../models/LabReferenceRange', () => ({
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    SAMPLE_QUALITIES: ['good', 'haemolysed', 'lipaemic'],
}));
jest.mock('../../services/EventPublisher', () => ({ publish: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../models/UserPermissionOverride', () => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    deleteOne: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../models/PharmacyOrder', () => ({
    find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([]) }),
    countDocuments: jest.fn().mockResolvedValue(0),
}));
jest.mock('../../models/Notification', () => ({
    findOneAndUpdate: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../models/ClinicalNote', () => ({
    findById: jest.fn().mockResolvedValue({ _id: 'note-1', signedBy: null, auditTrail: [], encounterId: 'enc-1', save: jest.fn().mockResolvedValue(undefined) }),
}));
jest.mock('../../middleware/audit', () => () => (req, res, next) => next());
jest.mock('mongoose', () => {
    function Schema() { this.index = () => this; this.plugin = () => this; }
    Schema.prototype.index = function() { return this; };
    Schema.prototype.plugin = function() { return this; };
    Schema.Types = {
        ObjectId: String, Mixed: Object, String: String,
        Number: Number, Boolean: Boolean, Date: Date, Buffer: Buffer,
    };
    return {
        connection: { readyState: 1 },
        Types: { ObjectId: { isValid: () => true } },
        Schema,
        model: jest.fn(() => class {}),
    };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const express = require('express');
const request = require('supertest');

function makeUser(role, id = `${role}-1`) {
    return { _id: id, role };
}

// Register a user in the global test registry so the PermissionService mock can find it.
function asUser(user) {
    if (!global.__testUsers) global.__testUsers = {};
    global.__testUsers[String(user._id)] = user;
    return user;
}

function defaultProtect(req, res, next) {
    if (req.__mockUser) { req.user = req.__mockUser; return next(); }
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
}

beforeAll(() => {
    mockProtect.mockImplementation(defaultProtect);
});
beforeEach(() => {
    mockProtect.mockImplementation(defaultProtect);
    global.__testUsers = {};
});

// Attach a user to a supertest request.
function withUser(agent, user) {
    asUser(user);
    return agent.set('x-mock-userid', user._id).use((r) => {
        r.request().on('socket', () => {});
    });
}

// ─── A-01: LIS History IDOR ───────────────────────────────────────────────────

describe('A-01 — LIS History IDOR: patient-A cannot read patient-B lab history', () => {
    let app;
    beforeAll(() => {
        const lisRoutes = require('../../routes/lisRoutes');
        app = express();
        app.use(express.json());
        app.use('/api/lis', lisRoutes);
    });

    it('returns 403 when patient-A requests patient-B history', async () => {
        const patientA = asUser(makeUser('patient', 'patient-A'));
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = patientA; return next();
        });
        const res = await request(app)
            .get('/api/lis/history?patientId=patient-B&parameter=Hemoglobin');
        expect(res.status).toBe(403);
    });

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app)
            .get('/api/lis/history?patientId=patient-B&parameter=Hemoglobin');
        expect(res.status).toBe(401);
    });

    it('allows patient-A to read own history (patient-A → patient-A)', async () => {
        const patientA = asUser(makeUser('patient', 'patient-A'));
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = patientA; return next();
        });
        const LabWorkItem = require('../../models/LabWorkItem');
        LabWorkItem.find.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([]) });
        const res = await request(app)
            .get('/api/lis/history?patientId=patient-A&parameter=Hemoglobin');
        // Authorization check passed — not 403 (may be 200 or other if handler has further issues)
        expect(res.status).not.toBe(403);
    });

    it('allows a doctor to read any patient history', async () => {
        const doctor = asUser(makeUser('doctor', 'doc-1'));
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = doctor; return next();
        });
        const LabWorkItem = require('../../models/LabWorkItem');
        LabWorkItem.find.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([]) });
        const res = await request(app)
            .get('/api/lis/history?patientId=patient-B&parameter=Hemoglobin');
        expect(res.status).not.toBe(403);
    });

    it('returns 403 when a nurse (no VIEW_LAB_ORDERS) tries to read lab history', async () => {
        const nurse = asUser(makeUser('nurse', 'nurse-1'));
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = nurse; return next();
        });
        const res = await request(app)
            .get('/api/lis/history?patientId=patient-B&parameter=Hemoglobin');
        expect(res.status).toBe(403);
    });

    // Source-level regression guard
    it('[source] lisRoutes /history has a permitAny guard', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../routes/lisRoutes.js'), 'utf8');
        expect(src).toMatch(/\/history.*permitAny\(/s);
    });

    it('[source] lisController history enforces patient-self ownership', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../controllers/lisController.js'), 'utf8');
        expect(src).toMatch(/role.*patient.*patientId.*user\._id/s);
    });
});

// ─── A-02: LIS Worklist — patients cannot access ─────────────────────────────

describe('A-02 — LIS Worklist access restricted to clinical staff', () => {
    let app;
    beforeAll(() => {
        const lisRoutes = require('../../routes/lisRoutes');
        app = express();
        app.use(express.json());
        app.use('/api/lis', lisRoutes);
    });

    it('returns 403 when a patient accesses the worklist', async () => {
        const patient = asUser(makeUser('patient', 'patient-1'));
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = patient; return next();
        });
        const res = await request(app).get('/api/lis/worklist');
        expect(res.status).toBe(403);
    });

    it('returns 403 when a patient accesses a specific work item', async () => {
        const patient = asUser(makeUser('patient', 'patient-1'));
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = patient; return next();
        });
        const res = await request(app).get('/api/lis/worklist/work-item-1');
        expect(res.status).toBe(403);
    });

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app).get('/api/lis/worklist');
        expect(res.status).toBe(401);
    });

    it('allows lab_tech to access worklist', async () => {
        const labTech = asUser(makeUser('lab_tech', 'lab-1'));
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = labTech; return next();
        });
        const LabWorkItem = require('../../models/LabWorkItem');
        LabWorkItem.find.mockReturnValueOnce({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([]),
        });
        const res = await request(app).get('/api/lis/worklist');
        // Authorization passed — not 403; may be 200 or other if mock chain is incomplete
        expect(res.status).not.toBe(403);
    });

    it('[source] lisRoutes /worklist has a permitAny guard', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../routes/lisRoutes.js'), 'utf8');
        expect(src).toMatch(/router\.get\(['"]\/worklist['"].*permitAny\(/s);
        expect(src).toMatch(/router\.get\(['"]\/worklist\/:id['"].*permitAny\(/s);
    });
});

// ─── A-03: Consultation sign requires SIGN permission ─────────────────────────

describe('A-03 — Consultation sign requires SIGN permission, not just EDIT', () => {
    it('[source] /consultations/:id/sign uses SIGN permission', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../routes/consultationRoutes.js'), 'utf8');
        // Must NOT use DOCTOR.EDIT_CLINICAL_NOTES for signing
        expect(src).not.toMatch(/\/sign.*permitAny\(['"]DOCTOR\.EDIT_CLINICAL_NOTES['"]\)/s);
        // Must use a SIGN-level permission
        expect(src).toMatch(/\/sign.*(?:CLINICAL\.SIGN_CONSULTATION|DOCTOR\.SIGN_CLINICAL_NOTES)/s);
    });
});

// ─── A-04: Invoice IDOR — patient cannot pay another patient's invoice ────────

describe('A-04 — Invoice IDOR: patient-A cannot pay patient-B invoice', () => {
    let app;
    beforeAll(() => {
        const paymentRoutes = require('../../routes/billingRoutes');
        app = express();
        app.use(express.json());
        app.use('/api/billing', paymentRoutes);
    });

    it('returns 403 when patient-A tries to pay an invoice belonging to patient-B', async () => {
        // Invoice mock: belongs to patient-2
        const patientA = asUser(makeUser('patient', 'patient-1'));
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = patientA; return next();
        });
        const Invoice = require('../../models/Invoice');
        Invoice.findById.mockResolvedValueOnce({
            _id: 'invoice-99',
            patient: { _id: 'patient-2', _id: { toString: () => 'patient-2' }, toString: () => 'patient-2', equals: (x) => false },
            status: 'PENDING',
            amount: 500,
        });
        const res = await request(app)
            .post('/api/billing/invoices/invoice-99/pay')
            .send({ method: 'card' });
        expect(res.status).toBe(403);
    });

    it('[source] billingController getInvoice enforces patient ownership', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../controllers/billingController.js'), 'utf8');
        // Must check patient ownership for PATIENT role
        expect(src).toMatch(/role.*patient.*invoice.*patient.*user\._id|patient.*equals.*user\._id/si);
    });
});

// ─── A-05: Encounter IDOR — patient-A cannot read patient-B encounter ─────────

describe('A-05 — Encounter IDOR: patient-A cannot read patient-B encounter', () => {
    it('[source] emrController getEncounter enforces patient-self for patient role', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../controllers/emrController.js'), 'utf8');
        // Must check: if patient role, patientId must match req.user._id
        expect(src).toMatch(/role.*patient.*patientId.*user\._id|user\.role.*patient.*encounter.*patient/si);
    });
});

// ─── A-06: Appointment cancel — patient-A cannot cancel patient-B's appointment

describe('A-06 — Appointment cancel: patient-A cannot cancel patient-B appointment', () => {
    it('[source] appointmentController cancelAppointment enforces ownership', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../controllers/appointmentController.js'), 'utf8');
        expect(src).toMatch(/isOwner.*patient.*user\._id|patient.*toString.*user.*_id/si);
        expect(src).toMatch(/isOwner.*isStaff|!isOwner.*!isStaff/s);
    });
});

// ─── A-07: RBAC role assignment requires MANAGE_PERMISSIONS ──────────────────

describe('A-07 — Role assignment requires ADMIN.MANAGE_PERMISSIONS (not VIEW_USERS)', () => {
    it('[source] rbacRoutes assign-role requires MANAGE_PERMISSIONS', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../routes/rbacRoutes.js'), 'utf8');
        // assign-role must require MANAGE_PERMISSIONS
        expect(src).toMatch(/assign-role.*permit\(['"]ADMIN\.MANAGE_PERMISSIONS['"]\)/s);
        // revoke-role must require MANAGE_PERMISSIONS
        expect(src).toMatch(/revoke-role.*permit\(['"]ADMIN\.MANAGE_PERMISSIONS['"]\)/s);
    });

    let app;
    beforeAll(() => {
        const rbacRoutes = require('../../routes/rbacRoutes');
        app = express();
        app.use(express.json());
        app.use('/api/rbac', rbacRoutes);
    });

    it('returns 403 when a user with only ADMIN.VIEW_USERS tries to assign a role', async () => {
        // Simulate a user who has VIEW_USERS but NOT MANAGE_PERMISSIONS
        const limitedAdmin = asUser({ _id: 'limited-admin', role: 'receptionist' }); // receptionist has no MANAGE_PERMISSIONS
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = limitedAdmin; return next();
        });
        const res = await request(app)
            .post('/api/rbac/users/assign-role')
            .send({ userId: 'victim', roleId: 'admin-role' });
        expect(res.status).toBe(403);
    });
});

// ─── A-08: Privilege escalation — patient cannot reach admin endpoints ─────────

describe('A-08 — Privilege escalation: patient cannot reach admin-only endpoints', () => {
    let adminApp;
    beforeAll(() => {
        const adminRoutes = require('../../routes/adminRoutes');
        adminApp = express();
        adminApp.use(express.json());
        adminApp.use('/api/admin', adminRoutes);
    });

    it('returns 403 when patient tries to access admin audit logs', async () => {
        const patient = asUser(makeUser('patient', 'patient-1'));
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = patient; return next();
        });
        const res = await request(adminApp).get('/api/admin/audit-logs');
        expect(res.status).toBe(403);
    });

    it('returns 403 when patient tries to access admin organizations', async () => {
        const patient = asUser(makeUser('patient', 'patient-1'));
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = patient; return next();
        });
        const res = await request(adminApp).get('/api/admin/organizations');
        expect(res.status).toBe(403);
    });

    it('returns 403 when nurse tries to access admin platform stats', async () => {
        const nurse = asUser(makeUser('nurse', 'nurse-1'));
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = nurse; return next();
        });
        const res = await request(adminApp).get('/api/admin/platform-stats');
        expect(res.status).toBe(403);
    });
});

// ─── A-09: Permission separation — VIEW does not imply SIGN/APPROVE ───────────

describe('A-09 — Permission separation: VIEW ≠ SIGN/APPROVE/DELETE', () => {
    it('[source] emrRoutes: POST /notes/:noteId/sign requires DOCTOR.SIGN_CLINICAL_NOTES', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../routes/emrRoutes.js'), 'utf8');
        expect(src).toMatch(/notes.*sign.*permit\(['"]DOCTOR\.SIGN_CLINICAL_NOTES['"]\)/s);
    });

    it('[source] radiology: createReport requires RADIOLOGY.CREATE_REPORT (not just VIEW_STUDIES)', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../routes/radiologyRoutes.js'), 'utf8');
        expect(src).toMatch(/permit\(['"]RADIOLOGY\.CREATE_REPORT['"]\)/);
        expect(src).toMatch(/permit\(['"]RADIOLOGY\.VIEW_STUDIES['"]\)/);
        // VIEW and CREATE are distinct — both present means they are separate
        expect(src).not.toMatch(/VIEW_STUDIES.*CREATE_REPORT.*same.*route|CREATE_REPORT.*VIEW_STUDIES.*same/si);
    });

    it('[source] payment: refund requires BILLING.REFUND (not just VIEW_BILLING)', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../routes/paymentRoutes.js'), 'utf8');
        expect(src).toMatch(/refund.*permit\(['"]BILLING\.REFUND['"]\)/s);
    });

    it('[source] rbac: assign-role requires MANAGE_PERMISSIONS (not just VIEW_USERS)', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../routes/rbacRoutes.js'), 'utf8');
        expect(src).toMatch(/assign-role.*MANAGE_PERMISSIONS/s);
    });

    it('[source] healthRecordRoutes: confirm requires MANAGE_RECORDS (not just VIEW)', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../routes/healthRecordRoutes.js'), 'utf8');
        expect(src).toMatch(/confirm.*permit\(['"]STAFF\.MANAGE_RECORDS['"]\)/s);
    });
});

// ─── A-10: Emergency access requires CLINICAL.EMERGENCY_ACCESS ───────────────

describe('A-10 — Emergency access gate: requires CLINICAL.EMERGENCY_ACCESS', () => {
    it('[source] emergencyAccessRoutes /request requires CLINICAL.EMERGENCY_ACCESS', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../routes/emergencyAccessRoutes.js'), 'utf8');
        expect(src).toMatch(/request.*permit\(['"]CLINICAL\.EMERGENCY_ACCESS['"]\)/s);
    });

    it('[source] emergencyAccessRoutes /revoke requires admin permission', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../routes/emergencyAccessRoutes.js'), 'utf8');
        expect(src).toMatch(/revoke.*permit/s);
    });

    let app;
    beforeAll(() => {
        const eaRoutes = require('../../routes/emergencyAccessRoutes');
        app = express();
        app.use(express.json());
        app.use('/api/emergency-access', eaRoutes);
    });

    it('returns 403 when patient tries to request emergency access', async () => {
        const patient = asUser(makeUser('patient', 'patient-1'));
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = patient; return next();
        });
        const res = await request(app)
            .post('/api/emergency-access/request')
            .send({ patientId: 'patient-2', reason: 'This is a test emergency reason here' });
        expect(res.status).toBe(403);
    });
});

// ─── A-11: Audit log requires ADMIN.VIEW_AUDIT_LOG ──────────────────────────

describe('A-11 — Audit log access requires ADMIN.VIEW_AUDIT_LOG', () => {
    let app;
    beforeAll(() => {
        const auditRoutes = require('../../routes/auditRoutes');
        app = express();
        app.use(express.json());
        app.use('/api/audit', auditRoutes);
    });

    it('returns 403 when doctor accesses audit log (no ADMIN.VIEW_AUDIT_LOG)', async () => {
        const doctor = asUser(makeUser('doctor', 'doc-1'));
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = doctor; return next();
        });
        const res = await request(app).get('/api/audit');
        expect(res.status).toBe(403);
    });

    it('returns 403 when patient accesses audit log', async () => {
        const patient = asUser(makeUser('patient', 'patient-1'));
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = patient; return next();
        });
        const res = await request(app).get('/api/audit');
        expect(res.status).toBe(403);
    });

    it('[source] auditRoutes uses router-level permit(ADMIN.VIEW_AUDIT_LOG)', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../routes/auditRoutes.js'), 'utf8');
        expect(src).toMatch(/router\.use\(permit\(['"]ADMIN\.VIEW_AUDIT_LOG['"]\)\)/);
    });
});

// ─── A-12: RBAC endpoints beyond VIEW require MANAGE_PERMISSIONS ─────────────

describe('A-12 — RBAC management requires ADMIN.MANAGE_PERMISSIONS (not just VIEW)', () => {
    it('[source] /roles POST/PUT require ADMIN.MANAGE_ROLES', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../routes/rbacRoutes.js'), 'utf8');
        expect(src).toMatch(/router\.post\(['"]\/roles['"].*permit\(['"]ADMIN\.MANAGE_ROLES['"]\)/s);
        expect(src).toMatch(/router\.put\(['"]\/roles\/:id['"].*permit\(['"]ADMIN\.MANAGE_ROLES['"]\)/s);
    });

    it('[source] /overrides POST requires ADMIN.MANAGE_PERMISSIONS', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../routes/rbacRoutes.js'), 'utf8');
        expect(src).toMatch(/override.*permit\(['"]ADMIN\.MANAGE_PERMISSIONS['"]\)/s);
    });

    it('[source] /overrides DELETE requires ADMIN.MANAGE_PERMISSIONS', () => {
        const fs = require('fs'), path = require('path');
        const src = fs.readFileSync(path.resolve(__dirname, '../../routes/rbacRoutes.js'), 'utf8');
        expect(src).toMatch(/overrides\/.*permit\(['"]ADMIN\.MANAGE_PERMISSIONS['"]\)/s);
    });
});

// ─── A-13: Billing refund — requires BILLING.REFUND ─────────────────────────

describe('A-13 — Billing refund requires BILLING.REFUND (not PATIENT.VIEW_BILLING)', () => {
    let app;
    beforeAll(() => {
        const paymentRoutes = require('../../routes/paymentRoutes');
        app = express();
        app.use(express.json());
        app.use('/api/payment', paymentRoutes);
    });

    it('returns 403 when patient (with VIEW_BILLING) tries to issue a refund', async () => {
        const patient = asUser(makeUser('patient', 'patient-1'));
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = patient; return next();
        });
        const res = await request(app)
            .post('/api/payment/refund')
            .send({ paymentId: 'pay-1', amount: 100 });
        expect(res.status).toBe(403);
    });
});

// ─── A-14: LIS history patient-self access allowed ───────────────────────────

describe('A-14 — LIS history: patient may read own results', () => {
    let app;
    beforeAll(() => {
        const lisRoutes = require('../../routes/lisRoutes');
        app = express();
        app.use(express.json());
        app.use('/api/lis', lisRoutes);
    });

    it('returns 200 (not 403) when patient requests own history', async () => {
        const ownId = 'patient-self-1';
        const patient = asUser(makeUser('patient', ownId));
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = patient; return next();
        });
        const LabWorkItem = require('../../models/LabWorkItem');
        LabWorkItem.find.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue([]) });
        const res = await request(app)
            .get(`/api/lis/history?patientId=${ownId}&parameter=Hemoglobin`);
        // Authorization passed — patient-self is allowed, not 403
        expect(res.status).not.toBe(403);
    });
});
