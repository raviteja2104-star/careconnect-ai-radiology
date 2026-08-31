import winston from 'winston';
import CircuitBreaker from 'opossum';
import { CommunicationProvider, NotificationIntent, SendResult, CommunicationChannel, ProviderMode } from './types';
import { TemplateEngine } from './TemplateEngine';
import { DeliveryTracker } from './DeliveryTracker';

export class NotificationRouter {
  private providers: Map<CommunicationChannel, CommunicationProvider> = new Map();
  private breakers: Map<string, CircuitBreaker<[string, string, string?], SendResult>> = new Map();
  private templateEngine: TemplateEngine;
  private tracker: DeliveryTracker;
  private logger: winston.Logger;

  constructor(templateEngine: TemplateEngine, tracker: DeliveryTracker, logger?: winston.Logger) {
    this.templateEngine = templateEngine;
    this.tracker = tracker;
    this.logger = logger || winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'notification-router' },
      transports: [new winston.transports.Console()]
    });
  }

  public registerProvider(provider: CommunicationProvider) {
    // Only storing one provider per channel for this RC2 implementation.
    // In production with multiple providers per channel (e.g. Twilio + MSG91),
    // we would keep a list and implement fallback routing.
    this.providers.set(provider.channel, provider);

    // Simulation providers never hit a network, so they bypass the circuit breaker entirely.
    if (provider.mode === 'simulation') {
      this.breakers.delete(provider.channel);
      this.logger.info(`Registered ${provider.providerName} for ${provider.channel} in SIMULATION mode (no circuit breaker)`);
      return;
    }

    const breaker = new CircuitBreaker(provider.send.bind(provider), {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 15000
    });

    breaker.on('open', () => this.logger.warn(`Circuit Breaker Opened for ${provider.providerName}`));
    breaker.on('halfOpen', () => this.logger.info(`Circuit Breaker Half-Open for ${provider.providerName}`));
    
    this.breakers.set(provider.channel, breaker);
  }

  public async dispatch(intent: NotificationIntent): Promise<SendResult[]> {
    // Determine channels
    const channelsToUse = this.determineChannels(intent);
    
    this.tracker.trackInitialIntent(intent, channelsToUse);

    const results: SendResult[] = [];

    for (const channel of channelsToUse) {
      const provider = this.providers.get(channel);
      const breaker = this.breakers.get(channel);
      const isSimulation = provider?.mode === 'simulation';

      if (!provider || (!breaker && !isSimulation)) {
        this.logger.error(`No provider registered for channel: ${channel}`);
        continue;
      }

      try {
        const { content, subject } = this.templateEngine.render(intent.type, channel, intent.payload);
        const destination = this.getDestinationForChannel(intent, channel);

        if (!destination) {
          const skipResult: SendResult = {
            success: false,
            channel,
            provider: provider.providerName,
            status: 'failed',
            error: 'Missing destination for channel',
            timestamp: new Date()
          };
          this.tracker.recordResult(intent, skipResult);
          results.push(skipResult);
          continue;
        }

        // Live sends go through the Circuit Breaker; simulation calls the provider directly.
        const result = isSimulation
          ? await provider.send(destination, content, subject)
          : await breaker!.fire(destination, content, subject);
        this.tracker.recordResult(intent, result);
        results.push(result);

      } catch (error: any) {
        const failResult: SendResult = {
          success: false,
          channel,
          provider: provider.providerName,
          status: 'failed',
          error: error.message || 'Unknown error',
          timestamp: new Date()
        };
        this.tracker.recordResult(intent, failResult);
        results.push(failResult);
      }
    }

    return results;
  }

  /**
   * Per-channel operational status: which provider serves the channel, whether it is
   * live or simulated, and the current circuit-breaker state for live providers.
   */
  public getChannelStatus(): Array<{
    channel: CommunicationChannel;
    provider: string;
    mode: ProviderMode;
    breakerState: 'closed' | 'open' | 'half-open' | 'n/a';
  }> {
    return Array.from(this.providers.entries()).map(([channel, provider]) => {
      const breaker = this.breakers.get(channel);
      let breakerState: 'closed' | 'open' | 'half-open' | 'n/a' = 'n/a';
      if (breaker) {
        breakerState = breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed';
      }
      return {
        channel,
        provider: provider.providerName,
        mode: provider.mode || 'live',
        breakerState
      };
    });
  }

  private determineChannels(intent: NotificationIntent): CommunicationChannel[] {
    if (intent.channels && intent.channels.length > 0) {
      return intent.channels; // explicit override
    }

    // Default routing based on preferences
    const channels: CommunicationChannel[] = [];
    const prefs = intent.recipient.preferences;

    if (prefs?.sms) channels.push('sms');
    if (prefs?.email) channels.push('email');
    if (prefs?.whatsapp) channels.push('whatsapp');
    if (prefs?.push) channels.push('push');

    // If no preferences, default to Email and SMS (system default policy)
    if (channels.length === 0) {
      if (intent.recipient.email) channels.push('email');
      if (intent.recipient.phone) channels.push('sms');
    }

    return channels;
  }

  private getDestinationForChannel(intent: NotificationIntent, channel: CommunicationChannel): string | undefined {
    switch (channel) {
      case 'sms':
      case 'whatsapp':
        return intent.recipient.phone;
      case 'email':
        return intent.recipient.email;
      case 'push':
        return intent.recipient.pushToken;
      default:
        return undefined;
    }
  }
}
