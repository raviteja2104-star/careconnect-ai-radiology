const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

describe('OWASP Top 10 API Security Verification', () => {
  let unauthClient;
  let authClient;

  beforeAll(() => {
    unauthClient = axios.create({ validateStatus: () => true });
    authClient = axios.create({ 
      headers: { 'Authorization': 'Bearer VALID_TOKEN', 'x-tenant-id': 't-default' },
      validateStatus: () => true
    });
  });

  // 1. Broken Object Level Authorization (BOLA / IDOR)
  it('should reject access to another users resources (BOLA / IDOR)', async () => {
    // Attempting to access an invoice belonging to a different tenant/user
    const res = await authClient.get(`${BACKEND_URL}/billing/invoices/INV-OTHER-USER`);
    // Should be 403 Forbidden or 404 Not Found to prevent data leakage, never 200
    expect([403, 404]).toContain(res.status);
  });

  // 2. Broken Authentication
  it('should reject requests lacking valid JWT tokens', async () => {
    const res = await unauthClient.get(`${BACKEND_URL}/patients`);
    expect(res.status).toBe(401); // Unauthorized
  });

  it('should reject manipulated/expired JWT tokens', async () => {
    const badClient = axios.create({ 
      headers: { 'Authorization': 'Bearer EXPIRED_OR_FORGED_TOKEN' },
      validateStatus: () => true
    });
    const res = await badClient.get(`${BACKEND_URL}/patients`);
    expect(res.status).toBe(401);
  });

  // 3. Excessive Data Exposure
  it('should not leak internal database schemas in API responses', async () => {
    const res = await authClient.get(`${BACKEND_URL}/patients/PAT-001`);
    if (res.status === 200) {
      expect(res.data._v).toBeUndefined(); // Mongoose internal version key should be stripped
      expect(res.data.passwordHash).toBeUndefined(); // Secrets must be stripped
    }
  });

  // 4. Mass Assignment
  it('should ignore restricted fields during object creation (Mass Assignment)', async () => {
    // Attempting to elevate privilege by passing role='ADMIN' during standard user registration
    const res = await unauthClient.post(`${BACKEND_URL}/patients`, {
      name: 'Hacker',
      email: 'hacker@example.com',
      role: 'SUPER_ADMIN' // Malicious parameter
    });
    
    // If the API accepts it, it must discard the 'role' field.
    if (res.status === 201) {
      expect(res.data.role).not.toBe('SUPER_ADMIN');
    }
  });

  // 5. Security Misconfiguration & Rate Limiting
  it('should enforce rate limiting on public endpoints', async () => {
    const promises = [];
    for (let i = 0; i < 150; i++) {
      promises.push(unauthClient.post(`${BACKEND_URL}/auth/login`, { email: 'test', password: '123' }));
    }
    const results = await Promise.all(promises);
    
    const tooManyRequests = results.some(r => r.status === 429);
    expect(tooManyRequests).toBe(true);
  });
});
