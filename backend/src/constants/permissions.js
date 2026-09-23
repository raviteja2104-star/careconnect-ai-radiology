/**
 * CareConnect — Granular RBAC Permission Catalogue
 *
 * Every protected action in the system maps to one entry here.
 * Middleware uses these strings to gate API routes.
 * The Admin UI groups them by workspace/section for display.
 *
 * Naming convention: NAMESPACE.ACTION
 * Namespaces: PATIENT, PATIENTS, DOCTOR, CLINICAL, OPD, RADIOLOGY,
 *             STAFF, BILLING, REPORTS, DOCUMENTS, CLINIC, ORGANIZATION, ADMIN
 */

const PERMISSIONS = {
    // ── Own-patient workspace (self-service) ──────────────────────────────────
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

    // ── Patient management (staff acting on patients) ─────────────────────────
    'PATIENTS.VIEW_ALL':                'View all patients in the clinic or organization',
    'PATIENTS.CREATE':                  'Register new patients',
    'PATIENTS.UPDATE':                  'Update patient demographics and contact details',
    'PATIENTS.DELETE':                  'Permanently delete patient records',
    'PATIENTS.EXPORT':                  'Export patient lists and data',
    'PATIENTS.VIEW_SENSITIVE':          'View sensitive / restricted patient information',
    'PATIENTS.MERGE':                   'Merge duplicate patient records',
    'PATIENTS.SEARCH':                  'Search patients by name, MRN, or mobile',

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

    // ── Clinical (granular — used in consultation, vitals, diagnosis) ─────────
    'CLINICAL.VIEW_VITALS':             'View patient vitals',
    'CLINICAL.RECORD_VITALS':           'Record and update patient vitals',
    'CLINICAL.VIEW_DIAGNOSIS':          'View diagnosis records',
    'CLINICAL.CREATE_DIAGNOSIS':        'Create diagnosis records',
    'CLINICAL.UPDATE_DIAGNOSIS':        'Update existing diagnosis records',
    'CLINICAL.VIEW_TREATMENT_PLAN':     'View treatment and care plans',
    'CLINICAL.MANAGE_TREATMENT_PLAN':   'Create and update treatment plans',
    'CLINICAL.VIEW_CONSULTATION':       'View consultation records',
    'CLINICAL.CREATE_CONSULTATION':     'Create and submit consultation records',
    'CLINICAL.SIGN_CONSULTATION':       'Sign and finalize consultation records',
    'CLINICAL.EMERGENCY_ACCESS':        'Break-glass / emergency access to restricted records',

    // ── OPD queue management ──────────────────────────────────────────────────
    'OPD.VIEW_QUEUE':                   'View the OPD patient queue',
    'OPD.MANAGE_QUEUE':                 'Reorder, update status, and manage the OPD queue',
    'OPD.CHECKIN':                      'Check in patients to the OPD queue',
    'OPD.CHECKOUT':                     'Complete or check out patients from the OPD queue',
    'OPD.CALL_NEXT':                    'Call the next patient from the queue',

    // ── Radiology workspace ───────────────────────────────────────────────────
    'RADIOLOGY.VIEW_WORKLIST':          'View radiology worklist',
    'RADIOLOGY.VIEW_STUDIES':           'Open and view DICOM studies',
    'RADIOLOGY.UPLOAD_STUDY':           'Upload radiology studies',
    'RADIOLOGY.CREATE_REPORT':          'Draft radiology reports',
    'RADIOLOGY.EDIT_REPORT':            'Edit radiology reports',
    'RADIOLOGY.FINALIZE_REPORT':        'Sign and finalize radiology reports',
    'RADIOLOGY.ASSIGN_RADIOLOGIST':     'Assign studies to radiologists',
    'RADIOLOGY.VIEW_STATS':             'View radiology throughput statistics',

    // ── Hospital Staff — Records / HIM ────────────────────────────────────────
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

    // ── Billing — granular ────────────────────────────────────────────────────
    'BILLING.VIEW':                     'View invoices and billing records',
    'BILLING.CREATE':                   'Create new invoices',
    'BILLING.UPDATE':                   'Update existing invoices',
    'BILLING.REFUND':                   'Issue refunds on invoices',
    'BILLING.VIEW_REVENUE':             'View revenue reports and summaries',
    'BILLING.EXPORT':                   'Export billing reports to file formats',
    'BILLING.MANAGE_INSURANCE':         'Manage patient insurance information',

    // ── Reports ───────────────────────────────────────────────────────────────
    'REPORTS.VIEW':                     'View operational reports',
    'REPORTS.CREATE':                   'Generate custom reports',
    'REPORTS.EXPORT':                   'Export reports to file formats',

    // ── Documents / Files ─────────────────────────────────────────────────────
    'DOCUMENTS.VIEW':                   'View patient documents and attachments',
    'DOCUMENTS.UPLOAD':                 'Upload documents to patient records',
    'DOCUMENTS.DELETE':                 'Delete patient documents',
    'DOCUMENTS.DOWNLOAD':               'Download patient documents',
    'DOCUMENTS.SHARE':                  'Share documents with other providers',

    // ── Clinic management ─────────────────────────────────────────────────────
    'CLINIC.VIEW':                      'View clinic details and configuration',
    'CLINIC.UPDATE':                    'Update clinic profile and settings',
    'CLINIC.MANAGE_DOCTORS':            'Add, edit, and deactivate clinic doctors',
    'CLINIC.MANAGE_STAFF':              'Add, edit, and deactivate clinic staff',
    'CLINIC.MANAGE_SCHEDULES':          'Configure OPD schedules for clinic doctors',
    'CLINIC.VIEW_REPORTS':              'View clinic-level reports',
    'CLINIC.EXPORT_REPORTS':            'Export clinic reports',

    // ── Organization management ───────────────────────────────────────────────
    'ORGANIZATION.VIEW':                'View organization details',
    'ORGANIZATION.UPDATE':              'Update organization profile and settings',
    'ORGANIZATION.MANAGE_CLINICS':      'Create and manage clinics under the organization',
    'ORGANIZATION.MANAGE_STAFF':        'Manage organization-level staff accounts',
    'ORGANIZATION.VIEW_REPORTS':        'View organization-level consolidated reports',
    'ORGANIZATION.EXPORT_REPORTS':      'Export organization reports',
    'ORGANIZATION.MANAGE_BILLING':      'Manage organization subscription and billing plan',
    'ORGANIZATION.MANAGE_INTEGRATIONS': 'Manage organization-level integrations',

    // ── Integrations ──────────────────────────────────────────────────────────
    'INTEGRATIONS.VIEW':                'View configured integrations and their status',
    'INTEGRATIONS.MANAGE':              'Create, update, and delete integrations',

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
    'ADMIN.EXPORT_AUDIT_LOG':           'Export audit logs',
    'ADMIN.MANAGE_SYSTEM_SETTINGS':     'Modify system configuration',
    'ADMIN.VIEW_DASHBOARD':             'View admin command dashboard',
    'ADMIN.VIEW_ANALYTICS':             'View platform analytics',
    'ADMIN.MANAGE_PROVIDERS':           'Manage provider registrations',
    'ADMIN.MANAGE_TENANTS':             'Create and manage tenant organizations',
    'ADMIN.IMPERSONATE_USER':           'Impersonate another user for support purposes',
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
 * isSystem: true roles cannot be deleted via the UI (only edited).
 */
const DEFAULT_ROLES = [
    // ── Self-service ──────────────────────────────────────────────────────────
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
            'DOCUMENTS.VIEW', 'DOCUMENTS.UPLOAD', 'DOCUMENTS.DOWNLOAD',
        ],
    },

    // ── Clinical ──────────────────────────────────────────────────────────────
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
            'CLINICAL.VIEW_VITALS', 'CLINICAL.RECORD_VITALS',
            'CLINICAL.VIEW_DIAGNOSIS', 'CLINICAL.CREATE_DIAGNOSIS', 'CLINICAL.UPDATE_DIAGNOSIS',
            'CLINICAL.VIEW_TREATMENT_PLAN', 'CLINICAL.MANAGE_TREATMENT_PLAN',
            'CLINICAL.VIEW_CONSULTATION', 'CLINICAL.CREATE_CONSULTATION', 'CLINICAL.SIGN_CONSULTATION',
            'OPD.VIEW_QUEUE', 'OPD.CALL_NEXT', 'OPD.CHECKOUT',
            'PATIENTS.VIEW_ALL', 'PATIENTS.SEARCH',
            'DOCUMENTS.VIEW', 'DOCUMENTS.UPLOAD', 'DOCUMENTS.DOWNLOAD',
        ],
    },
    {
        name: 'NURSE',
        displayName: 'Nurse',
        description: 'Clinical nurse with access to patient vitals, care coordination, and OPD queue.',
        workspaces: ['HOSPITAL_STAFF'],
        isSystem: true,
        permissions: [
            'STAFF.MANAGE_RECORDS',
            'STAFF.VIEW_APPOINTMENTS', 'STAFF.CHECKIN_PATIENTS',
            'STAFF.VIEW_LAB_ORDERS',
            'DOCTOR.VIEW_PATIENTS', 'DOCTOR.VIEW_MEDICAL_RECORDS',
            'CLINICAL.VIEW_VITALS', 'CLINICAL.RECORD_VITALS',
            'CLINICAL.VIEW_DIAGNOSIS', 'CLINICAL.VIEW_CONSULTATION',
            'OPD.VIEW_QUEUE', 'OPD.CHECKIN',
            'PATIENTS.VIEW_ALL', 'PATIENTS.SEARCH',
            'DOCUMENTS.VIEW', 'DOCUMENTS.UPLOAD',
        ],
    },

    // ── Radiology ─────────────────────────────────────────────────────────────
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
            'PATIENTS.SEARCH',
        ],
    },

    // ── Front-desk ────────────────────────────────────────────────────────────
    {
        name: 'RECEPTIONIST',
        displayName: 'Receptionist',
        description: 'Front-desk staff responsible for patient registration, scheduling, and check-in.',
        workspaces: ['HOSPITAL_STAFF'],
        isSystem: true,
        permissions: [
            'STAFF.RECEPTION',
            'STAFF.MANAGE_RECORDS',
            'STAFF.VIEW_APPOINTMENTS', 'STAFF.CREATE_APPOINTMENTS', 'STAFF.CHECKIN_PATIENTS',
            'PATIENTS.VIEW_ALL', 'PATIENTS.CREATE', 'PATIENTS.UPDATE', 'PATIENTS.SEARCH',
            'OPD.VIEW_QUEUE', 'OPD.CHECKIN', 'OPD.MANAGE_QUEUE',
            'DOCUMENTS.VIEW', 'DOCUMENTS.UPLOAD',
        ],
    },

    // ── Lab ───────────────────────────────────────────────────────────────────
    {
        name: 'LAB_TECHNICIAN',
        displayName: 'Lab Technician',
        description: 'Processes laboratory samples and uploads test results.',
        workspaces: ['HOSPITAL_STAFF'],
        isSystem: true,
        permissions: [
            'STAFF.LAB', 'STAFF.VIEW_LAB_ORDERS', 'STAFF.PROCESS_LAB', 'STAFF.UPLOAD_LAB_RESULTS',
            'PATIENTS.SEARCH',
            'DOCUMENTS.VIEW', 'DOCUMENTS.UPLOAD',
        ],
    },

    // ── Pharmacy ──────────────────────────────────────────────────────────────
    {
        name: 'PHARMACY_STAFF',
        displayName: 'Pharmacy Staff',
        description: 'Dispenses medication based on verified prescriptions.',
        workspaces: ['HOSPITAL_STAFF'],
        isSystem: true,
        permissions: [
            'STAFF.PHARMACY', 'STAFF.VIEW_PRESCRIPTIONS', 'STAFF.DISPENSE_MEDICATION',
            'PATIENTS.SEARCH',
        ],
    },

    // ── Billing ───────────────────────────────────────────────────────────────
    {
        name: 'BILLING_MANAGER',
        displayName: 'Billing Manager',
        description: 'Manages invoices, payments, refunds, and billing reports. No clinical access.',
        workspaces: ['HOSPITAL_STAFF'],
        isSystem: true,
        permissions: [
            'STAFF.BILLING', 'STAFF.CREATE_INVOICE', 'STAFF.PROCESS_PAYMENT', 'STAFF.VIEW_REVENUE',
            'BILLING.VIEW', 'BILLING.CREATE', 'BILLING.UPDATE',
            'BILLING.REFUND', 'BILLING.VIEW_REVENUE', 'BILLING.EXPORT',
            'BILLING.MANAGE_INSURANCE',
            'REPORTS.VIEW', 'REPORTS.EXPORT',
            'PATIENTS.SEARCH',
        ],
    },
    {
        name: 'ACCOUNTANT',
        displayName: 'Accountant',
        description: 'Read-only access to financial records and reports. No clinical or patient record access.',
        workspaces: ['HOSPITAL_STAFF'],
        isSystem: true,
        permissions: [
            'BILLING.VIEW', 'BILLING.VIEW_REVENUE', 'BILLING.EXPORT',
            'REPORTS.VIEW', 'REPORTS.EXPORT',
            'STAFF.VIEW_REVENUE',
        ],
    },

    // ── Emergency ─────────────────────────────────────────────────────────────
    {
        name: 'EMERGENCY_STAFF',
        displayName: 'Emergency Staff',
        description: 'Responds to SOS alerts and manages emergency dispatch.',
        workspaces: ['HOSPITAL_STAFF'],
        isSystem: true,
        permissions: [
            'STAFF.EMERGENCY', 'STAFF.RESPOND_EMERGENCY', 'STAFF.DISPATCH_AMBULANCE',
            'CLINICAL.EMERGENCY_ACCESS',
            'PATIENTS.SEARCH',
        ],
    },

    // ── Clinic admin ──────────────────────────────────────────────────────────
    {
        name: 'CLINIC_ADMIN',
        displayName: 'Clinic Administrator',
        description: 'Manages a single clinic: doctors, staff, schedules, and clinic-level reporting.',
        workspaces: ['ADMINISTRATION', 'HOSPITAL_STAFF'],
        isSystem: true,
        permissions: [
            // Clinic management
            'CLINIC.VIEW', 'CLINIC.UPDATE',
            'CLINIC.MANAGE_DOCTORS', 'CLINIC.MANAGE_STAFF', 'CLINIC.MANAGE_SCHEDULES',
            'CLINIC.VIEW_REPORTS', 'CLINIC.EXPORT_REPORTS',
            // Staff operations
            'STAFF.VIEW_APPOINTMENTS', 'STAFF.CREATE_APPOINTMENTS', 'STAFF.CHECKIN_PATIENTS',
            'STAFF.MANAGE_RECORDS',
            'STAFF.VIEW_LAB_ORDERS', 'STAFF.VIEW_PRESCRIPTIONS',
            'STAFF.BILLING', 'STAFF.CREATE_INVOICE', 'STAFF.PROCESS_PAYMENT', 'STAFF.VIEW_REVENUE',
            // Patient management
            'PATIENTS.VIEW_ALL', 'PATIENTS.CREATE', 'PATIENTS.UPDATE', 'PATIENTS.SEARCH', 'PATIENTS.EXPORT',
            // OPD
            'OPD.VIEW_QUEUE', 'OPD.MANAGE_QUEUE', 'OPD.CHECKIN', 'OPD.CHECKOUT',
            // Billing
            'BILLING.VIEW', 'BILLING.CREATE', 'BILLING.UPDATE', 'BILLING.VIEW_REVENUE', 'BILLING.EXPORT',
            // Reports
            'REPORTS.VIEW', 'REPORTS.CREATE', 'REPORTS.EXPORT',
            // Documents
            'DOCUMENTS.VIEW', 'DOCUMENTS.UPLOAD', 'DOCUMENTS.DOWNLOAD',
            // User management (within clinic)
            'ADMIN.VIEW_USERS', 'ADMIN.CREATE_USERS', 'ADMIN.EDIT_USERS', 'ADMIN.DISABLE_USERS',
            'ADMIN.VIEW_AUDIT_LOG',
            'INTEGRATIONS.VIEW',
        ],
    },

    // ── Organization admin ────────────────────────────────────────────────────
    {
        name: 'ORGANIZATION_ADMIN',
        displayName: 'Organization Administrator',
        description: 'Manages the entire organization: clinics, staff, roles, permissions, and organization-level reporting.',
        workspaces: ['ADMINISTRATION', 'HOSPITAL_STAFF'],
        isSystem: true,
        permissions: [
            // Organization management
            'ORGANIZATION.VIEW', 'ORGANIZATION.UPDATE',
            'ORGANIZATION.MANAGE_CLINICS', 'ORGANIZATION.MANAGE_STAFF',
            'ORGANIZATION.VIEW_REPORTS', 'ORGANIZATION.EXPORT_REPORTS',
            'ORGANIZATION.MANAGE_BILLING', 'ORGANIZATION.MANAGE_INTEGRATIONS',
            // Clinic management (all clinics in org)
            'CLINIC.VIEW', 'CLINIC.UPDATE',
            'CLINIC.MANAGE_DOCTORS', 'CLINIC.MANAGE_STAFF', 'CLINIC.MANAGE_SCHEDULES',
            'CLINIC.VIEW_REPORTS', 'CLINIC.EXPORT_REPORTS',
            // Staff operations
            'STAFF.VIEW_APPOINTMENTS', 'STAFF.CREATE_APPOINTMENTS', 'STAFF.CHECKIN_PATIENTS',
            'STAFF.MANAGE_RECORDS',
            'STAFF.VIEW_LAB_ORDERS', 'STAFF.VIEW_PRESCRIPTIONS',
            'STAFF.BILLING', 'STAFF.CREATE_INVOICE', 'STAFF.PROCESS_PAYMENT', 'STAFF.VIEW_REVENUE',
            // Patient management
            'PATIENTS.VIEW_ALL', 'PATIENTS.CREATE', 'PATIENTS.UPDATE', 'PATIENTS.SEARCH',
            'PATIENTS.EXPORT', 'PATIENTS.VIEW_SENSITIVE',
            // OPD
            'OPD.VIEW_QUEUE', 'OPD.MANAGE_QUEUE', 'OPD.CHECKIN', 'OPD.CHECKOUT',
            // Billing
            'BILLING.VIEW', 'BILLING.CREATE', 'BILLING.UPDATE',
            'BILLING.REFUND', 'BILLING.VIEW_REVENUE', 'BILLING.EXPORT', 'BILLING.MANAGE_INSURANCE',
            // Reports
            'REPORTS.VIEW', 'REPORTS.CREATE', 'REPORTS.EXPORT',
            // Documents
            'DOCUMENTS.VIEW', 'DOCUMENTS.UPLOAD', 'DOCUMENTS.DOWNLOAD', 'DOCUMENTS.DELETE',
            // User & role management
            'ADMIN.VIEW_USERS', 'ADMIN.CREATE_USERS', 'ADMIN.EDIT_USERS', 'ADMIN.DISABLE_USERS',
            'ADMIN.MANAGE_ROLES', 'ADMIN.MANAGE_PERMISSIONS',
            'ADMIN.GRANT_ACCESS', 'ADMIN.REVOKE_ACCESS',
            'ADMIN.VIEW_AUDIT_LOG', 'ADMIN.EXPORT_AUDIT_LOG',
            'ADMIN.VIEW_DASHBOARD', 'ADMIN.VIEW_ANALYTICS',
            'INTEGRATIONS.VIEW', 'INTEGRATIONS.MANAGE',
        ],
    },

    // ── Hospital admin ────────────────────────────────────────────────────────
    {
        name: 'HOSPITAL_ADMIN',
        displayName: 'Hospital Administrator',
        description: 'Full hospital operations, staff, permissions, and system settings.',
        workspaces: ['ADMINISTRATION', 'HOSPITAL_STAFF', 'RADIOLOGY'],
        isSystem: true,
        permissions: [
            'ADMIN.VIEW_USERS', 'ADMIN.CREATE_USERS', 'ADMIN.EDIT_USERS', 'ADMIN.DISABLE_USERS',
            'ADMIN.MANAGE_ROLES', 'ADMIN.MANAGE_PERMISSIONS',
            'ADMIN.GRANT_ACCESS', 'ADMIN.REVOKE_ACCESS',
            'ADMIN.VIEW_AUDIT_LOG', 'ADMIN.EXPORT_AUDIT_LOG',
            'ADMIN.VIEW_DASHBOARD', 'ADMIN.VIEW_ANALYTICS',
            'ADMIN.MANAGE_SYSTEM_SETTINGS', 'ADMIN.MANAGE_PROVIDERS',
            'STAFF.VIEW_APPOINTMENTS', 'STAFF.CREATE_APPOINTMENTS',
            'STAFF.MANAGE_RECORDS',
            'STAFF.VIEW_LAB_ORDERS', 'STAFF.VIEW_PRESCRIPTIONS',
            'STAFF.BILLING', 'STAFF.CREATE_INVOICE', 'STAFF.PROCESS_PAYMENT', 'STAFF.VIEW_REVENUE',
            'CLINIC.VIEW', 'CLINIC.UPDATE', 'CLINIC.MANAGE_DOCTORS', 'CLINIC.MANAGE_STAFF',
            'ORGANIZATION.VIEW', 'ORGANIZATION.UPDATE',
            'PATIENTS.VIEW_ALL', 'PATIENTS.CREATE', 'PATIENTS.UPDATE', 'PATIENTS.SEARCH', 'PATIENTS.EXPORT',
            'OPD.VIEW_QUEUE', 'OPD.MANAGE_QUEUE', 'OPD.CHECKIN', 'OPD.CHECKOUT',
            'BILLING.VIEW', 'BILLING.CREATE', 'BILLING.UPDATE', 'BILLING.REFUND',
            'BILLING.VIEW_REVENUE', 'BILLING.EXPORT',
            'REPORTS.VIEW', 'REPORTS.CREATE', 'REPORTS.EXPORT',
            'DOCUMENTS.VIEW', 'DOCUMENTS.UPLOAD', 'DOCUMENTS.DOWNLOAD', 'DOCUMENTS.DELETE',
            'INTEGRATIONS.VIEW', 'INTEGRATIONS.MANAGE',
        ],
    },

    // ── Support ───────────────────────────────────────────────────────────────
    {
        name: 'SUPPORT_AGENT',
        displayName: 'Support Agent',
        description: 'Customer support: view permitted user/organization information to resolve support requests. No clinical data access.',
        workspaces: ['ADMINISTRATION'],
        isSystem: true,
        permissions: [
            'ADMIN.VIEW_USERS',
            'ADMIN.VIEW_DASHBOARD',
            'PATIENTS.SEARCH',
        ],
    },

    // ── Platform ──────────────────────────────────────────────────────────────
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
    patient:            'PATIENT',
    doctor:             'DOCTOR',
    radiologist:        'RADIOLOGIST',
    admin:              'HOSPITAL_ADMIN',
    super_admin:        'SUPER_ADMIN',
    // reception is the stored enum value (not receptionist)
    reception:          'RECEPTIONIST',
    receptionist:       'RECEPTIONIST',
    lab_tech:           'LAB_TECHNICIAN',
    // pharmacist is the stored enum value (not pharmacy)
    pharmacist:         'PHARMACY_STAFF',
    pharmacy:           'PHARMACY_STAFF',
    nurse:              'NURSE',
    emergency:          'EMERGENCY_STAFF',
    billing:            'BILLING_MANAGER',
    accountant:         'ACCOUNTANT',
    clinic_admin:       'CLINIC_ADMIN',
    organization_admin: 'ORGANIZATION_ADMIN',
    support:            'SUPPORT_AGENT',
};

/**
 * High-risk permissions that require explicit confirmation before granting.
 * The Admin UI should display a warning when a role is edited to include these.
 */
const HIGH_RISK_PERMISSIONS = new Set([
    'PATIENTS.DELETE',
    'PATIENTS.EXPORT',
    'PATIENTS.VIEW_SENSITIVE',
    'PATIENTS.MERGE',
    'BILLING.REFUND',
    'DOCUMENTS.DELETE',
    'ADMIN.DISABLE_USERS',
    'ADMIN.MANAGE_ROLES',
    'ADMIN.MANAGE_PERMISSIONS',
    'ADMIN.GRANT_ACCESS',
    'ADMIN.REVOKE_ACCESS',
    'ADMIN.MANAGE_SYSTEM_SETTINGS',
    'ADMIN.MANAGE_TENANTS',
    'ADMIN.IMPERSONATE_USER',
    'ADMIN.EXPORT_AUDIT_LOG',
    'CLINICAL.EMERGENCY_ACCESS',
    'ORGANIZATION.MANAGE_BILLING',
    'REPORTS.EXPORT',
]);

module.exports = {
    PERMISSIONS,
    WORKSPACES,
    WORKSPACE_ROUTES,
    DEFAULT_ROLES,
    LEGACY_ROLE_MAP,
    HIGH_RISK_PERMISSIONS,
};
