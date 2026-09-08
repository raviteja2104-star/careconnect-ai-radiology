/**
 * integrationController.js
 * Handles external integration health checks and endpoint testing.
 */

const axios = require('axios');

// Matches hostnames that resolve to private/loopback ranges — SSRF prevention.
const PRIVATE_HOST_RE = /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/i;

function isPrivateUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    return PRIVATE_HOST_RE.test(u.hostname);
  } catch (_) {
    return true; // unparseable URL — block it
  }
}

exports.testEndpoint = async (req, res) => {
  try {
    const { url, method = 'GET', headers = {} } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'url is required' });
    }
    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).json({ success: false, error: 'url must start with http:// or https://' });
    }
    if (isPrivateUrl(url)) {
      return res.status(400).json({ success: false, error: 'Requests to private or local IP addresses are not allowed' });
    }

    const start = Date.now();
    try {
      const response = await axios({
        method: (method || 'GET').toUpperCase(),
        url,
        headers,
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: () => true, // don't throw on 4xx/5xx — we want the real status
      });
      const responseTimeMs = Date.now() - start;
      return res.json({
        success: true,
        data: {
          status: response.status,
          responseTimeMs,
          ok: response.status < 400,
          headers: response.headers,
        },
      });
    } catch (err) {
      const responseTimeMs = err.code === 'ECONNABORTED' ? null : Date.now() - start;
      return res.json({
        success: true,
        data: {
          status: err.response ? err.response.status : 0,
          responseTimeMs,
          ok: false,
          error: err.message,
        },
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getIntegrationHealth = async (req, res) => {
  try {
    const integrations = [
      {
        name: 'ABDM',
        status: process.env.ABDM_CLIENT_ID ? 'Configured' : 'Not configured',
        description: 'Ayushman Bharat Digital Mission health data exchange',
      },
      {
        name: 'Razorpay',
        status: process.env.RAZORPAY_KEY_ID ? 'Configured' : 'Not configured',
        description: 'Payment gateway for billing and collections',
      },
      {
        name: 'AI Service',
        status: process.env.AI_SERVICE_URL ? 'Configured' : 'Not configured',
        description: 'Clinical AI for SOAP notes, radiology, and decision support',
      },
      {
        name: 'FHIR',
        status: 'Available',
        description: 'HL7 FHIR R4 built-in via ABDM routes',
      },
    ];
    res.json({ success: true, data: integrations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
