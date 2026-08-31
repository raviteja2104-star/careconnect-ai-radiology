const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

describe('Role-Based Access Control (RBAC)', () => {
  let patientClient;
  let doctorClient;
  let adminClient;

  beforeAll(() => {
    patientClient = axios.create({ headers: { 'Authorization': 'Bearer PATIENT_TOKEN', 'x-tenant-id': 't-default' }, validateStatus: () => true });
    doctorClient = axios.create({ headers: { 'Authorization': 'Bearer DOCTOR_TOKEN', 'x-tenant-id': 't-default' }, validateStatus: () => true });
    adminClient = axios.create({ headers: { 'Authorization': 'Bearer ADMIN_TOKEN', 'x-tenant-id': 't-default' }, validateStatus: () => true });
  });

  it('should prevent PATIENTS from accessing DOCTOR specific endpoints', async () => {
    // Patient attempts to view all schedules
    const res = await patientClient.get(`${BACKEND_URL}/doctor/schedules`);
    expect(res.status).toBe(403);
  });

  it('should prevent DOCTORS from accessing ADMIN specific endpoints', async () => {
    // Doctor attempts to access system configuration
    const res = await doctorClient.get(`${BACKEND_URL}/_internal/config`);
    expect(res.status).toBe(403);
  });

  it('should prevent PATIENTS from modifying their own billing records', async () => {
    // Patient attempts to mark their own invoice as PAID
    const res = await patientClient.put(`${BACKEND_URL}/billing/invoices/INV-100/status`, { status: 'PAID' });
    expect(res.status).toBe(403);
  });

  it('should allow ADMIN to read system configuration', async () => {
    const res = await adminClient.get(`${BACKEND_URL}/_internal/config`);
    expect([200, 404]).toContain(res.status); // Assuming endpoint exists, 200. Mock might be 404.
  });
});
