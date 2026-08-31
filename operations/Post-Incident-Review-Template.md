# CareConnect Post-Incident Review (PIR) Template

*All PIRs are explicitly Blameless. The goal is to fix the system, not the human.*

## 1. Incident Overview
- **Incident ID:** `INC-XXXX`
- **Date:** `YYYY-MM-DD`
- **Severity:** `SEV-X`
- **Incident Commander:** `Name`
- **Service Impacted:** `Service Name`

## 2. Customer Impact
*How did this affect the hospital and patients? State in business terms (e.g., "Patients could not check-in at the front desk for 15 minutes").*

## 3. Timeline
- `09:00` - Issue began.
- `09:02` - Alert triggered: `High Latency on Billing`.
- `09:05` - On-call SRE engaged.
- `09:12` - Containment (Rollback applied).
- `09:15` - SLO returned to green.

## 4. Root Cause Analysis (5 Whys)
1. **Why did billing latency spike?** Because the DB lock contention increased.
2. **Why was there lock contention?** Because a heavy reporting query was run on the Primary DB.
3. **Why was it run on the Primary?** Because the reporting service was misconfigured in the helm chart.
4. **Why was it misconfigured?** Because the env var defaulted to `MONGO_URI` instead of `MONGO_URI_READONLY`.
5. **Why did this bypass testing?** Because our load tests don't simulate heavy asynchronous reporting alongside clinical operations.

**Root Cause:** The reporting service defaulted to the primary database, starving the clinical API of write-locks.

## 5. Action Items (Preventative Actions)
| Action | Owner | Target Date |
| :--- | :--- | :--- |
| 1. Hardcode Read Preference `secondaryPreferred` into the reporting service's DB driver. | Eng Backend | `YYYY-MM-DD` |
| 2. Add asynchronous reporting simulation to RC4 Capacity Benchmarks. | QA Team | `YYYY-MM-DD` |
| 3. Set a specific Prometheus alert for DB Lock Wait Time > 500ms. | Platform | `YYYY-MM-DD` |
