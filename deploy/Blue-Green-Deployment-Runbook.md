# CareConnect Blue/Green Deployment Runbook

## 1. Goal
Ensure zero-downtime releases for production clinical APIs by deploying a new replica set (Green) alongside the existing one (Blue), validating it, and instantly shifting traffic.

## 2. Infrastructure Setup
- The Kubernetes `Service` (e.g. `backend-service`) controls routing via label selectors (e.g. `version: v1.0.0` vs `version: v1.1.0`).

## 3. Deployment Phases

### Phase 1: Deploy Green
Deploy the new version of the application. It will spin up pods, but receive **zero** live user traffic.
```bash
helm upgrade --install careconnect ./helm-chart \
  --set backend.image.tag=v1.1.0 \
  --set backend.deployment.color=green \
  --set activeTraffic=blue
```

### Phase 2: Smoke Testing
Execute internal synthetic queries directly against the Green pods.
`npm run test:release:smoke -- --target=http://green-backend.internal`

### Phase 3: Traffic Switch
Once Smoke tests pass, immediately shift 100% of the live ingress routing to the Green deployment.
```bash
helm upgrade careconnect ./helm-chart \
  --reuse-values \
  --set activeTraffic=green
```

### Phase 4: Monitor & Retire
Monitor SLOs for 30 minutes. If no SEV-1/SEV-2 alerts fire, scale the old Blue deployment to 0.
```bash
kubectl scale deployment backend-blue --replicas=0
```
