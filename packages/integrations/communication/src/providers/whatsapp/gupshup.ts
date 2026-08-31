import { CommunicationProvider, CommunicationChannel, SendResult, ProviderMode } from '../../types';
import axios from 'axios';

/**
 * Gupshup WhatsApp provider (https://api.gupshup.io/wa/api/v1/msg).
 * Form-encoded POST with the API key in the `apikey` header.
 */
export class GupshupWhatsAppProvider implements CommunicationProvider {
  channel: CommunicationChannel = 'whatsapp';
  providerName = 'Gupshup';
  mode: ProviderMode = 'live';

  private apiKey: string;
  private source: string;
  private appName?: string;

  constructor(apiKey: string, source: string, appName?: string) {
    this.apiKey = apiKey;
    this.source = source;
    this.appName = appName;
  }

  async initialize(): Promise<void> {
    if (!this.apiKey || !this.source) {
      throw new Error('Gupshup credentials missing');
    }
  }

  async send(to: string, content: string): Promise<SendResult> {
    try {
      const url = 'https://api.gupshup.io/wa/api/v1/msg';
      const data = new URLSearchParams({
        channel: 'whatsapp',
        source: this.source,
        destination: to,
        message: JSON.stringify({ type: 'text', text: content })
      });
      if (this.appName) {
        data.set('src.name', this.appName);
      }

      const response = await axios.post(url, data.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apikey': this.apiKey
        }
      });

      // Gupshup returns { status: 'submitted', messageId: '...' } on success.
      if (response.data?.status && response.data.status !== 'submitted') {
        return {
          success: false,
          channel: this.channel,
          provider: this.providerName,
          status: 'failed',
          error: response.data?.message || `Gupshup returned status: ${response.data.status}`,
          timestamp: new Date()
        };
      }

      return {
        success: true,
        messageId: response.data?.messageId,
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
    return !!this.apiKey && !!this.source;
  }
}
