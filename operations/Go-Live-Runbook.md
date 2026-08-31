# CareConnect Go-Live Runbook

## 1. Objective
Ensure a flawlessly coordinated, zero-downtime cutover to the CareConnect production system for the initial hospital pilot.

## 2. Pre-Flight Checks
- [ ] T-7 Days: Go/No-Go Approval completed by steering committee.
- [ ] T-3 Days: Final Backup and DR Restore validation verified.
- [ ] T-1 Day: Production environment locked. Non-critical deployments frozen.

## 3. Go-Live Day Timeline (T-0)

| Time | Activity | Owner | Rollback Check |
| :--- | :--- | :--- | :--- |
| **07:00** | Spin up `Green` deployment behind Envoy (0% traffic). | DevOps Lead | If pods crashloop, abort go-live. |
| **07:30** | Execute Production Smoke Tests (`smoke.test.js`) | QA Lead | If tests fail, abort go-live. |
| **08:00** | Verify all Clinical Champions are on the floor. | Clinical Lead | If absent, delay cutover. |
| **08:30** | Route 10% Ingress traffic to Green (Canary phase). | Release Mgr | If 5xx spikes, auto-rollback. |
| **08:45** | Verify Telemetry (SLO Dashboards). | SRE On-Call | If P95 > 250ms, auto-rollback. |
| **09:00** | Route 100% Ingress traffic to Green. | Release Mgr | If issues occur, manual rollback via Runbook. |
| **09:30** | Formal declaration of Go-Live to hospital staff. | Comms Lead | N/A |

## 4. Post-Cutover Actions
- Monitor SLOs and Error Budgets continuously.
- Establish the open Slack Bridge `#careconnect-hypercare`.
- Schedule the T+24 Hour Go-Live Review.
