const axios = require('axios');
const OutboxEvent = require('../models/OutboxEvent');

class OutboxWorker {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.communicationServiceUrl = process.env.COMMUNICATION_SERVICE_URL || 'http://localhost:4002/api/internal/events';
  }

  start(intervalMs = 5000) {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.processPendingEvents(), intervalMs);
    console.log(`[Outbox Worker] Started polling every ${intervalMs}ms`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async processPendingEvents() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      // Claim up to 10 pending events atomically (compare-and-swap), so two
      // worker instances can never dispatch the same event twice.
      const events = [];
      for (let i = 0; i < 10; i++) {
        const claimed = await OutboxEvent.findOneAndUpdate(
          { status: 'pending' },
          { $set: { status: 'processing' } },
          { sort: { occurredAt: 1 }, new: true }
        );
        if (!claimed) break;
        events.push(claimed);
      }

      for (const event of events) {

        try {
          // Push to communication service
          await axios.post(this.communicationServiceUrl, {
            eventType: event.eventType,
            payload: event.payload,
            recipient: event.recipient
          }, {
            headers: {
              'x-trace-id': event.traceId // propagate trace
            },
            timeout: 5000
          });

          event.status = 'completed';
          await event.save();
        } catch (error) {
          console.error(`[Outbox Worker] Failed to dispatch event ${event._id}:`, error.message);
          event.retryCount += 1;
          event.lastError = error.message;
          
          if (event.retryCount >= 3) {
            event.status = 'failed'; // Dead letter equivalent
          } else {
            event.status = 'pending'; // Re-queue
          }
          await event.save();
        }
      }
    } catch (error) {
      console.error('[Outbox Worker] Error polling database:', error.message);
    } finally {
      this.isRunning = false;
    }
  }
}

// Singleton export
module.exports = new OutboxWorker();
