import {
    Compass, HeartPulse, Stethoscope, FileText, Scan, Command, MonitorPlay,
    type LucideIcon,
} from 'lucide-react';

export interface TourStep {
    /** Route the step lives on; the engine navigates there automatically. */
    route: string;
    /** CSS selector to spotlight; omitted → page-level step (centered card). */
    selector?: string;
    title: string;
    body: string;
}

export interface Tour {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    /** Persona the tour runs as; the engine switches automatically. */
    role: 'PATIENT' | 'PHYSICIAN' | 'RADIOLOGIST' | 'SUPER_ADMIN';
    steps: TourStep[];
}

export const TOURS: Tour[] = [
    {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'The shell every app shares — navigation, search, quick actions, theming.',
        icon: Compass,
        role: 'SUPER_ADMIN',
        steps: [
            { route: '/admin', selector: 'aside', title: 'Role-based sidebar', body: 'Navigation adapts to who you are. Groups collapse, pages can be pinned, and recents surface automatically. Hover any item to pin it.' },
            { route: '/admin', selector: 'aside button[aria-label="Switch workspace"]', title: 'Workspace switcher', body: 'CareConnect is four apps in one — Patient Portal, Clinical, Radiology, and Admin. Switch here; every role gets its own home, navigation, and guarded routes.' },
            { route: '/admin', selector: 'button[aria-label="Open global search"]', title: 'Global search — Ctrl/⌘ K', body: 'Search every page and action from anywhere. Arrow keys to navigate, Enter to jump. Try theme switching from here too.' },
            { route: '/admin', selector: 'button[aria-label="Quick add"]', title: 'Quick actions', body: 'One-tap entry points for the most common flows: book an appointment, register a walk-in, start a teleconsult, order labs.' },
            { route: '/admin', selector: 'button[aria-label*="dark mode"], button[aria-label*="light mode"]', title: 'Light, dark & high contrast', body: 'The whole design system is tokenized — light, dark, and a WCAG high-contrast mode, all persisted per user.' },
        ],
    },
    {
        id: 'patient-portal',
        name: 'Patient Portal',
        description: 'What patients see — health wallet, appointments, records, AI assistant.',
        icon: HeartPulse,
        role: 'PATIENT',
        steps: [
            { route: '/', title: 'Patient home', body: 'A personal health overview: upcoming appointments, medications due, new lab reports, and a live health score. Every card navigates to its module.' },
            { route: '/appointments', title: 'Appointments', body: 'Book, reschedule, join video visits, and get directions. The booking flow is a real multi-step wizard hitting the appointments API.' },
            { route: '/health-records', title: 'Health records', body: 'The longitudinal record: encounters, conditions, medications — with one-click FHIR export of the on-page data.' },
            { route: '/patient/wallet', title: 'Health wallet', body: 'Tokens, invoices, and telemedicine sessions in one wallet-style view, mirroring what the kiosk and reception issue.' },
            { route: '/billing', title: 'Billing', body: 'Invoices with real downloads, payment history, and pay-flows routed into the wallet.' },
            { route: '/ai-assistant', title: 'AI health assistant', body: 'A conversational assistant with suggestion chips. Currently on-device drafting; the UI is ready for the AI service.' },
        ],
    },
    {
        id: 'doctor-workspace',
        name: 'Doctor Workspace',
        description: 'The clinical day: dashboard, queue, patients, and the live ED board.',
        icon: Stethoscope,
        role: 'PHYSICIAN',
        steps: [
            { route: '/dashboard', title: 'Clinical dashboard', body: 'KPIs, the waiting queue, urgent tasks, and critical alerts. Queue rows open the live queue; task and alert rows deep-link to their modules.' },
            { route: '/doctor/queue', title: 'Live queue', body: 'Socket-driven token queue with real claim/transfer mutations. This is the doctor\'s heartbeat during OPD hours.' },
            { route: '/patients', title: 'Patient directory', body: 'Search, filter, and open any chart. Row actions lead into the EMR.' },
            { route: '/emergency', title: 'Emergency department', body: 'ESI-triaged tracking board with code pathways — stroke, STEMI, sepsis tabs — and one-tap protocol activation.' },
            { route: '/bed-management', title: 'Beds & wards', body: 'Occupancy heatmaps, the bed explorer, and pending ADT requests routed to the transfer flow.' },
        ],
    },
    {
        id: 'emr',
        name: 'EMR / Patient 360',
        description: 'The clinical record: Patient 360, encounters, notes, safe prescribing.',
        icon: FileText,
        role: 'PHYSICIAN',
        steps: [
            { route: '/emr/patients/demo', title: 'Patient 360', body: 'One screen for the whole patient: identity header with allergies and alerts, KPI cards, active medications, and the full longitudinal timeline — powered by the /api/emr aggregation.' },
            { route: '/emr/patients/demo', selector: 'main h1', title: 'Quick actions', body: '“Start Consultation” creates a real encounter via POST /api/emr/encounters and opens the encounter workspace. Rx, lab, and radiology deep-link into the same encounter.' },
            { route: '/emr', title: 'Legacy EMR module', body: 'The original EMR page remains fully functional — orders, prescriptions, documents — now restyled and wired into billing, telemedicine, and teleradiology.' },
            { route: '/emr/patients/demo', title: 'Clinical safety, by design', body: 'In the encounter workspace: notes autosave as drafts, signing makes them immutable (SHA-256 sealed, amendments version instead of overwrite), and medication orders run interaction/allergy screening — critical flags demand explicit clinician override with a reason. AI drafts never enter the note without a click.' },
        ],
    },
    {
        id: 'teleradiology',
        name: 'Teleradiology',
        description: 'From order to signed report: worklist, reading room, command center.',
        icon: Scan,
        role: 'RADIOLOGIST',
        steps: [
            { route: '/teleradiology/worklist', title: 'Radiologist worklist', body: 'STAT-first ordering, AI-triage flags, live SLA countdowns, and one-click claim. An EMR radiology order lands here automatically via the event bus.' },
            { route: '/teleradiology/worklist', selector: 'main table', title: 'Acuity at a glance', body: 'Priority badges pulse for STAT/emergency, study age turns amber then red as SLA erodes, and breaches float to the top. Filters are server-side query params.' },
            { route: '/teleradiology/command-center', title: 'Command center', body: 'Network TAT percentiles (p50–p99), SLA breaches, pipeline by status, and critical findings with acknowledgement tracking — the executive view of the radiology network.' },
            { route: '/teleradiology/worklist', title: 'The reading room', body: 'Open any study: three panes (worklist rail, viewer stage, structured reporting), j/k study navigation, autosaving report sections, Ctrl+Enter to sign. Signed reports are immutable — addenda only — and signing completes the EMR order and notifies doctor + patient automatically.' },
        ],
    },
    {
        id: 'admin-ops',
        name: 'Admin & Operations',
        description: 'Command center, observability, builders, and platform consoles.',
        icon: Command,
        role: 'SUPER_ADMIN',
        steps: [
            { route: '/admin', title: 'Admin home', body: 'The module launcher: every operational console one click away, with live system health in the rail.' },
            { route: '/admin/command-center/live', title: 'Live operations wall', body: 'Real-time department heatmaps and the raw event stream — five socket subscriptions rendering the hospital\'s pulse.' },
            { route: '/admin/observability', title: 'Observability', body: 'SLOs with error budgets, distributed traces (exportable as JSON or Mermaid), and alert history.' },
            { route: '/admin/system/dashboard', title: 'System health', body: 'Hardware telemetry polled every 5 seconds from /api/system/performance — CPU, memory, sockets — plus honest service health (the API now probes MongoDB for real).' },
            { route: '/admin/workflow-builder', title: 'Low-code builders', body: 'Workflow and consent-form builders: drag-in fields, rules, template cloning into the designer, validation and simulation.' },
        ],
    },
    {
        id: 'frontdesk',
        name: 'Reception & Kiosk',
        description: 'Front-desk command center, check-in, walk-in, and self-service.',
        icon: MonitorPlay,
        role: 'SUPER_ADMIN',
        steps: [
            { route: '/reception/dashboard', title: 'Reception dashboard', body: 'The front-desk command center: check-in, walk-in registration, queue display, and kiosk — all one tap away.' },
            { route: '/reception/checkin', title: 'Check-in', body: 'Find the appointment, collect payment, issue a queue token — mutations against the reception API.' },
            { route: '/reception/walkin', title: 'Walk-in registration', body: 'A full registration form that creates the patient and routes them into the queue.' },
            { route: '/reception/dashboard', title: 'Kiosk & TV display', body: 'The self-service kiosk (/kiosk) and the queue display board (/display) run chrome-free and full-screen — the display board is public by design so waiting-room TVs need no login, and token calls are announced with speech synthesis.' },
        ],
    },
];

export function tourById(id: string): Tour | undefined {
    return TOURS.find((t) => t.id === id);
}
