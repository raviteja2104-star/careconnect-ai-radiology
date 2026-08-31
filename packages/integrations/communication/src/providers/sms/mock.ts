import { CommunicationProvider, CommunicationChannel, SendResult } from '../../types';

export class MockSmsProvider implements CommunicationProvider {
  channel: CommunicationChannel = 'sms';
  providerName = 'MockSMS';

  async initialize(): Promise<void> {
    // Setup Mock
  }

  async send(to: string, content: string): Promise<SendResult> {
    if (!to) throw new Error('Missing destination phone number');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      messageId: `mock-sms-${Date.now()}`,
      channel: this.channel,
      provider: this.providerName,
      status: 'delivered',
      timestamp: new Date()
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
