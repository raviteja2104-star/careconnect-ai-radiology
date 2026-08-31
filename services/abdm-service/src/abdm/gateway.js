const axios = require('axios');

class ABDMGateway {
  constructor() {
    this.baseUrl = process.env.ABDM_GATEWAY_URL || 'https://dev.abdm.gov.in/gateway';
    this.clientId = process.env.ABDM_CLIENT_ID || 'careconnect_sbx';
    this.clientSecret = process.env.ABDM_CLIENT_SECRET || 'sbx_secret_mock';
    this.sessionToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Fetches an OAuth session token from the National Health Authority Sandbox.
   */
  async getSessionToken() {
    // Return cached token if valid
    if (this.sessionToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.sessionToken;
    }

    try {
      console.log('[ABDM Gateway] Fetching new session token from NHA Sandbox...');
      // In sandbox, the session url is slightly different, usually /v0.5/sessions
      const response = await axios.post(`${this.baseUrl}/v0.5/sessions`, {
        clientId: this.clientId,
        clientSecret: this.clientSecret
      });

      this.sessionToken = response.data.accessToken;
      // Tokens are typically valid for 20 minutes in Sandbox
      this.tokenExpiry = new Date(new Date().getTime() + 15 * 60000); 
      
      return this.sessionToken;
    } catch (error) {
      console.error('[ABDM Gateway] Failed to fetch session token:', error.message);
      // Fallback for local dev when Sandbox is unreachable
      return 'mock_nha_sandbox_token'; 
    }
  }

  /**
   * Helper to construct authenticated headers
   */
  async getHeaders() {
    const token = await this.getSessionToken();
    return {
      'Authorization': `Bearer ${token}`,
      'X-CM-ID': 'sbx',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Sends the mandatory asynchronous acknowledgment back to the Consent Manager
   * after we process a `/v0.5/consents/hip/notify` webhook.
   */
  async acknowledgeHipNotification(originalRequestId, consentId) {
    const headers = await this.getHeaders();
    const payload = {
      requestId: crypto.randomUUID(), // New UUID for this outbound request
      timestamp: new Date().toISOString(),
      acknowledgement: {
        status: "OK",
        consentId: consentId
      },
      resp: {
        requestId: originalRequestId // Link back to the incoming webhook
      }
    };

    try {
      console.log(`[ABDM Gateway] Transmitting HIP on-notify for consent ${consentId}`);
      await axios.post(`${this.baseUrl}/v0.5/consents/hip/on-notify`, payload, { headers });
    } catch (error) {
      console.error('[ABDM Gateway] Error sending HIP on-notify:', error.message);
    }
  }

  /**
   * Sends the mandatory asynchronous acknowledgment back to the Consent Manager
   * after we process a `/v0.5/consents/hiu/notify` webhook.
   */
  async acknowledgeHiuNotification(originalRequestId, consentIds) {
    const headers = await this.getHeaders();
    const payload = {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      acknowledgement: (consentIds || []).map(c => ({
        status: "OK",
        consentId: c
      })),
      resp: {
        requestId: originalRequestId
      }
    };

    try {
      console.log(`[ABDM Gateway] Transmitting HIU on-notify for request ${originalRequestId}`);
      await axios.post(`${this.baseUrl}/v0.5/consents/hiu/on-notify`, payload, { headers });
    } catch (error) {
      console.error('[ABDM Gateway] Error sending HIU on-notify:', error.message);
    }
  }
}

const crypto = require('crypto'); // Built in node module for randomUUID
module.exports = new ABDMGateway();
