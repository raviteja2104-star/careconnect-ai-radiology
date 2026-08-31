const { EventBus } = require('./EventBus');
const TelemedicineSession = require('../models/TelemedicineSession');
const EventPublisher = require('./EventPublisher');

const SAGA_NAME = 'TelemedicineSaga';

/**
 * Telemedicine Saga Orchestrator
 * Coordinates the multi-step process of a telemedicine consultation.
 *
 * Every step is wrapped in try/catch. If a downstream step fails after the
 * TelemedicineSession has been created, the saga compensates by marking the
 * session CANCELLED and publishing a 'TelemedicineSagaFailed' event so
 * operators (recipient channel INTERNAL) can react.
 *
 * Note: this saga only subscribes to events that are actually published in
 * the codebase ('AppointmentBooked' from appointmentController,
 * 'TelemedicineEnded' from telemedicineController). No 'ConsultationFailed'
 * event exists anywhere, and 'TelemedicinePatientCheckedIn' was never
 * published, so those listeners are intentionally absent.
 */
class TelemedicineSaga {
  constructor() {
    this.registerListeners();
  }

  registerListeners() {
    // 1. Appointment Confirmed -> Create Session
    EventBus.on('AppointmentBooked', async (eventPayload) => {
      // handleAppointmentConfirmed compensates internally; this catch is a
      // last resort so an async listener rejection never crashes the process.
      try {
        await this.handleAppointmentConfirmed(eventPayload);
      } catch (error) {
        this.logStructuredError('handleAppointmentConfirmed', error, eventPayload);
      }
    });

    // 2. Consultation Ended -> announce completion for downstream consumers
    EventBus.on('TelemedicineEnded', async (eventPayload) => {
      try {
        await this.handleConsultationEnded(eventPayload);
      } catch (error) {
        this.logStructuredError('handleConsultationEnded', error, eventPayload);
      }
    });
  }

  async handleAppointmentConfirmed(eventPayload) {
    const { aggregateId: appointmentId, tenantId, traceId, recipient } = (eventPayload && eventPayload.meta) || {};
    const { patientName } = (eventPayload && eventPayload.data) || {};

    let session = null;
    let sagaStep = 'createSession';
    try {
      // Session abstraction behind a video provider (Daily, LiveKit, etc.)
      const roomId = `tele-${appointmentId}-${Date.now().toString().slice(-4)}`;

      session = await TelemedicineSession.create({
        appointment: appointmentId,
        status: 'SCHEDULED',
        roomId
      });

      sagaStep = 'publishSessionCreated';
      await EventPublisher.publish({
        eventType: 'TelemedicineSessionCreated',
        version: '1.0',
        aggregateId: session._id.toString(),
        tenantId,
        traceId,
        payload: {
          roomId,
          patientName
        },
        recipient
      });
    } catch (error) {
      await this.compensate({ sagaStep, appointmentId, session, error, tenantId, traceId });
    }
  }

  /**
   * Compensation for the AppointmentBooked leg: if the session was created
   * before the failure, cancel it, then publish TelemedicineSagaFailed.
   */
  async compensate({ sagaStep, appointmentId, session, error, tenantId, traceId }) {
    let compensated = false;
    const sessionId = session && session._id ? session._id.toString() : null;

    if (sessionId) {
      try {
        // The schema has no cancellation-reason field, so the reason travels
        // in the TelemedicineSagaFailed event and the structured log below.
        await TelemedicineSession.findByIdAndUpdate(sessionId, { status: 'CANCELLED' });
        compensated = true;
      } catch (compensationError) {
        this.logStructuredError('compensateCancelSession', compensationError, { sagaStep, appointmentId, sessionId });
      }
    }

    console.error(`[${SAGA_NAME}] saga step failed`, JSON.stringify({
      saga: SAGA_NAME,
      sagaStep,
      appointmentId: appointmentId ? appointmentId.toString() : null,
      sessionId,
      error: error && error.message,
      compensated
    }));

    try {
      await EventPublisher.publish({
        eventType: 'TelemedicineSagaFailed',
        version: '1.0',
        aggregateId: appointmentId ? appointmentId.toString() : sessionId,
        tenantId,
        traceId,
        payload: {
          sagaStep,
          appointmentId: appointmentId ? appointmentId.toString() : null,
          sessionId,
          error: error && error.message,
          compensated,
          reason: compensated
            ? 'Session cancelled after downstream saga step failed'
            : 'Saga step failed before/without a session to compensate'
        },
        recipient: { channel: 'INTERNAL' }
      });
    } catch (publishError) {
      // The failure event could not be persisted either; the structured log
      // above remains the source of truth. Never throw from compensation.
      this.logStructuredError('publishTelemedicineSagaFailed', publishError, { sagaStep, appointmentId, sessionId });
    }
  }

  /**
   * The consultation has ended. We only announce the fact honestly via
   * 'ConsultationCompleted'. AI summary generation belongs to the ai-service;
   * this saga no longer fabricates a summary URL.
   */
  async handleConsultationEnded(eventPayload) {
    const { aggregateId: sessionId, tenantId, traceId, recipient } = (eventPayload && eventPayload.meta) || {};
    const { aiSummaryAvailable } = (eventPayload && eventPayload.data) || {};

    try {
      await EventPublisher.publish({
        eventType: 'ConsultationCompleted',
        version: '1.0',
        aggregateId: sessionId,
        tenantId,
        traceId,
        payload: {
          sessionId,
          aiSummaryAvailable: !!aiSummaryAvailable
        },
        recipient
      });
    } catch (error) {
      // Nothing was created in this leg, so there is nothing to roll back —
      // record the failure and surface it internally.
      console.error(`[${SAGA_NAME}] saga step failed`, JSON.stringify({
        saga: SAGA_NAME,
        sagaStep: 'publishConsultationCompleted',
        sessionId,
        error: error && error.message,
        compensated: false
      }));
      try {
        await EventPublisher.publish({
          eventType: 'TelemedicineSagaFailed',
          version: '1.0',
          aggregateId: sessionId,
          tenantId,
          traceId,
          payload: {
            sagaStep: 'publishConsultationCompleted',
            sessionId,
            error: error && error.message,
            compensated: false
          },
          recipient: { channel: 'INTERNAL' }
        });
      } catch (publishError) {
        this.logStructuredError('publishTelemedicineSagaFailed', publishError, { sessionId });
      }
    }
  }

  logStructuredError(step, error, context) {
    console.error(`[${SAGA_NAME}] unexpected error`, JSON.stringify({
      saga: SAGA_NAME,
      step,
      error: error && error.message,
      context: context && context.meta ? context.meta : context
    }));
  }
}

module.exports = new TelemedicineSaga();
