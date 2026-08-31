# CareConnect Certificate (TLS) Rotation Runbook

## 1. Scope
This runbook dictates the lifecycle and rotation of:
- Public-facing TLS certificates (ingress)
- Internal mTLS certificates (service-to-service)

## 2. Automated Renewal (Let's Encrypt / ACME)
**Frequency:** 60 days (30 days prior to expiration).

CareConnect utilizes `cert-manager` within the Kubernetes cluster. 
1. Certificates are automatically requested via the ACME DNS-01 or HTTP-01 challenge.
2. `cert-manager` silently updates the Kubernetes `Secret` bound to the Envoy Ingress.
3. Envoy dynamically reloads the TLS context without dropping active TCP connections.
*No manual intervention is required for public ingress rotation.*

## 3. Manual Certificate Override
If `cert-manager` fails or the CA is compromised, manual intervention is required.

1. Obtain a new `.pem` and `.key` from the internal PKI or alternative CA.
2. Replace the Kubernetes secret:
   ```bash
   kubectl create secret tls careconnect-tls --cert=public.crt --key=private.key --dry-run=client -o yaml | kubectl apply -f -
   ```
3. Envoy will detect the secret mutation and hot-reload.

## 4. Internal mTLS Rotation
Service Mesh (e.g. Istio or Linkerd) manages internal pod-to-pod encryption. 
The mesh control plane rotates ephemeral mTLS certificates every 24 hours.

**Validation Command:**
```bash
# Verify internal mTLS validity (assuming istioctl)
istioctl proxy-status
```

## 5. Expiration Monitoring
Prometheus is configured to monitor the `cert_manager_certificate_expiration_timestamp_seconds` metric.
- **Warning Alert:** 14 days until expiration.
- **Critical Alert:** 3 days until expiration.
