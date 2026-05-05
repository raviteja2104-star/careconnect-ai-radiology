/**
 * Emergency Orchestrator
 * Handles the "Global Emergency Override Architecture"
 * When an emergency fires, it intercepts and manages the system-wide response.
 */
const { EventBus, emitEvent } = require('./EventBus');
const EVENTS = require('../config/events');

class EmergencyOrchestrator {
    constructor() {
        EventBus.on(EVENTS.EMERGENCY_TRIGGERED, this.handleEmergency.bind(this));
    }

    async handleEmergency(event) {
        const { patientId, reason, autoDispatch } = event.data;
        console.log(`\n======================================================`);
        console.log(`🚑 [EMERGENCY OVERRIDE INITIATED]`);
        console.log(`👤 Patient ID: ${patientId}`);
        console.log(`⚠️ Reason: ${reason}`);
        console.log(`======================================================\n`);

        // SYSTEM WIDE ACTIONS (Simulated)
        this.lockResources(patientId);
        this.notifyParties(patientId);

        if (autoDispatch) {
            this.dispatchAmbulance(patientId);
            this.alertHospital(patientId);
        }
    }

    lockResources(patientId) {
        console.log(`[Emergency Protocol] 🔒 Locking patient record and escalating priority queues to CRITICAL.`);
        // In reality: Update DB, cancel pending non-critical queues, bump priority in Kafka.
    }

    notifyParties(patientId) {
        console.log(`[Emergency Protocol] 📱 Notifying family, assigned doctor, and nearest hospital.`);
        // Emit push notification events
    }

    dispatchAmbulance(patientId) {
        console.log(`[Emergency Protocol] 🚑 Dispatching nearest ambulance (ETA < 5 mins).`);
        emitEvent(EVENTS.AMBULANCE_DISPATCHED, { patientId, ambulanceId: 'AMB-001', eta: '4m 30s' });
    }

    alertHospital(patientId) {
        console.log(`[Emergency Protocol] 🏥 Alerting ICU/OT at destination hospital.`);
        emitEvent(EVENTS.HOSPITAL_ALERTED, { patientId, hospitalId: 'HOSP-01', bedType: 'ICU' });
    }
}

const orchestrator = new EmergencyOrchestrator();
module.exports = orchestrator;
