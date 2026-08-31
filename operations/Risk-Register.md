# CareConnect Risk Register

| Risk ID | Description | Impact | Likelihood | Mitigation Strategy | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RSK-01** | ABDM API experiences a prolonged outage during pilot. | Medium | High | Application implements aggressive circuit breakers. Core clinical workflows will gracefully degrade and continue without ABDM. | Eng Lead |
| **RSK-02** | Payment Gateway Webhook failure causes lost revenue. | High | Low | Idempotent Outbox architecture ensures webhooks can be replayed safely. Manual reconciliation job exists. | Finance Eng |
| **RSK-03** | Doctors resist digital prescription adoption. | High | Medium | Appointed "Clinical Champions" to provide at-the-elbow support. Paper fallback approved as a last resort. | Clinical Lead |
| **RSK-04** | Cloud infrastructure outage (e.g. AWS AZ failure). | Critical | Low | Cross-AZ Kubernetes deployment. DR Runbook dictates a 30m RTO via S3 snapshot restore. | DevOps Lead |
