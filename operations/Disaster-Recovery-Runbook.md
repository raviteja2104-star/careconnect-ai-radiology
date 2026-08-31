# CareConnect Disaster Recovery (DR) Runbook

## Scope
This runbook covers catastrophic loss of the primary cluster, database corruption, or complete Availability Zone (AZ) failure.

## Objectives
- **RPO (Recovery Point Objective):** <= 15 Minutes
- **RTO (Recovery Time Objective):** <= 30 Minutes

## Scenario: Complete MongoDB Database Loss (or Corruption)

### Phase 1: Containment
1. Halt all ingress traffic at the Envoy Gateway to prevent partial clinical writes.
   `kubectl scale deployment envoy-gateway --replicas=0 -n ingress-system`
2. Halt all Outbox Polling Workers to prevent desyncing the event bus.
   `kubectl scale deployment outbox-worker --replicas=0 -n careconnect-core`

### Phase 2: Recovery
1. Identify the latest validated backup in S3:
   `aws s3 ls s3://careconnect-dr-backups/mongodb/`
2. Restore the latest Daily Full Snapshot.
3. Replay the Oplog up to the point of failure (Point-In-Time-Recovery).
   *Warning: If the failure was data corruption (e.g. ransomware or accidental DROP), replay the oplog only up to the timestamp IMMEDIATELY PRECEDING the corruption event.*

### Phase 3: Validation
1. Execute `npm run test:restore-validation`.
2. Confirm 0 partial outbox events exist.

### Phase 4: Traffic Restoration
1. Scale the Outbox Polling Workers back up. Wait for the backlog to drain.
2. Scale the Envoy Gateway back up to admit external traffic.
3. Post incident report to `#incidents` Slack channel.
