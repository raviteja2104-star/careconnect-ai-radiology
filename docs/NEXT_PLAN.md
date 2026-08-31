# CareConnect — Next Plan (Post-Redesign Roadmap)
**Date:** 2026-08-21 · **Baseline:** UI redesign complete (62 pages), EMR + Teleradiology modules live, app separation + guided tours shipped, security hardening + transactional outbox landed. All builds green; 20 unit + 5 smoke tests passing.

The platform is now an excellent **demo-complete system with a real architectural spine**. The next arc turns it into a **deployable product**: real auth, real data, real integrations — in that order, because everything downstream depends on the first two.

---

## Phase A — Live data foundation (Week 1–2) · *unblocks everything*

**A1. Real authentication, end to end**
- Login/register pages in the portal wired to `/api/auth` (JWT already works server-side).
- `SessionProvider` consumes the real JWT session; demo personas become seed fixtures behind a `?demo=1` flag.
- Token storage + refresh, 401 interceptor → login redirect; MFA screen using the existing TOTP stub.
- *Done when:* every module loads live data for a logged-in user of the right role; demo badges disappear.

**A2. MongoDB as a replica set + seed data**
- `docker-compose` mongo → single-node replica set (`rs.initiate`) so `TxRunner` runs real transactions instead of fallback.
- Seed script: one user per role (incl. new `reception`/`emergency`), 20 patients, appointments, encounters, orders, studies — enough to make every dashboard truthful.
- *Done when:* the EMR→teleradiology loop (order → study → sign → notify) runs live with zero mocks.

**A3. Redis, for real**
- Add `ioredis`; wire the three claimed-but-absent uses: response caching on hot reads (patient 360, worklist), rate limiting on the monolith (replacing the unused dep), payment-service idempotency (replacing the in-memory Map).
- Health endpoint probes it (currently reports `not_configured` honestly).

## Phase B — Clinical integrations (Week 3–5)

**B1. Imaging: Orthanc + OHIF (replaces canvas-drawn mock DICOM)**
- Orthanc container as the PACS; STOW ingest from the existing DICOMweb routes; worklist `studyInstanceUID` becomes real.
- Build/pin OHIF into `ohif-viewer/` (currently an empty directory) and embed it in the reading workspace — the disabled W/L/MPR toolbar becomes live.

**B2. Telemedicine: real WebRTC**
- LiveKit (self-hostable) or Daily as provider; replace the static video panels in all three telemedicine pages. The socket signaling and session lifecycle already exist.

**B3. AI service: from deterministic stubs to real drafting**
- Stand up `ai-service` with a Claude API backend for: SOAP draft, discharge summary, radiology report draft, patient-friendly explanations, differential suggestions.
- The UI contract is already built (explicit "Insert into note", never silent) — only the generation swaps in.
- Drug-interaction screening upgraded from the curated list to a proper dataset (e.g. openFDA).

**B4. Communications: live WhatsApp/SMS**
- Wire real Twilio/Gupshup credentials into the existing (genuinely implemented) circuit-breaker NotificationRouter; connect the outbox drainer to it for `CriticalFindingDetected` and `PatientNotified`.

## Phase C — Trust & operations (Week 5–7)

**C1. Audit log that isn't fake**
- `AuditLog` model + middleware (who/what/when/trace) on all PHI reads and clinical writes; hash-chained entries; admin viewer page replacing the hardcoded two-row array.

**C2. Observability with real numbers**
- Latency/error middleware on the monolith → `/metrics` (Prometheus format); Grafana dashboards from the compose stack that's already provisioned; `/admin/observability` reads real SLO/error-budget arithmetic instead of literals.

**C3. Saga compensation + broker decision**
- Add failure listeners + compensating actions to `TelemedicineSaga`; implement `EmergencyOrchestrator`'s console.log stubs.
- Decide the bus: RabbitMQ container + `amqplib` behind the existing EventBus interface, or commit (in ADR) to in-process + outbox for single-node deployments.

**C4. Migration framework**
- `migrate-mongo` with the expand/migrate/contract convention documented; first migration = the role-enum expansion already shipped.

## Phase D — Release engineering (Week 7–8)

- **E2E:** Playwright suite for the critical path (book → check-in → queue → consult → order → report → billing → notify) — reusing the recorder harness built for the demo video.
- **CI that does things:** replace the echo-only GitHub Actions steps with real build, unit, smoke, and E2E gates; the smoke suite now exists and passes.
- **ABDM sandbox:** apply for sandbox keys; wire the (now-fixed) ECDH + consent flow against the sandbox; feed FHIR bundles from real DB data instead of the hardcoded mocks.
- **Deploy:** compose stack refresh (Redis client env, replica-set Mongo, Orthanc, LiveKit) → then Helm/K8s only when a real multi-node target exists.

---

## Sequencing logic
- **A before everything:** auth + live data convert every demo badge into a real screen and make all later testing meaningful.
- **B is the product:** imaging, video, AI, and messaging are the four visible promises still stubbed.
- **C is what a hospital will ask about in procurement:** audit, observability, resilience.
- **D is what lets you ship weekly without fear.**

## Immediate next actions (if we start now)
1. Login page + JWT session wiring (A1) — ~1 session of work.
2. Compose replica-set + seed script (A2) — ~1 session.
3. Redis client + rate limiting (A3) — ~half a session.
