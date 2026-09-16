/**
 * Resource-level (ABAC) authorization middleware.
 *
 * These go AFTER protect() and permit() to enforce that the authenticated
 * user is actually allowed to touch a specific resource, not just that they
 * hold a permission name globally.
 *
 * Usage:
 *   router.get('/patients/:id', protect, permit('PATIENTS.VIEW_ALL'),
 *              requirePatientAccess(), getPatient);
 */

const mongoose = require('mongoose');

// ── helpers ───────────────────────────────────────────────────────────────────

function forbidden(res, msg = 'You are not authorized to access this resource.') {
    return res.status(403).json({ success: false, message: msg });
}

// ── Patient access ────────────────────────────────────────────────────────────

/**
 * requirePatientAccess(idParam = 'id')
 *
 * Gates access to a patient resource. The requesting user must satisfy at
 * least one of:
 *   a) They ARE the patient (req.user._id === patient._id)
 *   b) They hold PATIENTS.VIEW_SENSITIVE (admin/org-admin unrestricted view)
 *   c) They are a doctor/nurse/staff in the same clinic as the patient
 *      (checked via Appointment history or explicit assignment)
 *
 * Attaches req.targetPatient for downstream controllers so they don't have
 * to re-fetch.
 *
 * Note: this is a best-effort check. Controllers MUST also filter query
 * results by the appropriate clinic/organization scope.
 */
function requirePatientAccess(idParam = 'id') {
    return async (req, res, next) => {
        try {
            if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });

            const patientId = req.params[idParam];
            if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
                return res.status(400).json({ success: false, message: 'Invalid patient ID.' });
            }

            const User = require('../models/User');
            const patient = await User.findById(patientId).select('_id role tenantId').lean();
            if (!patient) {
                // Return 404 to avoid confirming that the patient exists to unauthorized callers
                return res.status(404).json({ success: false, message: 'Patient not found.' });
            }

            const actorId = req.user._id.toString();
            const targetId = patient._id.toString();

            // a) Same person — patient accessing own record
            if (actorId === targetId) {
                req.targetPatient = patient;
                return next();
            }

            // b) Admin / privileged role with PATIENTS.VIEW_SENSITIVE
            const { userHasPermissions } = require('../services/PermissionService');
            const isSensitiveViewer = await userHasPermissions(req.user._id, ['PATIENTS.VIEW_SENSITIVE']);
            if (isSensitiveViewer) {
                req.targetPatient = patient;
                return next();
            }

            // c) Clinical staff — must share a clinic (same tenantId) OR have
            //    an appointment/encounter with the patient.
            const clinicalLegacyRoles = ['doctor', 'nurse', 'reception', 'lab_tech', 'pharmacist', 'emergency', 'admin'];
            if (clinicalLegacyRoles.includes(req.user.role)) {
                // Same tenant check (fast path)
                const actorTenant = req.user.tenantId?.toString();
                const patientTenant = patient.tenantId?.toString();
                if (actorTenant && patientTenant && actorTenant === patientTenant) {
                    req.targetPatient = patient;
                    return next();
                }

                // Doctor-specific: check for any appointment with this patient
                if (req.user.role === 'doctor') {
                    const Appointment = require('../models/Appointment');
                    const linked = await Appointment.exists({
                        patient: patientId,
                        doctor: req.user._id,
                        status: { $ne: 'Cancelled' },
                    });
                    if (linked) {
                        req.targetPatient = patient;
                        return next();
                    }
                }
            }

            return forbidden(res);
        } catch (err) {
            next(err);
        }
    };
}

// ── Appointment access ────────────────────────────────────────────────────────

/**
 * requireAppointmentAccess(idParam = 'id')
 *
 * Ensures the calling user is the patient, the assigned doctor, or clinical
 * staff. Attaches req.targetAppointment.
 */
function requireAppointmentAccess(idParam = 'id') {
    return async (req, res, next) => {
        try {
            if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });

            const appointmentId = req.params[idParam];
            if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) {
                return res.status(400).json({ success: false, message: 'Invalid appointment ID.' });
            }

            const Appointment = require('../models/Appointment');
            const appt = await Appointment.findById(appointmentId).select('patient doctor hospital').lean();
            if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found.' });

            const userId = req.user._id.toString();
            const isPatient = appt.patient?.toString() === userId;
            const isDoctor  = appt.doctor?.toString()  === userId;
            const isStaff   = ['admin', 'nurse', 'reception', 'emergency'].includes(req.user.role);

            if (isPatient || isDoctor || isStaff) {
                req.targetAppointment = appt;
                return next();
            }

            return forbidden(res);
        } catch (err) {
            next(err);
        }
    };
}

// ── Own-record only ───────────────────────────────────────────────────────────

/**
 * requireOwnRecord(userIdParam = 'userId')
 *
 * Ensures the requesting user is the same as the :userId param.
 * Users with ADMIN.VIEW_USERS bypass this check.
 */
function requireOwnRecord(userIdParam = 'userId') {
    return async (req, res, next) => {
        if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });

        const targetId = req.params[userIdParam];
        const actorId  = req.user._id.toString();
        if (actorId === targetId) return next();

        const { userHasPermissions } = require('../services/AuthorizationService');
        const isAdmin = await userHasPermissions(req.user._id, ['ADMIN.VIEW_USERS']);
        if (isAdmin) return next();

        return forbidden(res, 'You can only access your own records.');
    };
}

// ── Tenant isolation ──────────────────────────────────────────────────────────

/**
 * requireSameTenant()
 *
 * Injects req.user.tenantId into every downstream query via res.locals.tenantId.
 * Controllers should always scope queries to res.locals.tenantId.
 *
 * Users with ADMIN.MANAGE_TENANTS (platform-level admins) bypass tenant
 * isolation and may supply an explicit ?tenantId= override for support.
 */
function requireSameTenant() {
    return async (req, res, next) => {
        try {
            if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });

            const { userHasPermissions } = require('../services/AuthorizationService');
            const isPlatformAdmin = await userHasPermissions(req.user._id, ['ADMIN.MANAGE_TENANTS']);

            if (isPlatformAdmin) {
                res.locals.tenantId = req.query.tenantId || null;
            } else {
                const tenantId = req.user.tenantId;
                if (!tenantId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Your account is not associated with an organization.',
                    });
                }
                res.locals.tenantId = tenantId.toString();
            }

            next();
        } catch (err) {
            next(err);
        }
    };
}

/**
 * assertSameTenant(resourceTenantId, req, res)
 *
 * Synchronous helper for controllers: call this after loading a resource to
 * verify the resource belongs to the requesting user's tenant.
 * Returns true when accessible, false (and sends 404) otherwise.
 *
 * Note: platform admins (ADMIN.MANAGE_TENANTS) should use canAccessOrganization()
 * instead for async permission-based bypass.
 */
function assertSameTenant(resourceTenantId, req, res) {
    const userTenant = req.user.tenantId?.toString();
    if (!userTenant || !resourceTenantId) {
        res.status(404).json({ success: false, message: 'Resource not found.' });
        return false;
    }
    if (userTenant !== resourceTenantId.toString()) {
        res.status(404).json({ success: false, message: 'Resource not found.' });
        return false;
    }
    return true;
}

// ── Organization / Clinic scope ───────────────────────────────────────────────

/**
 * canAccessOrganization(actorId, organizationId)
 *
 * Returns true when the actor is allowed to access the given organization:
 *   a) They hold ADMIN.MANAGE_TENANTS (platform-level admin)
 *   b) Their tenantId matches organizationId
 */
async function canAccessOrganization(actorId, organizationId) {
    const { userHasPermissions } = require('../services/AuthorizationService');
    const isPlatformAdmin = await userHasPermissions(actorId, ['ADMIN.MANAGE_TENANTS']);
    if (isPlatformAdmin) return true;

    const User = require('../models/User');
    const user = await User.findById(actorId).select('tenantId').lean();
    if (!user || !user.tenantId) return false;
    return user.tenantId.toString() === organizationId.toString();
}

/**
 * canAccessClinic(actorId, clinicId)
 *
 * Returns true when the actor is allowed to access the given clinic:
 *   a) They hold ADMIN.MANAGE_TENANTS (platform-level admin)
 *   b) They hold CLINIC.VIEW (clinic-scoped admins and staff)
 *
 * Clinic-to-user assignment is enforced by the controller using req.user.clinicId
 * or equivalent when that field is present on the User model.
 */
async function canAccessClinic(actorId, clinicId) { // eslint-disable-line no-unused-vars
    const { userHasPermissions } = require('../services/AuthorizationService');
    const isPlatformAdmin = await userHasPermissions(actorId, ['ADMIN.MANAGE_TENANTS']);
    if (isPlatformAdmin) return true;
    return userHasPermissions(actorId, ['CLINIC.VIEW']);
}

module.exports = {
    requirePatientAccess,
    requireAppointmentAccess,
    requireOwnRecord,
    requireSameTenant,
    assertSameTenant,
    canAccessOrganization,
    canAccessClinic,
};
