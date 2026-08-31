# CareConnect Rollback Runbook

## 1. Goal
Provide an objective, instant mechanism to revert a production deployment if SLOs degrade, without requiring database repairs.

## 2. Automated Rollback Triggers
The CI/CD pipeline (or SRE) MUST initiate an immediate rollback if any of the following occur within 30 minutes of a traffic switch:
- `/health` or `/ready` endpoints fail on > 10% of new pods.
- P95 Latency spikes > 250ms for clinical APIs.
- Elevated 5xx error rate (> 1%).
- Payment Webhook signature validation failures spike.

## 3. Rollback Procedure

Because we employ Blue/Green deployments, the previous (Blue) replica set is still running in the background (until explicitly retired). 

**Step 1: Execute Instant Traffic Reversal**
Re-route the Kubernetes Service selector back to the old label.
```bash
helm upgrade careconnect ./helm-chart \
  --reuse-values \
  --set activeTraffic=blue
```

**Step 2: Verify**
Verify that ingress traffic is hitting the old pods.
`npm run test:release:rollback-validation`

**Step 3: Containment**
Do NOT delete the failing Green pods immediately. Isolate them so the Engineering team can debug the runtime memory/logs to determine the RCA.
