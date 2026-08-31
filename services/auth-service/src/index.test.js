const request = require('supertest');
const app = require('./index');

describe('Auth Service Integration Tests', () => {
  let accessToken = '';
  let refreshToken = '';
  
  // Happy Path: Health Checks
  describe('Service Health', () => {
    it('GET /health returns 200 OK', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('auth-service');
    });

    it('GET /ready returns 200 OK', async () => {
      const res = await request(app).get('/ready');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ready');
    });
  });

  // Happy Path: Login
  describe('Login Flow', () => {
    it('POST /api/auth/login successfully logs in user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@healthcore.com',
          password: 'password123',
          tenantId: 't-default'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tokens.accessToken).toBeDefined();
      expect(res.body.tokens.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe('admin@healthcore.com');
      expect(res.body.user.tenantId).toBe('t-default');
      expect(res.body.user.hospitalId).toBe('h-apollo-01');
      expect(res.body.user.roles).toContain('System Admin');
      
      // Save tokens for future tests
      accessToken = res.body.tokens.accessToken;
      refreshToken = res.body.tokens.refreshToken;
    });

    it('POST /api/auth/verify succeeds with valid JWT', async () => {
      const res = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('admin@healthcore.com');
    });

    it('GET /api/auth/me returns authenticated identity with RBAC claims', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.permissions).toContain('manage:system');
    });
  });

  // Refresh Token Rotation
  describe('Refresh Token Flow', () => {
    it('POST /api/auth/refresh returns new tokens and invalidates old', async () => {
      // Delay to ensure the new token gets a different iat (issued at) timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tokens.accessToken).not.toBe(accessToken);
      expect(res.body.tokens.refreshToken).not.toBe(refreshToken);

      const oldRefresh = refreshToken;
      // Save new tokens
      accessToken = res.body.tokens.accessToken;
      refreshToken = res.body.tokens.refreshToken;

      // Ensure old refresh token is invalidated
      const retryRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: oldRefresh });
      
      expect(retryRes.statusCode).toBe(403);
      expect(retryRes.body.message).toBe('Invalid refresh token');
    });
  });

  // Logout
  describe('Logout Flow', () => {
    it('POST /api/auth/logout revokes refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it's revoked
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });
      
      expect(refreshRes.statusCode).toBe(403);
    });
  });

  // Negative Tests
  describe('Negative Paths', () => {
    it('Rejects unknown username', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'ghost@healthcore.com',
        password: 'password123'
      });
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('Rejects incorrect password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@healthcore.com',
        password: 'wrongpassword'
      });
      expect(res.statusCode).toBe(401);
    });

    it('Rejects missing authorization header', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });

    it('Rejects malformed JWT', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer 1234567890.abcdefg.12345');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Unauthorized');
    });
  });

  // Security and Traceability
  describe('Security & Traceability', () => {
    it('Includes security headers in response', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-powered-by']).toBeUndefined(); // Helmet removes this
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('Generates and returns x-trace-id', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-trace-id']).toBeDefined();
    });

    it('Propagates client-provided x-trace-id', async () => {
      const res = await request(app)
        .get('/health')
        .set('x-trace-id', 'custom-trace-123');
      expect(res.headers['x-trace-id']).toBe('custom-trace-123');
    });
  });
});
