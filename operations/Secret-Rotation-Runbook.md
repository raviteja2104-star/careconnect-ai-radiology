# CareConnect Secret Rotation Runbook

## 1. Scope
This runbook covers the zero-downtime rotation of application secrets, including:
- Database credentials (MongoDB, Redis)
- Third-party API Keys (Razorpay, Stripe, SMS Providers)
- Internal JWT Signing Keys (Symmetric & Asymmetric)
- Webhook HMAC secrets

## 2. Zero-Downtime Rotation Principles
CareConnect implements the **"Dual Key" / "Current & Previous"** rotation pattern. 
At any given time, the platform supports verifying tokens/signatures with *either* the new active key or the previous key. This guarantees zero broken sessions during the rotation window.

## 3. Procedure: Internal JWT Key Rotation
**Frequency:** Every 90 days.

1. **Generate New Key:** Generate a new RSA-256 Keypair in Hashicorp Vault (or AWS KMS).
2. **Deploy Configuration (Active+1):** 
   Update the deployment manifest so the backend has access to `JWT_KEYS_ARRAY=[NEW_KEY, OLD_KEY]`.
3. **Trigger Rolling Restart:**
   `kubectl rollout restart deployment backend-service -n careconnect-core`
4. **Validation:**
   Wait for pods to cycle. Verify that a user can login (issues new token with `NEW_KEY`) and that an existing user's session (signed with `OLD_KEY`) is still accepted by the backend.
5. **Retire Old Key (30 Days Later):**
   Remove `OLD_KEY` from the array and trigger another rollout to aggressively invalidate all old sessions.

## 4. Procedure: Database Credential Rotation
**Frequency:** Every 180 days, or immediately upon suspected compromise.

1. Create a *new* secondary database user with identical read/write roles in MongoDB.
2. Update the Vault secret `mongo-app-credentials` to use the new username and password.
3. Trigger a rolling restart of the backend microservices.
4. Verify application health (`/health` and `/ready`).
5. Revoke and delete the old database user inside MongoDB.

## 5. Compromise Response (Emergency Rotation)
If a secret is confirmed compromised, the Zero-Downtime principle is **abandoned**.
1. Immediately delete the compromised key from Vault.
2. Purge the old database user.
3. Deploy new secrets and forcibly restart all pods.
4. Notify users that they must re-authenticate.
