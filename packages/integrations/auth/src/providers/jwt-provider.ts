import jwt from 'jsonwebtoken';
import winston from 'winston';
import CircuitBreaker from 'opossum';
import { AuthProvider, AuthConfig, UserIdentity, AuthTokens } from '../types';

export class LocalJwtProvider implements AuthProvider {
  private config: AuthConfig;
  private logger: winston.Logger;
  private verifyBreaker: CircuitBreaker<[string], UserIdentity>;

  constructor(config: AuthConfig, logger?: winston.Logger) {
    this.config = config;
    
    this.logger = logger || winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'auth-integration', provider: 'jwt' },
      transports: [new winston.transports.Console()]
    });

    if (!this.config.jwtSecret) {
      throw new Error('jwtSecret is required for LocalJwtProvider');
    }

    // Configure Circuit Breaker for Token Verification (simulating resilient integration)
    const breakerOptions = {
      timeout: 3000, // If verification takes longer than 3 seconds, trigger a failure
      errorThresholdPercentage: 50, // When 50% of requests fail, trip the breaker
      resetTimeout: 10000, // After 10 seconds, try again
      errorFilter: (err: any) => err.message === 'Unauthorized' // Don't trip breaker on invalid JWTs
    };

    this.verifyBreaker = new CircuitBreaker(this.executeVerifyToken.bind(this), breakerOptions);
    
    this.verifyBreaker.fallback(() => {
      this.logger.error('Circuit breaker tripped or timeout occurred during token verification');
      throw new Error('Identity Provider unavailable');
    });

    this.verifyBreaker.on('open', () => this.logger.warn('Token Verify Circuit Breaker Opened'));
    this.verifyBreaker.on('halfOpen', () => this.logger.info('Token Verify Circuit Breaker Half-Open'));
    this.verifyBreaker.on('close', () => this.logger.info('Token Verify Circuit Breaker Closed'));
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Local JWT Provider');
    // For local JWT, initialization is mostly validating config, 
    // but an OIDC provider would fetch /.well-known/openid-configuration here.
  }

  async authenticate(credentials: Record<string, any>): Promise<{ user: UserIdentity; tokens: AuthTokens }> {
    this.logger.info('Authenticating user', { email: credentials.email });
    
    // In a real scenario, we'd check the DB. Since this is the provider layer, 
    // we expect the service layer to have validated the password before calling this,
    // OR we pass username/password to an external Identity Provider (like Keycloak/Auth0) via OIDC.
    // For this LocalJwtProvider, we assume credentials contain the validated user object.
    const user = credentials.user as UserIdentity;
    if (!user || !user.userId) {
      this.logger.error('Invalid user payload provided to JWT authenticate');
      throw new Error('Invalid user payload');
    }

    const tokens = this.generateTokens(user);
    this.logger.info('Authentication successful', { userId: user.userId });
    
    return { user, tokens };
  }

  async verifyToken(token: string): Promise<UserIdentity> {
    // We route this through the circuit breaker for resilience
    return this.verifyBreaker.fire(token);
  }

  private async executeVerifyToken(token: string): Promise<UserIdentity> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.config.jwtSecret!, (err, decoded) => {
        if (err) {
          this.logger.warn('Token verification failed', { error: err.message });
          return reject(new Error('Unauthorized'));
        }
        resolve(decoded as UserIdentity);
      });
    });
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    this.logger.info('Attempting to refresh token');
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.config.jwtSecret!, (err, decoded) => {
        if (err) {
          this.logger.warn('Refresh token verification failed', { error: err.message });
          return reject(new Error('Unauthorized'));
        }
        // In a real app, verify refresh token is not blacklisted in Redis/DB
        const user = decoded as UserIdentity;
        
        // Strip out JWT specific claims before re-signing
        const { iat, exp, ...userData } = user as any; 
        resolve(this.generateTokens(userData as UserIdentity));
      });
    });
  }

  async revokeToken(token: string): Promise<void> {
    this.logger.info('Revoking token');
    // For local JWT without a stateful DB, revocation implies blacklisting the token in Redis.
    // This is a stub for the abstraction.
    return Promise.resolve();
  }

  async healthCheck(): Promise<boolean> {
    // For a local JWT, it's always healthy if the secret is configured.
    // For an OIDC provider, we'd ping the IDP here.
    return !!this.config.jwtSecret;
  }

  private generateTokens(user: UserIdentity): AuthTokens {
    const expiry = this.config.tokenExpirySeconds || 3600;
    const refreshExpiry = this.config.refreshTokenExpirySeconds || 86400;

    const accessToken = jwt.sign(user, this.config.jwtSecret!, { expiresIn: expiry });
    const refreshToken = jwt.sign(user, this.config.jwtSecret!, { expiresIn: refreshExpiry });

    return {
      accessToken,
      refreshToken,
      expiresIn: expiry,
      tokenType: 'Bearer'
    };
  }
}
