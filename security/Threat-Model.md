# CareConnect Threat Model

## 1. System Overview
CareConnect is an event-driven, multi-tenant healthcare operating system managing patient records, telemedicine sessions, financial billing, and ABDM/FHIR interoperability.

## 2. Key Assets
- Protected Health Information (PHI) & PII.
- Financial data (Ledger balances, Invoices).
- Auth Tokens & Gateway credentials.
- Cryptographic ABDM Consent Objects.

## 3. Trust Boundaries
- **Public Internet <-> API Gateway (Envoy):** High risk boundary. Must enforce TLS, Rate Limiting, WAF rules.
- **API Gateway <-> Microservices:** Internal boundary. Must enforce JWT validation and tenant isolation.
- **Microservices <-> Message Broker (Redis):** Internal async boundary.
- **Microservices <-> External Providers (Razorpay/ABDM):** High risk. Must validate webhook signatures and sanitize egress data.

## 4. Threat Scenarios (STRIDE)

| Threat Type | Scenario | Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Forged webhook payload from Payment Gateway. | Enforce strict HMAC signature verification in `payment-service` before processing. |
| **Tampering** | Modifying Audit Log entries to hide a data breach. | Audit API exposes only `GET` methods. Database user for audit logs lacks `UPDATE/DELETE` grants. |
| **Repudiation** | Doctor denies finalizing a prescription. | All clinical mutations log immutable trace events tied to the verified JWT subject. |
| **Information Disclosure** | BOLA/IDOR allowing Tenant B to view Tenant A's patients. | Mongoose plugins and Route middleware automatically append `tenantId` bounds to all queries. |
| **Denial of Service** | Volumetric attack on Public Booking API. | Gateway rate limiting (Envoy). Asynchronous Outbox limits internal DB contention. |
| **Elevation of Privilege**| Mass assignment to elevate `role` during registration. | Strict schema whitelisting strips unapproved fields during POST/PUT. |

## 5. Follow-up Security Posture
- Require an external red-team to execute blind penetration testing against the production-replica cluster before final go-live.
