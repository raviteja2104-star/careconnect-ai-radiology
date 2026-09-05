const crypto = require('crypto');
const TxRunner = require('./TxRunner');
const EventPublisher = require('./EventPublisher');

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN'];

/** Thrown when a requested slot is invalid, closed, or has just been taken. */
class SlotConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SlotConflictError';
        this.code = 'SLOT_CONFLICT';
    }
}

/* ───────────────────────── pure date/time helpers ─────────────────────────
 * NOTE (TZ simplification): dates are treated as calendar days in the
 * server's local timezone (mirrors the same simplification GeoSearch takes
 * for openNow). A 'YYYY-MM-DD' string is parsed into a *local* midnight
 * Date (not via `new Date('YYYY-MM-DD')`, which parses as UTC and can shift
 * the calendar day depending on server TZ) so dayOfWeek/date-range matching
 * behaves the way a Vizag-only MVP expects.
 */

function normalizeDate(dateInput) {
    if (dateInput instanceof Date) {
        return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
    }
    const [y, m, d] = String(dateInput).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

function dayBounds(dateInput) {
    const start = normalizeDate(dateInput);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
    return { start, end };
}

function todayDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function timeToMinutes(t) {
    const [h, m] = String(t).split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(mins) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Pure slot generator: startTime/endTime/slotMinutes/breaks → candidate
 * [{startTime, endTime}] list, minus any slot overlapping a break. Testable
 * without touching the DB.
 */
function generateCandidateSlots({ startTime, endTime, slotMinutes, breaks }) {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    const step = Number(slotMinutes) > 0 ? Number(slotMinutes) : 15;
    const slots = [];
    for (let t = start; t + step <= end; t += step) {
        const slotStart = t;
        const slotEnd = t + step;
        const inBreak = (breaks || []).some((b) => {
            const bs = timeToMinutes(b.start);
            const be = timeToMinutes(b.end);
            return slotStart < be && slotEnd > bs; // overlap
        });
        if (!inBreak) slots.push({ startTime: minutesToTime(slotStart), endTime: minutesToTime(slotEnd) });
    }
    return slots;
}

/** 6-char alphanumeric confirmation code; ambiguous chars (0/O/1/I) excluded. */
function generateConfirmationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[bytes[i] % chars.length];
    return code;
}

class AvailabilityEngine {
    /**
     * Resolve the effective working window for one calendar date: applies
     * ScheduleException (holiday/closed → closed; extra → overrideHours)
     * on top of the recurring ProviderSchedule. Returns
     * { closed: true } or { closed: false, startTime, endTime, slotMinutes, breaks, maxPerSlot }.
     */
    async _resolveDaySchedule({ providerId, doctorId = null, date }) {
        const ProviderSchedule = require('../models/ProviderSchedule');
        const ScheduleException = require('../models/ScheduleException');

        const { start, end } = dayBounds(date);
        const dayOfWeek = start.getDay();

        const [doctorException, providerException] = await Promise.all([
            doctorId
                ? ScheduleException.findOne({ providerId, doctorId, date: { $gte: start, $lte: end } }).lean()
                : Promise.resolve(null),
            ScheduleException.findOne({ providerId, doctorId: null, date: { $gte: start, $lte: end } }).lean(),
        ]);
        const exception = doctorException || providerException;

        if (exception && (exception.type === 'holiday' || exception.type === 'closed')) {
            return { closed: true };
        }

        const schedule = await ProviderSchedule.findOne({
            providerId,
            doctorId: doctorId || null,
            dayOfWeek,
            active: true,
            effectiveFrom: { $lte: end },
            $or: [{ effectiveTo: null }, { effectiveTo: { $gte: start } }],
        }).lean();

        if (exception && exception.type === 'extra' && exception.overrideHours?.startTime && exception.overrideHours?.endTime) {
            return {
                closed: false,
                startTime: exception.overrideHours.startTime,
                endTime: exception.overrideHours.endTime,
                slotMinutes: schedule?.slotMinutes || 15,
                breaks: schedule?.breaks || [],
                maxPerSlot: schedule?.maxPerSlot || 1,
            };
        }

        if (!schedule) return { closed: true };

        return {
            closed: false,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            slotMinutes: schedule.slotMinutes,
            breaks: schedule.breaks || [],
            maxPerSlot: schedule.maxPerSlot || 1,
        };
    }

    /**
     * computeSlots({providerId, doctorId, date}) → [{startTime, endTime, status}]
     * status is 'available' | 'limited' (<=1 remaining, maxPerSlot>1) | 'full'.
     */
    async computeSlots({ providerId, doctorId = null, date }) {
        const NearbyAppointment = require('../models/NearbyAppointment');

        const resolved = await this._resolveDaySchedule({ providerId, doctorId, date });
        if (resolved.closed) return [];

        const candidates = generateCandidateSlots(resolved);
        if (candidates.length === 0) return [];

        const { start, end } = dayBounds(date);
        const existing = await NearbyAppointment.find({
            providerId,
            doctorId: doctorId || null,
            date: { $gte: start, $lte: end },
            status: { $in: ACTIVE_STATUSES },
        })
            .select('startTime')
            .lean();

        const counts = new Map();
        for (const appt of existing) {
            counts.set(appt.startTime, (counts.get(appt.startTime) || 0) + 1);
        }

        return candidates.map((slot) => {
            const taken = counts.get(slot.startTime) || 0;
            const remaining = resolved.maxPerSlot - taken;
            let status = 'available';
            if (remaining <= 0) status = 'full';
            else if (remaining <= 1 && resolved.maxPerSlot > 1) status = 'limited';
            return { ...slot, status };
        });
    }

    /**
     * Fast existence check used by GeoSearch's `availableToday` filter and
     * provider search-result flags — deliberately cheaper than computeSlots.
     *
     * With a doctorId, it runs the real slot computation (one doctor, one
     * day — cheap). Without one (the common case for a provider-list
     * search result), it only checks that *some* active schedule exists for
     * today and isn't wiped out by a provider-wide closure exception; it
     * does NOT guarantee remaining capacity, since that would require
     * generating slots for every doctor at the provider on every search hit.
     */
    async hasAvailabilityToday(providerId, doctorId = null) {
        try {
            const today = todayDateString();
            if (doctorId) {
                const slots = await this.computeSlots({ providerId, doctorId, date: today });
                return slots.some((s) => s.status !== 'full');
            }

            const ProviderSchedule = require('../models/ProviderSchedule');
            const ScheduleException = require('../models/ScheduleException');
            const { start, end } = dayBounds(today);

            const closure = await ScheduleException.findOne({
                providerId,
                doctorId: null,
                date: { $gte: start, $lte: end },
                type: { $in: ['holiday', 'closed'] },
            }).lean();
            if (closure) return false;

            const hasSchedule = await ProviderSchedule.exists({
                providerId,
                dayOfWeek: start.getDay(),
                active: true,
                effectiveFrom: { $lte: end },
                $or: [{ effectiveTo: null }, { effectiveTo: { $gte: start } }],
            });
            return !!hasSchedule;
        } catch (err) {
            console.warn('[AvailabilityEngine] hasAvailabilityToday failed:', err.message);
            return false;
        }
    }

    /**
     * bookSlot — books `startTime` on `date` inside a TxRunner transaction:
     *   1. Resolve the day's schedule; reject if closed or startTime isn't a
     *      valid generated slot boundary.
     *   2. Re-check current active-appointment count for that exact slot
     *      INSIDE the transaction (optimistic re-check) against maxPerSlot.
     *   3. Insert; the partial-unique index on NearbyAppointment is the hard
     *      DB-level guard — a duplicate-key (11000) race is caught and
     *      turned into a SlotConflictError.
     *   4. Publish 'NearbyAppointmentBooked'.
     *
     * Throws SlotConflictError (typed, .code === 'SLOT_CONFLICT') on any of
     * the above conflicts — callers should map it to HTTP 409.
     */
    async bookSlot({
        patientId,
        providerId,
        doctorId = null,
        serviceId = null,
        type,
        date,
        startTime,
        patientDetails,
        paymentMode = 'pay_at_location',
        notes,
        createdVia = 'app',
        tenantId = 't-default',
        traceId,
    }) {
        const NearbyAppointment = require('../models/NearbyAppointment');

        const resolved = await this._resolveDaySchedule({ providerId, doctorId, date });
        if (resolved.closed) {
            throw new SlotConflictError('This provider has no availability on the selected date.');
        }

        const candidates = generateCandidateSlots(resolved);
        const match = candidates.find((s) => s.startTime === startTime);
        if (!match) {
            throw new SlotConflictError('The selected time is not a valid slot.');
        }

        const { start: dayStart, end: dayEnd } = dayBounds(date);

        return TxRunner.run(async (session) => {
            const activeCountQuery = {
                providerId,
                doctorId: doctorId || null,
                date: { $gte: dayStart, $lte: dayEnd },
                startTime,
                status: { $in: ACTIVE_STATUSES },
            };
            const currentCount = session
                ? await NearbyAppointment.countDocuments(activeCountQuery).session(session)
                : await NearbyAppointment.countDocuments(activeCountQuery);

            if (currentCount >= resolved.maxPerSlot) {
                throw new SlotConflictError('This slot was just filled — please pick another time.');
            }

            const confirmationCode = generateConfirmationCode();
            const doc = {
                patientId,
                providerId,
                doctorId: doctorId || null,
                serviceId: serviceId || null,
                type,
                date: dayStart,
                startTime: match.startTime,
                endTime: match.endTime,
                status: 'PENDING',
                patientDetails,
                notes,
                paymentMode,
                paymentStatus: 'pending',
                confirmationCode,
                createdVia,
                tenantId,
            };

            let appt;
            try {
                const [created] = session
                    ? await NearbyAppointment.create([doc], { session })
                    : [await NearbyAppointment.create(doc)];
                appt = created;
            } catch (err) {
                if (err && err.code === 11000) {
                    throw new SlotConflictError('This slot was just booked by someone else — please choose another time.');
                }
                throw err;
            }

            await EventPublisher.publish({
                session,
                eventType: 'NearbyAppointmentBooked',
                version: '1.0',
                aggregateId: appt._id,
                tenantId,
                traceId,
                payload: {
                    providerId: String(providerId),
                    doctorId: doctorId ? String(doctorId) : null,
                    date: dayStart.toISOString().slice(0, 10),
                    startTime: match.startTime,
                    endTime: match.endTime,
                    confirmationCode,
                    type,
                },
                recipient: {
                    id: String(patientId),
                    phone: patientDetails?.phone,
                    preferences: { sms: true, email: false, whatsapp: false, push: true },
                },
            });

            return appt;
        });
    }
}

const instance = new AvailabilityEngine();
module.exports = instance;
module.exports.SlotConflictError = SlotConflictError;
module.exports.generateCandidateSlots = generateCandidateSlots;
module.exports.generateConfirmationCode = generateConfirmationCode;
module.exports.normalizeDate = normalizeDate;
module.exports.timeToMinutes = timeToMinutes;
module.exports.minutesToTime = minutesToTime;
module.exports.ACTIVE_STATUSES = ACTIVE_STATUSES;
