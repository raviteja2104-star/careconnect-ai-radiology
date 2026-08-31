# ADR-008: FHIR and ABDM Integration Mapping Strategy

## Date
July 29, 2026

## Status
Accepted

## Context
CareConnect requires interoperability with the Ayushman Bharat Digital Mission (ABDM) and the broader Indian digital health ecosystem. ABDM mandates the use of FHIR R4 standard profiles for Health Information Providers (HIP) and Health Information Users (HIU). Our internal platform, however, relies on domain-specific MongoDB schemas (e.g., `Patient`, `Appointment`, `ClinicalNote`, `Prescription`) optimized for our frontend UI and internal workflows. Modifying our internal domain models to conform strictly to FHIR R4 schemas would introduce significant bloat, query complexity, and tight coupling to external standards within our core monolithic bounded contexts.

## Decision
We will introduce a dedicated, stateless **ABDM/FHIR Integration Service**.
1. **Anti-Corruption Layer (ACL):** The core monolith will remain unaware of FHIR resources. It will publish its internal events (e.g., `PrescriptionCreated`, `PatientRegistered`) to the Event Bus and expose standard REST/GraphQL APIs.
2. **Dedicated Service:** The `services/abdm-service` will act as a bidirectional translator (HIP/HIU gateway).
3. **Outbound (HIP):** When an external entity requests health data, the ABDM service will fetch the internal domain models from the monolith's APIs and map them to FHIR R4 Bundles (e.g., converting an internal `Prescription` to a FHIR `MedicationRequest` and `Bundle`).
4. **Inbound (HIU):** When CareConnect fetches data from external hospitals via ABDM, the ABDM service will receive the FHIR bundles, parse them, and translate them into CareConnect's internal formats before persisting them.

## Consequences
### Positive
* **Decoupling:** The core monolith retains its simplicity and fast iteration speed. Changes to ABDM specifications or FHIR profiles will only require updates to the `abdm-service`.
* **Scalability:** The `abdm-service` can scale independently based on interoperability traffic.
* **Maintainability:** The mapping logic (which is often complex and verbose in FHIR) is isolated from business logic.

### Negative
* **Eventual Consistency:** Synchronization between the monolith and ABDM networks may incur slight network latency.
* **Schema Duplication:** We must maintain mapping adapters for every new clinical domain entity we wish to exchange.
