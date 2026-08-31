# CareConnect Backup Runbook

## 1. Strategy & Frequency

| Component | Strategy | Frequency | Retention | Storage |
| :--- | :--- | :--- | :--- | :--- |
| **MongoDB (Clinical/Billing)** | LVM Snapshots + Oplog Tail | Daily Full, Continuous Oplog | 30 Days | S3 (Encrypted at rest: AES-256) |
| **Redis (Event Bus)** | AOF (Append Only File) | Continuous | 7 Days | S3 |
| **Vault / Secrets** | Consul Snapshot | Hourly | 90 Days | S3 (KMS Encrypted) |

## 2. Backup Execution (Automated)

Backups are executed via Kubernetes CronJobs (`careconnect-db-backup-cron`). 

To trigger a manual ad-hoc backup:
```bash
kubectl create job --from=cronjob/mongodb-backup manual-backup-001 -n careconnect-data
```

## 3. Verification

A backup is not considered valid until verified.
1. The cronjob automatically provisions an ephemeral MongoDB instance.
2. It restores the dump into the ephemeral instance.
3. It runs `npm run test:backup-integrity`.
4. It alerts `#sre-alerts` in Slack if validation fails.
