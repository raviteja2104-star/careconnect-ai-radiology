# Synthetic Clinical Workload (PR-1)

During Phase 3 of the Production Rehearsal, the Quality Assurance team and designated Clinical Champions must manually execute the following synthetic workflows to validate end-to-end business correctness.

## 1. OPD Workflow
- [ ] Register new patient "John Doe (Test)".
- [ ] Book Cardiology Walk-In Appointment.
- [ ] Generate Queue Token.
- [ ] Doctor accepts token -> Consultation Begins.
- [ ] Doctor adds E-Prescription for "Amoxicillin 500mg".
- [ ] Consultation Ends.
- [ ] Invoice Generated ($50.00).
- [ ] Synthetic Payment Webhook fired -> Invoice Paid.

## 2. Telemedicine Workflow
- [ ] Patient books Telemedicine slot.
- [ ] Patient pays upfront via Razorpay mock.
- [ ] Doctor and Patient join Video Room.
- [ ] Peer-to-Peer WebRTC connection verified.
- [ ] Call ended -> Status updated to `COMPLETED`.

## 3. ABDM Interoperability
- [ ] Generate Consent Request for "Care Management".
- [ ] Approve Consent using NHA Sandbox App.
- [ ] Export FHIR Bundle.
- [ ] Verify payload passes standard validation.
