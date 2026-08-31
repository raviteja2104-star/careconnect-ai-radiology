const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

describe('Multi-Tenant Data Isolation Security', () => {
  let tenantAClient;
  let tenantBClient;

  beforeAll(() => {
    // Both are Admins, but for different hospital tenants
    tenantAClient = axios.create({ headers: { 'Authorization': 'Bearer ADMIN_A', 'x-tenant-id': 't-hospital-a' }, validateStatus: () => true });
    tenantBClient = axios.create({ headers: { 'Authorization': 'Bearer ADMIN_B', 'x-tenant-id': 't-hospital-b' }, validateStatus: () => true });
  });

  it('should prevent Tenant B from viewing Tenant A patients', async () => {
    // 1. Tenant A creates a patient
    const resA = await tenantAClient.post(`${BACKEND_URL}/patients`, { name: 'Tenant A Patient', phone: '11111' });
    if (resA.status === 201) {
      const patientId = resA.data._id;

      // 2. Tenant B attempts to fetch the patient
      const resB = await tenantBClient.get(`${BACKEND_URL}/patients/${patientId}`);
      expect(resB.status).toBe(404); // To Tenant B, it must appear as if it doesn't exist to prevent enumeration
    }
  });

  it('should prevent Tenant B from cross-wiring appointments to Tenant A doctors', async () => {
    // 1. Tenant B attempts to book an appointment with a DOCTOR ID belonging to Tenant A
    const res = await tenantBClient.post(`${BACKEND_URL}/appointments`, {
      patientId: 'PAT-B',
      doctorId: 'DOC-TENANT-A-ID', // Forged ID
      type: 'OPD'
    });

    // The backend must validate that DOC-TENANT-A-ID belongs to 't-hospital-b'
    expect(res.status).toBe(400); // Or 403 / 404
  });
});
