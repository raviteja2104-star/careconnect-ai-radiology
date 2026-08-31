import winston from 'winston';
import { CommunicationProvider, CommunicationChannel, SendResult, ProviderMode } from '../types';

const CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  sms: 'SMS',
  whatsapp: 'WhatsApp message',
  email: 'email',
  push: 'push notification'
};

/**
 * Honest simulation provider used when no credentials are configured for a channel.
 * It logs what WOULD have been sent and returns { simulated: true }.
 * It never fabricates a provider message ID.
 */
export class SimulationProvider implements CommunicationProvider {
  channel: CommunicationChannel;
  providerName: string;
  mode: ProviderMode = 'simulation';

  private logger?: winston.Logger;

  constructor(channel: CommunicationChannel, logger?: winston.Logger) {
    this.channel = channel;
    this.providerName = `Simulated${channel.charAt(0).toUpperCase()}${channel.slice(1)}`;
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    // Nothing to initialize.
  }

  async send(to: string, content: string, subject?: string): Promise<SendResult> {
    const label = CHANNEL_LABELS[this.channel] || this.channel;
    const subjectPart = subject ? ` (subject: "${subject}")` : '';
    const line = `[SIMULATION] would send ${label} to ${to}${subjectPart}: "${content}"`;

    if (this.logger) {
      this.logger.info(line, { channel: this.channel, simulated: true });
    } else {
      // eslint-disable-next-line no-console
      console.log(line);
    }

    return {
      success: true,
      // No messageId on purpose: nothing was actually sent, so we never fake a provider ID.
      channel: this.channel,
      provider: this.providerName,
      status: 'sent',
      simulated: true,
      timestamp: new Date()
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
