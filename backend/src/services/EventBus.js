/**
 * EventBus - System-wide orchestration
 * Acts as the nervous system of CareConnect.
 * MVP: Uses Node's EventEmitter.
 * Scale: Can be swapped out for Kafka, RabbitMQ, or AWS EventBridge.
 */
const EventEmitter = require('events');
class CareConnectEventBus extends EventEmitter {}

const EventBus = new CareConnectEventBus();

// Optional: Log all events for debugging / auditing
EventBus.on('newListener', (event) => {
    // console.log(`[EventBus] New listener registered for: ${event}`);
});

/**
 * Helper to emit events with standardized payload structure
 * @param {string} eventName - From config/events.js
 * @param {object} payload - The event data
 * @param {object} metadata - Origin, timestamp, traceId, etc.
 */
const emitEvent = (eventName, payload, metadata = {}) => {
    const eventPayload = {
        eventName,
        timestamp: new Date().toISOString(),
        data: payload,
        meta: {
            origin: metadata.origin || 'system',
            traceId: metadata.traceId || `TRC-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            ...metadata
        }
    };
    
    console.log(`[EVENT EMITTED] ⚡ ${eventName} | Trace: ${eventPayload.meta.traceId}`);
    EventBus.emit(eventName, eventPayload);
};

module.exports = {
    EventBus,
    emitEvent
};
