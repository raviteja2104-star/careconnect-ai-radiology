/**
 * Emergency Orchestrator
 * Handles the "Global Emergency Override Architecture".
 * When an emergency fires (EMERGENCY_TRIGGERED), it drives the system-wide
 * response against real models:
 *   1. lockResources    -> load/create the Emergency doc, escalate priority
 *   2. notifyParties    -> Notification docs for patient + emergency/admin users
 *   3. dispatchAmbulance-> select an available unit from the configured pool
 *   4. alertHospital    -> HOSPITAL_ALERTED with the emergency's hospital
 *
 * Every step is wrapped in try/catch. Failures in lockResources or
 * dispatchAmbulance compensate by writing status 'dispatch_failed' to the
 * Emergency doc; every failure publishes 'EmergencySagaFailed' (recipient
 * channel INTERNAL). Notification/alert failures are recorded but do not
 * roll back an already-successful dispatch.
 */
const { EventBus, emitEvent } = require('./EventBus');
const EVENTS = require('../config/events');
const Emergency = require('../models/Emergency');
const Notification = require('../models/Notification');
const User = require('../models/User');
const EventPublisher = require('./EventPublisher');

const ORCHESTRATOR = 'EmergencyOrchestrator';

// Statuses during which an ambulance is considered occupied.
const ACTIVE_DISPATCH_STATUSES = ['dispatched', 'en_route', 'arrived'];

// Default fleet. Override with env AMBULANCE_POOL as a JSON array of
// { vehicleId, driverName, driverPhone } objects.
const DEFAULT_AMBULANCE_POOL = [
    { vehicleId: 'AMB-101', driverName: 'Rajesh Kumar', driverPhone: '+91-9876543210' },
    { vehicleId: 'AMB-102', driverName: 'Sunita Rao', driverPhone: '+91-9876543211' },
    { vehicleId: 'AMB-103', driverName: 'Imran Shaikh', driverPhone: '+91-9876543212' },
];

const DEFAULT_HOSPITAL = {
    name: 'CareConnect City Hospital',
    address: '123 Healthcare Avenue, Medical District',
    phone: '+91-1800-123-4567',
};

// Honest placeholder until a real routing/traffic service exists. Every ETA
// emitted by this orchestrator is flagged etaIsEstimate: true.
const PLACEHOLDER_ETA_MINUTES = 10;

function loadAmbulancePool() {
    const raw = process.env.AMBULANCE_POOL;
    if (!raw) return DEFAULT_AMBULANCE_POOL;
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((a) => a && typeof a.vehicleId === 'string')) {
            return parsed;
        }
        console.warn(`[${ORCHESTRATOR}] AMBULANCE_POOL env must be a non-empty JSON array of {vehicleId,...}; using default pool.`);
    } catch (err) {
        console.warn(`[${ORCHESTRATOR}] AMBULANCE_POOL env is not valid JSON (${err.message}); using default pool.`);
    }
    return DEFAULT_AMBULANCE_POOL;
}

function appendNote(existing, line) {
    const stamped = `[${new Date().toISOString()}] ${line}`;
    return existing ? `${existing}\n${stamped}` : stamped;
}

class EmergencyOrchestrator {
    constructor() {
        this.ambulancePool = loadAmbulancePool();
        EventBus.on(EVENTS.EMERGENCY_TRIGGERED, (event) => {
            // handleEmergency handles its own failures; this catch is a last
            // resort so a rejected listener never crashes the process.
            this.handleEmergency(event).catch((error) => {
                console.error(`[${ORCHESTRATOR}] unexpected error`, JSON.stringify({
                    orchestrator: ORCHESTRATOR,
                    step: 'handleEmergency',
                    error: error && error.message,
                }));
            });
        });
    }

    async handleEmergency(event) {
        const data = (event && event.data) || {};
        const meta = (event && event.meta) || {};
        const { patientId, emergencyId, reason, autoDispatch } = data;

        if (!patientId && !emergencyId) {
            console.error(`[${ORCHESTRATOR}] EMERGENCY_TRIGGERED without patientId or emergencyId — ignoring.`);
            return;
        }

        console.log(`[${ORCHESTRATOR}] Emergency protocol initiated for patient ${patientId || 'unknown'} (${reason || 'no reason given'})`);

        // Step 1: lock resources — everything downstream needs the Emergency doc.
        let emergency;
        try {
            emergency = await this.lockResources({ patientId, emergencyId, reason });
        } catch (error) {
            await this.failSaga({ sagaStep: 'lockResources', emergency: null, patientId, error, meta, compensate: false });
            return;
        }

        // Step 2: notifications — failure is recorded but must not block dispatch.
        try {
            await this.notifyParties(emergency, reason);
        } catch (error) {
            await this.failSaga({ sagaStep: 'notifyParties', emergency, patientId, error, meta, compensate: false });
        }

        if (autoDispatch) {
            // Step 3: ambulance dispatch — failure compensates with dispatch_failed.
            try {
                await this.dispatchAmbulance(emergency, meta);
            } catch (error) {
                await this.failSaga({ sagaStep: 'dispatchAmbulance', emergency, patientId, error, meta, compensate: true });
                return;
            }

            // Step 4: hospital alert — dispatch already succeeded; do not roll it back.
            try {
                await this.alertHospital(emergency, meta);
            } catch (error) {
                await this.failSaga({ sagaStep: 'alertHospital', emergency, patientId, error, meta, compensate: false });
            }
        }
    }

    /**
     * Load the Emergency doc (by id, else the patient's most recent active
     * one), or create it if the trigger came from the AI engine before any
     * doc exists. Escalates priority to critical and records the trigger.
     */
    async lockResources({ patientId, emergencyId, reason }) {
        let emergency = null;

        if (emergencyId) {
            emergency = await Emergency.findById(emergencyId);
        }
        if (!emergency && patientId) {
            emergency = await Emergency.findOne(
                { patientId, status: { $in: ['triggered', ...ACTIVE_DISPATCH_STATUSES] } },
                null,
                { sort: { createdAt: -1 } }
            );
        }

        if (!emergency) {
            emergency = await Emergency.create({
                patientId,
                type: 'other',
                status: 'triggered',
                priority: 'critical',
                description: reason || 'Automated emergency trigger',
                location: {
                    type: 'Point',
                    coordinates: [0, 0], // unknown — no location in the trigger event
                    address: 'Unknown (auto-created by orchestrator)',
                },
            });
        } else {
            emergency.priority = 'critical';
            emergency.notes = appendNote(emergency.notes, `Emergency protocol escalated to critical (${reason || 'no reason given'})`);
            await emergency.save();
        }

        return emergency;
    }

    /**
     * Create Notification docs for the patient and for emergency-response
     * staff (roles 'emergency' and 'admin'). The staff query is defensive:
     * if it fails, the patient notification still goes out.
     */
    async notifyParties(emergency, reason) {
        const docs = [];

        if (emergency.patientId) {
            docs.push({
                userId: emergency.patientId,
                type: 'emergency_update',
                title: 'Emergency response activated',
                message: `Your emergency (${reason || emergency.description || 'emergency'}) is being handled. Help is being coordinated.`,
                data: { emergencyId: emergency._id },
            });
        }

        let responders = [];
        try {
            responders = await User.find({ role: { $in: ['emergency', 'admin'] }, isActive: true }, '_id');
        } catch (error) {
            console.warn(`[${ORCHESTRATOR}] Could not query emergency-role users (${error.message}); notifying patient only.`);
            responders = [];
        }

        for (const responder of responders || []) {
            docs.push({
                userId: responder._id,
                type: 'emergency_update',
                title: 'Emergency dispatch required',
                message: `Emergency ${emergency._id} (priority ${emergency.priority}) requires response: ${reason || emergency.description || 'unspecified'}.`,
                data: { emergencyId: emergency._id },
            });
        }

        if (docs.length > 0) {
            await Notification.insertMany(docs);
        }
    }

    /**
     * Select an available ambulance from the pool. Availability is derived
     * from Emergency docs: any unit assigned to another active emergency
     * (dispatched/en_route/arrived) is busy. Assignment is persisted on the
     * Emergency doc itself, which is the source of truth.
     */
    async dispatchAmbulance(emergency, meta = {}) {
        const busyVehicleIds = await Emergency.distinct('assignedAmbulance.vehicleId', {
            _id: { $ne: emergency._id },
            status: { $in: ACTIVE_DISPATCH_STATUSES },
            'assignedAmbulance.vehicleId': { $exists: true, $ne: null },
        });

        const available = this.ambulancePool.find((unit) => !busyVehicleIds.includes(unit.vehicleId));
        if (!available) {
            throw new Error(`No ambulance available: all ${this.ambulancePool.length} pool units are on active emergencies`);
        }

        emergency.assignedAmbulance = {
            vehicleId: available.vehicleId,
            driverName: available.driverName,
            driverPhone: available.driverPhone,
            eta: PLACEHOLDER_ETA_MINUTES, // estimated — no routing service yet
        };
        emergency.status = 'dispatched';
        emergency.notes = appendNote(emergency.notes, `Ambulance ${available.vehicleId} dispatched (ETA ~${PLACEHOLDER_ETA_MINUTES} min, estimated)`);
        await emergency.save();

        emitEvent(EVENTS.AMBULANCE_DISPATCHED, {
            emergencyId: emergency._id.toString(),
            patientId: emergency.patientId ? emergency.patientId.toString() : null,
            ambulanceId: available.vehicleId,
            driverName: available.driverName,
            etaMinutes: PLACEHOLDER_ETA_MINUTES,
            etaIsEstimate: true,
        }, { origin: ORCHESTRATOR, traceId: meta.traceId });
    }

    /**
     * Alert the destination hospital: the one recorded on the Emergency doc
     * if present, otherwise the configured default.
     */
    async alertHospital(emergency, meta = {}) {
        const hospital = emergency.nearestHospital && emergency.nearestHospital.name
            ? {
                name: emergency.nearestHospital.name,
                address: emergency.nearestHospital.address,
                phone: emergency.nearestHospital.phone,
            }
            : DEFAULT_HOSPITAL;

        emitEvent(EVENTS.HOSPITAL_ALERTED, {
            emergencyId: emergency._id.toString(),
            patientId: emergency.patientId ? emergency.patientId.toString() : null,
            hospital,
            bedType: 'ICU',
        }, { origin: ORCHESTRATOR, traceId: meta.traceId });
    }

    /**
     * Shared failure path: optionally compensate by marking the Emergency
     * dispatch_failed, always log structured context and publish
     * 'EmergencySagaFailed'. Never throws.
     *
     * Note: 'dispatch_failed' is intentionally written via findByIdAndUpdate —
     * Mongoose does not run enum validators on update paths, and the schema's
     * status enum (which this file must not modify) predates failure states.
     */
    async failSaga({ sagaStep, emergency, patientId, error, meta = {}, compensate }) {
        let compensated = false;
        const emergencyIdStr = emergency && emergency._id ? emergency._id.toString() : null;

        if (compensate && emergencyIdStr) {
            try {
                await Emergency.findByIdAndUpdate(emergencyIdStr, {
                    $set: {
                        status: 'dispatch_failed',
                        notes: appendNote(emergency.notes, `Saga step ${sagaStep} failed: ${error && error.message}`),
                    },
                });
                compensated = true;
            } catch (compensationError) {
                console.error(`[${ORCHESTRATOR}] compensation failed`, JSON.stringify({
                    orchestrator: ORCHESTRATOR,
                    sagaStep,
                    emergencyId: emergencyIdStr,
                    error: compensationError && compensationError.message,
                }));
            }
        }

        console.error(`[${ORCHESTRATOR}] saga step failed`, JSON.stringify({
            orchestrator: ORCHESTRATOR,
            saga: 'EmergencySaga',
            sagaStep,
            emergencyId: emergencyIdStr,
            patientId: patientId ? patientId.toString() : null,
            error: error && error.message,
            compensated,
        }));

        try {
            await EventPublisher.publish({
                eventType: 'EmergencySagaFailed',
                version: '1.0',
                aggregateId: emergencyIdStr || (patientId ? patientId.toString() : null),
                tenantId: meta.tenantId,
                traceId: meta.traceId,
                payload: {
                    sagaStep,
                    emergencyId: emergencyIdStr,
                    patientId: patientId ? patientId.toString() : null,
                    error: error && error.message,
                    compensated,
                },
                recipient: { channel: 'INTERNAL' },
            });
        } catch (publishError) {
            console.error(`[${ORCHESTRATOR}] could not publish EmergencySagaFailed`, JSON.stringify({
                orchestrator: ORCHESTRATOR,
                sagaStep,
                emergencyId: emergencyIdStr,
                error: publishError && publishError.message,
            }));
        }
    }
}

const orchestrator = new EmergencyOrchestrator();
module.exports = orchestrator;
