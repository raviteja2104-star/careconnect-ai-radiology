# ADR-004: RBAC + ABAC Authentication Strategy

**Status:** Accepted  
**Date:** 2026-07-24  
**Deciders:** Engineering Team  

---

## Context

A hospital information system has one of the most complex permission requirements of any enterprise application. A radiologist must read radiology reports but not write prescriptions. A nurse can record vitals and administer medications but not sign off discharge summaries. An EMS staff member needs limited access to active patient records during transport.

## Decision

Implement a layered access control strategy in `@careconnect/auth`:

### Layer 1 — RBAC (Role-Based Access Control)

14 predefined roles with curated permission sets:

| Role | Scope |
|------|-------|
| SUPER_ADMIN | Full system access |
| ADMIN | User management, settings, audit |
| DOCTOR | Clinical write, orders, discharge |
| NURSE | Vitals, medications, notes |
| PHARMACIST | Dispense, inventory |
| LAB_TECHNICIAN | Lab orders, results |
| RADIOLOGIST | Imaging reports |
| BILLING_STAFF | Claims, invoices |
| RECEPTIONIST | Registration, basic ADT |
| WARD_COORDINATOR | Bed management |
| ICU_STAFF | ICU read/write |
| OT_STAFF | OT checklist, read |
| EMS_STAFF | Dispatch, pre-hospital |
| PATIENT | Own records read-only |

### Layer 2 — Typed Permissions (30+)

Fine-grained permissions like `emr:sign`, `ot:checklist:sign`, `lab:result:verify` ensure no over-privileging within a role.

### Layer 3 — ABAC Guards (Planned)

Context-aware rules: "A doctor can only access patients in their assigned department/ward." Implemented via `guard` functions in the workflow engine and API middleware.

### Layer 4 — Feature Flags

Per-tenant features (`aiCopilot`, `bloodBank`, `mobileApp`) independently controlled without code changes.

## Consequences

- ✅ Compile-time safety: `Permission` is a union type — invalid permissions cause TS errors.
- ✅ `hasPermission()`, `hasRole()`, `isClinicalRole()` utilities used uniformly across frontend and backend.
- ✅ Token payload carries `permissions[]` — no DB call needed per request for auth checks.
- ⚠️ Permission additions require a package release + version bump.
- ⚠️ Refresh token rotation and MFA verification need concrete implementation against the selected auth provider.

## Auth Provider Decision (Deferred)

The `@careconnect/auth` package defines the contract (interfaces + types). Concrete implementation pending decision between:

| Option | Notes |
|--------|-------|
| NextAuth.js v5 | Good Next.js integration |
| Clerk | Managed service, faster dev |
| Keycloak | On-premise, enterprise, SAML/OIDC |
| Custom JWT + Redis | Full control, high complexity |

> Decision target: Before `v1.0-ui-foundation` tag.
