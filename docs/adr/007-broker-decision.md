# ADR-007: Event Broker Decision — In-Process EventBus + Transactional Mongo Outbox

**Status:** Accepted
**Date:** 2026-08-25
**Deciders:** Engineering Team
**Supersedes:** the open broker question flagged in [ADR-003](./003-event-driven-architecture.md)

---

## Context

ADR-003 introduced the event-driven architecture but left the broker choice open ("Redis Streams / RabbitMQ / Kafka is still to be selected for production"). Since then the eventing layer has hardened:

- **Transactional outbox is real.** `EventPublisher.publish` accepts a Mongo `session`; when callers run inside `TxRunner.run`, the `OutboxEvent` row commits atomically with the aggregate write, and local emits are deferred to `TxRunner`'s after-commit queue so subscribers never observe writes that roll back. On standalone MongoDB, `TxRunner` degrades gracefully to sequential writes.
- **Outbox dispatch is safe for multiple workers.** `OutboxWorker` claims pending events with an atomic `findOneAndUpdate` compare-and-swap (`pending` → `processing`), so two worker instances can never dispatch the same event twice, with retry counts and a dead-letter (`failed`) status.
- **Sagas now compensate.** `TelemedicineSaga` and `EmergencyOrchestrator` handle step failures with compensating writes and `*SagaFailed` events rather than silently dropping work.

CareConnect currently deploys as a single-node monolith. Introducing RabbitMQ or Kafka today would add an operational dependency (cluster management, partitioning, consumer-group tuning, delivery-semantics rework) that no current requirement justifies.

## Decision

**CareConnect commits to the in-process `EventBus` (Node `EventEmitter`) plus the transactional Mongo outbox as the event backbone for single-node deployments. RabbitMQ/Kafka adoption is deferred until multi-node deployment.**

Concretely:

1. **In-process fan-out** (`EventBus` / `emitEvent`) remains the mechanism for same-process subscribers (sagas, orchestrators, AI engine).
2. **Durability** comes from the outbox, not the bus: any event that must survive a crash goes through `EventPublisher.publish` (ideally inside `TxRunner.run` for atomicity), and `OutboxWorker` handles at-least-once external delivery with retries and dead-lettering.
3. **No message broker** (RabbitMQ, Kafka, Redis Streams) is introduced until a trigger condition below is met.

### Trigger conditions for revisiting

Adopt an external broker when **either** occurs:

- **Horizontal scaling of the monolith** — more than one API/server process must react to the same events (in-process `EventEmitter` fan-out cannot cross process boundaries).
- **>1 consumer process** — a service is split out (e.g. a dedicated ai-service or communication service consuming events directly) and needs its own subscription, replay, or independent scaling.

Secondary signals: outbox polling latency becoming a product problem (need push-based delivery), or event volume where 5s polling and per-event HTTP dispatch stop keeping up.

### Migration path

The design keeps the switch cheap:

- **The `EventBus` interface stays.** Subscribers keep `EventBus.on(EVENT, handler)`; the bus implementation is swapped to bridge from the broker (ADR-003's "can be swapped for Kafka/RabbitMQ" promise, now with a concrete seam).
- **The outbox drainer becomes the bridge publisher.** `OutboxWorker` already reads committed outbox rows and pushes them outward; its dispatch target changes from the communication-service HTTP endpoint to broker topics/exchanges. The transactional-outbox guarantee (aggregate write + event commit atomically) carries over unchanged — this is exactly the pattern brokers recommend for exactly-once-ish publication.
- **Publishers do not change.** Controllers and sagas keep calling `EventPublisher.publish({ ..., session })`.

## Consequences

- ✅ Zero new infrastructure to operate for the current single-node deployment.
- ✅ Durable, at-least-once delivery of externally-visible events via the outbox; atomic with business writes when MongoDB runs as a replica set (`TxRunner`).
- ✅ Clear, pre-agreed triggers prevent both premature adoption and indefinite drift.
- ✅ Migration is confined to two seams (`EventBus` implementation, `OutboxWorker` dispatch target).
- ⚠️ In-process subscribers get at-most-once, non-durable delivery: if the process dies mid-handler, saga steps after the outbox write are lost until a replay mechanism reads the outbox. Compensation events (`TelemedicineSagaFailed`, `EmergencySagaFailed`) mitigate but do not eliminate this.
- ⚠️ On standalone MongoDB (no replica set) the outbox write is not atomic with the aggregate write — `TxRunner` logs this degradation; production should run a replica set.
- ⚠️ Ordering across aggregates is best-effort (`occurredAt` sort in the worker); consumers must stay tolerant of reordering, which also keeps them broker-ready.

## Alternatives Considered

| Option | Rejected Reason |
|--------|----------------|
| RabbitMQ now | Operational cost (cluster, HA, DLX topology) with zero cross-process consumers today |
| Kafka now | Even heavier ops burden; partitioned log semantics unneeded at current scale |
| Redis Streams | Redis already present, but adds a second delivery semantic to reason about without solving a current problem; revisit at trigger time as the lightweight option |
| Mongo change streams instead of outbox polling | Requires replica set unconditionally; polling worker is simpler and already battle-tested here |
