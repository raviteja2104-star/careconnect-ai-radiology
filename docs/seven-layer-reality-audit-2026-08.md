# CareConnect Seven-Layer Reality Audit
**Date:** 2026-08-07 · **Method:** code-verified (every claim traced to file:line by two independent audit passes) · **Scope:** Features → Architecture → Interoperability → Resilience → Operations → Governance → Production Readiness

> TL;DR — The platform's *feature surface and documentation are extensive; its executable depth is thin.* The RC1/RC2 docs' "GO-LIVE READY" verdict is not supported by the code. Current honest stage: **feature-complete prototype / demo**, not a production candidate.

---

## 1. Features — BROAD, real surface
- 62 web-portal pages, 30 backend route files, 22 Mongoose models, 6 microservices. The breadth claim is genuine.
- Much page-level data is mock/hardcoded (e.g. doctor dashboard KPIs, observability metrics).

## 2. Architecture — patterns named, half-implemented
| Claim | Reality |
|---|---|
| RabbitMQ EventBus | In-process Node `EventEmitter` (`backend/src/services/EventBus.js:7`). No amqplib anywhere; no broker in docker-compose. Billing never subscribes to anything — it only publishes. |
| Transactional Outbox | Model + polling worker are real (`OutboxEvent.js`, `OutboxWorker.js`), but **zero MongoDB transactions exist repo-wide** (no `startSession`/`withTransaction`). `appointmentController.js:103-139` does two unatomic writes — the exact failure the pattern exists to prevent. Worker claim is non-atomic (double-send risk with 2 instances). |
| Saga orchestration | `TelemedicineSaga` is a real forward-only event chain with **no compensation/rollback/failure handlers**. `EmergencyOrchestrator.js:32-50` is console.log stubs with hardcoded `AMB-001`. |
| Redis caching/rate-limit | **No Redis client library in any package.json.** Container provisioned in docker-compose but nothing connects. Payment idempotency is an in-memory `Map` "simulating Redis". |

## 3. Interoperability — one bright spot, two real bugs
- **FHIR R4 mappers: genuinely implemented** (`services/abdm-service/src/fhir/mapper.js` — 5 resource mappers, correct terminology URIs, unit-tested). Bundle assembly works but is fed 100% mock inputs; nothing fetches from the real DB.
- **Consent webhooks:** spec-shaped, but consents live in an in-process Map, signature verification skipped, and **`gateway.js:88` references undefined `consents` → every HIU consent ack throws `ReferenceError`** (unhandled rejection, ack never sent).
- **ECDH crypto (`fidh.js`):** real X25519 + HKDF + AES-256-GCM, but **`:100` returns the hardcoded string `"sender_public_key_derived"` as the public key** — interop is impossible. Module is dead code (never imported by routes).
- **OHIF/PACS:** `ohif-viewer/` is an **empty directory**; fallback deep-links to public viewer.ohif.org with localhost DICOMweb roots (won't load). DICOMweb routes serve mock studies with canvas-drawn synthetic images.
- **Telemedicine WebRTC: absent** — no RTCPeerConnection/signaling anywhere; video panel is static JSX ("Ping: 42ms" is a literal).

## 4. Resilience — 2 real circuit breakers, everything else aspirational
- Real opossum breaker on notification providers (`packages/integrations/communication/src/NotificationRouter.ts:31-79`) wrapping a real Twilio axios call — strongest code in the repo.
- Auth "breaker" wraps local `jwt.verify` (CPU-bound) — no resilience value. Monolith backend has **no breaker at all**; the ABDM breaker promised by the Risk Register/Alert Catalog doesn't exist.
- All 6 chaos experiment scripts have their entrypoints **commented out**; experiment 03 relabels an axios client timeout as "circuit breaker OPEN".
- One real fault-injection hook: `x-chaos-latency` middleware in abdm-service (permanently enabled, no env gate — itself a risk).

## 5. Operations — dashboards without instruments
- `/admin/observability` page: metrics, traces, SLO figures, alerts — **all hardcoded literals** with `Math.random()` jitter. No error-budget arithmetic exists anywhere.
- Backend has no latency/error middleware (auth-service's trace-ID middleware is the sole real instance).
- `/api/system/health` hardcodes `database/redis/eventBus/rateLimiter` as healthy strings — it would report green during a total outage.
- CI Blue/Green pipeline: correct stage shape, every step is `echo`; helm commands commented out.
- **Smoke tests target routes that don't exist** (`/ready`, `/patients` vs `/api/patient`) and the `test:release:smoke` script isn't defined; no jest dependency at root → the entire `tests/` tree is unrunnable. Rollback validation's key assertion is commented out.
- **All socket.io realtime is disabled when `NODE_ENV=production`** (`server.js:165-171`) — every realtime feature silently dies in prod. Where it fires, `io.emit` broadcasts clinical/billing payloads globally, bypassing room scoping.

## 6. Governance — primitives exist, enforcement doesn't
- JWT auth + `authorize()` role guard are real and correctly written (`backend/src/middleware/auth.js`).
- **16 of 31 route files never use them** — patient PHI, telemedicine, consent, billing, reception routes are fully unauthenticated.
- Claimed Reception/Emergency roles don't exist in the User enum.
- Audit logging: no model, no middleware; the "SHA-256 immutable audit log" is a hardcoded 2-element array whose hash is the SHA-256 of the empty string.
- HIPAA/DPDP: hardcoded strings (`hipaa: 'compliant'`, `vulnerabilities: 0`). Security tests assert 403s they can never produce (literal `Bearer PATIENT_TOKEN` strings → 401).
- Schema migrations: **no framework, no migrations dir** — Expand/Migrate/Contract exists only as prose.

## 7. Production Readiness — verdict
**Not production-ready.** Highest-priority fixes, in order:
1. **Auth coverage:** protect the 16 open route files; add reception/emergency roles or gate their routes.
2. **Realtime in prod:** remove the `NODE_ENV !== 'production'` guard around socket.io; scope emissions to rooms.
3. **Fix the two hard bugs:** `abdm-service/src/abdm/gateway.js:88` (undefined `consents`) and `fidh.js:100` (hardcoded public key).
4. **Make the outbox transactional:** `mongoose.startSession()` + `withTransaction` around aggregate-write + outbox-write; atomic claim (`findOneAndUpdate`) in the worker.
5. **Make tests runnable:** add jest, define `test:release:smoke`, point smoke tests at real routes; uncomment rollback assertion.
6. **Real health checks:** ping Mongo/Redis instead of returning literals; add latency/error middleware before trusting any SLO number.
7. Then: real Redis client, broker decision (or honestly document in-process bus), saga compensation, migration framework, audit-log model.

*Generated by code audit; see git history for the two underlying verification passes.*
