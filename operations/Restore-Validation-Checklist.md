# CareConnect Restore Validation Checklist

Before accepting a restored database as the new Primary System of Record, the on-call SRE must verify the following checklist.

## Infrastructure Health
- [ ] `/health` returns `200 OK` for all microservices.
- [ ] `/ready` returns `200 OK` indicating successful connection to the restored MongoDB.

## Data Integrity (Automated via `restore-validation.test.js`)
- [ ] **Outbox Consistency:** Total count of pending outbox events matches the pre-incident expectation. No duplicate processing states.
- [ ] **Billing Integrity:** Total sum of `PAID` invoices matches the external Stripe/Razorpay ledger up to the RPO (Recovery Point Objective).
- [ ] **Audit Trail:** The final recorded audit event chronologically aligns with the final clinical event committed before the outage.

## Functional Smoke Test
- [ ] Successfully create a test patient.
- [ ] Successfully book an appointment.
- [ ] Successfully verify an ABDM FHIR export request.
- [ ] Receive the expected SMS/Email notification.

---
**Approval Required:** Site Reliability Engineering Lead
