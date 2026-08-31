'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, HeartPulse, ShieldCheck, CalendarClock, Phone,
  Droplets, FileText, MoreHorizontal, Link2,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  StatGrid,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Dropdown,
  DropdownItem,
  DropdownSeparator,
} from '@/components/ui';

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  gender: string;
  bloodGroup: string;
  abhaLinked: boolean;
  accessLevel: 'Full Access' | 'Reports Only' | 'Emergency Only';
  conditions: string[];
  nextAppointment?: string;
  phone: string;
}

const FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'FAM-001',
    name: 'Rajendra Prasad',
    relation: 'Self',
    age: 42,
    gender: 'Male',
    bloodGroup: 'B+',
    abhaLinked: true,
    accessLevel: 'Full Access',
    conditions: ['Hypertension'],
    nextAppointment: '12 Aug 2026',
    phone: '+91 98450 12345',
  },
  {
    id: 'FAM-002',
    name: 'Sunita Prasad',
    relation: 'Spouse',
    age: 39,
    gender: 'Female',
    bloodGroup: 'O+',
    abhaLinked: true,
    accessLevel: 'Full Access',
    conditions: ['Hypothyroidism'],
    nextAppointment: '20 Aug 2026',
    phone: '+91 98450 67890',
  },
  {
    id: 'FAM-003',
    name: 'Aarav Prasad',
    relation: 'Son',
    age: 12,
    gender: 'Male',
    bloodGroup: 'B+',
    abhaLinked: false,
    accessLevel: 'Full Access',
    conditions: [],
    nextAppointment: '15 Sep 2026',
    phone: '+91 98450 12345',
  },
  {
    id: 'FAM-004',
    name: 'Kamala Devi',
    relation: 'Mother',
    age: 68,
    gender: 'Female',
    bloodGroup: 'A+',
    abhaLinked: true,
    accessLevel: 'Reports Only',
    conditions: ['Type 2 Diabetes', 'Osteoarthritis'],
    phone: '+91 98450 24680',
  },
];

const ACCESS_TONE: Record<FamilyMember['accessLevel'], 'success' | 'info' | 'warning'> = {
  'Full Access': 'success',
  'Reports Only': 'info',
  'Emergency Only': 'warning',
};

export default function familyPage() {
  const router = useRouter();
  const abhaLinkedCount = FAMILY_MEMBERS.filter(m => m.abhaLinked).length;
  const upcomingCount = FAMILY_MEMBERS.filter(m => m.nextAppointment).length;
  const conditionsCount = FAMILY_MEMBERS.reduce((n, m) => n + m.conditions.length, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Family Health"
        description="Manage health profiles, records and care access for your family members."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Family' }]}
        actions={
          <Button variant="primary" disabled title="Coming soon">
            <UserPlus className="h-4 w-4" aria-hidden /> Add Member
          </Button>
        }
      />

      <StatGrid>
        <StatCard label="Family Members" value={FAMILY_MEMBERS.length} icon={Users} tone="brand" delay={0} sub="Profiles under your care" />
        <StatCard label="ABHA Linked" value={`${abhaLinkedCount}/${FAMILY_MEMBERS.length}`} icon={ShieldCheck} tone="emerald" delay={0.05} sub="Health IDs connected" />
        <StatCard label="Tracked Conditions" value={conditionsCount} icon={HeartPulse} tone="rose" delay={0.1} sub="Across all members" />
        <StatCard label="Upcoming Visits" value={upcomingCount} icon={CalendarClock} tone="amber" delay={0.15} sub="Scheduled appointments" />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {FAMILY_MEMBERS.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card variant="interactive" className="h-full">
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <Avatar name={member.name} size="xl" status={member.abhaLinked ? 'online' : 'offline'} />
                    <div>
                      <h3 className="text-lg font-bold leading-tight text-foreground">{member.name}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {member.relation} · {member.age} yrs · {member.gender}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge tone={ACCESS_TONE[member.accessLevel]}>{member.accessLevel}</Badge>
                        {member.abhaLinked ? (
                          <Badge tone="brand">
                            <Link2 className="h-3 w-3" aria-hidden /> ABHA Linked
                          </Badge>
                        ) : (
                          <Badge tone="outline">ABHA Pending</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Dropdown
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${member.name}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <DropdownItem onClick={() => router.push('/health-records')}>View Records</DropdownItem>
                    <DropdownItem onClick={() => router.push('/appointments/book')}>Book Appointment</DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem onClick={() => router.push('/settings')}>Manage Access</DropdownItem>
                  </Dropdown>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/50 p-4 text-sm sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Droplets className="h-4 w-4 text-danger" aria-hidden />
                    <span className="font-semibold text-foreground">{member.bloodGroup}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" aria-hidden />
                    <span className="tabular-nums">{member.phone}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2 text-muted-foreground sm:col-span-3">
                    <HeartPulse className="h-4 w-4 text-danger" aria-hidden />
                    {member.conditions.length > 0 ? (
                      <span className="truncate">{member.conditions.join(', ')}</span>
                    ) : (
                      <span className="text-subtle-foreground">No tracked conditions</span>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarClock className="h-4 w-4" aria-hidden />
                    {member.nextAppointment ? `Next visit ${member.nextAppointment}` : 'No upcoming visits'}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => router.push('/health-records')}>
                    <FileText className="h-4 w-4" aria-hidden /> Records
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
