'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Hammer, Video, CalendarClock, ShieldCheck } from 'lucide-react';
import { PageHeader, Card, CardContent, EmptyState, Badge } from '@/components/ui';

const UPCOMING = [
  { icon: Video, title: 'Virtual Consult Rooms', description: 'HD video sessions with in-call vitals, notes and prescriptions.' },
  { icon: CalendarClock, title: 'Session Scheduling', description: 'Book, reschedule and track tele-visits alongside in-person care.' },
  { icon: ShieldCheck, title: 'Secure by Design', description: 'End-to-end encrypted media with full audit trails.' },
];

export default function telemedicinePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Telemedicine"
        description="Virtual care sessions, lobby and consult rooms."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Telemedicine' }]}
        actions={<Badge tone="info" dot>Release Candidate 2</Badge>}
      />

      <Card>
        <CardContent className="py-14">
          <EmptyState
            icon={Hammer}
            title="Telemedicine Module"
            description="This module is currently being wired up for the Release Candidate 2 integration phase. Check back soon for the functional release!"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {UPCOMING.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="h-full">
              <CardContent className="pt-6">
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                  <item.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
