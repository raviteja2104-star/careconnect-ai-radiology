/**
 * CareConnect — Frontend RBAC helpers
 *
 * Single authoritative source for permission-gated UI logic.
 * All checks are derived from the session's permissions array,
 * which is resolved by the backend on login and never trusted
 * from client-side storage alone.
 *
 * SECURITY NOTE: These helpers gate the UI only (show/hide buttons,
 * links, and components). Every API call is independently protected
 * by backend middleware (protect → permit → resource-level check).
 * UI hiding is a UX convenience, not a security boundary.
 */

'use client';

import { usePermissions } from '@/contexts/PermissionContext';

// ── Core hook ─────────────────────────────────────────────────────────────────

export { usePermissions };

/**
 * useRBAC()
 * Extended hook with all RBAC helpers. Use this as the single import
 * for any component that needs permission checks.
 */
export function useRBAC() {
    const { hasPermission, hasWorkspace, permissions, workspaces } = usePermissions();

    /**
     * can(...perms) — returns true if the user holds ALL listed permissions.
     * @example can('PATIENTS.CREATE')
     * @example can('BILLING.REFUND', 'BILLING.CREATE')
     */
    const can = (...perms: string[]): boolean => hasPermission(...perms);

    /**
     * canAny(...perms) — returns true if the user holds AT LEAST ONE permission.
     * @example canAny('STAFF.PHARMACY', 'ADMIN.VIEW_DASHBOARD')
     */
    const canAny = (...perms: string[]): boolean => {
        const set = new Set(permissions);
        return perms.some(p => set.has(p));
    };

    /**
     * cannot(...perms) — inverse of can(); semantic sugar for readability.
     * @example cannot('PATIENTS.DELETE') && <DeleteButton ... />
     */
    const cannot = (...perms: string[]): boolean => !can(...perms);

    /**
     * inWorkspace(ws) — returns true if the user's session includes the workspace.
     */
    const inWorkspace = (ws: string): boolean => hasWorkspace(ws);

    return { can, canAny, cannot, inWorkspace, permissions, workspaces };
}

// ── React component helper ────────────────────────────────────────────────────

import React from 'react';

interface CanProps {
    /** All of these permissions must be held. */
    permission?: string | string[];
    /** At least one of these permissions must be held. */
    anyOf?: string[];
    /** Workspace the user must belong to. */
    workspace?: string;
    /** Rendered when the check passes. */
    children: React.ReactNode;
    /** Optional fallback when the check fails (default: null). */
    fallback?: React.ReactNode;
}

/**
 * <Can permission="PATIENTS.CREATE">
 *   <RegisterPatientButton />
 * </Can>
 *
 * <Can anyOf={['BILLING.REFUND', 'ADMIN.MANAGE_PERMISSIONS']}>
 *   <RefundButton />
 * </Can>
 */
export function Can({ permission, anyOf, workspace, children, fallback = null }: CanProps) {
    const { can, canAny, inWorkspace } = useRBAC();

    let allowed = true;

    if (permission) {
        const perms = Array.isArray(permission) ? permission : [permission];
        allowed = allowed && can(...perms);
    }

    if (anyOf && anyOf.length > 0) {
        allowed = allowed && canAny(...anyOf);
    }

    if (workspace) {
        allowed = allowed && inWorkspace(workspace);
    }

    return allowed ? <>{children}</> : <>{fallback}</>;
}

// ── Predefined permission groups (mirrors backend DEFAULT_ROLES) ──────────────

export const PERMS = {
    // Patient self-service
    patient: {
        viewProfile:    'PATIENT.VIEW_PROFILE',
        editProfile:    'PATIENT.EDIT_PROFILE',
        viewAppts:      'PATIENT.VIEW_APPOINTMENTS',
        bookAppt:       'PATIENT.BOOK_APPOINTMENT',
        cancelAppt:     'PATIENT.CANCEL_APPOINTMENT',
        viewRecords:    'PATIENT.VIEW_MEDICAL_RECORDS',
        uploadDoc:      'PATIENT.UPLOAD_DOCUMENT',
        download:       'PATIENT.DOWNLOAD_MEDICAL_RECORDS',
        telemedicine:   'PATIENT.USE_TELEMEDICINE',
        viewRx:         'PATIENT.VIEW_PRESCRIPTIONS',
        viewBilling:    'PATIENT.VIEW_BILLING',
        viewLab:        'PATIENT.VIEW_LAB_RESULTS',
    },

    // Patient management (staff)
    patients: {
        viewAll:        'PATIENTS.VIEW_ALL',
        create:         'PATIENTS.CREATE',
        update:         'PATIENTS.UPDATE',
        delete:         'PATIENTS.DELETE',
        export:         'PATIENTS.EXPORT',
        viewSensitive:  'PATIENTS.VIEW_SENSITIVE',
        merge:          'PATIENTS.MERGE',
        search:         'PATIENTS.SEARCH',
    },

    // Doctor clinical
    doctor: {
        viewPatients:   'DOCTOR.VIEW_PATIENTS',
        viewRecords:    'DOCTOR.VIEW_MEDICAL_RECORDS',
        editNotes:      'DOCTOR.EDIT_CLINICAL_NOTES',
        signNotes:      'DOCTOR.SIGN_CLINICAL_NOTES',
        createRx:       'DOCTOR.CREATE_PRESCRIPTION',
        viewAppts:      'DOCTOR.VIEW_APPOINTMENTS',
        manageAppts:    'DOCTOR.MANAGE_APPOINTMENTS',
        startTele:      'DOCTOR.START_TELEMEDICINE',
        orderLab:       'DOCTOR.ORDER_LAB',
        orderRadiology: 'DOCTOR.ORDER_RADIOLOGY',
        createEncounter:'DOCTOR.CREATE_ENCOUNTER',
        viewSchedule:   'DOCTOR.VIEW_SCHEDULE',
        manageSchedule: 'DOCTOR.MANAGE_SCHEDULE',
    },

    // Clinical
    clinical: {
        viewVitals:         'CLINICAL.VIEW_VITALS',
        recordVitals:       'CLINICAL.RECORD_VITALS',
        viewDiagnosis:      'CLINICAL.VIEW_DIAGNOSIS',
        createDiagnosis:    'CLINICAL.CREATE_DIAGNOSIS',
        updateDiagnosis:    'CLINICAL.UPDATE_DIAGNOSIS',
        viewConsultation:   'CLINICAL.VIEW_CONSULTATION',
        createConsultation: 'CLINICAL.CREATE_CONSULTATION',
        signConsultation:   'CLINICAL.SIGN_CONSULTATION',
        emergencyAccess:    'CLINICAL.EMERGENCY_ACCESS',
    },

    // OPD
    opd: {
        viewQueue:   'OPD.VIEW_QUEUE',
        manageQueue: 'OPD.MANAGE_QUEUE',
        checkin:     'OPD.CHECKIN',
        checkout:    'OPD.CHECKOUT',
        callNext:    'OPD.CALL_NEXT',
    },

    // Staff operations
    staff: {
        reception:        'STAFF.RECEPTION',
        viewAppts:        'STAFF.VIEW_APPOINTMENTS',
        createAppts:      'STAFF.CREATE_APPOINTMENTS',
        checkinPatients:  'STAFF.CHECKIN_PATIENTS',
        lab:              'STAFF.LAB',
        viewLabOrders:    'STAFF.VIEW_LAB_ORDERS',
        processLab:       'STAFF.PROCESS_LAB',
        uploadLabResults: 'STAFF.UPLOAD_LAB_RESULTS',
        pharmacy:         'STAFF.PHARMACY',
        viewRx:           'STAFF.VIEW_PRESCRIPTIONS',
        dispense:         'STAFF.DISPENSE_MEDICATION',
        billing:          'STAFF.BILLING',
        createInvoice:    'STAFF.CREATE_INVOICE',
        processPayment:   'STAFF.PROCESS_PAYMENT',
        viewRevenue:      'STAFF.VIEW_REVENUE',
    },

    // Billing
    billing: {
        view:        'BILLING.VIEW',
        create:      'BILLING.CREATE',
        update:      'BILLING.UPDATE',
        refund:      'BILLING.REFUND',
        viewRevenue: 'BILLING.VIEW_REVENUE',
        export:      'BILLING.EXPORT',
    },

    // Reports
    reports: {
        view:   'REPORTS.VIEW',
        create: 'REPORTS.CREATE',
        export: 'REPORTS.EXPORT',
    },

    // Documents
    documents: {
        view:     'DOCUMENTS.VIEW',
        upload:   'DOCUMENTS.UPLOAD',
        delete:   'DOCUMENTS.DELETE',
        download: 'DOCUMENTS.DOWNLOAD',
        share:    'DOCUMENTS.SHARE',
    },

    // Clinic management
    clinic: {
        view:            'CLINIC.VIEW',
        update:          'CLINIC.UPDATE',
        manageDoctors:   'CLINIC.MANAGE_DOCTORS',
        manageStaff:     'CLINIC.MANAGE_STAFF',
        manageSchedules: 'CLINIC.MANAGE_SCHEDULES',
        viewReports:     'CLINIC.VIEW_REPORTS',
        exportReports:   'CLINIC.EXPORT_REPORTS',
    },

    // Organization management
    org: {
        view:               'ORGANIZATION.VIEW',
        update:             'ORGANIZATION.UPDATE',
        manageClinics:      'ORGANIZATION.MANAGE_CLINICS',
        manageStaff:        'ORGANIZATION.MANAGE_STAFF',
        viewReports:        'ORGANIZATION.VIEW_REPORTS',
        exportReports:      'ORGANIZATION.EXPORT_REPORTS',
        manageBilling:      'ORGANIZATION.MANAGE_BILLING',
        manageIntegrations: 'ORGANIZATION.MANAGE_INTEGRATIONS',
    },

    // Admin
    admin: {
        viewUsers:       'ADMIN.VIEW_USERS',
        createUsers:     'ADMIN.CREATE_USERS',
        editUsers:       'ADMIN.EDIT_USERS',
        disableUsers:    'ADMIN.DISABLE_USERS',
        manageRoles:     'ADMIN.MANAGE_ROLES',
        managePerms:     'ADMIN.MANAGE_PERMISSIONS',
        grantAccess:     'ADMIN.GRANT_ACCESS',
        revokeAccess:    'ADMIN.REVOKE_ACCESS',
        viewAuditLog:    'ADMIN.VIEW_AUDIT_LOG',
        exportAuditLog:  'ADMIN.EXPORT_AUDIT_LOG',
        manageSettings:  'ADMIN.MANAGE_SYSTEM_SETTINGS',
        viewDashboard:   'ADMIN.VIEW_DASHBOARD',
        viewAnalytics:   'ADMIN.VIEW_ANALYTICS',
        manageProviders: 'ADMIN.MANAGE_PROVIDERS',
        manageTenants:   'ADMIN.MANAGE_TENANTS',
    },
} as const;
