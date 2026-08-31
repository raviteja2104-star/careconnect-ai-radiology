import jwt from 'jsonwebtoken';
import { LocalJwtProvider } from './jwt-provider';
import { UserIdentity } from '../types';

jest.setTimeout(15000);

describe('LocalJwtProvider', () => {
  const mockConfig = {
    provider: 'jwt' as const,
    jwtSecret: 'test-secret-key-12345',
    tokenExpirySeconds: 2, // very short for expiry testing
    refreshTokenExpirySeconds: 4
  };

  const mockUser: UserIdentity = {
    userId: 'u-123',
    tenantId: 't-123',
    email: 'test@example.com',
    roles: ['Patient'],
    permissions: ['read:own'],
    mfaEnabled: false
  };

  let provider: LocalJwtProvider;

  beforeEach(() => {
    provider = new LocalJwtProvider(mockConfig);
  });

  describe('Initialization & Health', () => {
    it('should initialize successfully', async () => {
      await expect(provider.initialize()).resolves.not.toThrow();
    });

    it('should throw if secret is missing', () => {
      expect(() => new LocalJwtProvider({ provider: 'jwt' })).toThrow();
    });

    it('healthCheck should return true if configured', async () => {
      const isHealthy = await provider.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });

  describe('Authentication', () => {
    it('should generate valid access and refresh tokens', async () => {
      const { user, tokens } = await provider.authenticate({ user: mockUser });
      
      expect(user).toEqual(mockUser);
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens.expiresIn).toBe(mockConfig.tokenExpirySeconds);
      expect(tokens.tokenType).toBe('Bearer');

      const decoded = jwt.verify(tokens.accessToken, mockConfig.jwtSecret) as any;
      expect(decoded.userId).toBe(mockUser.userId);
      expect(decoded.email).toBe(mockUser.email);
    });

    it('should throw on invalid user payload', async () => {
      await expect(provider.authenticate({})).rejects.toThrow('Invalid user payload');
    });
  });

  describe('Token Verification', () => {
    it('should successfully verify a valid token', async () => {
      const { tokens } = await provider.authenticate({ user: mockUser });
      
      const verifiedUser = await provider.verifyToken(tokens.accessToken);
      expect(verifiedUser.userId).toBe(mockUser.userId);
      expect(verifiedUser.roles).toEqual(mockUser.roles);
    });

    it('should throw on invalid signature', async () => {
      const { tokens } = await provider.authenticate({ user: mockUser });
      
      // Tamper with the token
      const tamperedToken = tokens.accessToken.slice(0, -5) + 'abcde';
      
      await expect(provider.verifyToken(tamperedToken)).rejects.toThrow();
    });

    it('should throw on expired token', async () => {
      const { tokens } = await provider.authenticate({ user: mockUser });
      
      // Wait for 3 seconds so the 2-second token expires
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await expect(provider.verifyToken(tokens.accessToken)).rejects.toThrow('Identity Provider unavailable');
    });
  });

  describe('Refresh Token Rotation', () => {
    it('should issue new tokens from a valid refresh token', async () => {
      const { tokens } = await provider.authenticate({ user: mockUser });
      
      // Wait 1 second so the IAT changes, ensuring a different token is generated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTokens = await provider.refreshToken(tokens.refreshToken);
      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.accessToken).not.toBe(tokens.accessToken);
      
      const decoded = await provider.verifyToken(newTokens.accessToken);
      expect(decoded.userId).toBe(mockUser.userId);
    });

    it('should reject an expired refresh token', async () => {
      const { tokens } = await provider.authenticate({ user: mockUser });
      
      // Wait for 5 seconds so the 4-second refresh token expires
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      await expect(provider.refreshToken(tokens.refreshToken)).rejects.toThrow('Unauthorized');
    });
  });

  describe('Revocation', () => {
    it('should revoke token without errors', async () => {
      const { tokens } = await provider.authenticate({ user: mockUser });
      await expect(provider.revokeToken(tokens.refreshToken)).resolves.not.toThrow();
    });
  });
});
