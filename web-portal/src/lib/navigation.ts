import {
    LayoutDashboard, Calendar, FileText, ClipboardList, FilePlus, Activity, Pill, CreditCard,
    ShieldCheck, Video, Bot, Users, MessageSquare, Bell, Wallet, BarChart3, Stethoscope,
    ListOrdered, FolderHeart, FlaskConical, Scan, HeartPulse, BedDouble, Ambulance, Siren,
    DoorOpen, Building2, MonitorPlay, UserCheck, UserPlus, Tv, Command, Radar, Gauge,
    ServerCog, BrainCircuit, Receipt, Send, CalendarRange, FormInput, Workflow, Database,
    Sparkles, Boxes, Code2, Briefcase, Store, Factory, Target, Settings, HelpCircle,
    type LucideIcon,
} from 'lucide-react';
import type { AuthUserSession } from '@/services/authService';

export interface NavItem {
    name: string;
    path: string;
    icon: LucideIcon;
    badgeKey?: 'messages' | 'notifications' | 'alerts';
    keywords?: string;
}

export interface NavGroup {
    id: string;
    label: string;
    items: NavItem[];
    /** Roles that see this group. Empty = everyone. */
    roles?: AuthUserSession['role'][];
}

export const NAV_GROUPS: NavGroup[] = [
    {
        id: 'patient',
        label: 'My Health',
        roles: ['PATIENT', 'SUPER_ADMIN'],
        items: [
            { name: 'Dashboard', path: '/', icon: LayoutDashboard, keywords: 'home overview' },
            { name: 'Appointments', path: '/appointments', icon: Calendar, keywords: 'book visit schedule' },
            { name: 'Health Records', path: '/health-records', icon: FileText, keywords: 'emr documents' },
            { name: 'Prescriptions', path: '/prescriptions', icon: ClipboardList, keywords: 'rx' },
            { name: 'Lab Reports', path: '/lab-reports', icon: FilePlus, keywords: 'results tests' },
            { name: 'Radiology', path: '/radiology', icon: Scan, keywords: 'imaging xray mri' },
            { name: 'Medications', path: '/medications', icon: Pill, keywords: 'drugs refill' },
            { name: 'Billing', path: '/billing', icon: CreditCard, keywords: 'invoice payments' },
            { name: 'Insurance', path: '/insurance', icon: ShieldCheck, keywords: 'claims policy' },
            { name: 'Health Wallet', path: '/patient/wallet', icon: Wallet, keywords: 'tokens cards' },
            { name: 'Telemedicine', path: '/telemedicine', icon: Video, keywords: 'video consult virtual' },
            { name: 'AI Health Assistant', path: '/ai-assistant', icon: Bot, keywords: 'chat help' },
            { name: 'Family Members', path: '/family', icon: Users, keywords: 'profiles dependents' },
            { name: 'Reports', path: '/reports', icon: BarChart3, keywords: 'analytics summary' },
        ],
    },
    {
        id: 'clinical',
        label: 'Clinical Workspace',
        roles: ['PHYSICIAN', 'NURSE', 'RADIOLOGIST', 'LAB_TECH', 'PHARMACIST', 'SUPER_ADMIN'],
        items: [
            { name: 'Doctor Dashboard', path: '/dashboard', icon: Stethoscope, keywords: 'physician overview' },
            { name: 'My Queue', path: '/doctor/queue', icon: ListOrdered, keywords: 'patients waiting tokens' },
            { name: 'Consultations', path: '/consultations', icon: FolderHeart, keywords: 'soap notes visits' },
            { name: 'EMR', path: '/emr', icon: FileText, keywords: 'records charting' },
            { name: 'Patients', path: '/patients', icon: Users, keywords: 'directory list' },
            { name: 'Lab Orders', path: '/lab-orders', icon: FlaskConical, keywords: 'tests requisition' },
            { name: 'Pharmacy', path: '/pharmacy', icon: Pill, keywords: 'dispensing orders' },
            { name: 'Nurse Station', path: '/nurse-station', icon: HeartPulse, keywords: 'vitals ward' },
            { name: 'ICU', path: '/icu', icon: Activity, keywords: 'critical care monitors' },
            { name: 'Operation Theatre', path: '/ot', icon: DoorOpen, keywords: 'surgery schedule' },
            { name: 'ADT', path: '/adt', icon: Building2, keywords: 'admission discharge transfer' },
            { name: 'Bed Management', path: '/bed-management', icon: BedDouble, keywords: 'occupancy wards' },
            { name: 'Emergency', path: '/emergency', icon: Siren, keywords: 'sos triage', badgeKey: 'alerts' },
            { name: 'EMS Dispatch', path: '/ems', icon: Ambulance, keywords: 'ambulance tracking' },
            { name: 'Teleradiology Worklist', path: '/teleradiology/worklist', icon: Scan, keywords: 'radiologist studies reading stat sla' },
        ],
    },
    {
        id: 'frontdesk',
        label: 'Front Desk',
        roles: ['SUPER_ADMIN'],
        items: [
            { name: 'Reception', path: '/reception/dashboard', icon: MonitorPlay, keywords: 'front office' },
            { name: 'Check-in', path: '/reception/checkin', icon: UserCheck, keywords: 'arrival' },
            { name: 'Walk-in', path: '/reception/walkin', icon: UserPlus, keywords: 'register new' },
            { name: 'Kiosk', path: '/kiosk', icon: Tv, keywords: 'self service' },
            { name: 'Queue Display', path: '/display', icon: MonitorPlay, keywords: 'tv board tokens' },
        ],
    },
    {
        id: 'admin',
        label: 'Administration',
        roles: ['SUPER_ADMIN'],
        items: [
            { name: 'Admin Home', path: '/admin', icon: Command, keywords: 'administration' },
            { name: 'Command Center', path: '/admin/command-center', icon: Radar, keywords: 'heatmap live operations' },
            { name: 'Live Wall', path: '/admin/command-center/live', icon: Tv, keywords: 'operations wall realtime' },
            { name: 'Telerad Command Center', path: '/teleradiology/command-center', icon: Radar, keywords: 'radiology tat sla network' },
            { name: 'Observability', path: '/admin/observability', icon: Gauge, keywords: 'slo traces metrics' },
            { name: 'Audit Log', path: '/admin/audit', icon: ShieldCheck, keywords: 'security hash chain compliance phi access' },
            { name: 'System Health', path: '/admin/system/dashboard', icon: ServerCog, keywords: 'sysops cpu memory' },
            { name: 'Operations', path: '/admin/operations', icon: Factory, keywords: 'capacity' },
            { name: 'AI Operations', path: '/admin/operations/ai', icon: BrainCircuit, keywords: 'predictions queue ai' },
            { name: 'Billing Console', path: '/admin/billing/dashboard', icon: Receipt, keywords: 'revenue rcm' },
            { name: 'Communications', path: '/admin/communication/dashboard', icon: Send, keywords: 'sms whatsapp' },
            { name: 'Scheduling', path: '/admin/scheduling/calendar', icon: CalendarRange, keywords: 'calendar rosters' },
            { name: 'Form Builder', path: '/admin/forms/builder', icon: FormInput, keywords: 'consent eforms' },
            { name: 'Workflow Builder', path: '/admin/workflow-builder', icon: Workflow, keywords: 'bpm low-code' },
            { name: 'Master Data', path: '/admin/master-data', icon: Database, keywords: 'mdm catalog' },
            { name: 'AI Platform', path: '/admin/ai-platform', icon: Sparkles, keywords: 'models ml' },
            { name: 'Data Platform', path: '/admin/data-platform', icon: Boxes, keywords: 'warehouse pipelines' },
            { name: 'Developer', path: '/admin/developer', icon: Code2, keywords: 'api keys webhooks' },
            { name: 'Enterprise', path: '/admin/enterprise', icon: Briefcase, keywords: 'tenants' },
            { name: 'Commercial', path: '/admin/commercial', icon: Store, keywords: 'saas plans' },
            { name: 'Production', path: '/admin/production', icon: Target, keywords: 'hardening readiness' },
            { name: 'Programs', path: '/admin/program', icon: Briefcase, keywords: 'initiatives' },
        ],
    },
    {
        id: 'general',
        label: 'General',
        items: [
            { name: 'Messages', path: '/messages', icon: MessageSquare, badgeKey: 'messages', keywords: 'chat inbox' },
            { name: 'Notifications', path: '/notifications', icon: Bell, badgeKey: 'notifications', keywords: 'alerts' },
            { name: 'Settings', path: '/settings', icon: Settings, keywords: 'preferences profile theme' },
            { name: 'Support', path: '/support', icon: HelpCircle, keywords: 'help tickets' },
        ],
    },
];

export function navGroupsForRole(role: AuthUserSession['role']): NavGroup[] {
    return NAV_GROUPS.filter((g) => !g.roles || g.roles.includes(role));
}

export function allNavItems(role: AuthUserSession['role']): NavItem[] {
    return navGroupsForRole(role).flatMap((g) => g.items);
}

/** Routes that render full-bleed without the sidebar/header chrome. */
export const CHROMELESS_ROUTES = ['/display', '/kiosk', '/login'];

export function isChromeless(pathname: string): boolean {
    return CHROMELESS_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
}

/* ─────────── App separation: per-role homes and route guards ─────────── */

type Role = AuthUserSession['role'];

const CLINICAL_ROLES: Role[] = ['PHYSICIAN', 'NURSE', 'RADIOLOGIST', 'LAB_TECH', 'PHARMACIST', 'SUPER_ADMIN'];

/** Route-prefix access rules, checked longest-prefix-first. Unlisted routes are open to all roles. */
const ROUTE_ACCESS: Array<{ prefix: string; roles: Role[] }> = [
    { prefix: '/admin', roles: ['SUPER_ADMIN'] },
    { prefix: '/teleradiology', roles: ['RADIOLOGIST', 'PHYSICIAN', 'SUPER_ADMIN'] },
    { prefix: '/reception', roles: ['SUPER_ADMIN'] },
    { prefix: '/emr', roles: CLINICAL_ROLES },
    { prefix: '/dashboard', roles: CLINICAL_ROLES },
    { prefix: '/doctor', roles: CLINICAL_ROLES },
    { prefix: '/consultations', roles: CLINICAL_ROLES },
    { prefix: '/patients', roles: CLINICAL_ROLES },
    { prefix: '/lab-orders', roles: CLINICAL_ROLES },
    { prefix: '/pharmacy', roles: CLINICAL_ROLES },
    { prefix: '/nurse-station', roles: CLINICAL_ROLES },
    { prefix: '/icu', roles: CLINICAL_ROLES },
    { prefix: '/ot', roles: CLINICAL_ROLES },
    { prefix: '/adt', roles: CLINICAL_ROLES },
    { prefix: '/bed-management', roles: CLINICAL_ROLES },
    { prefix: '/emergency', roles: CLINICAL_ROLES },
    { prefix: '/ems', roles: CLINICAL_ROLES },
];

export function canAccessRoute(role: Role, pathname: string): boolean {
    const rule = ROUTE_ACCESS
        .filter((r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/'))
        .sort((a, b) => b.prefix.length - a.prefix.length)[0];
    return !rule || rule.roles.includes(role);
}

/** Landing page of each role's app. The patient home ('/') is patient-only:
 *  clinical roles arriving there are redirected to their own workspace. */
export function homeForRole(role: Role): string {
    switch (role) {
        case 'PATIENT': return '/';
        case 'RADIOLOGIST': return '/teleradiology/worklist';
        case 'SUPER_ADMIN': return '/admin';
        default: return '/dashboard';
    }
}

/** Display identity of the app a role lives in — used for shell branding. */
export function appForRole(role: Role): { name: string; subtitle: string } {
    switch (role) {
        case 'PATIENT': return { name: 'CareConnect', subtitle: 'Patient Portal' };
        case 'RADIOLOGIST': return { name: 'CareConnect', subtitle: 'Radiology Workspace' };
        case 'SUPER_ADMIN': return { name: 'CareConnect', subtitle: 'Hospital OS — Admin' };
        default: return { name: 'CareConnect', subtitle: 'Clinical Workspace' };
    }
}

/** The patient home is exclusive to the patient app. */
export function isPatientOnlyHome(role: Role, pathname: string): boolean {
    return pathname === '/' && role !== 'PATIENT' && role !== 'SUPER_ADMIN';
}
