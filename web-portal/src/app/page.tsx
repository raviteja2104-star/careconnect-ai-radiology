'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar,
  Pill,
  FileText,
  Activity,
  Video,
  MapPin,
  Bot,
  Sparkles,
  ChevronRight,
  Search,
  Send,
  HeartPulse,
  Gauge,
  Footprints,
  MoonStar,
  ScanLine,
  Upload,
  FlaskConical,
  ClipboardList,
  FileScan,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  PageHeader,
  StatCard,
  StatGrid,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Avatar,
  Input,
} from '@/components/ui';
import { CHART_COLORS, chartGrid, chartAxis, chartTooltip } from '@/lib/chart-theme';

const vitalsData = [
  { name: 'Mon', heartRate: 72, bloodPressure: 120 },
  { name: 'Tue', heartRate: 75, bloodPressure: 118 },
  { name: 'Wed', heartRate: 71, bloodPressure: 122 },
  { name: 'Thu', heartRate: 74, bloodPressure: 121 },
  { name: 'Fri', heartRate: 70, bloodPressure: 119 },
  { name: 'Sat', heartRate: 68, bloodPressure: 117 },
  { name: 'Sun', heartRate: 72, bloodPressure: 120 },
];

const consultations = [
  { doc: 'Dr. Sarah Johnson', spec: 'Cardiologist', date: 'May 20, 2024', status: 'Completed', img: 'doc1' },
  { doc: 'Dr. Michael Brown', spec: 'General Physician', date: 'May 15, 2024', status: 'Completed', img: 'doc2' },
  { doc: 'Dr. Emily Davis', spec: 'Dermatologist', date: 'May 10, 2024', status: 'Completed', img: 'doc3' },
];

const medications = [
  { med: 'Amlodipine 5mg', dose: '1 tablet', time: 'Morning', tone: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400' },
  { med: 'Metformin 500mg', dose: '1 tablet', time: 'After Breakfast', tone: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' },
  { med: 'Vitamin D3 1000 IU', dose: '1 tablet', time: 'After Lunch', tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' },
];

const assistantActions = [
  { label: 'Check my symptoms', icon: Search, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' },
  { label: 'Explain my lab report', icon: FileText, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' },
  { label: 'Suggest healthy habits', icon: Pill, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' },
];

const healthRecordCaptureActions = [
  { label: 'Scan Prescription', href: '/health-records/capture?type=HANDWRITTEN_PRESCRIPTION', icon: ScanLine, tone: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400' },
  { label: 'Upload Report', href: '/health-records/capture?type=DIAGNOSTIC_REPORT', icon: Upload, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' },
  { label: 'Add Lab Report', href: '/health-records/capture?type=LAB_REPORT', icon: FlaskConical, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' },
  { label: 'Add Discharge Summary', href: '/health-records/capture?type=DISCHARGE_SUMMARY', icon: ClipboardList, tone: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400' },
  { label: 'Upload Medical Document', href: '/health-records/capture', icon: FileScan, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export default function Home() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Good morning, John! Here's your health overview for today."
        actions={
          <Link href="/appointments/book">
            <Button>
              <Calendar className="h-4 w-4" aria-hidden />
              Book appointment
            </Button>
          </Link>
        }
      />

      <StatGrid>
        <StatCard label="Upcoming Appointments" value="2" sub="View all" icon={Calendar} tone="brand" delay={0} onClick={() => router.push('/appointments')} />
        <StatCard label="Medications" value="3" sub="Due today" icon={Pill} tone="amber" delay={0.05} onClick={() => router.push('/medications')} />
        <StatCard label="Lab Reports" value="1" sub="New report" icon={FileText} tone="violet" delay={0.1} onClick={() => router.push('/lab-reports')} />
        <StatCard label="Health Score" value="85" sub="Excellent" icon={Activity} trend="up" trendPositive tone="emerald" delay={0.15} onClick={() => router.push('/health-records')} />
      </StatGrid>

      {/* Upcoming appointment + vitals chart + AI assistant */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Upcoming appointment */}
        <motion.div {...fadeUp(0.1)}>
          <Card className="flex h-full flex-col">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Upcoming Appointment</CardTitle>
              <Badge tone="brand" dot pulse>Today, 10:30 AM</Badge>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <div className="mb-6 flex items-center gap-4">
                <Avatar name="Dr. Sarah Johnson" src="https://i.pravatar.cc/150?u=doc1" size="lg" />
                <div className="min-w-0">
                  <h4 className="font-semibold text-foreground">Dr. Sarah Johnson</h4>
                  <p className="text-sm text-muted-foreground">Cardiologist</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-subtle-foreground">
                    <MapPin className="h-3 w-3" aria-hidden />
                    HealthCore Hospital, New York
                  </p>
                </div>
              </div>
              <div className="mt-auto space-y-3">
                <Button className="w-full" onClick={() => router.push('/telemedicine')}>
                  <Video className="h-4 w-4" aria-hidden />
                  Join Video Call
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => router.push('/appointments')}>Reschedule</Button>
                  <Button variant="outline" className="flex-1" onClick={() => router.push('/appointments')}>View Details</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Health overview */}
        <motion.div {...fadeUp(0.15)}>
          <Card className="flex h-full flex-col">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Health Overview</CardTitle>
              <select
                aria-label="Chart period"
                className="rounded-lg border border-input bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground outline-none"
              >
                <option>This Week</option>
                <option>This Month</option>
              </select>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <div className="mb-4 grid grid-cols-2 gap-6">
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <HeartPulse className="h-3.5 w-3.5" aria-hidden /> Heart Rate
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tabular-nums text-foreground">72</span>
                    <span className="text-xs font-semibold text-subtle-foreground">bpm</span>
                  </div>
                  <Badge tone="success" className="mt-1">Normal</Badge>
                </div>
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Gauge className="h-3.5 w-3.5" aria-hidden /> Blood Pressure
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tabular-nums text-foreground">120/80</span>
                    <span className="text-xs font-semibold text-subtle-foreground">mmHg</span>
                  </div>
                  <Badge tone="success" className="mt-1">Normal</Badge>
                </div>
              </div>

              <div className="h-[170px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={vitalsData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid {...chartGrid} />
                    <XAxis {...chartAxis} dataKey="name" dy={8} />
                    <YAxis {...chartAxis} />
                    <Tooltip {...chartTooltip} />
                    <Line type="monotone" dataKey="heartRate" name="Heart rate" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="bloodPressure" name="Blood pressure" stroke={CHART_COLORS[1]} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-6 border-t border-border pt-4">
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Footprints className="h-3.5 w-3.5" aria-hidden /> Steps
                  </p>
                  <span className="text-lg font-bold tabular-nums text-foreground">7,532</span>
                </div>
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MoonStar className="h-3.5 w-3.5" aria-hidden /> Sleep
                  </p>
                  <span className="text-lg font-bold tabular-nums text-foreground">7h 45m</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI assistant */}
        <motion.div {...fadeUp(0.2)}>
          <Card className="relative flex h-full flex-col overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 to-transparent" aria-hidden />
            <Sparkles className="absolute right-6 top-6 h-8 w-8 text-primary/25" aria-hidden />
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card shadow-soft">
                <Bot className="h-5 w-5 text-primary" aria-hidden />
              </span>
              <div>
                <CardTitle>AI Health Assistant</CardTitle>
                <CardDescription>Your personal health companion</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <div className="mb-4 rounded-xl border border-border bg-card/80 p-4 shadow-soft backdrop-blur-sm">
                <p className="text-sm font-semibold text-foreground">Hello John!</p>
                <p className="text-sm text-muted-foreground">How can I help you today?</p>
              </div>

              <div className="mb-auto space-y-2.5">
                {assistantActions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => router.push('/ai-assistant')}
                    className="group flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 shadow-soft transition-colors hover:border-primary/40"
                  >
                    <span className="flex items-center gap-3">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${a.tone}`}>
                        <a.icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="text-sm font-medium text-foreground">{a.label}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-subtle-foreground transition-colors group-hover:text-primary" aria-hidden />
                  </button>
                ))}
              </div>

              <div className="relative mt-4">
                <Input placeholder="Type your message…" aria-label="Message the assistant" className="pr-12" />
                <Button size="icon-sm" aria-label="Send message" onClick={() => router.push('/ai-assistant')} className="absolute right-1.5 top-1/2 -translate-y-1/2">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Add Health Record */}
      <motion.div {...fadeUp(0.22)}>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Add Health Record</CardTitle>
              <CardDescription>Photograph or upload a paper document — Claude reads it, you review and confirm every field.</CardDescription>
            </div>
            <Link href="/health-records">
              <Button variant="link" size="sm">View All Records</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {healthRecordCaptureActions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => router.push(a.href)}
                  className="group flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card p-4 text-center shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-float"
                >
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${a.tone}`}>
                    <a.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-xs font-medium leading-tight text-foreground">{a.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent consultations + medications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div {...fadeUp(0.25)}>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Recent Consultations</CardTitle>
              <Link href="/appointments">
                <Button variant="link" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {consultations.map((item) => (
                  <li key={item.doc} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={item.doc} src={`https://i.pravatar.cc/150?u=${item.img}`} size="md" />
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-foreground">{item.doc}</h4>
                        <p className="text-xs text-muted-foreground">{item.spec}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="mb-1 text-xs text-muted-foreground">{item.date}</p>
                      <Badge tone="success">{item.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp(0.3)}>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Medications</CardTitle>
              <Link href="/medications">
                <Button variant="link" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {medications.map((item) => (
                  <li key={item.med} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
                        <Pill className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-foreground">{item.med}</h4>
                        <p className="text-xs text-muted-foreground">{item.dose} • {item.time}</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" className="shrink-0" onClick={() => router.push('/medications')}>Take</Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
