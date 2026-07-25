# ADR-003: Event-Driven Architecture with Typed Events

**Status:** Accepted  
**Date:** 2026-07-24  
**Deciders:** Engineering Team  

---

## Context

As the platform grew to 19+ modules (EMR, ICU, OT, ED, EMS, Pharmacy, Lab, Billing, etc.), inter-module communication via direct function calls created tight coupling. A medication dispensed in Pharmacy needed to update the nurse station, billing, and the patient portal. A bed assignment in ADT needed to notify the ICU and EMS systems.

## Decision

Introduce `@careconnect/events` as the single source of truth for all inter-module events.

- **No string literals** in application event handlers — only named constants.
- All events are enveloped in a typed `CareConnectEvent<T>` wrapper containing `type`, `payload`, and `metadata` (eventId, timestamp, correlationId, patientId, userId, tenantId).
- 45+ typed event constants covering every clinical domain.

## Event Categories

| Domain | Events |
|--------|--------|
| Patient | PATIENT_CREATED, PATIENT_UPDATED, PATIENT_DECEASED |
| ADT | PATIENT_ADMITTED, PATIENT_TRANSFERRED, PATIENT_DISCHARGED |
| Clinical | VITALS_RECORDED, SOAP_SAVED, ALLERGY_UPDATED |
| Medications | MEDICATION_ORDERED, MEDICATION_DISPENSED, MEDICATION_ADMINISTERED |
| Lab | LAB_ORDERED, LAB_RESULT_READY, LAB_CRITICAL_VALUE |
| Imaging | IMAGING_ORDERED, IMAGING_COMPLETED, RADIOLOGY_REPORTED |
| Surgery | SURGERY_SCHEDULED, SURGERY_STARTED, SURGERY_COMPLETED |
| ICU | ICU_ADMITTED, VENTILATOR_STARTED, VENTILATOR_STOPPED |
| Emergency | CODE_BLUE, CODE_RED, TRIAGE_COMPLETED |
| EMS | EMS_DISPATCHED, EMS_ON_SCENE, EMS_HANDOVER |
| Billing | CLAIM_SUBMITTED, PAYMENT_RECEIVED |

## Consequences

- ✅ Modules are decoupled; adding a new subscriber does not require changing the publisher.
- ✅ Every event carries a `correlationId` enabling distributed tracing.
- ✅ `patientId` + `tenantId` on every event enables compliance audit logging.
- ⚠️ Event broker implementation (Redis Streams / RabbitMQ / Kafka) is still to be selected for production. Current implementation is in-process.
- ⚠️ Event versioning strategy (schema registry) needed before v2.0.

## Alternatives Considered

| Option | Rejected Reason |
|--------|----------------|
| Direct module calls | Tight coupling; circular dependency risk |
| GraphQL subscriptions only | Not suitable for server-to-server events |
| String-based events | No compile-time safety; typos cause silent bugs |
