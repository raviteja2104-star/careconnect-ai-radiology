# ADR-006: Multi-Tenancy & Hospital Branding Strategy

**Status:** Accepted  
**Date:** 2026-07-25  
**Deciders:** Engineering Team  

---

## Context

CareConnect must support deployment across multiple hospitals, each with their own branding (logo, colors, app name), timezone, currency, locale, and feature flags. Patient data must be completely isolated between tenants.

## Decision

### Data Isolation

Every database entity carries a `tenantId` column (UUID). All queries are automatically scoped:

```ts
// Every repository query MUST include tenantId filter
await db.patient.findMany({ where: { tenantId: ctx.tenantId, ...filters } });
```

- Enforced via Prisma middleware (global query hook).
- API client attaches `X-Tenant-ID` header on every request.
- JWT token payload carries `tenantId` and `hospitalId`.

### Branding

Implemented via CSS Custom Properties. No code changes needed per tenant:

```css
/* Default */
:root { --color-brand-primary: #6366f1; }

/* Apollo Hospitals tenant */
[data-tenant="apollo"] { --color-brand-primary: #005bab; }

/* Manipal Hospitals */
[data-tenant="manipal"] { --color-brand-primary: #e4002b; }
```

Applied at mount via `ThemeProvider.setBranding()`:

```tsx
<ThemeProvider defaultBranding={{ primaryColor: tenant.branding.primaryColor, appName: tenant.name }}>
```

### Feature Flags

Per-tenant features in `TenantConfig.features: FeatureFlags`. UI conditionally renders based on:

```ts
const { features } = useTenant();
if (!features.bloodBank) return null;
```

## Consequences

- ✅ One codebase, unlimited tenants — configuration drives behaviour.
- ✅ Zero cross-tenant data leakage by construction (tenantId on every query).
- ✅ Branding applied at runtime with zero build step.
- ⚠️ Super-admin users with cross-tenant access need explicit multi-tenant bypass — handled by `SUPER_ADMIN` role JWT scope.
- ⚠️ Tenant provisioning workflow (onboarding, database seed, initial admin) to be built as part of `@careconnect/workflow`.

## Tenant Configuration Shape

```ts
interface TenantConfig {
  tenantId: string;
  name: string;
  domain: string;          // e.g., "apollo.careconnect.in"
  timezone: string;        // "Asia/Kolkata"
  currency: string;        // "INR"
  locale: string;          // "en-IN"
  features: FeatureFlags;
  branding: {
    primaryColor: string;
    logoUrl?: string;
    faviconUrl?: string;
    appName: string;
  };
}
```
