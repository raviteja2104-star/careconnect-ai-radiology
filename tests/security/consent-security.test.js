const axios = require('axios');

const ABDM_URL = process.env.ABDM_URL || 'http://localhost:5005/api/abdm';

describe('ABDM Consent Enforcement Security', () => {
  let client;

  beforeAll(() => {
    client = axios.create({ headers: { 'Authorization': 'Bearer EXTERNAL_HIU_TOKEN', 'x-tenant-id': 't-default' }, validateStatus: () => true });
  });

  it('should block FHIR Exchange requests lacking a valid Consent ID', async () => {
    const res = await client.post(`${ABDM_URL}/exchange/fetch`, {}); // No consent passed
    expect(res.status).toBe(400); // Bad Request / Unauthorized
  });

  it('should block FHIR Exchange requests for an unapproved consent', async () => {
    // 1. Create a requested but unapproved consent
    const reqRes = await client.post(`${ABDM_URL}/consent/request`, { patientId: 'PAT-1', purpose: 'CAREMGT', hiTypes: ['DiagnosticReport'] });
    const consentId = reqRes.data.consentId;

    // 2. Attempt exchange
    const fetchRes = await client.post(`${ABDM_URL}/exchange/fetch`, { consentId });
    expect(fetchRes.status).toBe(403); // Forbidden, not yet approved
  });

  it('should cryptographically block forged consent IDs', async () => {
    const fetchRes = await client.post(`${ABDM_URL}/exchange/fetch`, { consentId: 'FORGED_CONSENT_123' });
    expect(fetchRes.status).toBe(403); // Forbidden
  });
});
