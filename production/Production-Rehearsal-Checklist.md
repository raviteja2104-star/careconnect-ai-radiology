# Production Rehearsal (PR-1) Observation Checklist

During the PR-1 exercise, the engineering and operations teams must verify the following:

## 1. Release Automation
- [ ] CI/CD pipeline triggered without manual ssh/kubectl access.
- [ ] Green deployment spun up cleanly.
- [ ] Smoke tests blocked traffic cutover until passing.
- [ ] Blue/Green routing switch occurred with 0 dropped HTTP requests.

## 2. Telemetry & Monitoring
- [ ] `Synthetic-Clinical-Workload` traces successfully appeared in the Observability Trace Viewer.
- [ ] SLO Dashboards correctly reflected live latency and error rates.

## 3. Incident Response Drill
- [ ] Artificial fault injected successfully.
- [ ] PagerDuty triggered within 2 minutes of SLO breach.
- [ ] SRE acknowledged the page within 5 minutes.
- [ ] Incident Commander formally established control in the Slack bridge.
- [ ] Automated Rollback triggered correctly, restoring SLOs.

## 4. Operational Readiness
- [ ] Clinical users found the UI performant and usable.
- [ ] Post-Incident Review (PIR) draft was generated after the rollback drill.
