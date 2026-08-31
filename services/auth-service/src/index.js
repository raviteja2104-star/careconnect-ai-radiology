require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { LocalJwtProvider } = require('@careconnect/auth-integration');

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

// Observability Middleware
app.use((req, res, next) => {
  req.traceId = req.headers['x-trace-id'] || crypto.randomUUID();
  res.setHeader('x-trace-id', req.traceId);
  console.log(`[AUTH-SERVICE][${req.traceId}] ${req.method} ${req.url}`);
  next();
});

// Apply rate limiter to auth routes
app.use('/api/auth/', authLimiter);

// Initialize Auth Provider (Dependency Injection style)
const authProvider = new LocalJwtProvider({
  provider: 'jwt',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-rc2-dev',
  tokenExpirySeconds: parseInt(process.env.JWT_EXPIRES_IN || '900'), // 15 mins
  refreshTokenExpirySeconds: parseInt(process.env.REFRESH_EXPIRES_IN || '86400'), // 24 hrs
});

// Mock DB for Users and Refresh Tokens
const mockDB = {
  users: [
    {
      userId: 'u-12345',
      tenantId: 't-default',
      hospitalId: 'h-apollo-01',
      email: 'admin@healthcore.com',
      password: 'password123',
      roles: ['System Admin'],
      permissions: ['read:all', 'write:all', 'manage:system'],
      mfaEnabled: false
    },
    {
      userId: 'u-67890',
      tenantId: 't-default',
      hospitalId: 'h-apollo-01',
      email: 'dr.smith@healthcore.com',
      password: 'password123',
      roles: ['Senior Doctor'],
      permissions: ['read:patients', 'write:prescriptions', 'read:reports'],
      mfaEnabled: false
    }
  ],
  refreshTokens: new Set()
};

const getRolePermissions = (role) => {
  const RBAC = {
    'Patient': ['read:own_records', 'write:appointments'],
    'Receptionist': ['read:appointments', 'write:appointments', 'read:patients'],
    'Doctor': ['read:patients', 'write:prescriptions', 'read:reports'],
    'Senior Doctor': ['read:patients', 'write:prescriptions', 'read:reports', 'approve:protocols'],
    'System Admin': ['read:all', 'write:all', 'manage:system']
  };
  return RBAC[role] || [];
};

// 1. LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, tenantId } = req.body;
    
    const user = mockDB.users.find(u => u.email === email && u.password === password && (!tenantId || u.tenantId === tenantId));
    
    if (user) {
      const dbUser = {
        userId: user.userId,
        tenantId: user.tenantId,
        hospitalId: user.hospitalId,
        email: user.email,
        roles: user.roles,
        permissions: [...new Set([...user.permissions, ...user.roles.flatMap(getRolePermissions)])],
        mfaEnabled: user.mfaEnabled
      };

      const result = await authProvider.authenticate({ user: dbUser });
      mockDB.refreshTokens.add(result.tokens.refreshToken);

      console.log(`[AUTH-SERVICE][${req.traceId}] Successful login for ${email}`);
      return res.json({ success: true, ...result });
    }

    console.warn(`[AUTH-SERVICE][${req.traceId}] Failed login attempt for ${email}`);
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    console.error(`[AUTH-SERVICE][${req.traceId}] Login error:`, error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
});

// 2. LOGOUT
app.post('/api/auth/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    mockDB.refreshTokens.delete(refreshToken);
    await authProvider.revokeToken(refreshToken);
  }
  console.log(`[AUTH-SERVICE][${req.traceId}] Logout successful`);
  res.json({ success: true, message: 'Logged out successfully' });
});

// 3. REFRESH TOKEN
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || !mockDB.refreshTokens.has(refreshToken)) {
      return res.status(403).json({ success: false, message: 'Invalid refresh token' });
    }

    // Rotate: Remove old token, issue new pair
    mockDB.refreshTokens.delete(refreshToken);
    
    const tokens = await authProvider.refreshToken(refreshToken);
    mockDB.refreshTokens.add(tokens.refreshToken);
    
    console.log(`[AUTH-SERVICE][${req.traceId}] Token refreshed successfully`);
    res.json({ success: true, tokens });
  } catch (error) {
    console.error(`[AUTH-SERVICE][${req.traceId}] Refresh error:`, error.message);
    res.status(403).json({ success: false, message: 'Token refresh failed' });
  }
});

// 4. VERIFY TOKEN
app.post('/api/auth/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const user = await authProvider.verifyToken(token);
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

// 5. CHANGE PASSWORD
app.post('/api/auth/change-password', async (req, res) => {
  res.json({ success: true, message: 'Password changed (Mock)' });
});

// 6. FORGOT PASSWORD
app.post('/api/auth/forgot-password', async (req, res) => {
  res.json({ success: true, message: 'Reset link sent (Mock)' });
});

// 7. RESET PASSWORD
app.post('/api/auth/reset-password', async (req, res) => {
  res.json({ success: true, message: 'Password reset successful (Mock)' });
});

// 8. ME (GET PROFILE)
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false });
    
    const token = authHeader.split(' ')[1];
    const user = await authProvider.verifyToken(token);
    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
});

// 9. HEALTH
app.get('/health', async (req, res) => {
  const isHealthy = await authProvider.healthCheck();
  res.json({ status: isHealthy ? 'healthy' : 'degraded', service: 'auth-service', timestamp: new Date() });
});

// 10. READY
app.get('/ready', (req, res) => {
  res.json({ status: 'ready' });
});

const PORT = process.env.PORT || 4001;

if (require.main === module) {
  app.listen(PORT, async () => {
    await authProvider.initialize();
    console.log(`[Auth Service] Running on port ${PORT}`);
  });
}

module.exports = app;
