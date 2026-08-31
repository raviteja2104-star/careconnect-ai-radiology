# CareConnect Database Migration Strategy

## 1. Goal
Ensure that database schema changes do not block Blue/Green deployments and never break rollback compatibility.

## 2. The Expand → Migrate → Contract Pattern

Destructive schema changes (like renaming or deleting a column) in a single deployment are **banned**. They break the old Blue deployment if a rollback is required.

### Phase 1: Expand (Release N)
- Add the new field/collection to the Mongoose schema.
- Deploy Application Version N.
- Both Blue (V N-1) and Green (V N) deployments can read/write successfully.

### Phase 2: Migrate (Background)
- Run an idempotent background job to backfill the new data field from the old data field.
- Ensure the job processes in small batches to avoid DB lock contention.

### Phase 3: Contract (Release N+1)
- Once V N is stable and a rollback to V N-1 is no longer possible, release Version N+1.
- This version removes the legacy Mongoose field.
- Execute a final DB script to `$unset` the legacy fields from the MongoDB documents.

## 3. Migration Safety Checklist
- [ ] Is the migration idempotent? (Can it be run twice without duplicating data?)
- [ ] Is it backwards compatible? (If we rollback the app code 5 minutes from now, will the old code still function with this new schema?)
- [ ] Does the migration execute in batches < 1000 to prevent locking the primary?
