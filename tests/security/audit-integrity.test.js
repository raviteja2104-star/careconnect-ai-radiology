const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

describe('Healthcare Audit Integrity & Immutability', () => {
  let client;

  beforeAll(() => {
    // Admin client with broad read access but shouldn't be able to mutate audits
    client = axios.create({
      headers: {
        'Authorization': 'Bearer MOCK_ADMIN_TOKEN',
        'x-tenant-id': 't-default'
      },
      validateStatus: () => true
    });
  });

  it('should prove audit logs are generated for every clinical read', async () => {
    // Read a patient record
    const readRes = await client.get(`${BACKEND_URL}/patients/PAT-001`);
    expect(readRes.status).toBe(200);

    // Verify audit log was created for the exact read action
    const traceId = readRes.headers['x-trace-id'];
    const auditRes = await client.get(`${BACKEND_URL}/_internal/audit?traceId=${traceId}`);
    
    expect(auditRes.status).toBe(200);
    const audits = auditRes.data.logs || [];
    const readAudit = audits.find(a => a.action === 'PATIENT_RECORD_VIEWED');
    expect(readAudit).toBeDefined();
    expect(readAudit.actor).toBe('MOCK_ADMIN_TOKEN');
  });

  it('should enforce strict immutability on the Audit Trail API', async () => {
    // Attempt to DELETE or UPDATE an audit log (should be physically impossible by API design)
    const delRes = await client.delete(`${BACKEND_URL}/_internal/audit/AUDIT-101`);
    expect(delRes.status).toBe(405); // Method Not Allowed

    const putRes = await client.put(`${BACKEND_URL}/_internal/audit/AUDIT-101`, { action: 'MODIFIED_EVENT' });
    expect(putRes.status).toBe(405); // Method Not Allowed
  });

  it('should mask PHI in raw database queries if possible', async () => {
    // Simulating checking what the logger outputted (mock API check)
    const logCheckRes = await client.get(`${BACKEND_URL}/_internal/audit/latest`);
    const logs = logCheckRes.data.logs || [];
    
    for (const log of logs) {
      if (log.payload) {
        expect(log.payload.patientName).toBeUndefined(); // Should be masked or omitted
        expect(log.payload.ssn).toBeUndefined();
      }
    }
  });
});
