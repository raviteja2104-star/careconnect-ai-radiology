const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
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
router.patch('/appointments/:id/status', authorize('admin', 'doctor'), ctrl.setAppointmentStatus);

/* ── Lab bookings (patient) ── */
router.post('/lab-bookings', ctrl.createLabBooking);
router.get('/lab-bookings/mine', ctrl.listMyLabBookings);

/* ── Reviews (patient) ── */
router.post('/providers/:id/reviews', ctrl.createReview);

/* ── Provider-admin (admin, doctor — interim) ── */
router.get('/providers', authorize('admin', 'doctor'), ctrl.listMyProviders);
router.post('/providers', authorize('admin', 'doctor'), ctrl.createProvider);
router.put('/providers/:id', authorize('admin', 'doctor'), ctrl.updateProvider);
router.post('/providers/:id/claim', authorize('admin', 'doctor'), ctrl.claimProvider);

router.get('/providers/:id/doctors', authorize('admin', 'doctor'), ctrl.listDoctors);
router.post('/providers/:id/doctors', authorize('admin', 'doctor'), ctrl.createDoctor);
router.put('/providers/:id/doctors/:doctorId', authorize('admin', 'doctor'), ctrl.updateDoctor);
router.delete('/providers/:id/doctors/:doctorId', authorize('admin', 'doctor'), ctrl.deleteDoctor);

router.get('/providers/:id/services', authorize('admin', 'doctor'), ctrl.listServices);
router.post('/providers/:id/services', authorize('admin', 'doctor'), ctrl.createService);
router.put('/providers/:id/services/:serviceId', authorize('admin', 'doctor'), ctrl.updateService);
router.delete('/providers/:id/services/:serviceId', authorize('admin', 'doctor'), ctrl.deleteService);

router.get('/providers/:id/schedules', authorize('admin', 'doctor'), ctrl.listSchedules);
router.put('/providers/:id/schedules/:doctorId', authorize('admin', 'doctor'), ctrl.putSchedule);

router.get('/providers/:id/exceptions', authorize('admin', 'doctor'), ctrl.listExceptions);
router.post('/providers/:id/exceptions', authorize('admin', 'doctor'), ctrl.createException);
router.delete('/providers/:id/exceptions/:exceptionId', authorize('admin', 'doctor'), ctrl.deleteException);

router.get('/providers/:id/dashboard', authorize('admin', 'doctor'), ctrl.getProviderDashboard);

/* ── Admin only ── */
router.patch('/providers/:id/verify', authorize('admin'), ctrl.verifyProvider);
router.get('/admin/providers', authorize('admin'), ctrl.listAdminProviders);
router.post('/admin/providers/merge', authorize('admin'), ctrl.mergeProviders);

/* ── Admin only — provider import pipeline (item 2) ──
 * Upload -> Parse & Normalize -> Validate -> Duplicate Detection ->
 * Review/Approval -> Import. Nothing here touches the live Provider
 * collection until POST .../commit, and only for rows a human approved. */
router.post('/admin/import/upload', authorize('admin'), upload.single('file'), importCtrl.uploadBatch);
router.get('/admin/import/batches', authorize('admin'), importCtrl.listBatches);
router.get('/admin/import/batches/:id', authorize('admin'), importCtrl.getBatch);
router.get('/admin/import/batches/:id/rows', authorize('admin'), importCtrl.listRows);
router.patch('/admin/import/batches/:id/rows/:rowId', authorize('admin'), importCtrl.decideRow);
router.post('/admin/import/batches/:id/bulk-decide', authorize('admin'), importCtrl.bulkDecide);
router.post('/admin/import/batches/:id/commit', authorize('admin'), importCtrl.commitBatch);

module.exports = router;
