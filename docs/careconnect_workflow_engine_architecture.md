# CareConnect End-to-End Healthcare Workflow Engine & Journey Blueprint

## 1. System & Architecture Overview

CareConnect is designed as a multi-tenant, event-driven Enterprise Hospital Information System (HIS), Electronic Medical Record (EMR), Practice Management System (PMS), and Operations Platform.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CA RECON NECT   EN T E R P R I S E                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
       │                                   │                                    │
       ▼                                   ▼                                    ▼
┌───────────────┐                  ┌───────────────┐                  ┌───────────────────┐
│ Web Portal    │                  │ Patient Portal│                  │ Mobile Apps       │
│ (React/Next)  │                  │ (PWA/Next)    │                  │ (React Native)    │
└───────┬───────┘                  └───────┬───────┘                  └─────────┬─────────┘
        │                                  │                                    │
        └──────────────────────────────────┼────────────────────────────────────┘
                                           │
                                           ▼
                       ┌───────────────────────────────────────┐
                       │ REST / GraphQL / WebSocket API Gateway│
                       └───────────────────┬───────────────────┘
                                           │
                                           ▼
                       ┌───────────────────────────────────────┐
                       │   CareConnect Workflow Engine & Bus   │
                       │   (State Machine + SLA + Audit)       │
                       └───────────────────┬───────────────────┘
                                           │
       ┌───────────────────────────────────┼───────────────────────────────────┐
       ▼                                   ▼                                   ▼
┌───────────────┐                  ┌───────────────┐                   ┌───────────────┐
│ Clinical Engine│                 │ Ops & Ancillary│                   │ AI & Messaging│
│ (EMR, Order   │                  │ (LIS, RIS, PIS│                   │ Copilot, Scribe│
│  Entry, SOAP) │                  │  Billing, ADT)│                   │ WhatsApp, SMS │
└───────────────┘                  └───────────────┘                   └───────────────┘
```

---

## 2. Universal Workflow Engine Design

Every action across CareConnect passes through the **Universal Workflow State Engine**.

### Workflow Core Schema
* **`Status`**: `INITIATED` | `QUEUED` | `IN_PROGRESS` | `PENDING_APPROVAL` | `COMPLETED` | `ESCALATED` | `CANCELLED`
* **`Owner / Assigned Role`**: Doctor, Nurse, Lab Tech, Radiologist, Pharmacist, Billing Exec, Administrator
* **`SLA Target`**: Max allowed minutes per state (e.g., Triage to Doctor: 15 mins; STAT Lab Result: 30 mins)
* **`Escalation Action`**: Automatic notification to Department Head / Charge Nurse if SLA threshold exceeded
* **`Event Publishing`**: Emits typed event (e.g., `ORDER_CREATED`, `SAMPLE_COLLECTED`, `RESULT_VERIFIED`)
* **`Audit Trail`**: Immutable log containing User ID, Role, Timestamp, Old State, New State, Client IP, & Digital Signature

---

## 3. End-to-End Patient Healthcare Journey

```text
1. PATIENT DISCOVERY & BOOKING
   Website / Mobile App / ABHA Login / Self-Check-in Kiosk / Reception Walk-in
   └─► Token Generated ──► Patient Queue Engine

2. FRONT OFFICE & RECEPTION TRIAGE
   Token Called ──► Insurance Verification (ABDM / TPA) ──► Check-in ──► Vitals Logged by Nurse

3. CLINICAL ENCOUNTER (EMR & AI COPILOT)
   Doctor Consultation ──► AI Scribe SOAP Note ──► Specialty EMR Widgets ──► E-Prescription & Orders
   ├─► Lab Orders ───────► LIS Sample Collection ──► Analyzer ──► Result Verification
   ├─► Radiology Orders ──► RIS Imaging Queue ──────► PACS ──────► AI Scanning ──► Radiologist Report
   └─► Medication Orders ─► Pharmacy Inventory Check ──► Drug Interaction Alert ──► Dispense

4. BILLING & INSURANCE SETTLEMENT
   Pending Charges Aggregated ──► TPA Claim Auto-generation ──► Co-pay / Self-Pay Collection ──► Receipt

5. INPATIENT / ADMISSION / ICU / OT (If Required)
   Admission Request ──► Bed Management (Ward/ICU) ──► Nurse Care Plan ──► WHO Surgical Checklist ──► OT
   └─► Recovery / PACU ──► Discharge Summary Generation ──► Medico-Legal Signoff

6. LIFELONG PATIENT PORTAL & TELEMEDICINE
   Digital Rx Download (Multi-Language) ──► Medicine Reminders ──► Follow-up Teleconsultation
```

---

## 4. Role-Based Dashboards & Specialized Workflows

CareConnect implements tailored interfaces for 11 distinct operational roles:

| Role Dashboard | Primary Focus & KPIs | Core Tools & Widgets |
| :--- | :--- | :--- |
| **Super & Hospital Admin** | Revenue, Occupancy, SLA Breaches, Compliance, Audit Logs | Multi-branch Selector, Department Management, RBAC Config |
| **Front Office & Reception** | Token Queue, Check-in Volume, Wait Times, Cash Collections | Patient Search, Appointment Desk, Walk-in Kiosk, ABHA Linker |
| **Physician & Specialist** | Schedule, Active Consultations, Pending Labs, AI Clinical Alerts | Smart Specialty EMR (27 Templates), SOAP Scribe, Order Entry |
| **Ward & ICU Nurse** | Patient Acuity, Vitals Logs, Medication Administration Record (MAR) | Bed Grid, Shift Handover, MAR Checklist, Fluid Balance |
| **Laboratory Technician** | Sample Collection Queue, Pending Analyzers, Result Verification | Barcode Scanner, Instrument Bridge, LIS Verification, AI Flag |
| **Radiologist** | Unread Imaging Queue, Emergency STAT Scans, Reporting | PACS DICOM Viewer, AI Lesion Detection, Voice Dictation |
| **Pharmacist** | Pending E-Prescriptions, Out-of-Stock Alerts, Dispense Queue | Drug Interaction Checker, Label Printer, Inventory Deductor |
| **Billing Executive** | Unbilled Charges, Insurance Claims, Co-pay Balances | TPA Claim Generator, Invoice Creator, Payment Gateway Sync |
| **Emergency Physician** | ESI Triage Levels 1-5, Door-to-Needle Timers, Resuscitation | Sepsis 1-Hour Bundle Timer, Code Red Alert, Bed Allocator |
| **ICU Care Specialist** | SOFA/APACHE Scores, Ventilator Settings, ABG Logs | PRVC Parameter Board, Continuous Telemetry, Infusion Log |
| **Patient / Family Portal** | Health Score, Appointments, Digital Rx, Lab Test Results | Multi-Language Prescriptions, Teleconsult Call, Health Vault |

---

## 5. Event-Driven Architecture & Multi-Channel Notifications

Every state transition triggers automated multi-channel dispatches:

```
[ Encounter / Order Event Triggered ]
               │
               ├─► WebSocket Push ────► Real-Time Role Dashboard Update
               ├─► WhatsApp API ──────► PDF Prescription / Appointment Pass to Patient
               ├─► SMS Gateway ────────► Queue Token Status & OTP Notifications
               ├─► Email Service ──────► Itemized Invoice & Lab Report Attachment
               └─► Mobile Push ────────► Nurse Station Alert & Doctor STAT Orders
```

---

## 6. Execution Roadmap & Next Steps

1. **Phase 1: Workflow Engine Core Integration** – Connect the state engine (`WorkflowService`) to all dashboard routes.
2. **Phase 2: Enhanced Role Workflows** – Polish role-specific quick actions and SLAs across LIS, RIS, PIS, and ADT.
3. **Phase 3: Automated Event Bus Testing** – Verify real-time notification dispatches via WebSockets and mock SMS/WhatsApp services.
