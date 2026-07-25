# ADR-001: Monorepo with Turborepo

**Status:** Accepted  
**Date:** 2026-07-24  
**Deciders:** Engineering Team  

---

## Context

The CareConnect HIS had grown from a single Next.js prototype into a system with 19+ clinical modules. Managing shared code (UI components, types, utilities, auth) across a monolith was creating duplication and drift. As new services (AI, EMS, Workflow, Notification) were added, the need for a structured, independently deployable multi-package architecture became critical.

## Decision

Adopt **Turborepo** as the monorepo build system with the following workspace structure:

```
careconnect/
  apps/
    web/          ← Next.js HIS frontend
  packages/
    ui/           ← @careconnect/ui design system
    types/        ← @careconnect/types shared DTOs
    events/       ← @careconnect/events typed event catalogue
    auth/         ← @careconnect/auth RBAC + tokens
    database/     ← @careconnect/database repository pattern
    utils/        ← @careconnect/utils clinical helpers
    api-client/   ← @careconnect/api-client typed HTTP client
    config/       ← @careconnect/config shared tooling configs
  services/
    workflow/     ← Clinical workflow state engine
    notification/ ← Notification delivery service
    ai/           ← AI copilot & inference service
```

## Rationale

- **Zero-downtime migration**: The existing `apps/web` continues to build at every step.
- **Turborepo caching**: Incremental builds; only changed packages rebuild.
- **Parallel execution**: Independent packages build concurrently.
- **Clear boundaries**: Each package has an explicit `package.json` and typed public API.

## Consequences

- ✅ Shared packages are consumed via workspace links (`"@careconnect/ui": "*"`).
- ✅ Any module can import from `@careconnect/types` without circular deps.
- ⚠️ `npm install` at root propagates to all workspaces — review lockfile on each merge.
- ⚠️ `services/workflow` is not in the lockfile yet — add to root `package.json` workspaces once the service has its own `node_modules`.

## Alternatives Considered

| Option | Rejected Reason |
|--------|----------------|
| Nx | More opinionated; Turborepo simpler for Next.js-centric stack |
| Lerna | Deprecated as primary tool |
| Separate repos | Cross-package changes require multiple PRs; shared type drift |
