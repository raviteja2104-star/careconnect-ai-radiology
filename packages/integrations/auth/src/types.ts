export interface UserIdentity {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  metadata?: Record<string, any>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Seconds
  tokenType: string;
}

export interface AuthProvider {
  /**
   * Initialize the provider (e.g., connect to identity provider, set up OIDC)
   */
  initialize(): Promise<void>;

  /**
   * Authenticate a user and return standardized identity and tokens
   */
  authenticate(credentials: Record<string, any>): Promise<{ user: UserIdentity; tokens: AuthTokens }>;

  /**
   * Validate an access token and return the user identity
   */
  verifyToken(token: string): Promise<UserIdentity>;

  /**
   * Refresh an expired access token using a refresh token
   */
  refreshToken(token: string): Promise<AuthTokens>;

  /**
   * Revoke a token (logout)
   */
  revokeToken(token: string): Promise<void>;

  /**
   * Health check for the identity provider connection
   */
  healthCheck(): Promise<boolean>;
}

export interface AuthConfig {
  provider: 'jwt' | 'oidc' | 'oauth2';
  issuer?: string;
  clientId?: string;
  clientSecret?: string;
  audience?: string;
  jwtSecret?: string; // For local JWT provider
  tokenExpirySeconds?: number;
  refreshTokenExpirySeconds?: number;
  enableMfa?: boolean;
}
