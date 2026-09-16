const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');
const audit = require('../middleware/audit');
const ctrl = require('../controllers/nearbyController');
const importCtrl = require('../controllers/importController');

// Memory storage — files are parsed in-process (ExcelImportParser) and never
// written to disk. 10MB covers the ~200-row master workbook with headroom.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * CareConnect Nearby routes — mounted by server.js at /api/nearby (matches
 * the base URL both web-portal/src/app/nearby/_lib/api.ts,
 * .../nearby/provider/_lib/api.ts and .../admin/nearby/_lib/api.ts already
 * call). Public discovery reads first, then protect+audit for everything
 * else — mirrors billableRoutes.js's protect/authorize layering, except the
 * first block intentionally runs before `protect` so anonymous patients can
 * browse and check availability without an account.
 *
 * Interim role model (per CLAUDE.md build brief): there is no dedicated
 * 'provider' role on User yet, so provider-admin endpoints are gated with
 * authorize('admin', 'doctor') as a stand-in until a scoped provider-staff
 * role ships.
 */

/* ── Public (no auth) ── */
router.get('/search', ctrl.search);
router.get('/localities', ctrl.getLocalities);
router.get('/providers/:id/availability', ctrl.getAvailability);
router.get('/providers/:id', ctrl.getProvider);

/* ── Everything below requires auth ── */
router.use(protect);
router.use(audit('Nearby'));

/* ── Appointments (patient) ── */
router.post('/appointments', ctrl.createAppointment);
router.get('/appointments/mine', ctrl.listMyAppointments);
router.patch('/appointments/:id/cancel', ctrl.cancelAppointment);
router.patch('/appointments/:id/reschedule', ctrl.rescheduleAppointment);
router.post('/appointments/:id/checkin', ctrl.checkinAppointment);
// Reconciles provider _lib's checkInAppointment(), which already calls this path.
router.patch('/appointments/:id/status', permitAny('DOCTOR.VIEW_PATIENTS', 'ADMIN.VIEW_DASHBOARD'), ctrl.setAppointmentStatus);

/* ── Lab bookings (patient) ── */
router.post('/lab-bookings', ctrl.createLabBooking);
router.get('/lab-bookings/mine', ctrl.listMyLabBookings);

/* ── Reviews (patient) ── */
router.post('/providers/:id/reviews', ctrl.createReview);

/* ── Provider-admin (admin, doctor — interim) ── */
router.get('/providers', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.listMyProviders);
router.post('/providers', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.createProvider);
router.put('/providers/:id', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.updateProvider);
router.post('/providers/:id/claim', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.claimProvider);

router.get('/providers/:id/doctors', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.listDoctors);
router.post('/providers/:id/doctors', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.createDoctor);
router.put('/providers/:id/doctors/:doctorId', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.updateDoctor);
router.delete('/providers/:id/doctors/:doctorId', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.deleteDoctor);

router.get('/providers/:id/services', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.listServices);
router.post('/providers/:id/services', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.createService);
router.put('/providers/:id/services/:serviceId', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.updateService);
router.delete('/providers/:id/services/:serviceId', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.deleteService);

router.get('/providers/:id/schedules', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.listSchedules);
router.put('/providers/:id/schedules/:doctorId', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.putSchedule);

router.get('/providers/:id/exceptions', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.listExceptions);
router.post('/providers/:id/exceptions', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.createException);
router.delete('/providers/:id/exceptions/:exceptionId', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.deleteException);

router.get('/providers/:id/dashboard', permitAny('ADMIN.MANAGE_PROVIDERS', 'DOCTOR.VIEW_PATIENTS'), ctrl.getProviderDashboard);

/* ── Admin only ── */
router.patch('/providers/:id/verify', permit('ADMIN.MANAGE_PROVIDERS'), ctrl.verifyProvider);
router.get('/admin/providers', permit('ADMIN.MANAGE_PROVIDERS'), ctrl.listAdminProviders);
router.post('/admin/providers/merge', permit('ADMIN.MANAGE_PROVIDERS'), ctrl.mergeProviders);

/* ── Admin only — provider import pipeline (item 2) ──
 * Upload -> Parse & Normalize -> Validate -> Duplicate Detection ->
 * Review/Approval -> Import. Nothing here touches the live Provider
 * collection until POST .../commit, and only for rows a human approved. */
router.post('/admin/import/upload', permit('ADMIN.MANAGE_PROVIDERS'), upload.single('file'), importCtrl.uploadBatch);
router.get('/admin/import/batches', permit('ADMIN.MANAGE_PROVIDERS'), importCtrl.listBatches);
router.get('/admin/import/batches/:id', permit('ADMIN.MANAGE_PROVIDERS'), importCtrl.getBatch);
router.get('/admin/import/batches/:id/rows', permit('ADMIN.MANAGE_PROVIDERS'), importCtrl.listRows);
router.patch('/admin/import/batches/:id/rows/:rowId', permit('ADMIN.MANAGE_PROVIDERS'), importCtrl.decideRow);
router.post('/admin/import/batches/:id/bulk-decide', permit('ADMIN.MANAGE_PROVIDERS'), importCtrl.bulkDecide);
router.post('/admin/import/batches/:id/commit', permit('ADMIN.MANAGE_PROVIDERS'), importCtrl.commitBatch);

module.exports = router;
