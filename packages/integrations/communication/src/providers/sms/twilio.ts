import { CommunicationProvider, CommunicationChannel, SendResult, ProviderMode } from '../../types';
import axios from 'axios';

export class TwilioSmsProvider implements CommunicationProvider {
  channel: CommunicationChannel = 'sms';
  providerName = 'Twilio';
  mode: ProviderMode = 'live';

  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async initialize(): Promise<void> {
    if (!this.accountSid || !this.authToken) {
      throw new Error('Twilio credentials missing');
    }
  }

  async send(to: string, content: string): Promise<SendResult> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const data = new URLSearchParams({
        To: to,
        From: this.fromNumber,
        Body: content
      });

      const response = await axios.post(url, data.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`
        }
      });

      return {
        success: true,
        messageId: response.data.sid,
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
        error: error.response?.data?.message || error.message,
        timestamp: new Date()
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    return !!this.accountSid;
  }
}
