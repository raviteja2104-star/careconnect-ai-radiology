import {
    HeartPulse, Stethoscope, Scan, MonitorPlay, Command, type LucideIcon,
} from 'lucide-react';
import type { BackendRole } from '@/services/authService';

/**
 * Portal separation: each user type signs in through its own door and can
 * only pass through the door that matches their account's role. The backend
 * still enforces authorization on every API — this is UX-level separation.
 */
export interface LoginPortal {
    id: string;
    name: string;
    audience: string;
    headline: string;
    sub: string;
    icon: LucideIcon;
    /** Backend roles accepted through this portal. */
    roles: BackendRole[];
    /** Self-registration is patient-only; staff are provisioned by admins. */
    allowRegister: boolean;
    /** Tailwind classes for the portal's accent tile. */
    tile: string;
}

export const LOGIN_PORTALS: LoginPortal[] = [
    {
        id: 'patient',
        name: 'Patient Portal',
        audience: 'Patients & families',
        headline: 'Your health, one connected journey.',
        sub: 'Appointments, records, reports, medications and video consultations — everything in one place.',
        icon: HeartPulse,
        roles: ['patient'],
        allowRegister: true,
        tile: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    },
    {
        id: 'doctor',
        name: 'Doctor Workspace',
        audience: 'Physicians',
        headline: 'The clinical day, without the friction.',
        sub: 'Your queue, your patients, the full EMR and orders — in one purpose-built workspace.',
        icon: Stethoscope,
        roles: ['doctor'],
        allowRegister: false,
        tile: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
    },
    {
        id: 'radiology',
        name: 'Radiology Workspace',
        audience: 'Radiologists',
        headline: 'From worklist to signed report.',
        sub: 'AI-triaged worklists, SLA tracking, structured reporting and critical-finding alerts.',
        icon: Scan,
        roles: ['radiologist'],
        allowRegister: false,
        tile: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
    },
    {
        id: 'staff',
        name: 'Hospital Staff',
        audience: 'Reception · Lab · Pharmacy · Emergency',
        headline: 'The hospital, moving as one.',
        sub: 'Front desk, diagnostics, dispensing and emergency response on a shared operational backbone.',
        icon: MonitorPlay,
        roles: ['reception', 'lab_tech', 'pharmacist', 'emergency'],
        allowRegister: false,
        tile: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    },
    {
        id: 'admin',
        name: 'Administration',
        audience: 'Hospital leadership & IT',
        headline: 'See and steer the whole organization.',
        sub: 'Command centre, observability, audit trails, and every operational console.',
        icon: Command,
        roles: ['admin'],
        allowRegister: false,
        tile: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
    },
];

export function portalById(id: string): LoginPortal | undefined {
    return LOGIN_PORTALS.find((p) => p.id === id);
}

/** Which portal a given backend role belongs to (for wrong-door redirects). */
export function portalForRole(role: BackendRole): LoginPortal {
    return LOGIN_PORTALS.find((p) => p.roles.includes(role)) ?? LOGIN_PORTALS[0];
}
