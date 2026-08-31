# Schema Migrations

CareConnect uses [migrate-mongo](https://github.com/seppevs/migrate-mongo) for
versioned MongoDB schema/index changes. Everything lives in `backend/`:

| Piece | Location |
| --- | --- |
| Config | `backend/migrate-mongo-config.js` (reads `MONGODB_URI` from `backend/.env`, falls back to `mongodb://localhost:27017/careconnect?directConnection=true`) |
| Migrations | `backend/migrations/<timestamp>-<name>.js` |
| Applied-migration ledger | `changelog` collection in the target database |
| Migration intent notes | `migration_meta` collection (written by expand/contract markers) |

## Commands

Run from `backend/`:

```bash
npm run migrate          # apply all pending migrations (migrate-mongo up)
npm run migrate:down     # roll back the most recent applied migration
npm run migrate:status   # show APPLIED / PENDING per migration file

npx migrate-mongo create <short-kebab-name>   # scaffold a new migration
```

`create` generates `migrations/<timestamp>-<short-kebab-name>.js` with empty
`async up(db, client)` / `async down(db, client)` functions. Every migration
**must** ship a working `down` — "cannot be undone" is a design smell; if a
step is truly irreversible (e.g. dropping data), that is a contract-phase
change and needs its own deployment (see below).

## The expand / migrate / contract convention

MongoDB is schemaless, so "schema" here means indexes, validators, and the
shape the application code expects. Because deployments overlap (old and new
app versions run against the same database during rollout, and rollbacks must
stay possible), **no single deployment may make a destructive change**. Every
change is split across releases:

| Phase | Release | What it may do |
| --- | --- | --- |
| **Expand** | N | Purely additive: create indexes, add fields with defaults, widen enums (app-layer), start dual-writing new + old shape. Old code must keep working untouched. |
| **Migrate** | N / N+1 | Backfill data into the new shape (batched, resumable, idempotent). Reads may switch to the new shape once backfill completes. Old shape still present. |
| **Contract** | N+2 | Remove the old shape: drop old fields/indexes, stop dual-writes, tighten validators. Only after release N+1 has been stable and rollback to N is no longer required. |

Rules of thumb:

- **Never destructive in a single deployment.** A drop/rename/tighten always
  trails the expand by at least two releases, so a rollback of the current
  release never lands on a database it cannot read.
- Enum changes enforced by Mongoose (e.g. `User.role`) are app-layer only:
  the expand needs no document rewrite — but record it with a
  `migration_meta` marker migration (see `20260825000002-expand-user-roles.js`)
  so schema intent is versioned alongside real DDL.
- Index creation is expand-safe (MongoDB ≥ 4.2 index builds are non-blocking);
  index drops are contract.
- TTL indexes delete data by definition — treat the *introduction* as expand
  (additive index) but choose a retention window generous enough that no live
  code path still needs the expiring documents.
- Migrations must be idempotent where possible (`createIndex` on an existing
  identical index is a no-op; use upserts for meta records) and `down` must
  tolerate partially-applied state (guard drops with try/catch).

## CI / deployment

1. **Before deploy (gate):** `npm run migrate:status` against the target
   environment. Fail the pipeline if the command cannot connect or reports a
   changelog entry with no matching file (drift).
2. **Apply:** `npm run migrate` as a release step *before* the new app
   version starts serving traffic. Because migrations follow
   expand/migrate/contract, the still-running old version is unaffected.
3. **Verify:** `npm run migrate:status` again — everything should read
   `APPLIED`.
4. **Rollback path:** rolling back the app does *not* require
   `migrate:down` (expand-phase changes are backward compatible). Use
   `migrate:down` only to unwind a bad migration itself.

Local development: `docker-compose` provides a single-node replica set at
`mongodb://localhost:27017/careconnect?directConnection=true`; the config
falls back to it automatically when `MONGODB_URI` is unset.

## Current migrations

| File | Phase | Purpose |
| --- | --- | --- |
| `20260825000001-baseline-indexes.js` | expand | Ensure model-critical indexes exist (clinicalorders, radiologystudies, auditlogs `seq` unique, outboxevents dispatch index) on databases that never ran autoIndex. |
| `20260825000002-expand-user-roles.js` | expand (marker) | Documents the app-layer role-enum expansion (`reception`, `emergency`); verifies no user doc carries an out-of-enum role; writes a `migration_meta` note. |
| `20260825000003-outbox-ttl.js` | expand | Partial TTL index on `outboxevents.occurredAt` (`status: 'completed'` only, 7-day retention) so dispatched events self-clean. |
