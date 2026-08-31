'use client';
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, CalendarClock, FlaskConical, Pill, CreditCard,
  ShieldCheck, Check, CheckCheck, type LucideIcon,
} from 'lucide-react';
import {
  PageHeader,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui';

type NotificationCategory = 'appointment' | 'lab' | 'medication' | 'billing' | 'security';

interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  time: string;
  group: 'Today' | 'Yesterday' | 'Earlier';
  read: boolean;
}

const CATEGORY_CFG: Record<NotificationCategory, { icon: LucideIcon; tile: string; label: string }> = {
  appointment: { icon: CalendarClock, tile: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400', label: 'Appointment' },
  lab:         { icon: FlaskConical, tile: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400', label: 'Lab Report' },
  medication:  { icon: Pill, tile: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400', label: 'Medication' },
  billing:     { icon: CreditCard, tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400', label: 'Billing' },
  security:    { icon: ShieldCheck, tile: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400', label: 'Security' },
};

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: 'NTF-001', category: 'appointment', title: 'Appointment confirmed', body: 'Your teleconsultation with Dr. Sunita Sharma (Cardiology) is confirmed for 12 Aug 2026, 10:30 AM.', time: '9:42 AM', group: 'Today', read: false },
  { id: 'NTF-002', category: 'lab', title: 'Lab report ready', body: 'Your Complete Blood Count (CBC) report LR-2026-8812 is now available to view and download.', time: '8:15 AM', group: 'Today', read: false },
  { id: 'NTF-003', category: 'medication', title: 'Refill reminder', body: 'Lisinopril 10mg has 0 refills remaining. Request a refill before 10 Aug 2026 to avoid missed doses.', time: '7:00 AM', group: 'Today', read: false },
  { id: 'NTF-004', category: 'billing', title: 'Payment received', body: 'We received your payment of ₹1,250 for invoice INV-2026-0781 (Central Pathology).', time: '6:20 PM', group: 'Yesterday', read: true },
  { id: 'NTF-005', category: 'security', title: 'New sign-in detected', body: 'A new sign-in to your account from Chrome on Windows was detected in Hyderabad, IN.', time: '2:05 PM', group: 'Yesterday', read: false },
  { id: 'NTF-006', category: 'appointment', title: 'Visit summary available', body: 'The visit summary for your Endocrinology consultation on 12 Jun 2026 has been added to your records.', time: '13 Jun 2026', group: 'Earlier', read: true },
  { id: 'NTF-007', category: 'lab', title: 'Sample collected', body: 'Your Metabolic Panel (BMP) sample was collected. Results are expected within 48 hours.', time: '29 Jul 2026', group: 'Earlier', read: true },
];

const GROUPS: AppNotification['group'][] = ['Today', 'Yesterday', 'Earlier'];

export default function notificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const visible = useMemo(
    () => (filter === 'unread' ? notifications.filter(n => !n.read) : notifications),
    [notifications, filter]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Notifications"
        description="Updates about your appointments, reports, medications and account."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Notifications' }]}
        actions={
          <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="h-4 w-4" aria-hidden /> Mark all as read
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
          <TabsList aria-label="Filter notifications">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && <Badge tone="brand" className="ml-1">{unreadCount}</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="text-sm text-muted-foreground tabular-nums">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </span>
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={filter === 'unread' ? BellOff : Bell}
              title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              description={
                filter === 'unread'
                  ? 'You are all caught up. New updates will appear here.'
                  : 'Updates about your care will show up here as they happen.'
              }
              action={
                filter === 'unread'
                  ? { label: 'View all notifications', onClick: () => setFilter('all') }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        GROUPS.map(group => {
          const items = visible.filter(n => n.group === group);
          if (items.length === 0) return null;
          return (
            <section key={group} aria-label={group} className="space-y-3">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">
                {group}
              </h2>
              <Card className="overflow-hidden">
                <ul className="divide-y divide-border">
                  <AnimatePresence initial={false}>
                    {items.map((n, i) => {
                      const cfg = CATEGORY_CFG[n.category];
                      const Icon = cfg.icon;
                      return (
                        <motion.li
                          key={n.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                          className={`group relative flex gap-4 px-5 py-4 transition-colors hover:bg-muted/40 ${n.read ? '' : 'bg-primary/[0.03]'}`}
                        >
                          {!n.read && (
                            <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" aria-hidden />
                          )}
                          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.tile}`}>
                            <Icon className="h-5 w-5" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                              <p className={`text-sm ${n.read ? 'font-medium text-muted-foreground' : 'font-semibold text-foreground'}`}>
                                {n.title}
                              </p>
                              <span className="whitespace-nowrap text-xs text-subtle-foreground">{n.time}</span>
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                            <Badge tone="outline" className="mt-2">{cfg.label}</Badge>
                          </div>
                          {!n.read && (
                            <div className="flex items-center">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => markRead(n.id)}
                                aria-label={`Mark "${n.title}" as read`}
                                title="Mark as read"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </Card>
            </section>
          );
        })
      )}
    </div>
  );
}
