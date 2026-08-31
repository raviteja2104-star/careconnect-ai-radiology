import { CommunicationProvider, CommunicationChannel, SendResult, ProviderMode } from '../../types';
import axios from 'axios';

export class SendGridEmailProvider implements CommunicationProvider {
  channel: CommunicationChannel = 'email';
  providerName = 'SendGrid';
  mode: ProviderMode = 'live';

  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('SendGrid API key missing');
    }
  }

  async send(to: string, content: string, subject?: string): Promise<SendResult> {
    try {
      const url = 'https://api.sendgrid.com/v3/mail/send';
      
      const payload = {
        personalizations: [{ to: [{ email: to }] }],
        from: { email: this.fromEmail },
        subject: subject || 'Notification from CareConnect',
        content: [{ type: 'text/plain', value: content }]
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        messageId: response.headers['x-message-id'] || `sg-${Date.now()}`,
        channel: this.channel,
        provider: this.providerName,
        status: 'accepted',
        timestamp: new Date()
      };
    } catch (error: any) {
      return {
        success: false,
        channel: this.channel,
        provider: this.providerName,
        status: 'failed',
        error: error.response?.data?.errors?.[0]?.message || error.message,
        timestamp: new Date()
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    return !!this.apiKey;
  }
}
