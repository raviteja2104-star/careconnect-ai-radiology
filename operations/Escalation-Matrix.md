# CareConnect Escalation Matrix

When an incident response breaks expected targets, or the root cause cannot be contained by the on-call SRE, escalation is required.

## 1. Vertical Escalation (Time-Based)

If an incident is not contained within the specified timeframe, automatically escalate to the next tier.

| Tier | Role | Trigger Time (SEV-1) | Example Actions |
| :--- | :--- | :--- | :--- |
| **Tier 1** | L1 Support / SRE On-Call | `T+0 min` | Acknowledge page, execute standard runbooks. |
| **Tier 2** | Platform Engineering Lead | `T+15 min` | Investigate K8s/networking edge cases, execute DR fallbacks. |
| **Tier 3** | Backend Architecture Owner | `T+30 min` | Debug microservice logic, analyze memory dumps. |
| **Tier 4** | VP of Engineering | `T+60 min` | Business impact authorization (e.g. accepting data loss for faster RTO). |

## 2. Horizontal Escalation (Domain Subject Matter Experts)

During triage, the Tech Lead may ping specific SMEs if the failure domain is explicitly identified.

| Failure Domain | SME / Team | Slack Channel |
| :--- | :--- | :--- |
| **MongoDB / DBaaS** | Database Admin (DBA) | `#db-ops` |
| **Envoy / Kubernetes** | Platform Team | `#platform-ops` |
| **Payment Webhooks** | Billing Engineering | `#eng-billing` |
| **ABDM / FHIR** | Interoperability Team | `#eng-abdm` |
| **Auth / Secrets** | Security Team | `#sec-ops` |
