# Build "CareConnect Patient" — a premium healthcare patient app

You are a world-class healthcare product designer and frontend engineer. Build a
complete, production-quality PATIENT mobile-first web app called **CareConnect
Patient**. It is the patient-facing companion of a hospital operating system.
Use React + Tailwind CSS. Mobile-first (390px), scaling gracefully to tablet
and desktop. Use Lucide icons only.

====================================================
PRODUCT SCOPE — PATIENT APP ONLY
====================================================
Screens (each a real, navigable route):
1. **Login / Register** — email+password sign-in, patient self-registration,
   "Continue in demo mode" button. Errors shown inline per field.
2. **Home dashboard** — greeting, next appointment card, medications due today,
   new lab reports, health score ring, quick actions row.
3. **Appointments** — upcoming/past/cancelled tabs, appointment cards
   (doctor, specialty, time, mode), Join Video Call, Reschedule, Directions.
4. **Book appointment** — multi-step wizard: specialty → doctor → date/time
   slots → visit type (in-person / video) → confirm. Progress indicator.
5. **Health records** — longitudinal timeline (encounters, conditions,
   medications, documents), filter chips, FHIR JSON export of on-screen data.
6. **Prescriptions** — active/past, drug rows (name, dose, frequency,
   duration, before/after food), refill request button.
7. **Lab reports** — list with status badges (processing/ready/flagged),
   abnormal-value highlighting, reference ranges, JSON download.
8. **Medications** — today's schedule with "Mark taken", adherence streak.
9. **Billing** — invoices (paid/partial/unpaid badges), amounts in ₹ (INR),
   invoice JSON download, pay flow routed to the wallet screen.
10. **Health wallet** — queue tokens, invoices, telemedicine session passes,
    wallet-card visual treatment.
11. **Insurance** — policy card (gradient card design), claims list,
    contact-insurer action.
12. **Telemedicine** — session list; waiting room with camera preview and
    honest camera-permission-denied state; in-call layout (remote video main
    stage, local picture-in-picture, mute/camera/end controls).
13. **AI health assistant** — chat UI with suggestion chips ("Check my
    symptoms", "Explain my lab report", "Suggest healthy habits"), typing
    indicator, and a visible disclaimer: "Not medical advice — consult your
    doctor."
14. **Family members** — avatar-led member cards (relation, age, blood group),
    per-member links into records/appointments.
15. **Notifications** — grouped Today/Yesterday/Earlier, unread dots,
    mark-read and mark-all-read.
16. **Profile & settings** — personal details, allergies list, language
    (English/Hindi UI toggle), theme (light/dark/high-contrast), logout.

Navigation: bottom tab bar on mobile (Home, Appointments, Records, Wallet,
More), collapsible sidebar on desktop. Global search opens a command palette.

====================================================
DESIGN LANGUAGE (must match exactly)
====================================================
- Font: Inter. Rounded corners 16–24px. Soft glassmorphism cards
  (translucent white/dark + backdrop blur), layered surfaces, generous
  spacing, subtle shadows. Minimal visual noise. No dense hospital-software
  look, no sharp edges, no heavy borders.
- Color tokens (light): background #F6F8FB, card #FFFFFF, text #0F172A,
  muted text #64748B, border #E2E8F0, primary #2563EB, secondary #14B8A6,
  accent emerald #10B981, success #16A34A, warning #D97706, danger #DC2626.
  Brand gradient: linear 135° from #2563EB via #3B82F6 to #14B8A6.
- Dark mode (class-based): background #090E1A, card #0F1629, text #E2E8F0,
  muted #94A3B8, border #1E293B, primary #3B82F6. Persist theme choice.
  Also support a high-contrast toggle (stronger borders, thicker focus rings).
- Motion: entrance fades ≤0.4s with slight upward translate, staggered lists,
  respectful of prefers-reduced-motion. Skeleton shimmer loaders — never
  spinners. Empty states with icon + message + primary CTA. Error states with
  a Retry button.
- Accessibility: WCAG 2.2 AA, semantic headings, labeled inputs, aria on
  icon-only buttons, visible focus rings, ≥44px touch targets.
- Indian healthcare context: currency ₹, Indian names in sample data,
  ABHA ID field on the profile (display-only), +91 phone formats.

====================================================
DATA & BACKEND CONTRACT
====================================================
Build a single API layer module. Every call:
- Base URL from env/config, default `http://localhost:5000`.
- Attach `Authorization: Bearer <token>` from localStorage key `token`.
- 5s timeout. ON ANY FAILURE (network/401/500): fall back to realistic
  built-in demo data and show a small amber "Demo data — backend offline"
  badge on that screen. The app must NEVER crash or show a blank screen
  because the backend is down.

Real endpoints to integrate (response envelope `{ success, data }` for auth;
plain JSON for the rest):
- `POST /api/auth/login` {email, password} → { success, data: { user, token } }
- `POST /api/auth/register` {firstName, lastName, email, phone, password,
  role: "patient"} → same shape
- `GET  /api/emr/patients/:patientId/summary` → { patient, summary,
  activeMedications[], diagnoses[], timeline[{kind, at, title, status}] }
- `GET  /api/emr/orders?patientId=…&category=medication` → orders[]
- `GET  /api/appointments` / `POST /api/appointments` (booking)
- `GET  /api/notifications` (list), mark-read via PATCH if available
- `GET  /api/queue/:department` → live queue tokens (public)
On login success: store `token` and the user JSON under `cc-user`, route to
Home. Logout clears both and returns to Login.

====================================================
HARD RULES
====================================================
1. NO fake buttons — every control either performs its real action, navigates
   somewhere real, or is visibly disabled with "Coming soon". Never fake a
   success (no pretend payments, no pretend uploads).
2. AI assistant answers are clearly labeled as informational; it must refuse
   to diagnose and always suggest consulting a clinician for medical concerns.
3. Health data shown is the signed-in patient's only. No cross-patient access.
4. All lists must handle loading (skeleton), empty (empty state), and error
   (retry) — three distinct states.
5. Keep components reusable: Button, Card, Badge, Input, Avatar, Skeleton,
   StatCard, Timeline, Dialog, Toast, Tabs, Progress — one design system,
   consistently applied on every screen.
6. Ship with rich, realistic demo data for every screen so the app is fully
   explorable with no backend: 1 patient (Rohit Sharma, 32, O+, allergy:
   Penicillin, ABHA 12-3456-7890-1234), 4 appointments across states,
   6 timeline events, 3 prescriptions, 4 lab reports (one flagged), 3
   invoices, 2 family members, 8 notifications.

====================================================
BUILD ORDER
====================================================
1) Design tokens + core components  2) App shell + navigation + theming
3) Login + session  4) Home  5) Appointments + booking wizard
6) Records/Prescriptions/Labs/Medications  7) Billing + Wallet + Insurance
8) Telemedicine UI  9) AI assistant  10) Family/Notifications/Settings
Polish pass: motion, dark mode audit, accessibility audit.

The result should feel like a premium consumer health app (Apple Health /
Eka Care caliber) that a patient trusts instantly — calm, fast, honest.
