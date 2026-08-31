import winston from 'winston';
import { DeliveryRecord, DeliveryStatus, SendResult, NotificationIntent } from './types';

export class DeliveryTracker {
  private logger: winston.Logger;
  
  // Using an in-memory map for the abstraction. 
  // In reality, this would sink to PostgreSQL or DynamoDB for auditability.
  private store: Map<string, DeliveryRecord[]> = new Map();

  constructor(logger?: winston.Logger) {
    this.logger = logger || winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'communication-tracker' },
      transports: [new winston.transports.Console()]
    });
  }

  public trackInitialIntent(intent: NotificationIntent, channels: string[]) {
    this.logger.info('Notification Intent Queued', {
      intentId: intent.id,
      intentType: intent.type,
      recipientId: intent.recipient.id,
      selectedChannels: channels
    });
    
    // We would insert a "queued" record for each channel here.
  }

  public recordResult(intent: NotificationIntent, result: SendResult) {
    const record: DeliveryRecord = {
      intentId: intent.id,
      messageId: result.messageId,
      recipientId: intent.recipient.id,
      channel: result.channel,
      provider: result.provider,
      status: result.status,
      timestamp: result.timestamp,
      error: result.error,
      ...(result.simulated ? { simulated: true } : {})
    };

    if (!this.store.has(intent.id)) {
      this.store.set(intent.id, []);
    }
    
    this.store.get(intent.id)!.push(record);

    if (result.success) {
      this.logger.info('Notification Delivery Success', record);
    } else {
      this.logger.error('Notification Delivery Failed', record);
    }
  }

  public getHistory(intentId: string): DeliveryRecord[] {
    return this.store.get(intentId) || [];
  }
}
