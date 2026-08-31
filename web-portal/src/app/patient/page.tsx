'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Heart, Activity, Calendar, FileText, Pill,
  Sparkles, CheckCircle, AlertTriangle, Moon, Zap,
  ChevronRight, Clock, Video, Shield, Send,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent,
  Drawer, Avatar, Skeleton, SkeletonCard, Input,
} from '@/components/ui';

export default function PatientPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const tabs = [
    { value: 'Dashboard', label: 'Dashboard', icon: Activity },
    { value: 'Appointments', label: 'Appointments', icon: Calendar },
    { value: 'Telemedicine', label: 'Telemedicine', icon: Video },
    { value: 'Timeline', label: 'Timeline', icon: Clock },
    { value: 'Medications', label: 'Medications', icon: Pill },
    { value: 'Labs', label: 'Lab Reports', icon: FileText },
    { value: 'Billing', label: 'Insurance & Billing', icon: Shield },
    { value: 'Wellness', label: 'Wellness', icon: Zap },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Portal"
        description="Your health at a glance — appointments, medications, records, and wellness."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Patient' }]}
        actions={
          <>
            <Button variant="outline" onClick={() => setShowAIAssistant(!showAIAssistant)}>
              <Sparkles className="h-4 w-4" aria-hidden /> Ask AI
            </Button>
            <Button variant="danger" onClick={() => router.push('/support')}>
              <AlertTriangle className="h-4 w-4" aria-hidden /> Emergency
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto no-scrollbar">
          <TabsList>
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                <t.icon className="h-4 w-4" aria-hidden /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="Dashboard" className="mt-6 space-y-6">
          {/* Welcome banner */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card variant="gradient" className="overflow-hidden rounded-3xl">
              <CardContent className="relative p-6 md:p-8">
                <span
                  className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-white opacity-5"
                  aria-hidden
                />
                <div className="relative">
                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Good morning, Ravi!</h2>
                  <p className="mt-2 max-w-lg text-sm opacity-90 md:text-base">
                    Your health score is looking great today. You have an upcoming cardiology
                    follow-up tomorrow at 10:00 AM.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button variant="secondary" size="sm" onClick={() => router.push('/telemedicine')}>
                      <Video className="h-4 w-4" aria-hidden /> Join Teleconsultation
                    </Button>
                    <Button variant="glass" size="sm" onClick={() => router.push('/lab-reports')}>
                      View New Lab Results
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Vitals */}
          <StatGrid>
            <StatCard
              label="Health Score"
              value="88 /100"
              sub="Excellent"
              trend="up"
              trendPositive
              icon={Heart}
              tone="rose"
              delay={0}
            />
            <StatCard
              label="Blood Pressure"
              value="118/78"
              sub="Normal · mmHg"
              trend="neutral"
              icon={Activity}
              tone="brand"
              delay={0.05}
            />
            <StatCard
              label="Resting Heart Rate"
              value="68 bpm"
              sub="Optimal"
              trend="neutral"
              icon={Activity}
              tone="emerald"
              delay={0.1}
            />
            <StatCard
              label="Sleep Quality"
              value="7h 12m"
              sub="Needs improvement"
              trend="down"
              trendPositive={false}
              icon={Moon}
              tone="violet"
              delay={0.15}
            />
          </StatGrid>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Left: appointments + meds */}
            <div className="space-y-6 xl:col-span-2">
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Upcoming Appointments</CardTitle>
                    <CardDescription className="mt-1">Your next scheduled visits.</CardDescription>
                  </div>
                  <Button variant="link" size="sm" onClick={() => router.push('/appointments')}>View All</Button>
                </CardHeader>
                <CardContent>
                  <div className="group flex flex-col justify-between gap-4 rounded-2xl border border-border bg-muted/30 p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-card shadow-soft">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Jul</span>
                        <span className="text-lg font-extrabold leading-none text-primary tabular-nums">25</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Cardiology Follow-up</h4>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Dr. Raj Sharma • Apollo Hospitals, City Center
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push('/appointments')}>Reschedule</Button>
                      <Button size="sm" onClick={() => router.push('/appointments')}>Pre-Check In</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Today&apos;s Medications</CardTitle>
                    <CardDescription className="mt-1">2 of 3 doses taken.</CardDescription>
                  </div>
                  <Button variant="link" size="sm" onClick={() => router.push('/medications')}>Manage</Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <MedicationRow name="Atorvastatin" dosage="20mg" time="08:00 AM (After Breakfast)" status="taken" />
                  <MedicationRow name="Telmisartan" dosage="40mg" time="08:00 AM (After Breakfast)" status="taken" />
                  <MedicationRow name="Metformin" dosage="500mg" time="08:00 PM (After Dinner)" status="pending" />
                </CardContent>
              </Card>
            </div>

            {/* Right: AI insight + recent records */}
            <div className="space-y-6 xl:col-span-1">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" aria-hidden /> AI Health Insight
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Your recent Lipid Profile shows a 15% improvement in LDL cholesterol since your
                    last visit. Continuing your current Atorvastatin dosage and Mediterranean diet
                    is recommended.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => setShowAIAssistant(true)}
                  >
                    Ask Copilot about Labs
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Records</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <RecordRow
                    icon={Activity}
                    tint="bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                    title="Lipid Profile Test"
                    meta="Jul 20, 2026 • Apollo Diagnostics"
                  />
                  <RecordRow
                    icon={FileText}
                    tint="bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                    title="Cardiology SOAP Note"
                    meta="Jun 25, 2026 • Dr. Raj Sharma"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {tabs.filter((t) => t.value !== 'Dashboard').map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-6">
            <div className="space-y-4" aria-busy="true" aria-live="polite">
              <p className="text-sm text-muted-foreground">
                The {t.value} module is loading patient records…
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
              <SkeletonCard />
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* AI Health Assistant */}
      <Drawer
        open={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden /> AI Health Assistant
          </span>
        }
        description="Understand your labs, medications, and health questions."
        footer={
          <div className="relative w-full">
            <Input placeholder="Type a question…" aria-label="Ask the AI assistant" className="pr-11" />
            <Button
              size="icon-sm"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full"
              aria-label="Send question"
              onClick={() => router.push('/ai-assistant')}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      >
        <div className="mb-4 flex gap-2 rounded-xl border border-warning/30 bg-warning-soft p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <p className="text-[11px] font-medium leading-tight text-warning">
            AI guidance is for informational purposes only and does not replace professional
            medical advice. In an emergency, call your local emergency services.
          </p>
        </div>

        <div className="space-y-4">
          <ChatBubble from="ai">
            Hello Ravi! I&apos;m your CareConnect Health Assistant. I can help you understand your
            recent lab reports, medication schedules, or answer general health questions. What can
            I help you with today?
          </ChatBubble>

          <ChatBubble from="user">
            Can you explain my recent Lipid Profile results in simple terms? Is my LDL high?
          </ChatBubble>

          <ChatBubble from="ai">
            <p className="mb-2">Sure! Here is a simple breakdown of your Lipid Profile from July 20:</p>
            <ul className="mb-2 list-disc space-y-1 pl-4 font-medium">
              <li><span className="text-success">Total Cholesterol: 180 mg/dL</span> (Normal)</li>
              <li><span className="text-warning">LDL (&quot;Bad&quot; Cholesterol): 110 mg/dL</span> (Borderline High)</li>
              <li><span className="text-success">HDL (&quot;Good&quot; Cholesterol): 55 mg/dL</span> (Normal)</li>
            </ul>
            <p>
              Your LDL is slightly elevated, but it has actually decreased from 130 mg/dL since
              your last test. Continuing your prescribed Atorvastatin is helping!
            </p>
          </ChatBubble>
        </div>
      </Drawer>
    </div>
  );
}

// Subcomponents

function MedicationRow({ name, dosage, time, status }: { name: string; dosage: string; time: string; status: 'taken' | 'pending' }) {
  const router = useRouter();
  const isTaken = status === 'taken';
  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-3 transition-colors hover:bg-muted/40">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
            isTaken
              ? 'border-success/30 bg-success-soft text-success'
              : 'border-border bg-muted text-muted-foreground'
          }`}
        >
          <Pill className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {name} <span className="text-xs font-medium text-muted-foreground">{dosage}</span>
          </p>
          <p className="text-xs text-muted-foreground">{time}</p>
        </div>
      </div>
      {isTaken ? (
        <Badge tone="success">
          <CheckCircle className="h-3.5 w-3.5" aria-hidden /> Taken
        </Badge>
      ) : (
        <Button variant="outline" size="sm" onClick={() => router.push('/medications')}>Mark Taken</Button>
      )}
    </div>
  );
}

function RecordRow({ icon: Icon, tint, title, meta }: { icon: React.ElementType; tint: string; title: string; meta: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/health-records')}
      className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition-colors hover:border-border hover:bg-muted/40"
    >
      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{meta}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-subtle-foreground transition-colors group-hover:text-primary" aria-hidden />
    </button>
  );
}

function ChatBubble({ from, children }: { from: 'ai' | 'user'; children: React.ReactNode }) {
  const isUser = from === 'user';
  return (
    <div className={`flex max-w-[90%] gap-3 ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
      {isUser ? (
        <Avatar name="Ravi Teja" size="sm" />
      ) : (
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
      )}
      <div
        className={`rounded-2xl p-3 text-sm shadow-soft ${
          isUser
            ? 'rounded-tr-none bg-primary text-primary-foreground'
            : 'rounded-tl-none border border-border bg-card text-muted-foreground'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
