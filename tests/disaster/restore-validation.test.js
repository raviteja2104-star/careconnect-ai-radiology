const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

describe('Disaster Recovery: Restore Validation', () => {
  let client;

  beforeAll(() => {
    client = axios.create({ headers: { 'Authorization': 'Bearer SRE_ADMIN', 'x-tenant-id': 't-default' }, validateStatus: () => true });
  });

  it('should verify the database is actively connected and writable', async () => {
    const res = await client.get(`http://localhost:5000/ready`);
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('READY');
  });

  it('should verify there are no orphan pending outbox events without a parent clinical record', async () => {
    // 1. Fetch pending outbox rows
    const outboxRes = await client.get(`${BACKEND_URL}/_internal/outbox/pending`);
    const events = outboxRes.data.events || [];

    // 2. Ensure every outbox event points to a valid aggregate that actually exists in the restored DB
    for (const event of events) {
      if (event.aggregateType === 'Patient') {
        const patientRes = await client.get(`${BACKEND_URL}/patients/${event.aggregateId}`);
        expect(patientRes.status).toBe(200); // Must exist, otherwise atomicity was broken during the backup snapshot!
      }
    }
  });

  it('should allow a new clinical transaction to commit to the restored DB', async () => {
    const res = await client.post(`${BACKEND_URL}/patients`, {
      name: 'Post Restore Test', email: 'restore@example.com', phone: '1231231234'
    });
    expect(res.status).toBe(201);
  });
});
