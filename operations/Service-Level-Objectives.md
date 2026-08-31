# CareConnect Service Level Objectives (SLOs)

We define our Operational targets distinctively for Clinical core systems versus supporting peripheral systems.

## 1. Core Clinical Services
These services are critical to patient care and financial continuity.

| Service | Availability SLO | Latency SLO (P95) | Error Budget | Alert Runbook |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | 99.95% | < 150 ms | 21.6 min / month | RB-01 |
| **Clinical Backend** | 99.95% | < 200 ms | 21.6 min / month | RB-02 |
| **Queue Management** | 99.9% | < 150 ms | 43.2 min / month | RB-03 |
| **Billing Engine** | 99.9% | < 250 ms | 43.2 min / month | RB-04 |
| **Payment Service** | 99.9% | Webhook ACK < 2s | 43.2 min / month | RB-05 |

## 2. Supporting Integrations
These services do not block core patient care, and have relaxed targets.

| Service | Availability SLO | Latency SLO | Error Budget | Alert Runbook |
| :--- | :--- | :--- | :--- | :--- |
| **Communication (SMS/Email)** | 99.5% | Asynchronous | 3.6 hours / month | RB-10 |
| **ABDM Integration (FHIR)** | Best Effort | N/A (External Dependency) | N/A | RB-11 |

## 3. Error Budget Policy
- **Warning:** If 50% of the Error Budget is consumed within 7 days, trigger a SEV-3.
- **Freeze:** If 100% of the Error Budget is consumed, all non-critical feature deployments are frozen until the trailing 30-day window recovers. SRE teams focus 100% on reliability engineering.
