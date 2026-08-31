# CareConnect Alert Catalog

This document defines the automated alerts configured in Prometheus/AlertManager and links them to the actionable runbooks for the on-call SRE.

## 1. Clinical Core Alerts

| Alert Name | Condition | Severity | Runbook Link |
| :--- | :--- | :--- | :--- |
| **High Error Budget Burn Rate** | 50% budget burned in 7 days | SEV-3 | `RB-01` |
| **MongoDB Primary Unavailable** | `mongodb_up == 0` for 1m | SEV-1 | `RB-DB-01` |
| **API Latency P95 > Target** | `http_request_duration_seconds{quantile="0.95"} > 0.2` for 5m | SEV-2 | `RB-02` |

## 2. Event-Driven & Integrations

| Alert Name | Condition | Severity | Runbook Link |
| :--- | :--- | :--- | :--- |
| **Outbox Backlog Growing** | `outbox_pending_events > 500` for 10m | SEV-2 | `RB-12` |
| **Circuit Breaker Open (ABDM)** | `circuit_breaker_state{service="abdm"} == OPEN` | SEV-3 | `RB-04` |
| **Payment Webhook Failures** | `payment_webhook_errors_rate > 5%` | SEV-2 | `RB-05` |

## 3. Infrastructure & Cryptography

| Alert Name | Condition | Severity | Runbook Link |
| :--- | :--- | :--- | :--- |
| **TLS Certificate Expiring** | `cert_manager_certificate_expiration < 14d` | SEV-3 | `RB-SEC-01` |
| **Nightly Backup Failed** | `cronjob_backup_success == 0` | SEV-2 | `RB-DR-01` |
| **Restore Validation Failed** | `restore_integrity_test == 0` | SEV-1 | `RB-DR-02` |
