/**
 * CareConnect — Granular RBAC Permission Catalogue
 *
 * Every protected action in the system maps to one entry here.
 * Middleware uses these strings to gate API routes.
 * The Admin UI groups them by workspace/section for display.
 */

const PERMISSIONS = {
    // ── Patient workspace ─────────────────────────────────────────────────────
    'PATIENT.VIEW_PROFILE':             'View own profile',
    'PATIENT.EDIT_PROFILE':             'Edit own profile',
    'PATIENT.VIEW_APPOINTMENTS':        'View own appointments',
    'PATIENT.BOOK_APPOINTMENT':         'Book new appointments',
    'PATIENT.CANCEL_APPOINTMENT':       'Cancel own appointments',
    'PATIENT.VIEW_MEDICAL_RECORDS':     'View own medical records',
    'PATIENT.UPLOAD_DOCUMENT':          'Upload own health documents',
    'PATIENT.DOWNLOAD_MEDICAL_RECORDS': 'Download medical records',
    'PATIENT.USE_TELEMEDICINE':         'Join telemedicine sessions',
    'PATIENT.VIEW_PRESCRIPTIONS':       'View own prescriptions',
    'PATIENT.VIEW_BILLING':             'View own billing / invoices',
    'PATIENT.VIEW_LAB_RESULTS':         'View own lab results',
    'PATIENT.TRIGGER_EMERGENCY':        'Trigger emergency SOS',

    // ── Doctor workspace ──────────────────────────────────────────────────────
    'DOCTOR.VIEW_PATIENTS':             'View assigned patient list',
    'DOCTOR.VIEW_MEDICAL_RECORDS':      'View patient medical records',
    'DOCTOR.EDIT_CLINICAL_NOTES':       'Create and edit clinical notes',
    'DOCTOR.SIGN_CLINICAL_NOTES':       'Digitally sign clinical notes',
    'DOCTOR.CREATE_PRESCRIPTION':       'Write prescriptions',
    'DOCTOR.VIEW_APPOINTMENTS':         'View own appointment schedule',
    'DOCTOR.MANAGE_APPOINTMENTS':       'Reschedule or cancel appointments',
    'DOCTOR.START_TELEMEDICINE':        'Start telemedicine sessions',
    'DOCTOR.END_TELEMEDICINE':          'End telemedicine sessions',
    'DOCTOR.ORDER_LAB':                 'Order laboratory tests',
    'DOCTOR.ORDER_RADIOLOGY':           'Order radiology studies',
    'DOCTOR.CREATE_ENCOUNTER':          'Create clinical encounters',
    'DOCTOR.VIEW_SCHEDULE':             'View doctor schedules',
    'DOCTOR.MANAGE_SCHEDULE':           'Edit own availability schedule',

    // ── Radiology workspace ───────────────────────────────────────────────────
    'RADIOLOGY.VIEW_WORKLIST':          'View radiology worklist',
    'RADIOLOGY.VIEW_STUDIES':           'Open and view DICOM studies',
    'RADIOLOGY.UPLOAD_STUDY':           'Upload radiology studies',
    'RADIOLOGY.CREATE_REPORT':          'Draft radiology reports',
    'RADIOLOGY.EDIT_REPORT':            'Edit radiology reports',
    'RADIOLOGY.FINALIZE_REPORT':        'Sign and finalize radiology reports',
    'RADIOLOGY.ASSIGN_RADIOLOGIST':     'Assign studies to radiologists',
    'RADIOLOGY.VIEW_STATS':             'View radiology throughput statistics',

    // ── Hospital Staff — Records / HIM ───────────────────────────────────────
    'STAFF.MANAGE_RECORDS':             'Manage patient health record documents',

    // ── Hospital Staff — Reception ────────────────────────────────────────────
    'STAFF.RECEPTION':                  'Access front-desk / reception functions',
    'STAFF.VIEW_APPOINTMENTS':          'View hospital-wide appointment list',
    'STAFF.CREATE_APPOINTMENTS':        'Create appointments on behalf of patients',
    'STAFF.CHECKIN_PATIENTS':           'Check in and manage patient arrival',

    // ── Hospital Staff — Lab ──────────────────────────────────────────────────
    'STAFF.LAB':                        'Access laboratory management functions',
    'STAFF.VIEW_LAB_ORDERS':            'View incoming lab orders',
    'STAFF.PROCESS_LAB':                'Process and track lab samples',
    'STAFF.UPLOAD_LAB_RESULTS':         'Upload and publish lab results',

    // ── Hospital Staff — Pharmacy ─────────────────────────────────────────────
    'STAFF.PHARMACY':                   'Access pharmacy management functions',
    'STAFF.VIEW_PRESCRIPTIONS':         'View active prescriptions',
    'STAFF.DISPENSE_MEDICATION':        'Mark prescriptions as dispensed',

    // ── Hospital Staff — Emergency ────────────────────────────────────────────
    'STAFF.EMERGENCY':                  'Access emergency response functions',
    'STAFF.RESPOND_EMERGENCY':          'Respond to and update emergency events',
    'STAFF.DISPATCH_AMBULANCE':         'Dispatch emergency resources',

    // ── Hospital Staff — Billing ──────────────────────────────────────────────
    'STAFF.BILLING':                    'Access billing and invoicing functions',
    'STAFF.CREATE_INVOICE':             'Create patient invoices',
    'STAFF.PROCESS_PAYMENT':            'Record and process payments',
    'STAFF.VIEW_REVENUE':               'View revenue dashboard',

    // ── Administration ────────────────────────────────────────────────────────
    'ADMIN.VIEW_USERS':                 'View all user accounts',
    'ADMIN.CREATE_USERS':               'Create new user accounts',
    'ADMIN.EDIT_USERS':                 'Edit user account details',
    'ADMIN.DISABLE_USERS':              'Disable or suspend user accounts',
    'ADMIN.MANAGE_ROLES':               'Create and edit roles',
    'ADMIN.MANAGE_PERMISSIONS':         'Grant and revoke permissions',
    'ADMIN.GRANT_ACCESS':               'Grant workspace or feature access',
    'ADMIN.REVOKE_ACCESS':              'Revoke workspace or feature access',
    'ADMIN.VIEW_AUDIT_LOG':             'View system audit logs',
    'ADMIN.MANAGE_SYSTEM_SETTINGS':     'Modify system configuration',
    'ADMIN.VIEW_DASHBOARD':             'View admin command dashboard',
    'ADMIN.VIEW_ANALYTICS':             'View platform analytics',
    'ADMIN.MANAGE_PROVIDERS':           'Manage provider registrations',
};

/** Ordered workspace list (matches frontend portal tabs). */
const WORKSPACES = [
    'PATIENT',
    'DOCTOR',
    'RADIOLOGY',
    'HOSPITAL_STAFF',
    'ADMINISTRATION',
];

/** Workspace → frontend route prefix mapping. */
const WORKSPACE_ROUTES = {
    PATIENT:        ['/dashboard', '/appointments', '/telemedicine', '/health-records', '/medications', '/lab', '/billing'],
    DOCTOR:         ['/doctor', '/consultations', '/emr'],
    RADIOLOGY:      ['/teleradiology'],
    HOSPITAL_STAFF: ['/reception', '/ems', '/icu', '/bed-management', '/lab-orders'],
    ADMINISTRATION: ['/admin'],
};

/**
 * Default role definitions — seeded on first startup.
 * Administrators may customize or extend these after seeding.
 */
const DEFAULT_ROLES = [
    {
        name: 'PATIENT',
        displayName: 'Patient',
        description: 'Standard patient with access to personal health records, appointments, and telemedicine.',
        workspaces: ['PATIENT'],
        isSystem: true,
        permissions: [
            'PATIENT.VIEW_PROFILE', 'PATIENT.EDIT_PROFILE',
            'PATIENT.VIEW_APPOINTMENTS', 'PATIENT.BOOK_APPOINTMENT', 'PATIENT.CANCEL_APPOINTMENT',
            'PATIENT.VIEW_MEDICAL_RECORDS', 'PATIENT.UPLOAD_DOCUMENT', 'PATIENT.DOWNLOAD_MEDICAL_RECORDS',
            'PATIENT.USE_TELEMEDICINE',
            'PATIENT.VIEW_PRESCRIPTIONS',
            'PATIENT.VIEW_BILLING',
            'PATIENT.VIEW_LAB_RESULTS',
            'PATIENT.TRIGGER_EMERGENCY',
        ],
    },
    {
        name: 'DOCTOR',
        displayName: 'Doctor',
        description: 'Clinical practitioner with access to patient management, EMR, and telemedicine.',
        workspaces: ['DOCTOR'],
        isSystem: true,
        permissions: [
            'DOCTOR.VIEW_PATIENTS', 'DOCTOR.VIEW_MEDICAL_RECORDS',
            'DOCTOR.EDIT_CLINICAL_NOTES', 'DOCTOR.SIGN_CLINICAL_NOTES',
            'DOCTOR.CREATE_PRESCRIPTION',
            'DOCTOR.VIEW_APPOINTMENTS', 'DOCTOR.MANAGE_APPOINTMENTS',
            'DOCTOR.START_TELEMEDICINE', 'DOCTOR.END_TELEMEDICINE',
            'DOCTOR.ORDER_LAB', 'DOCTOR.ORDER_RADIOLOGY',
            'DOCTOR.CREATE_ENCOUNTER',
            'DOCTOR.VIEW_SCHEDULE', 'DOCTOR.MANAGE_SCHEDULE',
        ],
    },
    {
        name: 'RADIOLOGIST',
        displayName: 'Radiologist',
        description: 'Reads and reports on radiology studies via the teleradiology worklist.',
        workspaces: ['RADIOLOGY'],
        isSystem: true,
        permissions: [
            'RADIOLOGY.VIEW_WORKLIST', 'RADIOLOGY.VIEW_STUDIES', 'RADIOLOGY.UPLOAD_STUDY',
            'RADIOLOGY.CREATE_REPORT', 'RADIOLOGY.EDIT_REPORT', 'RADIOLOGY.FINALIZE_REPORT',
            'RADIOLOGY.VIEW_STATS',
        ],
    },
    {
        name: 'RECEPTIONIST',
        displayName: 'Receptionist',
        description: 'Front-desk staff responsible for patient registration, scheduling, and check-in.',
        workspaces: ['HOSPITAL_STAFF'],
        isSystem: true,
        permissions: [
            'STAFF.RECEPTION', 'STAFF.MANAGE_RECORDS',
            'STAFF.VIEW_APPOINTMENTS', 'STAFF.CREATE_APPOINTMENTS', 'STAFF.CHECKIN_PATIENTS',
        ],
    },
    {
        name: 'LAB_TECHNICIAN',
        displayName: 'Lab Technician',
        description: 'Processes laboratory samples and uploads test results.',
        workspaces: ['HOSPITAL_STAFF'],
        isSystem: true,
        permissions: [
            'STAFF.LAB', 'STAFF.VIEW_LAB_ORDERS', 'STAFF.PROCESS_LAB', 'STAFF.UPLOAD_LAB_RESULTS',
        ],
    },
    {
        name: 'PHARMACY_STAFF',
        displayName: 'Pharmacy Staff',
        description: 'Dispenses medication based on verified prescriptions.',
        workspaces: ['HOSPITAL_STAFF'],
        isSystem: true,
        permissions: [
            'STAFF.PHARMACY', 'STAFF.VIEW_PRESCRIPTIONS', 'STAFF.DISPENSE_MEDICATION',
        ],
    },
    {
        name: 'EMERGENCY_STAFF',
        displayName: 'Emergency Staff',
        description: 'Responds to SOS alerts and manages emergency dispatch.',
        workspaces: ['HOSPITAL_STAFF'],
        isSystem: true,
        permissions: [
            'STAFF.EMERGENCY', 'STAFF.RESPOND_EMERGENCY', 'STAFF.DISPATCH_AMBULANCE',
        ],
    },
    {
        name: 'HOSPITAL_ADMIN',
        displayName: 'Hospital Administrator',
        description: 'Manages hospital operations, staff, permissions, and system settings.',
        workspaces: ['ADMINISTRATION', 'HOSPITAL_STAFF'],
        isSystem: true,
        permissions: [
            'ADMIN.VIEW_USERS', 'ADMIN.CREATE_USERS', 'ADMIN.EDIT_USERS', 'ADMIN.DISABLE_USERS',
            'ADMIN.MANAGE_ROLES', 'ADMIN.MANAGE_PERMISSIONS',
            'ADMIN.GRANT_ACCESS', 'ADMIN.REVOKE_ACCESS',
            'ADMIN.VIEW_AUDIT_LOG', 'ADMIN.VIEW_DASHBOARD', 'ADMIN.VIEW_ANALYTICS',
            'ADMIN.MANAGE_SYSTEM_SETTINGS', 'ADMIN.MANAGE_PROVIDERS',
            'STAFF.VIEW_APPOINTMENTS', 'STAFF.CREATE_APPOINTMENTS',
            'STAFF.MANAGE_RECORDS',
            'STAFF.VIEW_LAB_ORDERS', 'STAFF.VIEW_PRESCRIPTIONS',
            'STAFF.BILLING', 'STAFF.CREATE_INVOICE', 'STAFF.PROCESS_PAYMENT', 'STAFF.VIEW_REVENUE',
        ],
    },
    {
        name: 'SUPER_ADMIN',
        displayName: 'Super Administrator',
        description: 'Unrestricted access to all workspaces, modules, and permissions.',
        workspaces: ['ADMINISTRATION', 'HOSPITAL_STAFF', 'DOCTOR', 'RADIOLOGY', 'PATIENT'],
        isSystem: true,
        permissions: Object.keys(PERMISSIONS),
    },
];

/**
 * Map from User.role (legacy string) → Role.name for auto-assignment.
 * Used when existing users log in before the admin assigns explicit roles.
 */
const LEGACY_ROLE_MAP = {
    patient:      'PATIENT',
    doctor:       'DOCTOR',
    radiologist:  'RADIOLOGIST',
    admin:        'HOSPITAL_ADMIN',
    super_admin:  'SUPER_ADMIN',
    receptionist: 'RECEPTIONIST',
    lab_tech:     'LAB_TECHNICIAN',
    pharmacy:     'PHARMACY_STAFF',
    emergency:    'EMERGENCY_STAFF',
};

module.exports = { PERMISSIONS, WORKSPACES, WORKSPACE_ROUTES, DEFAULT_ROLES, LEGACY_ROLE_MAP };
