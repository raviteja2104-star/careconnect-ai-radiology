# CareConnect Incident Response Runbook

## 1. Severity Definitions

| Severity | Definition | Example | Target Response Time |
| :--- | :--- | :--- | :--- |
| **SEV-1 (CRITICAL)** | Core clinical or financial workflow entirely unavailable. | MongoDB primary down; Envoy gateway offline. | < 15 minutes |
| **SEV-2 (HIGH)** | Significant degradation of core systems, or loss of secondary systems. | Billing lagging; Authentication latency > 2s. | < 30 minutes |
| **SEV-3 (MEDIUM)** | External integrations down, or non-critical backlog growing. | ABDM Circuit Breaker OPEN; SMS queue > 50. | < 4 hours |
| **SEV-4 (LOW)** | Cosmetic issues, UI defects, or single-user glitches. | Typo in email template; Missing translation. | Next Planned Release |

## 2. Incident Roles
During a SEV-1 or SEV-2, the following roles are explicitly assigned on the Slack bridge (`#incidents`):

1. **Incident Commander (IC):** Drives the incident. Does not type commands. Makes the final call on failovers or rollbacks.
2. **Technical Lead (Tech):** Operates the infrastructure. Queries logs, executes runbook commands.
3. **Communications Lead (Comms):** Translates technical status into business updates. Updates the status page every 30 minutes.

## 3. The Response Loop
1. **Detection:** Alert fires via PagerDuty. IC acks the page.
2. **Containment:** Tech Lead executes immediate mitigation (e.g., rolling back the last deployment, scaling down ingress).
3. **Recovery:** Apply the formal fix or execute DR runbook.
4. **Closure:** System returns to normal SLO bands. IC declares the incident resolved.
5. **Post-Incident Review:** Scheduled within 48 hours.
