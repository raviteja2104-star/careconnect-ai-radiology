// @careconnect/auth — Authentication & Authorization Package

// ─── Core Types ──────────────────────────────────────────────────────────────
export type UserRole =
  | 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PHARMACIST'
  | 'LAB_TECHNICIAN' | 'RADIOLOGIST' | 'BILLING_STAFF' | 'RECEPTIONIST'
  | 'WARD_COORDINATOR' | 'ICU_STAFF' | 'OT_STAFF' | 'EMS_STAFF' | 'PATIENT';

// Clinical permission granularity
export type Permission =
  // Patient management
  | 'patient:read' | 'patient:write' | 'patient:delete'
  // Clinical records
  | 'emr:read' | 'emr:write' | 'emr:sign'
  | 'prescription:read' | 'prescription:write' | 'prescription:dispense'
  | 'lab:order' | 'lab:result:read' | 'lab:result:verify'
  | 'radiology:order' | 'radiology:report:read' | 'radiology:report:write'
  // Bed & ADT
  | 'bed:read' | 'bed:assign' | 'adt:admit' | 'adt:transfer' | 'adt:discharge'
  // Clinical departments
  | 'icu:read' | 'icu:write' | 'ot:read' | 'ot:write' | 'ot:checklist:sign'
  | 'emergency:read' | 'emergency:write' | 'ems:dispatch' | 'ems:read'
  // Finance
  | 'billing:read' | 'billing:write' | 'billing:approve'
  // Admin
  | 'admin:users' | 'admin:settings' | 'admin:audit' | 'admin:reports'
  // Pharmacy
  | 'pharmacy:dispense' | 'pharmacy:inventory'
  // Nursing
  | 'nurse:vitals' | 'nurse:medications' | 'nurse:notes';

// Default role → permission mappings (source of truth)
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'patient:read','patient:write','patient:delete',
    'emr:read','emr:write','emr:sign',
    'admin:users','admin:settings','admin:audit','admin:reports',
    'billing:read','billing:write','billing:approve',
    'bed:read','bed:assign','adt:admit','adt:transfer','adt:discharge',
    'icu:read','icu:write','ot:read','ot:write','ot:checklist:sign',
    'emergency:read','emergency:write','ems:dispatch','ems:read',
    'lab:order','lab:result:read','lab:result:verify',
    'radiology:order','radiology:report:read','radiology:report:write',
    'prescription:read','prescription:write','prescription:dispense',
    'pharmacy:dispense','pharmacy:inventory',
    'nurse:vitals','nurse:medications','nurse:notes',
  ],
  ADMIN: [
    'patient:read','patient:write',
    'admin:users','admin:settings','admin:audit','admin:reports',
    'billing:read','billing:write','billing:approve',
    'bed:read','bed:assign',
  ],
  DOCTOR: [
    'patient:read','patient:write',
    'emr:read','emr:write','emr:sign',
    'prescription:read','prescription:write',
    'lab:order','lab:result:read',
    'radiology:order','radiology:report:read',
    'adt:admit','adt:transfer','adt:discharge',
    'bed:read',
    'icu:read','icu:write',
    'ot:read','ot:write','ot:checklist:sign',
    'emergency:read','emergency:write',
    'ems:read',
    'billing:read',
  ],
  NURSE: [
    'patient:read','patient:write',
    'emr:read',
    'prescription:read',
    'lab:result:read',
    'bed:read','bed:assign',
    'icu:read','icu:write',
    'emergency:read',
    'nurse:vitals','nurse:medications','nurse:notes',
  ],
  PHARMACIST: [
    'patient:read',
    'prescription:read','prescription:dispense',
    'pharmacy:dispense','pharmacy:inventory',
    'lab:result:read',
  ],
  LAB_TECHNICIAN: [
    'patient:read',
    'lab:order','lab:result:read','lab:result:verify',
    'emr:read',
  ],
  RADIOLOGIST: [
    'patient:read',
    'radiology:order','radiology:report:read','radiology:report:write',
    'emr:read',
  ],
  BILLING_STAFF: [
    'patient:read',
    'billing:read','billing:write',
    'emr:read',
  ],
  RECEPTIONIST: [
    'patient:read','patient:write',
    'adt:admit',
    'bed:read',
    'billing:read',
  ],
  WARD_COORDINATOR: [
    'patient:read',
    'bed:read','bed:assign',
    'adt:transfer',
    'nurse:vitals',
  ],
  ICU_STAFF: [
    'patient:read','patient:write',
    'icu:read','icu:write',
    'emr:read',
    'lab:result:read',
    'nurse:vitals','nurse:medications','nurse:notes',
  ],
  OT_STAFF: [
    'patient:read',
    'ot:read','ot:write','ot:checklist:sign',
    'emr:read',
  ],
  EMS_STAFF: [
    'ems:dispatch','ems:read',
    'patient:read','patient:write',
    'emergency:read','emergency:write',
  ],
  PATIENT: [
    'patient:read',
    'emr:read',
    'prescription:read',
    'lab:result:read',
    'billing:read',
  ],
};

// ─── Token Management ─────────────────────────────────────────────────────────
export interface TokenPayload {
  sub: string;          // userId
  email: string;
  role: UserRole;
  permissions: Permission[];
  tenantId: string;
  hospitalId?: string;
  departmentId?: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

// ─── Session ──────────────────────────────────────────────────────────────────
export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  tenantId: string;
  hospitalId?: string;
  departmentId?: string;
  avatarUrl?: string;
  isAuthenticated: boolean;
  mfaVerified: boolean;
  lastActivity: Date;
}

// ─── RBAC Helpers ─────────────────────────────────────────────────────────────
export function hasPermission(session: AuthSession | null, permission: Permission): boolean {
  if (!session?.isAuthenticated) return false;
  return session.permissions.includes(permission);
}

export function hasAnyPermission(session: AuthSession | null, permissions: Permission[]): boolean {
  if (!session?.isAuthenticated) return false;
  return permissions.some(p => session.permissions.includes(p));
}

export function hasAllPermissions(session: AuthSession | null, permissions: Permission[]): boolean {
  if (!session?.isAuthenticated) return false;
  return permissions.every(p => session.permissions.includes(p));
}

export function hasRole(session: AuthSession | null, role: UserRole | UserRole[]): boolean {
  if (!session?.isAuthenticated) return false;
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(session.role);
}

export function isClinicalRole(session: AuthSession | null): boolean {
  return hasRole(session, ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'RADIOLOGIST', 'ICU_STAFF', 'OT_STAFF', 'EMS_STAFF']);
}

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// ─── Token Utilities ──────────────────────────────────────────────────────────
export function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.');
    const decoded: TokenPayload = JSON.parse(atob(payload));
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload)) as TokenPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiry(token: string): Date | null {
  const payload = decodeToken(token);
  if (!payload) return null;
  return new Date(payload.exp * 1000);
}

// ─── MFA Types ────────────────────────────────────────────────────────────────
export type MFAMethod = 'TOTP' | 'SMS' | 'EMAIL' | 'PASSKEY' | 'HARDWARE_KEY';

export interface MFAChallenge {
  challengeId: string;
  method: MFAMethod;
  expiresAt: string;
  hint?: string;
}

// ─── OAuth / OIDC ─────────────────────────────────────────────────────────────
export interface OAuthConfig {
  provider: 'google' | 'microsoft' | 'okta' | 'azure-ad' | 'keycloak';
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

// ─── React Hooks (Client-side stubs — implement with your auth provider) ──────
// These are typed interfaces; the actual implementation depends on your
// auth provider (NextAuth, Clerk, Supabase, custom JWT, etc.)

export interface UseAuthReturn {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<AuthTokens>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export interface UsePermissionsReturn {
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
  is: (role: UserRole | UserRole[]) => boolean;
  isClinical: boolean;
}

// ─── Feature Flags ────────────────────────────────────────────────────────────
export interface FeatureFlags {
  aiCopilot: boolean;
  videoConsultation: boolean;
  patientPortal: boolean;
  mobileApp: boolean;
  analytics: boolean;
  bloodBank: boolean;
  inventory: boolean;
  cssd: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  aiCopilot: true,
  videoConsultation: false,
  patientPortal: true,
  mobileApp: false,
  analytics: true,
  bloodBank: false,
  inventory: false,
  cssd: false,
};

// ─── Tenant Config ────────────────────────────────────────────────────────────
export interface TenantConfig {
  tenantId: string;
  name: string;
  domain: string;
  timezone: string;
  currency: string;
  locale: string;
  features: FeatureFlags;
  branding: {
    primaryColor: string;
    logoUrl?: string;
    faviconUrl?: string;
    appName: string;
  };
}
