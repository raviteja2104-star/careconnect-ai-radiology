'use client';
import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, CalendarClock, FlaskConical, Pill, CreditCard,
  ShieldCheck, Check, CheckCheck, AlertTriangle, Activity, type LucideIcon,
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
  SkeletonCard,
} from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

type NotificationCategory = 'appointment' | 'lab' | 'medication' | 'billing' | 'security' | 'system' | 'general';

interface AppNotification {
  id: string;
  _id?: string;
  category: NotificationCategory;
  title: string;
  body: string;
  message?: string;
  time: string;
  createdAt?: string;
  group: 'Today' | 'Yesterday' | 'Earlier';
  read: boolean;
  isRead?: boolean;
}

const CATEGORY_CFG: Record<NotificationCategory, { icon: LucideIcon; tile: string; label: string }> = {
  appointment: { icon: CalendarClock, tile: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400', label: 'Appointment' },
  lab:         { icon: FlaskConical, tile: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400', label: 'Lab Report' },
  medication:  { icon: Pill, tile: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400', label: 'Medication' },
  billing:     { icon: CreditCard, tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400', label: 'Billing' },
  security:    { icon: ShieldCheck, tile: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400', label: 'Security' },
  system:      { icon: Activity, tile: 'bg-gray-50 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400', label: 'System' },
  general:     { icon: Bell, tile: 'bg-gray-50 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400', label: 'Notification' },
};

function getGroup(createdAt?: string): AppNotification['group'] {
  if (!createdAt) return 'Earlier';
  const d = new Date(createdAt);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) return 'Today';
  if (diff < 172800000) return 'Yesterday';
  return 'Earlier';
}

function formatTime(createdAt?: string): string {
  if (!createdAt) return '—';
  const d = new Date(createdAt);
  const group = getGroup(createdAt);
  if (group === 'Today' || group === 'Yesterday') {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function mapNotification(n: any): AppNotification {
  const category = (n.category || n.type || 'general').toLowerCase() as NotificationCategory;
  return {
    id: n._id || n.id,
    _id: n._id || n.id,
    category: CATEGORY_CFG[category] ? category : 'general',
    title: n.title || n.subject || 'Notification',
    body: n.body || n.message || n.description || '',
    time: formatTime(n.createdAt || n.timestamp),
    createdAt: n.createdAt || n.timestamp,
    group: getGroup(n.createdAt || n.timestamp),
    read: !!(n.read || n.isRead),
  };
}

const GROUPS: AppNotification['group'][] = ['Today', 'Yesterday', 'Earlier'];

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const getAuthHeader = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const { data: raw, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      fetch(`${API_BASE}/api/notifications`, { headers: getAuthHeader() })
        .then(r => r.json()),
    refetchInterval: 30000,
  });

  const notifications: AppNotification[] = useMemo(() => {
    const list = raw?.data || raw?.notifications || [];
    return Array.isArray(list) ? list.map(mapNotification) : [];
  }, [raw]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeader(),
      }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PUT',
        headers: getAuthHeader(),
      }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const visible = useMemo(
    () => filter === 'unread' ? notifications.filter(n => !n.read) : notifications,
    [notifications, filter]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Notifications"
        description="Updates about your appointments, reports, medications and account."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Notifications' }]}
        actions={
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
            loading={markAllReadMutation.isPending}
          >
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
          {isLoading ? 'Loading…' : unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </span>
      </div>

      {isLoading ? (
        <SkeletonCard />
      ) : visible.length === 0 ? (
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
                      const cfg = CATEGORY_CFG[n.category] || CATEGORY_CFG.general;
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
                                onClick={() => markReadMutation.mutate(n.id)}
                                disabled={markReadMutation.isPending}
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
