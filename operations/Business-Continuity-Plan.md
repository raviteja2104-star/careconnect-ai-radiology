# CareConnect Business Continuity Plan (BCP)

## 1. Goal
Ensure that the hospital can continue operating critical clinical services during an extended (4+ hour) CareConnect outage.

## 2. Tiering of Services
- **Tier 1 (Critical):** Patient Registration, OPD Encounters, E-Prescriptions.
- **Tier 2 (Degraded):** Telemedicine, Billing, Queue Management.
- **Tier 3 (Offline):** ABDM Interoperability, Analytics.

## 3. Downtime Procedures (Manual Operations)
If CareConnect is declared fully unavailable and RTO (>30m) is breached:
1. **Clinical Fallback:** Switch to pre-printed Emergency Encounter Forms.
2. **Prescription Fallback:** Issue physical, wet-signed prescriptions.
3. **Queue Fallback:** Use physical token dispensers.

## 4. Recovery & Reconciliation (Post-Incident)
Once CareConnect is restored:
1. Data entry clerks must bulk-upload the physical Emergency Encounter Forms into the system.
2. The Finance team will retroactively generate digital invoices for offline payments collected during the outage.
3. Run `npm run job:reconcile-downtime-records` to ensure audit integrity.
