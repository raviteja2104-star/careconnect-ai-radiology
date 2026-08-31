# Production Smoke Test Checklist

During Phase 2 of a Blue/Green Deployment, before live clinical traffic is routed to the new pods, the automated CI/CD pipeline MUST execute this checklist against the isolated Green environment.

## 1. Health & Configuration
- [ ] `/health` returns 200.
- [ ] `/ready` returns 200 (DB & Redis connected).
- [ ] Metrics endpoint `/metrics` exposes Prometheus data.

## 2. Core Clinical Smoke Test
- [ ] Authenticate with synthetic user (`MOCK_SMOKE_USER`).
- [ ] Create a synthetic patient record.
- [ ] Book an OPD appointment for the synthetic patient.
- [ ] Ensure Outbox record is created for `AppointmentBooked`.

## 3. Core Financial Smoke Test
- [ ] Generate synthetic invoice.
- [ ] Trigger mock payment webhook.
- [ ] Verify Invoice status transitions to `PAID`.

## 4. Integration Smoke Test
- [ ] Generate synthetic ABDM Consent Request.
- [ ] Verify outbound communication queue receives an event.

*(These tests are codified in `tests/release/smoke.test.js`)*
