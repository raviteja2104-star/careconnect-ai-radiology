const OutboxEvent = require('../models/OutboxEvent');
const { emitEvent } = require('./EventBus');
const { v4: uuidv4 } = require('uuid');

class EventPublisher {
  /**
   * Publishes an event to the persistent Outbox.
   * 
   * @param {Object} params
   * @param {String} params.eventType - e.g., 'AppointmentBooked'
   * @param {String} params.version - e.g., '1.0'
   * @param {String} params.aggregateId - e.g., appointment._id
   * @param {String} params.tenantId - e.g., 't-default'
   * @param {String} params.traceId - distributed trace ID
   * @param {Object} params.payload - specific event payload
   * @param {Object} params.recipient - recipient details for notifications
   */
  async publish({ eventType, version = '1.0', aggregateId, tenantId, traceId, payload, recipient, session }) {
    if (!eventType || !payload || !recipient) {
      throw new Error('Event Publisher requires eventType, payload, and recipient.');
    }

    const doc = {
      eventType,
      version,
      aggregateId: aggregateId?.toString(),
      tenantId: tenantId || 't-default',
      traceId: traceId || uuidv4(),
      occurredAt: new Date(),
      payload,
      recipient
    };
    // With a session the outbox row commits atomically with the caller's
    // aggregate write — the actual transactional-outbox guarantee.
    const [event] = session
      ? await OutboxEvent.create([doc], { session })
      : [await OutboxEvent.create(doc)];

    console.log(`[EventPublisher] Published event ${eventType} for aggregate ${aggregateId} to Outbox.`);

    // Broadcast locally so Sagas/Orchestrators can pick it up. Inside a
    // transaction the emit is deferred to TxRunner's after-commit queue so
    // subscribers never react to writes that may still roll back.
    const emit = () => emitEvent(eventType, payload, { aggregateId, tenantId, traceId, recipient });
    if (session && Array.isArray(session.$afterCommit)) {
      session.$afterCommit.push(emit);
    } else {
      emit();
    }

    return event;
  }
}

module.exports = new EventPublisher();
