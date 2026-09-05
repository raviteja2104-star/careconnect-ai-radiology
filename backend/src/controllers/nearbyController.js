const Provider = require('../models/Provider');
const { sendEmail, templates } = require('../services/EmailNotificationService');
const ProviderDoctor = require('../models/ProviderDoctor');
const ProviderService = require('../models/ProviderService');
const ProviderSchedule = require('../models/ProviderSchedule');
const ScheduleException = require('../models/ScheduleException');
const NearbyAppointment = require('../models/NearbyAppointment');
const LabTestBooking = require('../models/LabTestBooking');
const ProviderReview = require('../models/ProviderReview');

const GeoSearch = require('../services/GeoSearch');
const AvailabilityEngine = require('../services/AvailabilityEngine');
const ProviderMasterResolver = require('../services/ProviderMasterResolver');
const {
    SlotConflictError,
    generateCandidateSlots,
    normalizeDate,
    generateConfirmationCode,
    ACTIVE_STATUSES,
} = AvailabilityEngine;
const { isOpenNow } = GeoSearch;

/**
 * nearbyController — "CareConnect Nearby" provider discovery, booking, and
 * provider/admin directory management.
 *
 * Response conventions (mirrors billableController):
 *   - Reads return raw JSON matching the shape the web-portal _lib clients
 *     already commit to (see contract notes below); errors are
 *     `{ message }` with an appropriate status code.
 *   - SlotConflictError (from AvailabilityEngine) → 409 with
 *     `{ message, code: 'SLOT_CONFLICT' }`.
 *
 * KNOWN CONTRACT GAPS (documented, not silently papered over):
 *   1. Provider.workingHours ({day:Number 0-6, open, close, is24h}) is
 *      passed through unmodified. The patient _lib's WorkingHoursDay
 *      ({day:string}) and the provider/admin _lib's WorkingHoursDay
 *      ({dayOfWeek:number}) each want a different shape, and disagree with
 *      each other — reconciling both would mean picking a winner and
 *      editing frontend code, which is out of scope here. UI components
 *      reading `workingHours` off provider responses should be adjusted to
 *      the real `{day, open, close, is24h}` shape as a follow-up.
 *   2. GeoSearch.buildBaseQuery matches `specialty` as a single exact array
 *      element (`query.specialties = specialty`). The patient UI's
 *      multiselect joins choices with a comma; GeoSearch itself was
 *      explicitly listed as pre-existing, wire-don't-guess code, so this
 *      controller passes `specialty` through unchanged — multi-specialty
 *      filtering degrades to (usually empty) exact match. A fix belongs in
 *      GeoSearch.buildBaseQuery, not here.
 *   3. Appointment status strings are the model's real enum
 *      (PENDING/CONFIRMED/CHECKED_IN/COMPLETED/CANCELLED/NO_SHOW) for the
 *      patient-facing endpoints — the patient _lib's AppointmentRecord.status
 *      type already includes `| string` so this is compatible. For the
 *      provider-dashboard endpoints, PENDING is mapped to 'BOOKED' to match
 *      the provider _lib's closed AppointmentStatus union exactly.
 *   4. ScheduleException has no `reason` field; POSTing one is accepted
 *      (matches the provider _lib's AvailabilityException.reason) but is
 *      silently dropped by Mongoose (schema doesn't declare the path).
 *   5. PATCH /appointments/:id/status is an addition beyond the brief's
 *      route list, added because the provider _lib's checkInAppointment()
 *      already calls it — reconciling toward what the frontend expects.
 */

/* ─────────────────────────────── helpers ─────────────────────────────── */

function todayStr() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function toIsoDate(d) {
    if (!d) return d;
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toISOString().slice(0, 10);
}

function serializeProviderBase(p) {
    const coords = p.geo && p.geo.coordinates;
    return {
        _id: String(p._id),
        name: p.name,
        type: p.type,
        providerTypeId: p.providerTypeId ? String(p.providerTypeId) : null,
        subtype: p.subtype,
        description: p.description,
        locality: p.locality,
        localityId: p.localityId ? String(p.localityId) : null,
        address: p.address,
        city: p.city,
        state: p.state,
        pincode: p.pincode,
        geo: Array.isArray(coords) && coords.length === 2 ? { lat: coords[1], lng: coords[0] } : undefined,
        distanceKm: p.distanceKm != null ? p.distanceKm : null,
        openNow: !!p.openNow,
        verificationStatus: p.verificationStatus,
        careconnectVerified: !!p.careconnectVerified,
        servicesOffered: p.servicesOffered || [],
        specialties: p.specialties || [],
        consultationFeeRange: p.consultationFeeRange,
        insuranceAccepted: p.insuranceAccepted || [],
        homeCollection: !!p.homeCollection,
        teleconsultation: !!p.teleconsultation,
        emergencyAvailable: !!p.emergencyAvailable,
        appointmentEnabled: !!p.appointmentEnabled,
        photos: p.photos || [],
        logo: p.logo,
        phone: p.phone,
        email: p.email,
        website: p.website,
        workingHours: p.workingHours,
        lastVerifiedAt: p.lastVerifiedAt,
        verifiedByUserId: p.verifiedByUserId ? String(p.verifiedByUserId) : null,
        verificationNotes: p.verificationNotes,
        claimedByUserId: p.claimedByUserId ? String(p.claimedByUserId) : null,
        discovery: p.discovery
            ? {
                  source: p.discovery.source,
                  sourceUrl: p.discovery.sourceUrl,
                  importedAt: p.discovery.importedAt,
                  lastCheckedAt: p.discovery.lastCheckedAt,
              }
            : undefined,
        active: p.active,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
    };
}

/** Batch-annotate GeoSearch results with availableToday + reviewSummary (one query each for the whole page, not per-row). */
async function enrichProviders(list) {
    if (!list.length) return [];
    const ids = list.map((p) => p._id);
    const [availFlags, reviewAgg] = await Promise.all([
        Promise.all(list.map((p) => AvailabilityEngine.hasAvailabilityToday(p._id))),
        ProviderReview.aggregate([
            { $match: { providerId: { $in: ids } } },
            { $group: { _id: '$providerId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]),
    ]);
    const reviewMap = new Map(reviewAgg.map((r) => [String(r._id), { avg: Math.round(r.avg * 10) / 10, count: r.count }]));
    return list.map((p, i) => ({
        ...serializeProviderBase(p),
        availableToday: availFlags[i],
        reviewSummary: reviewMap.get(String(p._id)),
    }));
}

function serializeDoctor(d) {
    return {
        _id: String(d._id),
        providerId: String(d.providerId),
        name: d.name,
        specialty: d.specialty,
        specialties: d.specialties,
        qualification: d.qualification,
        registrationNumber: d.registrationNumber,
        experienceYears: d.experienceYears,
        languages: d.languages,
        photo: d.photo,
        bio: d.bio,
        consultationFee: d.consultationFee,
        consultationTypes: d.consultationTypes,
        appointmentEnabled: !!d.appointmentEnabled,
        verified: !!d.verified,
        active: !!d.active,
    };
}

function serializeService(s) {
    return {
        _id: String(s._id),
        providerId: String(s.providerId),
        name: s.name,
        category: s.category,
        price: s.price,
        durationMinutes: s.durationMinutes,
        department: s.department,
        doctorId: s.doctorId ? String(s.doctorId) : null,
        homeCollection: !!s.homeCollection,
        onlineBooking: !!s.onlineBooking,
        active: !!s.active,
    };
}

function serializeAppointmentForPatient(a, extra = {}) {
    return {
        _id: String(a._id),
        providerId: String(a.providerId),
        providerName: extra.providerName,
        providerLocality: extra.providerLocality,
        doctorId: a.doctorId ? String(a.doctorId) : undefined,
        doctorName: extra.doctorName,
        serviceId: a.serviceId ? String(a.serviceId) : undefined,
        serviceName: extra.serviceName,
        type: a.type,
        date: toIsoDate(a.date),
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
        patientDetails: a.patientDetails,
        paymentMode: a.paymentMode,
        confirmationCode: a.confirmationCode,
        createdAt: a.createdAt,
    };
}

/** Provider-dashboard shape: PENDING -> 'BOOKED' to match the provider _lib's closed AppointmentStatus union. */
function serializeAppointmentForProvider(a) {
    return {
        _id: String(a._id),
        providerId: String(a.providerId),
        doctorId: a.doctorId ? String(a.doctorId) : undefined,
        serviceId: a.serviceId ? String(a.serviceId) : undefined,
        type: a.type,
        date: toIsoDate(a.date),
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status === 'PENDING' ? 'BOOKED' : a.status,
        patientDetails: a.patientDetails,
        confirmationCode: a.confirmationCode,
        paymentMode: a.paymentMode,
        paymentStatus: a.paymentStatus,
    };
}

function serializeLabBooking(b, providerName) {
    return {
        _id: String(b._id),
        providerId: String(b.providerId),
        providerName,
        tests: (b.tests || []).map((t) => t.name),
        collectionMethod: b.collectionMethod === 'home_collection' ? 'home' : 'lab',
        date: toIsoDate(b.date),
        slot: b.slot,
        address: b.address,
        status: b.status,
        confirmationCode: b.confirmationCode,
        createdAt: b.createdAt,
    };
}

const FRONTEND_TO_MODEL_EXCEPTION_TYPE = { HOLIDAY: 'holiday', CLOSED: 'closed', CUSTOM_HOURS: 'extra' };
const MODEL_TO_FRONTEND_EXCEPTION_TYPE = { holiday: 'HOLIDAY', closed: 'CLOSED', extra: 'CUSTOM_HOURS' };

function serializeException(e) {
    return {
        _id: String(e._id),
        providerId: String(e.providerId),
        doctorId: e.doctorId ? String(e.doctorId) : null,
        date: toIsoDate(e.date),
        type: MODEL_TO_FRONTEND_EXCEPTION_TYPE[e.type] || e.type,
        startTime: e.overrideHours && e.overrideHours.startTime,
        endTime: e.overrideHours && e.overrideHours.endTime,
    };
}

function isCastError(err) {
    return err && err.name === 'CastError';
}
function isValidationError(err) {
    return err && err.name === 'ValidationError';
}

const PROVIDER_EDITABLE_FIELDS = [
    'name', 'subtype', 'description', 'logo', 'photos', 'address',
    'city', 'state', 'pincode', 'phone', 'email', 'website', 'workingHours',
    'emergencyAvailable', 'servicesOffered', 'specialties', 'consultationFeeRange',
    'insuranceAccepted', 'homeCollection', 'teleconsultation', 'appointmentEnabled', 'orgId',
];
// type/locality are handled separately via ProviderMasterResolver (accepts
// either the raw string or an *Id — never written to the document as-is).
function pickProviderEditable(body) {
    const out = {};
    for (const f of PROVIDER_EDITABLE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(body || {}, f)) out[f] = body[f];
    }
    return out;
}

/* ═════════════════════════════════ PUBLIC ═════════════════════════════════ */

// GET /api/nearby/search
exports.search = async (req, res) => {
    try {
        const q = req.query;
        const params = {
            lat: q.lat !== undefined ? Number(q.lat) : undefined,
            lng: q.lng !== undefined ? Number(q.lng) : undefined,
            radiusKm: q.radiusKm !== undefined ? Number(q.radiusKm) : undefined,
            type: q.type || undefined,
            specialty: q.specialty || undefined,
            q: q.q || undefined,
            openNow: q.openNow === 'true',
            availableToday: q.availableToday === 'true',
            verifiedOnly: q.verifiedOnly === 'true',
            homeCollection: q.homeCollection === 'true',
            teleconsultation: q.teleconsultation === 'true',
            emergency: q.emergency === 'true',
            maxFee: q.maxFee !== undefined ? Number(q.maxFee) : undefined,
            page: q.page !== undefined ? Number(q.page) : undefined,
            limit: q.limit !== undefined ? Number(q.limit) : undefined,
        };
        const { results, total } = await GeoSearch.searchProviders(params);
        const enriched = await enrichProviders(results);
        res.json({ results: enriched, total });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/nearby/localities — the full Locality master (database-backed,
// not the old hardcoded 13-item enum), city-region entries only by default.
exports.getLocalities = async (req, res) => {
    try {
        const Locality = require('../models/Locality');
        const includeDistrictWide = req.query.includeDistrictWide === 'true';
        const filter = { active: { $ne: false } };
        if (!includeDistrictWide) filter.region = 'city';
        const rows = await Locality.find(filter).sort({ name: 1 }).lean();
        res.json({ localities: rows.map((l) => l.name) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/nearby/providers/:id
exports.getProvider = async (req, res) => {
    try {
        const provider = await Provider.findById(req.params.id).lean();
        if (!provider) return res.status(404).json({ message: 'Provider not found.' });

        const [doctors, services] = await Promise.all([
            ProviderDoctor.find({ providerId: provider._id, active: true }).lean(),
            ProviderService.find({ providerId: provider._id, active: true }).lean(),
        ]);

        const [enriched] = await enrichProviders([
            { ...provider, distanceKm: null, openNow: isOpenNow(provider.workingHours) },
        ]);

        const bookableDoctors = doctors.filter((d) => (d.consultationTypes || []).length > 0).slice(0, 5);
        const today = todayStr();
        const slotLists = await Promise.all(
            bookableDoctors.map((d) =>
                AvailabilityEngine.computeSlots({ providerId: provider._id, doctorId: d._id, date: today }).catch(() => [])
            )
        );
        const todaySlotsPreview = slotLists
            .flat()
            .filter((s) => s.status === 'available')
            .slice(0, 4)
            .map((s) => ({ startTime: s.startTime }));

        res.json({
            provider: enriched,
            doctors: doctors.map(serializeDoctor),
            services: services.map(serializeService),
            todaySlotsPreview: todaySlotsPreview.length ? todaySlotsPreview : undefined,
        });
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Provider not found.' });
        res.status(500).json({ message: err.message });
    }
};

// GET /api/nearby/providers/:id/availability?date=&doctorId=
exports.getAvailability = async (req, res) => {
    try {
        const { date, doctorId } = req.query;
        if (!date) return res.status(400).json({ message: 'date (YYYY-MM-DD) is required.' });
        const slots = await AvailabilityEngine.computeSlots({ providerId: req.params.id, doctorId: doctorId || null, date });
        res.json({ slots });
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Provider not found.' });
        res.status(500).json({ message: err.message });
    }
};

/* ═══════════════════════════ AUTHENTICATED (patient) ═══════════════════════════ */

// POST /api/nearby/appointments
exports.createAppointment = async (req, res) => {
    try {
        const { providerId, doctorId, serviceId, type, date, startTime, patientDetails, paymentMode, notes } = req.body;
        if (!providerId || !type || !date || !startTime || !patientDetails || !patientDetails.name) {
            return res.status(400).json({ message: 'providerId, type, date, startTime and patientDetails.name are required.' });
        }
        const appt = await AvailabilityEngine.bookSlot({
            patientId: req.user._id,
            providerId,
            doctorId: doctorId || null,
            serviceId: serviceId || null,
            type,
            date,
            startTime,
            patientDetails,
            paymentMode,
            notes,
            createdVia: 'app',
            tenantId: req.user.tenantId || 't-default',
            traceId: req.headers['x-trace-id'],
        });

        const [provider, doctor, service] = await Promise.all([
            Provider.findById(providerId).select('name locality').lean(),
            doctorId ? ProviderDoctor.findById(doctorId).select('name').lean() : null,
            serviceId ? ProviderService.findById(serviceId).select('name').lean() : null,
        ]);

        const apptObj = appt.toObject ? appt.toObject() : appt;
        const serialized = serializeAppointmentForPatient(apptObj, {
            providerName: provider && provider.name,
            providerLocality: provider && provider.locality,
            doctorName: doctor && doctor.name,
            serviceName: service && service.name,
        });
        res.status(201).json({ appointment: serialized });

        // Fire confirmation email non-blocking
        const toEmail = patientDetails.email || (req.user && req.user.email);
        if (toEmail) {
            const { subject, html } = templates.appointmentConfirmationEmail({
                patientName:      patientDetails.name,
                doctorName:       (doctor && doctor.name) || (provider && provider.name) || 'Your provider',
                specialty:        patientDetails.specialty || '',
                date:             date,
                time:             startTime,
                address:          provider && provider.locality,
                bookingId:        serialized.confirmationCode || String(apptObj._id),
                consultationType: type,
            });
            void sendEmail({ to: toEmail, toName: patientDetails.name, subject, html });
        }
    } catch (err) {
        if (err instanceof SlotConflictError || err.code === 'SLOT_CONFLICT') {
            return res.status(409).json({ message: err.message, code: 'SLOT_CONFLICT' });
        }
        if (isValidationError(err)) return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

// GET /api/nearby/appointments/mine?status=
exports.listMyAppointments = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { patientId: req.user._id };
        if (status) filter.status = status;
        const appts = await NearbyAppointment.find(filter).sort({ date: -1, startTime: -1 }).limit(200).lean();

        const providerIds = [...new Set(appts.map((a) => String(a.providerId)))];
        const doctorIds = [...new Set(appts.filter((a) => a.doctorId).map((a) => String(a.doctorId)))];
        const serviceIds = [...new Set(appts.filter((a) => a.serviceId).map((a) => String(a.serviceId)))];

        const [providers, doctors, services] = await Promise.all([
            Provider.find({ _id: { $in: providerIds } }).select('name locality').lean(),
            doctorIds.length ? ProviderDoctor.find({ _id: { $in: doctorIds } }).select('name').lean() : [],
            serviceIds.length ? ProviderService.find({ _id: { $in: serviceIds } }).select('name').lean() : [],
        ]);
        const pMap = new Map(providers.map((p) => [String(p._id), p]));
        const dMap = new Map(doctors.map((d) => [String(d._id), d]));
        const sMap = new Map(services.map((s) => [String(s._id), s]));

        const appointments = appts.map((a) =>
            serializeAppointmentForPatient(a, {
                providerName: pMap.get(String(a.providerId)) && pMap.get(String(a.providerId)).name,
                providerLocality: pMap.get(String(a.providerId)) && pMap.get(String(a.providerId)).locality,
                doctorName: a.doctorId ? dMap.get(String(a.doctorId)) && dMap.get(String(a.doctorId)).name : undefined,
                serviceName: a.serviceId ? sMap.get(String(a.serviceId)) && sMap.get(String(a.serviceId)).name : undefined,
            })
        );
        res.json({ appointments });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PATCH /api/nearby/appointments/:id/cancel
exports.cancelAppointment = async (req, res) => {
    try {
        const appt = await NearbyAppointment.findById(req.params.id);
        if (!appt) return res.status(404).json({ message: 'Appointment not found.' });
        if (String(appt.patientId) !== String(req.user._id)) return res.status(403).json({ message: 'Not your appointment.' });
        if (!ACTIVE_STATUSES.includes(appt.status)) {
            return res.status(409).json({ message: `Cannot cancel an appointment with status ${appt.status}.` });
        }
        appt.status = 'CANCELLED';
        appt.cancelReason = req.body && req.body.reason;
        await appt.save();
        res.json({ ok: true, appointment: serializeAppointmentForPatient(appt.toObject()) });
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Appointment not found.' });
        res.status(500).json({ message: err.message });
    }
};

// PATCH /api/nearby/appointments/:id/reschedule  { date, startTime }
exports.rescheduleAppointment = async (req, res) => {
    try {
        const appt = await NearbyAppointment.findById(req.params.id);
        if (!appt) return res.status(404).json({ message: 'Appointment not found.' });
        if (String(appt.patientId) !== String(req.user._id)) return res.status(403).json({ message: 'Not your appointment.' });
        if (!ACTIVE_STATUSES.includes(appt.status)) {
            return res.status(409).json({ message: `Cannot reschedule an appointment with status ${appt.status}.` });
        }
        const { date, startTime } = req.body;
        if (!date || !startTime) return res.status(400).json({ message: 'date and startTime are required.' });

        const resolved = await AvailabilityEngine._resolveDaySchedule({
            providerId: appt.providerId,
            doctorId: appt.doctorId,
            date,
        });
        if (resolved.closed) {
            return res.status(409).json({ message: 'This provider has no availability on the selected date.', code: 'SLOT_CONFLICT' });
        }
        const candidates = generateCandidateSlots(resolved);
        const match = candidates.find((s) => s.startTime === startTime);
        if (!match) return res.status(409).json({ message: 'The selected time is not a valid slot.', code: 'SLOT_CONFLICT' });

        const dayStart = normalizeDate(date);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
        const activeCount = await NearbyAppointment.countDocuments({
            _id: { $ne: appt._id },
            providerId: appt.providerId,
            doctorId: appt.doctorId || null,
            date: { $gte: dayStart, $lte: dayEnd },
            startTime,
            status: { $in: ACTIVE_STATUSES },
        });
        if (activeCount >= resolved.maxPerSlot) {
            return res.status(409).json({ message: 'This slot was just filled — please pick another time.', code: 'SLOT_CONFLICT' });
        }

        appt.date = dayStart;
        appt.startTime = match.startTime;
        appt.endTime = match.endTime;
        try {
            await appt.save();
        } catch (err) {
            if (err && err.code === 11000) {
                return res.status(409).json({ message: 'This slot was just booked by someone else — please choose another time.', code: 'SLOT_CONFLICT' });
            }
            throw err;
        }
        res.json({ ok: true, appointment: serializeAppointmentForPatient(appt.toObject()) });
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Appointment not found.' });
        res.status(500).json({ message: err.message });
    }
};

// POST /api/nearby/appointments/:id/checkin — patient self check-in
exports.checkinAppointment = async (req, res) => {
    try {
        const appt = await NearbyAppointment.findById(req.params.id);
        if (!appt) return res.status(404).json({ message: 'Appointment not found.' });
        if (String(appt.patientId) !== String(req.user._id)) return res.status(403).json({ message: 'Not your appointment.' });
        if (!['PENDING', 'CONFIRMED'].includes(appt.status)) {
            return res.status(409).json({ message: `Cannot check in from status ${appt.status}.` });
        }
        appt.status = 'CHECKED_IN';
        await appt.save();
        res.json({ ok: true, appointment: serializeAppointmentForPatient(appt.toObject()) });
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Appointment not found.' });
        res.status(500).json({ message: err.message });
    }
};

// PATCH /api/nearby/appointments/:id/status — provider-admin status transitions.
// Reconciles the provider _lib's checkInAppointment(), which already calls this
// endpoint (see module doc note #5). Ownership-of-provider is not yet enforced
// beyond the interim admin/doctor role gate (documented gap — no provider-staff
// scoping exists on User yet).
exports.setAppointmentStatus = async (req, res) => {
    try {
        const appt = await NearbyAppointment.findById(req.params.id);
        if (!appt) return res.status(404).json({ message: 'Appointment not found.' });
        const { status } = req.body;
        const ALLOWED = ['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'NO_SHOW', 'CANCELLED'];
        if (!ALLOWED.includes(status)) return res.status(400).json({ message: `status must be one of ${ALLOWED.join(', ')}.` });
        appt.status = status;
        await appt.save();
        res.json(serializeAppointmentForProvider(appt.toObject()));
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Appointment not found.' });
        res.status(500).json({ message: err.message });
    }
};

// POST /api/nearby/lab-bookings
exports.createLabBooking = async (req, res) => {
    try {
        const { providerId, tests, collectionMethod, date, slot, address } = req.body;
        if (!providerId || !Array.isArray(tests) || tests.length === 0 || !collectionMethod || !date || !slot) {
            return res.status(400).json({ message: 'providerId, tests, collectionMethod, date and slot are required.' });
        }
        const modelCollectionMethod = collectionMethod === 'home' ? 'home_collection' : collectionMethod === 'lab' ? 'center_visit' : null;
        if (!modelCollectionMethod) return res.status(400).json({ message: "collectionMethod must be 'home' or 'lab'." });
        if (modelCollectionMethod === 'home_collection' && !address) {
            return res.status(400).json({ message: 'address is required for home collection.' });
        }

        const services = await ProviderService.find({ providerId, name: { $in: tests }, active: true }).lean();
        const byName = new Map(services.map((s) => [s.name, s]));
        const missing = tests.filter((t) => !byName.has(t));
        if (missing.length) return res.status(400).json({ message: `Unknown test(s) for this provider: ${missing.join(', ')}` });

        const testDocs = tests.map((t) => ({ name: t, price: byName.get(t).price }));
        const totalPrice = testDocs.reduce((sum, t) => sum + t.price, 0);

        const booking = await LabTestBooking.create({
            patientId: req.user._id,
            providerId,
            tests: testDocs,
            collectionMethod: modelCollectionMethod,
            address,
            date: normalizeDate(date),
            slot,
            totalPrice,
            confirmationCode: generateConfirmationCode(),
            tenantId: req.user.tenantId || 't-default',
        });

        const provider = await Provider.findById(providerId).select('name').lean();
        const serializedBooking = serializeLabBooking(booking.toObject(), provider && provider.name);
        res.status(201).json({ booking: serializedBooking });

        // Fire confirmation email non-blocking
        const toEmail = req.user && req.user.email;
        if (toEmail) {
            const { subject, html } = templates.labBookingConfirmationEmail({
                patientName:      req.user.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : 'Patient',
                testName:         tests.join(', '),
                providerName:     provider && provider.name,
                collectionMethod: collectionMethod === 'home' ? 'Home collection' : 'Centre visit',
                date,
                time:             slot,
                address:          address || '',
                bookingId:        booking.confirmationCode || String(booking._id),
            });
            void sendEmail({ to: toEmail, subject, html });
        }
    } catch (err) {
        if (err && err.code === 11000) return res.status(409).json({ message: 'Duplicate booking, please retry.' });
        if (isValidationError(err)) return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

// GET /api/nearby/lab-bookings/mine
exports.listMyLabBookings = async (req, res) => {
    try {
        const bookings = await LabTestBooking.find({ patientId: req.user._id }).sort({ date: -1 }).limit(200).lean();
        const providerIds = [...new Set(bookings.map((b) => String(b.providerId)))];
        const providers = await Provider.find({ _id: { $in: providerIds } }).select('name').lean();
        const pMap = new Map(providers.map((p) => [String(p._id), p.name]));
        res.json({ bookings: bookings.map((b) => serializeLabBooking(b, pMap.get(String(b.providerId)))) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/nearby/providers/:id/reviews  { appointmentId, rating, comment }
exports.createReview = async (req, res) => {
    try {
        const { appointmentId, rating, comment } = req.body;
        if (!appointmentId || rating == null) return res.status(400).json({ message: 'appointmentId and rating are required.' });

        const appt = await NearbyAppointment.findById(appointmentId);
        if (!appt) return res.status(404).json({ message: 'Appointment not found.' });
        if (String(appt.patientId) !== String(req.user._id)) return res.status(403).json({ message: 'This appointment does not belong to you.' });
        if (String(appt.providerId) !== String(req.params.id)) return res.status(400).json({ message: 'Appointment does not match this provider.' });
        if (appt.status !== 'COMPLETED') return res.status(409).json({ message: 'Only completed visits can be reviewed.' });

        const review = await ProviderReview.create({
            providerId: appt.providerId,
            patientId: req.user._id,
            appointmentId: appt._id,
            rating,
            comment,
        });
        res.status(201).json({ review });
    } catch (err) {
        if (err && err.code === 11000) return res.status(409).json({ message: 'You already reviewed this visit.' });
        if (isValidationError(err)) return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

/* ═══════════════════════════ PROVIDER-ADMIN (admin, doctor) ═══════════════════════════ */

// GET /api/nearby/providers?claimedByUserId=me — "my providers" (provider _lib's fetchMyProviders).
exports.listMyProviders = async (req, res) => {
    try {
        const { claimedByUserId } = req.query;
        const filter = {};
        if (!claimedByUserId || claimedByUserId === 'me') {
            filter.claimedByUserId = req.user._id;
        } else if (req.user.role === 'admin') {
            filter.claimedByUserId = claimedByUserId;
        } else {
            filter.claimedByUserId = req.user._id;
        }
        const providers = await Provider.find(filter).sort({ createdAt: -1 }).lean();
        res.json(providers.map(serializeProviderBase));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/nearby/providers
exports.createProvider = async (req, res) => {
    try {
        const body = pickProviderEditable(req.body);
        if (!body.name || !(req.body.type || req.body.providerTypeId)) {
            return res.status(400).json({ message: 'name and type (or providerTypeId) are required.' });
        }
        const masterFields = await ProviderMasterResolver.resolveProviderFields(req.body);
        const provider = await Provider.create({
            ...body,
            ...masterFields,
            discovery: { source: 'admin' },
            claimedByUserId: req.user._id,
            verificationStatus: 'UNVERIFIED',
        });
        res.status(201).json(serializeProviderBase(provider.toObject()));
    } catch (err) {
        if (err instanceof ProviderMasterResolver.UnresolvedMasterReferenceError) {
            return res.status(400).json({ message: err.message });
        }
        if (isValidationError(err)) return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/nearby/providers/:id
exports.updateProvider = async (req, res) => {
    try {
        const provider = await Provider.findById(req.params.id);
        if (!provider) return res.status(404).json({ message: 'Provider not found.' });
        if (req.user.role !== 'admin' && String(provider.claimedByUserId || '') !== String(req.user._id)) {
            return res.status(403).json({ message: 'You do not manage this provider.' });
        }
        const masterFields = await ProviderMasterResolver.resolveProviderFields(req.body);
        Object.assign(provider, pickProviderEditable(req.body), masterFields);
        await provider.save();
        res.json(serializeProviderBase(provider.toObject()));
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Provider not found.' });
        if (err instanceof ProviderMasterResolver.UnresolvedMasterReferenceError) {
            return res.status(400).json({ message: err.message });
        }
        if (isValidationError(err)) return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

// POST /api/nearby/providers/:id/claim
exports.claimProvider = async (req, res) => {
    try {
        const provider = await Provider.findById(req.params.id);
        if (!provider) return res.status(404).json({ message: 'Provider not found.' });
        if (provider.claimedByUserId && String(provider.claimedByUserId) !== String(req.user._id)) {
            return res.status(409).json({ message: 'This provider listing has already been claimed.' });
        }
        provider.claimedByUserId = req.user._id;
        if (provider.verificationStatus === 'UNVERIFIED') provider.verificationStatus = 'CLAIMED';
        await provider.save();
        res.json(serializeProviderBase(provider.toObject()));
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Provider not found.' });
        res.status(500).json({ message: err.message });
    }
};

// GET /api/nearby/providers/:id/doctors
exports.listDoctors = async (req, res) => {
    try {
        const docs = await ProviderDoctor.find({ providerId: req.params.id }).lean();
        res.json(docs.map(serializeDoctor));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/nearby/providers/:id/doctors
exports.createDoctor = async (req, res) => {
    try {
        const { name, specialty } = req.body;
        if (!name || !specialty) return res.status(400).json({ message: 'name and specialty are required.' });
        const doc = await ProviderDoctor.create({ ...req.body, providerId: req.params.id });
        res.status(201).json(serializeDoctor(doc.toObject()));
    } catch (err) {
        if (isValidationError(err)) return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/nearby/providers/:id/doctors/:doctorId
exports.updateDoctor = async (req, res) => {
    try {
        const doc = await ProviderDoctor.findOne({ _id: req.params.doctorId, providerId: req.params.id });
        if (!doc) return res.status(404).json({ message: 'Doctor not found.' });
        Object.assign(doc, req.body);
        await doc.save();
        res.json(serializeDoctor(doc.toObject()));
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Doctor not found.' });
        if (isValidationError(err)) return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/nearby/providers/:id/doctors/:doctorId — soft deactivate.
exports.deleteDoctor = async (req, res) => {
    try {
        const doc = await ProviderDoctor.findOne({ _id: req.params.doctorId, providerId: req.params.id });
        if (!doc) return res.status(404).json({ message: 'Doctor not found.' });
        doc.active = false;
        await doc.save();
        res.json({ ok: true });
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Doctor not found.' });
        res.status(500).json({ message: err.message });
    }
};

// GET /api/nearby/providers/:id/services
exports.listServices = async (req, res) => {
    try {
        const docs = await ProviderService.find({ providerId: req.params.id }).lean();
        res.json(docs.map(serializeService));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/nearby/providers/:id/services
exports.createService = async (req, res) => {
    try {
        const { name, price } = req.body;
        if (!name || price == null) return res.status(400).json({ message: 'name and price are required.' });
        const doc = await ProviderService.create({ ...req.body, providerId: req.params.id });
        res.status(201).json(serializeService(doc.toObject()));
    } catch (err) {
        if (isValidationError(err)) return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/nearby/providers/:id/services/:serviceId
exports.updateService = async (req, res) => {
    try {
        const doc = await ProviderService.findOne({ _id: req.params.serviceId, providerId: req.params.id });
        if (!doc) return res.status(404).json({ message: 'Service not found.' });
        Object.assign(doc, req.body);
        await doc.save();
        res.json(serializeService(doc.toObject()));
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Service not found.' });
        if (isValidationError(err)) return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/nearby/providers/:id/services/:serviceId — soft deactivate.
exports.deleteService = async (req, res) => {
    try {
        const doc = await ProviderService.findOne({ _id: req.params.serviceId, providerId: req.params.id });
        if (!doc) return res.status(404).json({ message: 'Service not found.' });
        doc.active = false;
        await doc.save();
        res.json({ ok: true });
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Service not found.' });
        res.status(500).json({ message: err.message });
    }
};

// GET /api/nearby/providers/:id/schedules — one ProviderSchedule doc per
// (doctor, day-of-week) in the DB is aggregated into one DoctorSchedule per
// doctor (days:[0..6]) to match the provider _lib's DoctorSchedule shape.
exports.listSchedules = async (req, res) => {
    try {
        const rows = await ProviderSchedule.find({ providerId: req.params.id, doctorId: { $ne: null } }).lean();
        const byDoctor = new Map();
        for (const r of rows) {
            const key = String(r.doctorId);
            if (!byDoctor.has(key)) byDoctor.set(key, []);
            byDoctor.get(key).push(r);
        }
        const result = [];
        for (const [doctorId, days] of byDoctor) {
            const dayMap = new Map(days.map((d) => [d.dayOfWeek, d]));
            const daysArr = [0, 1, 2, 3, 4, 5, 6].map((dow) => {
                const d = dayMap.get(dow);
                if (!d) return { dayOfWeek: dow, active: false, breaks: [] };
                return {
                    dayOfWeek: dow,
                    active: !!d.active,
                    startTime: d.startTime,
                    endTime: d.endTime,
                    slotDurationMinutes: d.slotMinutes,
                    breaks: (d.breaks || []).map((b) => ({ start: b.start, end: b.end })),
                };
            });
            result.push({ _id: doctorId, providerId: req.params.id, doctorId, days: daysArr });
        }
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/nearby/providers/:id/schedules/:doctorId  { days: ScheduleDay[] }
exports.putSchedule = async (req, res) => {
    try {
        const { providerId: pIdParam, doctorId: dIdParam } = { providerId: req.params.id, doctorId: req.params.doctorId };
        const days = Array.isArray(req.body.days) ? req.body.days : [];
        for (const day of days) {
            if (day.dayOfWeek == null) continue;
            await ProviderSchedule.findOneAndUpdate(
                { providerId: pIdParam, doctorId: dIdParam, dayOfWeek: day.dayOfWeek },
                {
                    $set: {
                        active: !!day.active,
                        startTime: day.startTime || '09:00',
                        endTime: day.endTime || '17:00',
                        slotMinutes: day.slotDurationMinutes || 15,
                        breaks: (day.breaks || []).map((b) => ({ start: b.start, end: b.end })),
                    },
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }
        const rows = await ProviderSchedule.find({ providerId: pIdParam, doctorId: dIdParam }).lean();
        const dayMap = new Map(rows.map((d) => [d.dayOfWeek, d]));
        const daysArr = [0, 1, 2, 3, 4, 5, 6].map((dow) => {
            const d = dayMap.get(dow);
            if (!d) return { dayOfWeek: dow, active: false, breaks: [] };
            return {
                dayOfWeek: dow,
                active: !!d.active,
                startTime: d.startTime,
                endTime: d.endTime,
                slotDurationMinutes: d.slotMinutes,
                breaks: (d.breaks || []).map((b) => ({ start: b.start, end: b.end })),
            };
        });
        res.json({ _id: dIdParam, providerId: pIdParam, doctorId: dIdParam, days: daysArr });
    } catch (err) {
        if (isValidationError(err)) return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

// GET /api/nearby/providers/:id/exceptions
exports.listExceptions = async (req, res) => {
    try {
        const rows = await ScheduleException.find({ providerId: req.params.id }).sort({ date: 1 }).lean();
        res.json(rows.map(serializeException));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/nearby/providers/:id/exceptions
exports.createException = async (req, res) => {
    try {
        const { doctorId, date, type, startTime, endTime } = req.body;
        if (!date || !type) return res.status(400).json({ message: 'date and type are required.' });
        const modelType = FRONTEND_TO_MODEL_EXCEPTION_TYPE[type] || type;
        if (!['holiday', 'extra', 'closed'].includes(modelType)) {
            return res.status(400).json({ message: 'type must be HOLIDAY, CLOSED or CUSTOM_HOURS.' });
        }
        const doc = await ScheduleException.create({
            providerId: req.params.id,
            doctorId: doctorId || null,
            date: normalizeDate(date),
            type: modelType,
            overrideHours: modelType === 'extra' ? { startTime, endTime } : undefined,
        });
        res.status(201).json(serializeException(doc.toObject()));
    } catch (err) {
        if (isValidationError(err)) return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/nearby/providers/:id/exceptions/:exceptionId
exports.deleteException = async (req, res) => {
    try {
        const doc = await ScheduleException.findOneAndDelete({ _id: req.params.exceptionId, providerId: req.params.id });
        if (!doc) return res.status(404).json({ message: 'Exception not found.' });
        res.json({ ok: true });
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Exception not found.' });
        res.status(500).json({ message: err.message });
    }
};

// GET /api/nearby/providers/:id/dashboard
exports.getProviderDashboard = async (req, res) => {
    try {
        const providerId = req.params.id;
        const todayStart = normalizeDate(todayStr());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

        const [todayAppointments, upcoming, cancelled, noShows] = await Promise.all([
            NearbyAppointment.find({ providerId, date: { $gte: todayStart, $lte: todayEnd }, status: { $ne: 'CANCELLED' } })
                .sort({ startTime: 1 })
                .lean(),
            NearbyAppointment.find({ providerId, date: { $gt: todayEnd }, status: { $in: ACTIVE_STATUSES } })
                .sort({ date: 1, startTime: 1 })
                .limit(100)
                .lean(),
            NearbyAppointment.find({ providerId, status: 'CANCELLED' }).sort({ updatedAt: -1 }).limit(50).lean(),
            NearbyAppointment.find({ providerId, status: 'NO_SHOW' }).sort({ updatedAt: -1 }).limit(50).lean(),
        ]);

        res.json({
            todayAppointments: todayAppointments.map(serializeAppointmentForProvider),
            upcoming: upcoming.map(serializeAppointmentForProvider),
            cancelled: cancelled.map(serializeAppointmentForProvider),
            noShows: noShows.map(serializeAppointmentForProvider),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ═══════════════════════════════ ADMIN ONLY ═══════════════════════════════ */

// PATCH /api/nearby/providers/:id/verify  { status, notes? }
exports.verifyProvider = async (req, res) => {
    try {
        const provider = await Provider.findById(req.params.id);
        if (!provider) return res.status(404).json({ message: 'Provider not found.' });
        const { status, notes } = req.body;
        const VALID = ['VERIFIED', 'CLAIMED', 'UNVERIFIED', 'SUSPENDED', 'CLOSED'];
        if (!VALID.includes(status)) return res.status(400).json({ message: `status must be one of ${VALID.join(', ')}.` });

        provider.verificationStatus = status;
        provider.verifiedByUserId = req.user._id;
        if (notes != null) provider.verificationNotes = notes;
        if (status === 'VERIFIED') {
            provider.careconnectVerified = true;
            provider.lastVerifiedAt = new Date();
        }
        if (status === 'CLOSED' || status === 'SUSPENDED') {
            provider.appointmentEnabled = false;
        }
        await provider.save();
        res.json(serializeProviderBase(provider.toObject()));
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Provider not found.' });
        res.status(500).json({ message: err.message });
    }
};

// GET /api/nearby/admin/providers?status=
exports.listAdminProviders = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status) filter.verificationStatus = status;
        const providers = await Provider.find(filter).sort({ createdAt: -1 }).limit(500).lean();
        res.json(providers.map(serializeProviderBase));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/nearby/admin/providers/merge  { keepId, mergeId }
exports.mergeProviders = async (req, res) => {
    try {
        const { keepId, mergeId } = req.body;
        if (!keepId || !mergeId || keepId === mergeId) {
            return res.status(400).json({ message: 'keepId and mergeId are required and must differ.' });
        }
        const [keep, merge] = await Promise.all([Provider.findById(keepId), Provider.findById(mergeId)]);
        if (!keep || !merge) return res.status(404).json({ message: 'One or both providers were not found.' });

        await Promise.all([
            ProviderDoctor.updateMany({ providerId: mergeId }, { $set: { providerId: keepId } }),
            ProviderService.updateMany({ providerId: mergeId }, { $set: { providerId: keepId } }),
            ProviderSchedule.updateMany({ providerId: mergeId }, { $set: { providerId: keepId } }),
            ScheduleException.updateMany({ providerId: mergeId }, { $set: { providerId: keepId } }),
            NearbyAppointment.updateMany({ providerId: mergeId }, { $set: { providerId: keepId } }),
            LabTestBooking.updateMany({ providerId: mergeId }, { $set: { providerId: keepId } }),
            ProviderReview.updateMany({ providerId: mergeId }, { $set: { providerId: keepId } }),
        ]);

        merge.active = false;
        merge.description = `${merge.description || ''} [MERGED_INTO:${keepId}]`.trim();
        await merge.save();

        res.json({ ok: true, keepId });
    } catch (err) {
        if (isCastError(err)) return res.status(404).json({ message: 'Provider not found.' });
        res.status(500).json({ message: err.message });
    }
};
