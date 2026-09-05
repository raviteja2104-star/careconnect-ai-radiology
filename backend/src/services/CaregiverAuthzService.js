/**
 * CaregiverAuthzService — the single enforcement point for "who may act on
 * this patient's health-record-capture data", called by every controller
 * action in this feature rather than each handler re-deriving its own rule.
 *
 * Role model (per the feature spec's section 7, mapped onto this codebase's
 * actual User.role enum — see docs/nearby-data-master-plan.md-style honesty
 * note: this codebase does not yet have per-patient staff scoping anywhere
 * (nearbyRoutes.js's own comments call this an "interim role model" for the
 * Nearby module too) — clinical/front-desk roles get a blanket capability
 * gated by role, same interim pattern already used elsewhere, not a new gap
 * introduced here):
 *   - patient: full control of their OWN record only.
 *   - nurse, reception, lab_tech, doctor: may capture documents for ANY
 *     patient (clinical/front-desk capture capability) — this is the
 *     existing codebase-wide interim scoping level, not scoped per-encounter.
 *   - doctor: additionally the only role that can perform CLINICAL review
 *     (VERIFIED status) — nurse/reception/lab_tech capture and can do the
 *     first-pass human review (ACCEPT/EDIT/REJECT of AI fields), but cannot
 *     mark a record clinically VERIFIED.
 *   - admin: may view records and manage configuration/audit, but is
 *     explicitly BLOCKED from editing/approving clinical field values (spec:
 *     "should not silently modify clinical information").
 *   - attendant/caregiver: any user (typically role 'patient', managing a
 *     family member) with an ACTIVE CaregiverAuthorization scoped to the
 *     specific capability being exercised.
 */

const STAFF_CAPTURE_ROLES = ['nurse', 'reception', 'lab_tech', 'doctor'];
const STAFF_VIEW_ROLES = ['nurse', 'reception', 'lab_tech', 'doctor', 'admin'];

async function activeAuthorization(patientId, caregiverUserId) {
    const CaregiverAuthorization = require('../models/CaregiverAuthorization');
    const now = new Date();
    return CaregiverAuthorization.findOne({
        patientId,
        caregiverUserId,
        status: 'ACTIVE',
        startDate: { $lte: now },
        $or: [{ endDate: null }, { endDate: { $gte: now } }],
    }).lean();
}

/** Can `actingUser` upload/capture a document for `patientId`? */
async function canCapture(actingUser, patientId) {
    if (String(actingUser._id) === String(patientId)) return { allowed: true, via: 'self' };
    if (STAFF_CAPTURE_ROLES.includes(actingUser.role)) return { allowed: true, via: 'staff' };
    const auth = await activeAuthorization(patientId, actingUser._id);
    if (auth && auth.permissionScope?.canUploadDocuments) {
        return { allowed: true, via: 'caregiver', authorizationId: auth._id };
    }
    return { allowed: false };
}

/** Can `actingUser` view `patientId`'s health-record-capture data? */
async function canView(actingUser, patientId) {
    if (String(actingUser._id) === String(patientId)) return { allowed: true, via: 'self' };
    if (STAFF_VIEW_ROLES.includes(actingUser.role)) return { allowed: true, via: 'staff' };
    const auth = await activeAuthorization(patientId, actingUser._id);
    if (auth && auth.permissionScope?.canViewRecords) return { allowed: true, via: 'caregiver', authorizationId: auth._id };
    // A RecordShare grant is checked separately (RecordShareService) for
    // non-caregiver, non-staff third parties (e.g. a specialist a patient
    // explicitly shared records with) — kept out of this function so the
    // common self/staff/caregiver path stays a single cheap query.
    return { allowed: false };
}

/** First-pass human review (ACCEPT/EDIT/REJECT of AI-extracted fields) — nurse/reception/lab_tech/doctor/self, never admin. */
function canFirstPassReview(actingUser) {
    return STAFF_CAPTURE_ROLES.includes(actingUser.role);
}

/** Clinical verification (VERIFIED status) — doctor only, per the spec's explicit clinical-review gate. */
function canClinicallyVerify(actingUser) {
    return actingUser.role === 'doctor';
}

/** Patient's own confirmation step (PATIENT_CONFIRMED) — the patient only, never a caregiver acting for them (an attendant's edits stay a caregiver action, not a patient attestation). */
function canPatientConfirm(actingUser, patientId) {
    return String(actingUser._id) === String(patientId);
}

module.exports = {
    STAFF_CAPTURE_ROLES,
    STAFF_VIEW_ROLES,
    canCapture,
    canView,
    canFirstPassReview,
    canClinicallyVerify,
    canPatientConfirm,
    activeAuthorization,
};
