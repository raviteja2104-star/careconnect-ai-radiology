# CareConnect Production Rehearsal (PR-1) Runbook

## 1. Objective
To execute a full-scale simulation of the production go-live, verifying that the infrastructure, deployment pipeline, operational monitoring, and human incident response processes function correctly in a live-like environment before admitting real patients.

## 2. Rehearsal Timeline

| Phase | Time | Action | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **1. Deploy** | 09:00 | Trigger CI/CD Pipeline. Deploy Green Replica. | Green pods spin up, Smoke Tests pass. |
| **2. Cutover** | 09:15 | Execute Blue/Green Ingress Switch. | Live routing shifts to Green gracefully. |
| **3. Clinical** | 09:30 | Execute `Synthetic-Clinical-Workload.md` | Core workflows process successfully. |
| **4. Chaos** | 11:30 | Inject 5s ABDM Latency Fault. | Circuit Breaker OPENS. Alerts fire. |
| **5. Triage** | 11:35 | SRE On-Call Acknowledges Page. | Incident Declared. Comms sent. |
| **6. Rollback**| 12:00 | Execute `Rollback-Runbook.md`. | Traffic reverts to Blue instantly. |
| **7. Restore** | 12:15 | Resolve fault. Redeploy Green. | System normalizes. |
| **8. Review** | 13:00 | Execute Go/No-Go Meeting. | Formal approval granted. |

## 3. Incident Injection Parameters
- **Type:** Controlled external dependency failure.
- **Target:** `abdm-service`
- **Method:** Add `x-chaos-latency: 5000` header to Envoy egress rules.
- **Goal:** Verify that PagerDuty alerts the SRE, the Incident Commander assumes control, and the Clinical UI gracefully degrades without crashing the core Telemedicine/OPD workflows.
